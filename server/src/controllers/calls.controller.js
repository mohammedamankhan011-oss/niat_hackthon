import { analyzeAudioWithGemini, analyzeLiveCall, transcribeChunk } from '../services/gemini.service.js';
import { analyseAndSaveScan } from '../services/scan.service.js';
import { AppError } from '../utils/AppError.js';

// Long calls: the opening (who the caller claims to be) and the latest part
// (what they are demanding now) carry the most signal.
const AI_TRANSCRIPT_LIMIT = 8000;
const AI_TRANSCRIPT_EDGE = 4000;

function trimForAi(transcript) {
  if (transcript.length <= AI_TRANSCRIPT_LIMIT) return transcript;
  return `${transcript.slice(0, AI_TRANSCRIPT_EDGE)}\n[...]\n${transcript.slice(-AI_TRANSCRIPT_EDGE)}`;
}

/** POST /api/calls/analyze — live verdict on the transcript so far (not stored). */
export async function analyze(req, res) {
  const { transcript } = req.valid.body;
  const language = req.valid.body.language ?? req.user.preferred_language;

  const analysis = await analyzeLiveCall({ transcript: trimForAi(transcript), language });
  res.json({ analysis });
}

/** POST /api/calls — save a finished call as a scan (input_type "call"). */
export async function save(req, res) {
  const { transcript } = req.valid.body;
  const language = req.valid.body.language ?? req.user.preferred_language;

  const scan = await analyseAndSaveScan({
    userId: req.user.id,
    text: trimForAi(transcript),
    storedText: transcript,
    language,
    inputType: 'call',
  });

  res.status(201).json({ scan });
}

const SPEECH_LOCALES = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' };

/** Accepts "en-IN" / "hi-IN" / "kn-IN" (lang) or "en" / "hi" / "kn" (language). */
function speechLocale(req) {
  const requested = String(req.body?.lang ?? req.body?.language ?? '').trim().toLowerCase();
  const short = requested.split('-')[0];
  return SPEECH_LOCALES[short] ?? SPEECH_LOCALES[req.user?.preferred_language] ?? 'en-IN';
}

/**
 * POST /api/calls/transcribe — speech-to-text for one live audio chunk.
 * Always 200: { text } (also returned as `transcript` for older clients), or
 * { text: "", error: "transcribe_failed" } when no model could transcribe it.
 * The audio is processed in memory and never stored.
 */
export async function transcribe(req, res) {
  try {
    const text = await transcribeChunk({ audio: req.file, lang: speechLocale(req) });
    res.json({ text, transcript: text });
  } catch (err) {
    console.warn(`[transcribe] failed (${err.code ?? err.message})`);
    res.json({ text: '', transcript: '', error: 'transcribe_failed' });
  }
}

/** POST /api/calls/analyze-audio — transcribe audio recording and return live scam analysis. */
export async function analyzeAudio(req, res) {
  if (!req.file) {
    throw AppError.badRequest('No audio data received', 'MISSING_AUDIO');
  }
  const language = req.body?.language ?? req.user?.preferred_language ?? 'en';
  const shouldSave = req.query?.save === 'true' || req.body?.save === 'true';

  const result = await analyzeAudioWithGemini({ audio: req.file, language });

  if (shouldSave && result.has_speech && result.transcript) {
    const scan = await analyseAndSaveScan({
      userId: req.user.id,
      text: trimForAi(result.transcript),
      storedText: result.transcript,
      language,
      inputType: 'call',
    });
    return res.status(201).json({ ...result, scan });
  }

  res.json(result);
}

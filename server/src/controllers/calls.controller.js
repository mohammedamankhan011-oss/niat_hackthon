import { analyzeLiveCall, transcribeAudio, analyzeAudioWithGemini } from '../services/gemini.service.js';
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

/** POST /api/calls/transcribe — transcribe an in-memory audio chunk via Gemini. */
export async function transcribe(req, res) {
  if (!req.file) {
    throw AppError.badRequest('No audio data received', 'MISSING_AUDIO');
  }
  const language = req.body?.language ?? req.user?.preferred_language ?? 'en';
  const result = await transcribeAudio({ audio: req.file, language });
  res.json(result);
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

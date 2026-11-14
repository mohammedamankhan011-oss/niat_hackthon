import { analyzeLiveCall } from '../services/gemini.service.js';
import { analyseAndSaveScan } from '../services/scan.service.js';

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

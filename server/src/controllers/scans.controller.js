import { notifyGuardiansOfScan } from '../services/alert.service.js';
import { deleteScan, getScan, insertScan, listScans } from '../services/db.service.js';
import { analyzeMessage, explainScan } from '../services/gemini.service.js';
import { AppError } from '../utils/AppError.js';
import { maskSensitiveNumbers, sanitizeForStorage } from '../utils/maskSensitive.js';

const maskList = (items) => items.map((item) => maskSensitiveNumbers(item));
const maskFlags = (flags) =>
  flags.map((flag) => ({
    flag: maskSensitiveNumbers(flag.flag),
    evidence: maskSensitiveNumbers(flag.evidence),
    explanation: maskSensitiveNumbers(flag.explanation),
  }));

export async function createScan(req, res) {
  const { text } = req.valid.body;
  const language = req.valid.body.language ?? req.user.preferred_language;
  const image = req.file;

  if (!text && !image) {
    throw AppError.badRequest('Upload a screenshot or paste the message text', 'NO_INPUT');
  }

  const analysis = await analyzeMessage({ text, image, language });

  // Prefer what the user typed; otherwise keep the text read from the screenshot.
  const messageText = sanitizeForStorage(text ?? analysis.extracted_text);

  const scan = await insertScan({
    user_id: req.user.id,
    input_type: image ? 'image' : 'text',
    message_text: messageText,
    risk_level: analysis.risk_level,
    risk_score: analysis.risk_score,
    scam_type: analysis.scam_type,
    red_flags: maskFlags(analysis.red_flags),
    summary: maskSensitiveNumbers(analysis.summary),
    explanation: maskSensitiveNumbers(analysis.explanation),
    actions: maskList(analysis.actions),
    safe_reasons: maskList(analysis.safe_reasons),
    language,
  });

  await notifyGuardiansOfScan(req.user.id, scan);

  res.status(201).json({ scan });
}

export async function listMyScans(req, res) {
  const scans = await listScans(req.user.id, req.valid.query);
  res.json({ scans });
}

export async function getMyScan(req, res) {
  const scan = await getScan(req.user.id, req.valid.params.id);
  if (!scan) throw AppError.notFound('Scan not found', 'SCAN_NOT_FOUND');
  res.json({ scan });
}

export async function explainMyScan(req, res) {
  const scan = await getScan(req.user.id, req.valid.params.id);
  if (!scan) throw AppError.notFound('Scan not found', 'SCAN_NOT_FOUND');

  const result = await explainScan(scan, req.valid.body.language);

  res.json({
    explanation: maskSensitiveNumbers(result.explanation),
    summary: maskSensitiveNumbers(result.summary),
    red_flags: maskFlags(result.red_flags),
    actions: maskList(result.actions),
  });
}

export async function deleteMyScan(req, res) {
  const deleted = await deleteScan(req.user.id, req.valid.params.id);
  if (!deleted) throw AppError.notFound('Scan not found', 'SCAN_NOT_FOUND');
  res.json({ success: true });
}

import { deleteScan, getScan, listScans } from '../services/db.service.js';
import { explainScan } from '../services/gemini.service.js';
import { analyseAndSaveScan, maskFlags, maskList } from '../services/scan.service.js';
import { AppError } from '../utils/AppError.js';
import { maskSensitiveNumbers } from '../utils/maskSensitive.js';

export async function createScan(req, res) {
  const { text } = req.valid.body;
  const language = req.valid.body.language ?? req.user.preferred_language;
  const image = req.file;

  if (!text && !image) {
    throw AppError.badRequest('Upload a screenshot or paste the message text', 'NO_INPUT');
  }

  const scan = await analyseAndSaveScan({
    userId: req.user.id,
    text,
    image,
    language,
    inputType: image ? 'image' : 'text',
  });

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

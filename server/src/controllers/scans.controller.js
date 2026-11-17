import {
  deleteScan,
  getScan,
  getScanForExplain,
  listScans,
  saveScanExplanations,
} from '../services/db.service.js';
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

const explanationOf = (scan) => ({
  explanation: scan.explanation,
  summary: scan.summary,
  red_flags: scan.red_flags,
  actions: scan.actions,
});

/**
 * Re-explains a scan in another language. Answers instantly from the scan's
 * own language or the per-language cache; otherwise asks the AI and caches the
 * result. If the AI is unavailable, returns the original text with
 * translated: false instead of an error.
 */
export async function explainMyScan(req, res) {
  const { id } = req.valid.params;
  const { language } = req.valid.body;
  const scan = await getScanForExplain(req.user.id, id);
  if (!scan) throw AppError.notFound('Scan not found', 'SCAN_NOT_FOUND');

  if (language === scan.language) {
    res.json({ ...explanationOf(scan), translated: true, cached: true });
    return;
  }

  const cached = scan.explanations?.[language];
  if (cached) {
    res.json({ ...cached, translated: true, cached: true });
    return;
  }

  let result;
  try {
    result = await explainScan(scan, language);
  } catch (err) {
    console.warn(`[explain] scan ${id} -> ${language} failed (${err.code ?? err.message}); returning original`);
    res.json({ ...explanationOf(scan), translated: false });
    return;
  }

  const explanation = {
    explanation: maskSensitiveNumbers(result.explanation),
    summary: maskSensitiveNumbers(result.summary),
    red_flags: maskFlags(result.red_flags),
    actions: maskList(result.actions),
  };

  try {
    await saveScanExplanations(req.user.id, id, { ...(scan.explanations ?? {}), [language]: explanation });
  } catch (err) {
    console.warn(`[explain] could not cache explanation for scan ${id}: ${err.message}`);
  }

  res.json({ ...explanation, translated: true, cached: false });
}

export async function deleteMyScan(req, res) {
  const deleted = await deleteScan(req.user.id, req.valid.params.id);
  if (!deleted) throw AppError.notFound('Scan not found', 'SCAN_NOT_FOUND');
  res.json({ success: true });
}

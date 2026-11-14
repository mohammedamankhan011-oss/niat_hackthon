import { lookupIdentifier, reportIdentifier } from '../services/community.service.js';

/** GET /api/lookup?value= — "Check before you pay" (public). */
export async function lookup(req, res) {
  const result = await lookupIdentifier(req.valid.query.value);
  res.set('Cache-Control', 'no-store');
  res.json(result);
}

/** POST /api/reports — report a phone number, UPI ID or link as a scam. */
export async function report(req, res) {
  const { value, scam_type: scamType } = req.valid.body;
  const created = await reportIdentifier({ reporterId: req.user.id, value, scamType });
  res.status(201).json({ report: created });
}

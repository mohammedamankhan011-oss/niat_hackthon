import { countUnreadAlerts, listAlerts, markAlertRead } from '../services/db.service.js';
import { AppError } from '../utils/AppError.js';

export async function list(req, res) {
  const [rows, unreadCount] = await Promise.all([
    listAlerts(req.user.id, { limit: 100 }),
    countUnreadAlerts(req.user.id),
  ]);

  const alerts = rows.map((row) => ({
    id: row.id,
    is_read: row.is_read,
    created_at: row.created_at,
    person: { name: row.person?.name ?? '' },
    scan: row.scan
      ? {
          id: row.scan.id,
          summary: row.scan.summary,
          risk_score: row.scan.risk_score,
          risk_level: row.scan.risk_level,
          scam_type: row.scan.scam_type,
          input_type: row.scan.input_type,
        }
      : null,
  }));

  res.json({ alerts, unread_count: unreadCount });
}

export async function markRead(req, res) {
  const updated = await markAlertRead(req.user.id, req.valid.params.id);
  if (!updated) throw AppError.notFound('Alert not found', 'ALERT_NOT_FOUND');
  res.json({ success: true });
}

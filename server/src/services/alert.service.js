import { insertAlerts, listAcceptedGuardianIds } from './db.service.js';

/**
 * Creates an alert for every accepted guardian when a scan is a scam.
 * Alert failures are logged but never fail the user's scan request:
 * the scan result is already saved and the user must still see it.
 */
export async function notifyGuardiansOfScan(userId, scan) {
  if (scan.risk_level !== 'scam') return 0;

  try {
    const guardianIds = await listAcceptedGuardianIds(userId);
    const created = await insertAlerts(
      guardianIds.map((guardianId) => ({ guardian_id: guardianId, user_id: userId, scan_id: scan.id })),
    );
    return created.length;
  } catch (err) {
    console.error(`[alerts] failed to create guardian alerts for scan ${scan.id}: ${err.message}`);
    return 0;
  }
}

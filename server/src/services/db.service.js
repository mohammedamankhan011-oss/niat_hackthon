import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

// Server-only client. The service role key bypasses RLS, so every query below
// is explicitly scoped to the logged-in user.
export const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const USER_PUBLIC = 'id, name, email, preferred_language';
const SCAN_PUBLIC =
  'id, input_type, message_text, risk_level, risk_score, scam_type, red_flags, summary, explanation, actions, safe_reasons, language, created_at';
const SCAN_LIST = 'id, summary, risk_level, risk_score, scam_type, created_at';

function dbError(error, context) {
  if (error.code === '23505') return AppError.conflict('This record already exists', 'ALREADY_EXISTS');
  if (error.code === '22P02') return AppError.notFound();
  console.error(`[db] ${context}: ${error.code ?? ''} ${error.message}`);
  return new AppError(500, 'A database error occurred. Please try again.', 'DATABASE_ERROR');
}

function unwrap({ data, error }, context) {
  if (error) throw dbError(error, context);
  return data;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function findUserByEmailWithPassword(email) {
  return unwrap(
    await supabase.from('users').select(`${USER_PUBLIC}, password_hash`).eq('email', email).maybeSingle(),
    'findUserByEmailWithPassword',
  );
}

export async function findUserByEmail(email) {
  return unwrap(
    await supabase.from('users').select(USER_PUBLIC).eq('email', email).maybeSingle(),
    'findUserByEmail',
  );
}

export async function findUserById(id) {
  return unwrap(
    await supabase.from('users').select(USER_PUBLIC).eq('id', id).maybeSingle(),
    'findUserById',
  );
}

export async function createUser({ name, email, passwordHash, preferredLanguage }) {
  const { data, error } = await supabase
    .from('users')
    .insert({ name, email, password_hash: passwordHash, preferred_language: preferredLanguage })
    .select(USER_PUBLIC)
    .single();
  if (error?.code === '23505') {
    throw AppError.conflict('An account with this email already exists', 'EMAIL_TAKEN');
  }
  return unwrap({ data, error }, 'createUser');
}

export async function updateUserLanguage(id, preferredLanguage) {
  return unwrap(
    await supabase
      .from('users')
      .update({ preferred_language: preferredLanguage })
      .eq('id', id)
      .select(USER_PUBLIC)
      .single(),
    'updateUserLanguage',
  );
}

// ---------------------------------------------------------------------------
// Scans
// ---------------------------------------------------------------------------

export async function insertScan(row) {
  return unwrap(await supabase.from('scans').insert(row).select(SCAN_PUBLIC).single(), 'insertScan');
}

export async function listScans(userId, { limit, offset }) {
  return unwrap(
    await supabase
      .from('scans')
      .select(SCAN_LIST)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1),
    'listScans',
  );
}

export async function getScan(userId, scanId) {
  return unwrap(
    await supabase.from('scans').select(SCAN_PUBLIC).eq('id', scanId).eq('user_id', userId).maybeSingle(),
    'getScan',
  );
}

export async function deleteScan(userId, scanId) {
  const rows = unwrap(
    await supabase.from('scans').delete().eq('id', scanId).eq('user_id', userId).select('id'),
    'deleteScan',
  );
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Guardians
// ---------------------------------------------------------------------------

const GUARDIAN_FIELDS = 'id, user_id, guardian_id, status, created_at';

export async function createGuardianInvite(userId, guardianId) {
  const { data, error } = await supabase
    .from('guardians')
    .insert({ user_id: userId, guardian_id: guardianId, status: 'pending' })
    .select(GUARDIAN_FIELDS)
    .single();
  if (error?.code === '23505') {
    throw AppError.conflict('You have already invited this person as a guardian', 'ALREADY_INVITED');
  }
  return unwrap({ data, error }, 'createGuardianInvite');
}

export async function getGuardianLink(linkId) {
  return unwrap(
    await supabase.from('guardians').select(GUARDIAN_FIELDS).eq('id', linkId).maybeSingle(),
    'getGuardianLink',
  );
}

export async function acceptGuardianLink(linkId, guardianId) {
  return unwrap(
    await supabase
      .from('guardians')
      .update({ status: 'accepted' })
      .eq('id', linkId)
      .eq('guardian_id', guardianId)
      .select(GUARDIAN_FIELDS)
      .single(),
    'acceptGuardianLink',
  );
}

export async function deleteGuardianLink(link) {
  unwrap(await supabase.from('guardians').delete().eq('id', link.id), 'deleteGuardianLink');
  // Once the link is gone, the guardian should no longer see this person's alerts.
  unwrap(
    await supabase.from('alerts').delete().eq('guardian_id', link.guardian_id).eq('user_id', link.user_id),
    'deleteGuardianAlerts',
  );
}

export async function listMyGuardians(userId) {
  return unwrap(
    await supabase
      .from('guardians')
      .select('id, status, created_at, other_user:users!guardians_guardian_id_fkey(id, name, email)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    'listMyGuardians',
  );
}

export async function listLinksWhereIAmGuardian(userId) {
  return unwrap(
    await supabase
      .from('guardians')
      .select('id, status, created_at, other_user:users!guardians_user_id_fkey(id, name, email)')
      .eq('guardian_id', userId)
      .order('created_at', { ascending: false }),
    'listLinksWhereIAmGuardian',
  );
}

export async function listAcceptedGuardianIds(userId) {
  const rows = unwrap(
    await supabase.from('guardians').select('guardian_id').eq('user_id', userId).eq('status', 'accepted'),
    'listAcceptedGuardianIds',
  );
  return rows.map((row) => row.guardian_id);
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export async function insertAlerts(rows) {
  if (rows.length === 0) return [];
  return unwrap(await supabase.from('alerts').insert(rows).select('id'), 'insertAlerts');
}

export async function listAlerts(guardianId, { limit }) {
  return unwrap(
    await supabase
      .from('alerts')
      .select(
        'id, is_read, created_at, person:users!alerts_user_id_fkey(name), scan:scans!alerts_scan_id_fkey(id, summary, risk_score, scam_type)',
      )
      .eq('guardian_id', guardianId)
      .order('created_at', { ascending: false })
      .limit(limit),
    'listAlerts',
  );
}

export async function countUnreadAlerts(guardianId) {
  const { count, error } = await supabase
    .from('alerts')
    .select('id', { count: 'exact', head: true })
    .eq('guardian_id', guardianId)
    .eq('is_read', false);
  if (error) throw dbError(error, 'countUnreadAlerts');
  return count ?? 0;
}

export async function markAlertRead(guardianId, alertId) {
  const rows = unwrap(
    await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', alertId)
      .eq('guardian_id', guardianId)
      .select('id'),
    'markAlertRead',
  );
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Trends (anonymous aggregates only)
// ---------------------------------------------------------------------------

export async function getTrends() {
  const data = unwrap(await supabase.rpc('scan_trends'), 'getTrends');
  return {
    total_scans: Number(data?.total_scans ?? 0),
    scams_caught: Number(data?.scams_caught ?? 0),
    last_7_days: (data?.last_7_days ?? []).map((row) => ({
      scam_type: row.scam_type,
      count: Number(row.count),
    })),
  };
}

import { displayIdentifier, normalizeIdentifier } from '../utils/identifiers.js';
import { AppError } from '../utils/AppError.js';
import { localized } from '../utils/localizedText.js';
import { getReportStats, insertScamReport } from './db.service.js';

function toMatch(stats) {
  return {
    identifier_type: stats.identifier_type,
    identifier_value: displayIdentifier(stats.identifier_type, stats.identifier_value),
    report_count: stats.report_count,
    last_7_days_count: stats.last_7_days_count,
    scam_types: stats.scam_types ?? [],
    last_reported_at: stats.last_reported_at,
  };
}

function parseIdentifier(value) {
  const identifier = normalizeIdentifier(value);
  if (!identifier) {
    throw AppError.badRequest(
      'Enter a valid phone number, UPI ID (like name@bank) or website link',
      'INVALID_IDENTIFIER',
    );
  }
  return identifier;
}

/** "Check before you pay": community report stats for one identifier. */
export async function lookupIdentifier(value) {
  const { type, key } = parseIdentifier(value);
  const [stats] = await getReportStats([{ type, key }]);

  if (!stats) {
    return {
      identifier_type: type,
      identifier_value: displayIdentifier(type, key),
      report_count: 0,
      last_7_days_count: 0,
      scam_types: [],
      last_reported_at: null,
      verdict: 'not_reported',
    };
  }
  return { ...toMatch(stats), verdict: 'reported' };
}

export async function reportIdentifier({ reporterId, value, scamType }) {
  const { type, key } = parseIdentifier(value);
  const row = await insertScamReport({ reporterId, type, key, scamType });
  return {
    id: row.id,
    identifier_type: row.identifier_type,
    identifier_value: displayIdentifier(row.identifier_type, row.identifier_value),
    value: value.trim(),
    scam_type: row.scam_type,
    created_at: row.created_at,
  };
}

/**
 * Community reports for identifiers found in a scanned message.
 * Returns [{ match, evidence }] where evidence is the exact text from the
 * message. Never fails the scan: on a database problem it logs and returns [].
 */
export async function findCommunityMatches(keys) {
  if (!keys?.length) return [];
  try {
    const rawByKey = new Map(keys.map(({ type, key, raw }) => [`${type}:${key}`, raw]));
    const stats = await getReportStats(keys);
    return stats
      .map((row) => ({
        match: toMatch(row),
        evidence: rawByKey.get(`${row.identifier_type}:${row.identifier_value}`),
      }))
      .sort((a, b) => b.match.report_count - a.match.report_count);
  } catch (err) {
    console.error(`[community] lookup failed: ${err.message}`);
    return [];
  }
}

/** One localized red flag per community match, quoting the identifier. */
export function communityRedFlags(found, language) {
  const names = localized(language, 'identifierNames');
  const explain = localized(language, 'communityExplanation');
  return found.map(({ match, evidence }) => ({
    flag: localized(language, 'communityFlag'),
    evidence: evidence ?? match.identifier_value,
    explanation: explain(names[match.identifier_type] ?? match.identifier_type, match.report_count),
  }));
}

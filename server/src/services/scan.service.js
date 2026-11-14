import { localized } from '../utils/localizedText.js';
import { extractIdentifiers } from '../utils/identifiers.js';
import { maskSensitiveNumbers, sanitizeForStorage } from '../utils/maskSensitive.js';
import { notifyGuardiansOfScan } from './alert.service.js';
import { communityRedFlags, findCommunityMatches } from './community.service.js';
import { insertScan } from './db.service.js';
import { analyzeMessage } from './gemini.service.js';

const MAX_RED_FLAGS = 12;

export const maskList = (items) => items.map((item) => maskSensitiveNumbers(item));
export const maskFlags = (flags) =>
  flags.map((flag) => ({
    flag: maskSensitiveNumbers(flag.flag),
    evidence: maskSensitiveNumbers(flag.evidence),
    explanation: maskSensitiveNumbers(flag.explanation),
  }));

/**
 * Community reports are a strong signal: identifiers already reported by other
 * users add a red flag, and a "safe" AI verdict is raised to "suspicious".
 */
function applyCommunitySignal(analysis, found, language) {
  if (found.length === 0) return analysis;

  const result = {
    ...analysis,
    red_flags: [...communityRedFlags(found, language), ...analysis.red_flags].slice(0, MAX_RED_FLAGS),
  };

  if (analysis.risk_level === 'safe') {
    result.risk_level = 'suspicious';
    result.risk_score = 55;
    result.scam_type = found[0].match.scam_types[0] ?? 'other';
    result.safe_reasons = [];
    result.actions = localized(language, 'scamActions');
  }
  return result;
}

/**
 * Analyses a message, screenshot or call transcript, saves the result and
 * alerts guardians when it is a scam. Images are processed in memory only.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} [params.text]        user-typed text or call transcript
 * @param {object} [params.image]       multer file (in memory)
 * @param {string} params.language
 * @param {'image'|'text'|'call'} params.inputType
 * @param {string} [params.storedText]  text to store (defaults to `text`)
 */
export async function analyseAndSaveScan({ userId, text, image, language, inputType, storedText }) {
  const analysis = await analyzeMessage({
    text,
    image,
    language,
    source: inputType === 'call' ? 'call' : 'message',
  });

  // Identifiers come from the raw text, before sensitive numbers are masked.
  const rawText = [storedText ?? text, analysis.extracted_text].filter(Boolean).join('\n');
  const identifiers = extractIdentifiers(rawText);
  const found = await findCommunityMatches(identifiers.keys);
  const result = applyCommunitySignal(analysis, found, language);

  const scan = await insertScan({
    user_id: userId,
    input_type: inputType,
    // Prefer what the user typed; otherwise keep the text read from the screenshot.
    message_text: sanitizeForStorage(storedText ?? text ?? analysis.extracted_text),
    risk_level: result.risk_level,
    risk_score: result.risk_score,
    scam_type: result.scam_type,
    red_flags: maskFlags(result.red_flags),
    summary: maskSensitiveNumbers(result.summary),
    explanation: maskSensitiveNumbers(result.explanation),
    actions: maskList(result.actions),
    safe_reasons: maskList(result.safe_reasons),
    identifiers: { phones: identifiers.phones, upi_ids: identifiers.upi_ids, urls: identifiers.urls },
    community_matches: found.map(({ match }) => match),
    language,
  });

  await notifyGuardiansOfScan(userId, scan);
  return scan;
}

import { MAX_STORED_MESSAGE_LENGTH } from '../config/constants.js';

// Matches 6 or more digits in a row, also when written in groups separated by
// a single space or hyphen (e.g. "1234 5678 9012" Aadhaar, "4111-1111-1111-1111" card).
const SENSITIVE_NUMBER = /\d(?:[ -]?\d){5,}/g;

/**
 * Replaces every long number with X's, keeping only the last 4 digits.
 * "Your OTP is 482913"           -> "Your OTP is XX2913"
 * "A/c 123456781234"             -> "A/c XXXXXXXX1234"
 * "Aadhaar 1234 5678 9012"       -> "Aadhaar XXXXXXXX9012"
 */
export function maskSensitiveNumbers(text) {
  if (typeof text !== 'string' || text.length === 0) return text;
  return text.replace(SENSITIVE_NUMBER, (match) => {
    const digits = match.replace(/[ -]/g, '');
    return 'X'.repeat(digits.length - 4) + digits.slice(-4);
  });
}

/** Masks sensitive numbers and truncates to the storage limit. */
export function sanitizeForStorage(text, maxLength = MAX_STORED_MESSAGE_LENGTH) {
  if (typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  return Array.from(maskSensitiveNumbers(trimmed)).slice(0, maxLength).join('');
}

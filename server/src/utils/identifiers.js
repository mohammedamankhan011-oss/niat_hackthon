// Parsing and normalisation of phone numbers, UPI IDs and website links, so
// different spellings of the same identifier ("+91 00000 00001",
// "0000000001", "+910000000001") share one community-report key.

const UPI_ID = /^[a-z0-9][a-z0-9._-]{1,255}@[a-z][a-z0-9]{1,63}$/;

// Hosts shared by many unrelated people: a link is identified by host + first
// path segment, so reporting one Telegram scam does not flag every t.me link.
const SHARED_HOSTS = new Set([
  't.me', 'telegram.me', 'wa.me', 'chat.whatsapp.com', 'bit.ly', 'tinyurl.com', 'cutt.ly',
  'rb.gy', 'is.gd', 'shorturl.at', 'goo.gl', 'forms.gle', 'linktr.ee', 'youtu.be',
]);

// Phone numbers in free text: any "+91" number, or a 10-digit Indian mobile
// number (starts with 6-9). Not part of a longer digit run.
const PHONE_IN_TEXT = /(?<![\w+])(?:\+91[\s-]?\d{5}[\s-]?\d{5}|0?[6-9]\d{4}[\s-]?\d{5})(?!\d)/g;
// UPI IDs in free text; "name@gmail.com" style emails are excluded.
const UPI_IN_TEXT = /(?<![\w.@-])[a-z0-9][a-z0-9._-]{1,255}@[a-z][a-z0-9]{1,63}(?!\.[a-z])(?![\w@-])/gi;
// Links: explicit http(s)/www, or a bare domain with a common TLD.
const URL_IN_TEXT =
  /(?:\bhttps?:\/\/|\bwww\.)[^\s<>"'`]+|(?<![@\w.-])(?:[a-z0-9-]+\.)+(?:com|in|net|org|info|biz|online|xyz|top|site|club|shop|live|link|app|io|co|me|cc|tk|ml|ga|cf|gq|buzz|icu|vip|example)(?:\/[^\s<>"'`]*)?(?![\w-])/gi;

const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"]+$/;

function phoneKey(digits) {
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  if (digits.length === 10) return digits;
  return null;
}

function urlKey(value) {
  const cleaned = value.replace(TRAILING_PUNCTUATION, '');
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;

  let url;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  if (!isIp && !/^([a-z0-9-]+\.)+[a-z][a-z0-9-]{1,62}$/.test(host)) return null;
  if (host.length > 200) return null;

  if (SHARED_HOSTS.has(host)) {
    const firstSegment = url.pathname.split('/').find(Boolean);
    if (!firstSegment) return null;
    return `${host}/${firstSegment}`.slice(0, 255);
  }
  return host;
}

/**
 * Normalises a user-entered phone number, UPI ID or link.
 * Returns { type, key } or null when the value is not a recognisable identifier.
 */
export function normalizeIdentifier(raw) {
  const value = String(raw ?? '').trim();
  if (!value || value.length > 2048) return null;
  const lower = value.toLowerCase();

  if (lower.includes('@') && !/^https?:\/\//.test(lower)) {
    return UPI_ID.test(lower) ? { type: 'upi', key: lower } : null;
  }
  if (/^[+\d\s().-]+$/.test(value)) {
    const key = phoneKey(value.replace(/\D/g, ''));
    return key ? { type: 'phone', key } : null;
  }
  const key = urlKey(value);
  return key ? { type: 'url', key } : null;
}

/** Human-friendly form of a normalised identifier. */
export function displayIdentifier(type, key) {
  if (type === 'phone') return `+91 ${key.slice(0, 5)} ${key.slice(5)}`;
  return key;
}

/**
 * Finds phone numbers, UPI IDs and links inside a message.
 * Returns { phones, upi_ids, urls } (display values, de-duplicated) and
 * `keys`: the normalised { type, key, raw } list used for community lookups,
 * where raw is the exact text found in the message.
 */
export function extractIdentifiers(text) {
  const result = { phones: [], upi_ids: [], urls: [] };
  const keys = [];
  const seen = new Set();
  if (typeof text !== 'string' || !text) return { ...result, keys };

  const add = (type, key, bucket, raw) => {
    if (!key || seen.has(`${type}:${key}`)) return;
    seen.add(`${type}:${key}`);
    keys.push({ type, key, raw: raw.replace(TRAILING_PUNCTUATION, '') });
    bucket.push(displayIdentifier(type, key));
  };

  for (const match of text.matchAll(PHONE_IN_TEXT)) {
    add('phone', phoneKey(match[0].replace(/\D/g, '')), result.phones, match[0]);
  }
  for (const match of text.matchAll(UPI_IN_TEXT)) {
    add('upi', match[0].toLowerCase(), result.upi_ids, match[0]);
  }
  for (const match of text.matchAll(URL_IN_TEXT)) {
    add('url', urlKey(match[0]), result.urls, match[0]);
  }

  const limit = 20;
  return {
    phones: result.phones.slice(0, limit),
    upi_ids: result.upi_ids.slice(0, limit),
    urls: result.urls.slice(0, limit),
    keys: keys.slice(0, limit * 3),
  };
}

import { createHash } from 'node:crypto';

// Small in-memory cache for AI answers: identical input + language returns the
// earlier result instantly. Entries expire after 30 minutes; the oldest entry
// is dropped when the cache is full. Cleared on restart (nothing is persisted).

const TTL_MS = 30 * 60 * 1000;
const MAX_ENTRIES = 500;
const store = new Map();

/** Stable key from any number of parts (strings or Buffers). */
export function cacheKey(...parts) {
  const hash = createHash('sha256');
  for (const part of parts) {
    hash.update(Buffer.isBuffer(part) ? part : String(part ?? ''));
    hash.update('\u0000');
  }
  return hash.digest('hex');
}

export function getCached(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return undefined;
  }
  return structuredClone(entry.value);
}

export function setCached(key, value) {
  if (store.has(key)) store.delete(key);
  store.set(key, { value: structuredClone(value), expiresAt: Date.now() + TTL_MS });
  while (store.size > MAX_ENTRIES) {
    store.delete(store.keys().next().value);
  }
}

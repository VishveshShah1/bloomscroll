import type { CheckResponse } from "./types";
import type { Lang } from "./i18n";

// Phase 5: in-memory result cache keyed by a hash of the input + language.
// Repeat checks (including demo re-runs) return instantly and don't burn API
// calls. Bounded LRU so a long-running server can't grow unbounded.

const MAX_ENTRIES = 200;
const store = new Map<string, CheckResponse>();

function hash(s: string): string {
  // FNV-1a 32-bit — small, fast, no deps. Not cryptographic; just a cache key.
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

export function cacheKey(input: string, lang: Lang): string {
  return `${lang}:${hash(input.trim().toLowerCase())}`;
}

export function getCached(key: string): CheckResponse | undefined {
  const hit = store.get(key);
  if (hit) {
    // refresh recency
    store.delete(key);
    store.set(key, hit);
  }
  return hit;
}

export function setCached(key: string, value: CheckResponse): void {
  store.set(key, value);
  if (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
}

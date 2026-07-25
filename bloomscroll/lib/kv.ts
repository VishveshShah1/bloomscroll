import { Redis } from "@upstash/redis";

// Key-value abstraction. Uses Upstash Redis when UPSTASH_REDIS_REST_URL +
// UPSTASH_REDIS_REST_TOKEN are set; otherwise falls back to an in-process Map.
//
// The Map fallback loses state on restart and doesn't share across serverless
// instances — fine for local dev, not for production traffic. Once you have
// real users, set the Upstash env vars and the same code just works.

type StoredValue = { value: string; expiresAt?: number };

class MemoryKV {
  private store = new Map<string, StoredValue>();

  private live(k: string): StoredValue | undefined {
    const v = this.store.get(k);
    if (!v) return undefined;
    if (v.expiresAt && v.expiresAt < Date.now()) {
      this.store.delete(k);
      return undefined;
    }
    return v;
  }

  async get(key: string): Promise<string | null> {
    const v = this.live(key);
    return v ? v.value : null;
  }

  async set(key: string, value: string, opts?: { ex?: number }): Promise<void> {
    const expiresAt = opts?.ex ? Date.now() + opts.ex * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async incrBy(key: string, delta: number): Promise<number> {
    const current = Number(this.live(key)?.value ?? "0");
    const next = current + delta;
    const existing = this.store.get(key);
    this.store.set(key, { value: String(next), expiresAt: existing?.expiresAt });
    return next;
  }

  async expire(key: string, seconds: number): Promise<void> {
    const v = this.store.get(key);
    if (!v) return;
    this.store.set(key, { value: v.value, expiresAt: Date.now() + seconds * 1000 });
  }
}

let cached: {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, opts?: { ex?: number }): Promise<void>;
  del(key: string): Promise<void>;
  incrBy(key: string, delta: number): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
} | null = null;

let warnedFallback = false;

function build() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    const redis = new Redis({ url, token });
    return {
      async get(key: string) {
        const v = await redis.get<string | number>(key);
        if (v === null || v === undefined) return null;
        return String(v);
      },
      async set(key: string, value: string, opts?: { ex?: number }) {
        if (opts?.ex) await redis.set(key, value, { ex: opts.ex });
        else await redis.set(key, value);
      },
      async del(key: string) {
        await redis.del(key);
      },
      async incrBy(key: string, delta: number) {
        return await redis.incrby(key, delta);
      },
      async expire(key: string, seconds: number) {
        await redis.expire(key, seconds);
      },
    };
  }
  if (!warnedFallback) {
    console.warn(
      "[kv] Upstash env vars missing (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN). Using in-process Map — state won't survive restarts or scale across serverless instances.",
    );
    warnedFallback = true;
  }
  return new MemoryKV();
}

export function kv() {
  if (!cached) cached = build();
  return cached;
}

// ---- key builders --------------------------------------------------------

export function monthKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function dayKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate(),
  ).padStart(2, "0")}`;
}

/** Seconds from now until 00:00 UTC of the 1st of the next month. */
export function secondsUntilMonthEnd(now = new Date()): number {
  const nextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
  );
  return Math.max(60, Math.floor((nextMonth.getTime() - now.getTime()) / 1000));
}

/** Seconds from now until 00:00 UTC tomorrow. */
export function secondsUntilDayEnd(now = new Date()): number {
  const nextDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0),
  );
  return Math.max(60, Math.floor((nextDay.getTime() - now.getTime()) / 1000));
}

/** ISO date for the 1st of the next month (for UI "resets on X" copy). */
export function monthResetIso(now = new Date()): string {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
  ).toISOString();
}

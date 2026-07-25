import { dayKey, kv, secondsUntilDayEnd } from "./kv";

// Circuit breaker for global daily API spend. Rough token-based estimate.
// If the day's estimated spend exceeds SPEND_CAP_DAILY_USD, ensureCanSpend()
// throws SpendCapExceededError, which the pipeline treats as a signal to
// serve labeled sample data for the rest of the day (same graceful path
// used for a missing API key). Reset happens on its own via TTL.
//
// The cap is a safety net against viral traffic, abuse, or a bug looping
// requests. It does NOT replace per-user quotas — those live in usage.ts.

export const SPEND_CAP_DAILY_USD = Number(process.env.SPEND_CAP_DAILY_USD ?? 10);

// Approximate per-model $ per 1M tokens. Update as pricing changes.
// Values in USD.
const MODEL_PRICES: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-sonnet-4-6-20250219": { input: 3, output: 15 },
  "claude-opus-4-7": { input: 15, output: 75 },
  "claude-haiku-4-5-20251001": { input: 1, output: 5 },
};
const FALLBACK_PRICE = { input: 3, output: 15 };

export class SpendCapExceededError extends Error {
  constructor(public readonly spentCents: number, public readonly capCents: number) {
    super("daily spend cap reached");
  }
}

function priceFor(model: string) {
  return MODEL_PRICES[model] ?? FALLBACK_PRICE;
}

/** Convert USD amount to integer cents (KV stores strings; ints avoid float drift). */
function usdToCents(usd: number): number {
  return Math.round(usd * 100);
}
function centsToUsd(c: number): number {
  return c / 100;
}

function spendKey(date = new Date()): string {
  return `spend:daily:${dayKey(date)}`;
}

export async function getDailySpendCents(): Promise<number> {
  const raw = await kv().get(spendKey());
  const n = Number(raw ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Fast pre-flight check called before every Anthropic call. Throws
 * SpendCapExceededError if today's estimated spend is already at or over the
 * cap. The pipeline catches this and falls back to sample data.
 */
export async function ensureCanSpend(): Promise<void> {
  const capCents = usdToCents(SPEND_CAP_DAILY_USD);
  const spent = await getDailySpendCents();
  if (spent >= capCents) {
    console.warn(
      `[spend] daily cap reached: $${centsToUsd(spent).toFixed(2)} spent >= $${SPEND_CAP_DAILY_USD.toFixed(2)} cap. Serving sample data.`,
    );
    throw new SpendCapExceededError(spent, capCents);
  }
}

/**
 * Called AFTER an Anthropic response comes back. Adds the estimated cost
 * to today's counter in KV. TTL is set on first write of the day so old
 * counters expire on their own.
 */
export async function chargeSpend(
  usage: { input_tokens?: number; output_tokens?: number } | null | undefined,
  model: string,
): Promise<void> {
  if (!usage) return;
  const p = priceFor(model);
  const cost =
    ((usage.input_tokens ?? 0) * p.input + (usage.output_tokens ?? 0) * p.output) / 1_000_000;
  const cents = Math.max(1, Math.round(cost * 100)); // floor at 1¢ so a burst of tiny calls still counts
  const key = spendKey();
  const next = await kv().incrBy(key, cents);
  if (next === cents) {
    // first write of the day — set TTL so it self-clears at midnight UTC
    await kv().expire(key, secondsUntilDayEnd());
  }
}

// ---- read-only snapshot for the UI or a status endpoint -----------------

export async function readSpendSnapshot(): Promise<{
  spentUsd: number;
  capUsd: number;
  capHit: boolean;
}> {
  const spent = await getDailySpendCents();
  const cap = usdToCents(SPEND_CAP_DAILY_USD);
  return {
    spentUsd: centsToUsd(spent),
    capUsd: SPEND_CAP_DAILY_USD,
    capHit: spent >= cap,
  };
}

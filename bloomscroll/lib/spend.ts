// Server-only guard. This module reads ANTHROPIC pricing knobs, but more
// importantly its callers (extract.ts, grade.ts) read ANTHROPIC_API_KEY and
// hit the Anthropic API. Nothing in this graph must ever ship to the browser.
if (typeof window !== "undefined") {
  throw new Error("lib/spend.ts is server-only and must not run in the browser");
}

import { kv, monthKey, secondsUntilMonthEnd } from "./kv";

// Monthly circuit breaker for Anthropic API spend, split into two independent
// buckets so a burst of free-tier traffic can never starve paying customers:
//
//   • FREE bucket   → seed users only. If this exhausts, ensureCanSpend()
//                     throws SpendCapExceededError and the pipeline falls
//                     back to labeled sample data (same graceful path used
//                     when the API key is missing). Paid users are unaffected.
//   • PAID bucket   → sprout + canopy users. This bucket NEVER auto-degrades
//                     paid customers. Once spend crosses PAID_ALERT_THRESHOLD_RATIO
//                     of the cap we log a loud warning (once per month) so a
//                     human can raise the cap or investigate. Auto-fallback for
//                     paying users is a decision that requires a human, not a
//                     silent server-side flip.
//
// Combined default caps ($10 free + $25 paid = $35) match the intended
// monthly budget, overridable via env vars for staging/production tuning.
//
// The counters live under `spend:monthly:{free,paid}:YYYY-MM` in KV. TTL is
// set on first write of the month so old counters expire on their own once
// the calendar rolls forward.

export const SPEND_CAP_FREE_MONTHLY_USD = Number(
  process.env.SPEND_CAP_FREE_MONTHLY_USD ?? 10,
);
export const SPEND_CAP_PAID_MONTHLY_USD = Number(
  process.env.SPEND_CAP_PAID_MONTHLY_USD ?? 25,
);
export const SPEND_CAP_TOTAL_MONTHLY_USD =
  SPEND_CAP_FREE_MONTHLY_USD + SPEND_CAP_PAID_MONTHLY_USD;

/** Fraction of the paid cap at which the "paid budget at risk" alert fires. */
export const PAID_ALERT_THRESHOLD_RATIO = Number(
  process.env.PAID_ALERT_THRESHOLD_RATIO ?? 0.8,
);

/**
 * Per-Canopy-user soft flag. Canopy is genuinely unlimited to the user —
 * this is INTERNAL visibility only, so we notice if a single Canopy account
 * is running the API cost past what they're paying (~$19.99). No block, no
 * downgrade — just a one-per-month alert per user in the server logs.
 */
export const CANOPY_USER_ALERT_USD = Number(
  process.env.CANOPY_USER_ALERT_USD ?? 15,
);

export type SpendTier = "free" | "paid";

export interface SpendContext {
  tier: SpendTier;
  /** Full plan slug — used only for Canopy per-user tracking. */
  plan?: "seed" | "sprout" | "canopy";
  /** Signed-in user email. Only used when plan === "canopy". */
  email?: string | null;
}

// Per-model $ per 1M tokens. Update as pricing changes. Values in USD.
//
// Keep BOTH the bare alias and the dated snapshot for any model we actually
// call: an unlisted id silently falls through to FALLBACK_PRICE, which would
// have billed Haiku at Sonnet's rate and made the cheap half of the pipeline
// look 3x more expensive than it is.
const MODEL_PRICES: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-sonnet-4-6-20250219": { input: 3, output: 15 },
  "claude-sonnet-5": { input: 3, output: 15 },
  "claude-opus-4-7": { input: 15, output: 75 },
  "claude-opus-5": { input: 5, output: 25 },
  "claude-haiku-4-5": { input: 1, output: 5 },
  "claude-haiku-4-5-20251001": { input: 1, output: 5 },
};
const FALLBACK_PRICE = { input: 3, output: 15 };

export class SpendCapExceededError extends Error {
  constructor(
    public readonly tier: SpendTier,
    public readonly spentCents: number,
    public readonly capCents: number,
  ) {
    super(`monthly spend cap reached for ${tier} tier`);
    this.name = "SpendCapExceededError";
  }
}

function priceFor(model: string) {
  return MODEL_PRICES[model] ?? FALLBACK_PRICE;
}

function usdToCents(usd: number): number {
  return Math.round(usd * 100);
}
function centsToUsd(c: number): number {
  return c / 100;
}

// ---- key builders --------------------------------------------------------

function freeSpendKey(date = new Date()): string {
  return `spend:monthly:free:${monthKey(date)}`;
}
function paidSpendKey(date = new Date()): string {
  return `spend:monthly:paid:${monthKey(date)}`;
}
function paidAlertKey(date = new Date()): string {
  return `spend:alert:paid:${monthKey(date)}`;
}
function canopyUserSpendKey(email: string, date = new Date()): string {
  return `spend:monthly:canopy:${email.toLowerCase()}:${monthKey(date)}`;
}
function canopyUserAlertKey(email: string, date = new Date()): string {
  return `spend:alert:canopy:${email.toLowerCase()}:${monthKey(date)}`;
}

// ---- read helpers --------------------------------------------------------

async function readCounterCents(key: string): Promise<number> {
  const raw = await kv().get(key);
  const n = Number(raw ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export async function getMonthlyFreeSpendCents(): Promise<number> {
  return readCounterCents(freeSpendKey());
}
export async function getMonthlyPaidSpendCents(): Promise<number> {
  return readCounterCents(paidSpendKey());
}
export async function getMonthlyCanopyUserSpendCents(email: string): Promise<number> {
  return readCounterCents(canopyUserSpendKey(email));
}

// ---- gate ---------------------------------------------------------------

/**
 * Fast pre-flight check called before every Anthropic call. Behavior differs
 * by tier:
 *
 *   • free: throws SpendCapExceededError when the free monthly cap is hit,
 *           so the pipeline falls back to labeled sample data. This is the
 *           safety net that stops viral / abusive free-tier traffic from
 *           burning the entire monthly budget.
 *   • paid: NEVER throws. Paying customers must not be silently downgraded.
 *           When spend crosses PAID_ALERT_THRESHOLD_RATIO of the paid cap
 *           the first call in that state logs a loud one-per-month warning
 *           so an operator can extend the cap or investigate.
 */
export async function ensureCanSpend(ctx: SpendContext): Promise<void> {
  if (ctx.tier === "free") {
    const capCents = usdToCents(SPEND_CAP_FREE_MONTHLY_USD);
    const spent = await getMonthlyFreeSpendCents();
    if (spent >= capCents) {
      console.warn(
        `[spend] FREE monthly cap reached: $${centsToUsd(spent).toFixed(2)} spent >= $${SPEND_CAP_FREE_MONTHLY_USD.toFixed(2)} cap. Serving sample data to free users for the rest of the month. Paid users are unaffected.`,
      );
      throw new SpendCapExceededError("free", spent, capCents);
    }
    return;
  }

  // Paid tier: never throw — just alert if we're approaching the ceiling.
  const capCents = usdToCents(SPEND_CAP_PAID_MONTHLY_USD);
  const spent = await getMonthlyPaidSpendCents();
  const threshold = Math.round(capCents * PAID_ALERT_THRESHOLD_RATIO);
  if (spent < threshold) return;

  const store = kv();
  const alertKey = paidAlertKey();
  const alreadyAlerted = await store.get(alertKey);
  if (alreadyAlerted) return;

  const pct = capCents === 0 ? 100 : (spent / capCents) * 100;
  console.warn(
    `[spend] PAID monthly budget at ${pct.toFixed(1)}%: $${centsToUsd(spent).toFixed(2)} / $${SPEND_CAP_PAID_MONTHLY_USD.toFixed(2)}. Paying customers are NOT being auto-degraded — raise SPEND_CAP_PAID_MONTHLY_USD or investigate usage. Human decision required.`,
  );
  await store.set(alertKey, "1", { ex: secondsUntilMonthEnd() });
}

// ---- charge -------------------------------------------------------------

/**
 * Called AFTER an Anthropic response comes back. Adds the estimated cost to
 * the appropriate monthly bucket (free vs. paid), and — for Canopy users
 * only — to a per-user counter that fires a soft alert if any single account
 * crosses CANOPY_USER_ALERT_USD in a month. Never blocks or throws.
 */
export async function chargeSpend(
  usage: { input_tokens?: number; output_tokens?: number } | null | undefined,
  model: string,
  ctx: SpendContext,
): Promise<void> {
  if (!usage) return;
  const p = priceFor(model);
  const inTok = usage.input_tokens ?? 0;
  const outTok = usage.output_tokens ?? 0;
  const cost = (inTok * p.input + outTok * p.output) / 1_000_000;

  // Exact, unrounded per-call line. The KV counter below floors every call at
  // 1¢, which is right for a budget guard but makes it useless for answering
  // "what does one check actually cost" — a Haiku extraction is well under a
  // cent and would read as 1¢. Grep BLOOMSCROLL_COST in the logs to total a
  // real check from real token counts.
  console.log(
    `[spend] BLOOMSCROLL_COST model=${model} in=${inTok} out=${outTok} usd=${cost.toFixed(6)}`,
  );

  const cents = Math.max(1, Math.round(cost * 100)); // floor at 1¢ so a burst of tiny calls still counts

  const store = kv();
  const bucketKey = ctx.tier === "free" ? freeSpendKey() : paidSpendKey();
  const bucketNext = await store.incrBy(bucketKey, cents);
  if (bucketNext === cents) {
    await store.expire(bucketKey, secondsUntilMonthEnd());
  }

  // Per-Canopy-user visibility. Sprout is bounded by PLAN_MONTHLY_LIMIT so
  // per-user tracking isn't useful there — a Sprout account can't run away.
  if (ctx.plan === "canopy" && ctx.email) {
    const userKey = canopyUserSpendKey(ctx.email);
    const userNext = await store.incrBy(userKey, cents);
    if (userNext === cents) {
      await store.expire(userKey, secondsUntilMonthEnd());
    }
    const alertCents = usdToCents(CANOPY_USER_ALERT_USD);
    if (userNext >= alertCents) {
      const alertKey = canopyUserAlertKey(ctx.email);
      const already = await store.get(alertKey);
      if (!already) {
        console.warn(
          `[spend] CANOPY user usage alert: ${ctx.email} crossed $${CANOPY_USER_ALERT_USD} in estimated Anthropic cost this month ($${centsToUsd(userNext).toFixed(2)}). NO block, NO downgrade — Canopy stays unlimited from their side. This is visibility only so we're not silently losing money on individual heavy users.`,
        );
        await store.set(alertKey, "1", { ex: secondsUntilMonthEnd() });
      }
    }
  }
}

// ---- read-only snapshot --------------------------------------------------

export async function readSpendSnapshot(): Promise<{
  free: { spentUsd: number; capUsd: number; capHit: boolean };
  paid: { spentUsd: number; capUsd: number; overThreshold: boolean };
  totalUsd: number;
  totalCapUsd: number;
}> {
  const [freeCents, paidCents] = await Promise.all([
    getMonthlyFreeSpendCents(),
    getMonthlyPaidSpendCents(),
  ]);
  const freeCap = usdToCents(SPEND_CAP_FREE_MONTHLY_USD);
  const paidCap = usdToCents(SPEND_CAP_PAID_MONTHLY_USD);
  const paidThreshold = Math.round(paidCap * PAID_ALERT_THRESHOLD_RATIO);
  return {
    free: {
      spentUsd: centsToUsd(freeCents),
      capUsd: SPEND_CAP_FREE_MONTHLY_USD,
      capHit: freeCents >= freeCap,
    },
    paid: {
      spentUsd: centsToUsd(paidCents),
      capUsd: SPEND_CAP_PAID_MONTHLY_USD,
      overThreshold: paidCents >= paidThreshold,
    },
    totalUsd: centsToUsd(freeCents + paidCents),
    totalCapUsd: SPEND_CAP_TOTAL_MONTHLY_USD,
  };
}

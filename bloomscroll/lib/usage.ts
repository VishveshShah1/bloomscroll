import { kv, monthKey, monthResetIso, secondsUntilMonthEnd } from "./kv";
import { getBonusChecks } from "./reviews";

export type Plan = "seed" | "sprout" | "canopy";

// Monthly caps per plan. `null` = unlimited. Single source of truth: change
// numbers here and every call site (quota gate, /api/usage response, UI copy
// derivations) picks it up. Sprout is bounded to protect against a single
// paid account driving runaway API cost; Canopy is the tier that pays for
// genuinely unlimited use.
export const PLAN_MONTHLY_LIMIT: Record<Plan, number | null> = {
  seed: 5,
  sprout: 150,
  canopy: null,
};

// Kept as a named export because /api/usage and older callers import it.
// Points at the free-tier number in the map above so it can never drift.
export const FREE_TIER_LIMIT = PLAN_MONTHLY_LIMIT.seed as number;

// Per-account hourly rate limit — applies to EVERY tier including Canopy.
// This is a safeguard against a single compromised or scripted account
// hammering the pipeline, independent of monthly billing caps.
export const HOURLY_RATE_LIMIT = 20;

export class UsageLimitExceededError extends Error {
  constructor(
    public readonly used: number,
    public readonly limit: number,
    public readonly resetAt: string,
  ) {
    super("usage limit reached");
  }
}

export class RateLimitExceededError extends Error {
  constructor(
    public readonly used: number,
    public readonly limit: number,
    public readonly retryAfterSeconds: number,
  ) {
    super("hourly rate limit reached");
  }
}

// ---- plan lookup ---------------------------------------------------------
// Plan is written by the Stripe webhook keyed by customer_email. Anyone we
// don't have a record for is on the free Seed tier.

function planKey(email: string): string {
  return `plan:${email.toLowerCase()}`;
}

export async function getPlan(email: string | null | undefined): Promise<Plan> {
  if (!email) return "seed";
  const raw = await kv().get(planKey(email));
  if (raw === "sprout" || raw === "canopy") return raw;
  return "seed";
}

export async function setPlan(email: string, plan: Plan): Promise<void> {
  await kv().set(planKey(email.toLowerCase()), plan);
}

export async function clearPlan(email: string): Promise<void> {
  await kv().del(planKey(email.toLowerCase()));
}

// ---- monthly usage counter ----------------------------------------------

function usageKey(userId: string, date = new Date()): string {
  return `usage:${userId}:${monthKey(date)}`;
}

export async function getMonthlyUsage(userId: string): Promise<number> {
  const raw = await kv().get(usageKey(userId));
  const n = Number(raw ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export async function incrementMonthlyUsage(userId: string): Promise<number> {
  const key = usageKey(userId);
  const next = await kv().incrBy(key, 1);
  // Set TTL on first write of the month so old counters expire on their own.
  if (next === 1) await kv().expire(key, secondsUntilMonthEnd());
  return next;
}

// ---- hourly rate limiter ------------------------------------------------
// Fixed 1-hour bucket per user, keyed by calendar UTC hour. Atomic incr +
// check means concurrent requests can't slip past the limit. Increment
// happens on every ATTEMPT (not just successful pipelines) because the
// point is to stop hammering, not to bill fairly — even a failing request
// still costs us upstream work.

function hourKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate(),
  ).padStart(2, "0")}-${String(date.getUTCHours()).padStart(2, "0")}`;
}

function rateKey(userId: string, date = new Date()): string {
  return `rate:hour:${userId}:${hourKey(date)}`;
}

function secondsUntilHourEnd(now = new Date()): number {
  const nextHour = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours() + 1,
      0,
      0,
      0,
    ),
  );
  return Math.max(60, Math.floor((nextHour.getTime() - now.getTime()) / 1000));
}

/**
 * Atomically increment the caller's hourly bucket, then throw if they've
 * crossed HOURLY_RATE_LIMIT for this hour. Applies to every tier. Sets a
 * TTL on the bucket the first time it's written so it self-cleans.
 */
export async function enforceHourlyRate(userId: string): Promise<void> {
  const now = new Date();
  const key = rateKey(userId, now);
  const count = await kv().incrBy(key, 1);
  if (count === 1) await kv().expire(key, secondsUntilHourEnd(now));
  if (count > HOURLY_RATE_LIMIT) {
    throw new RateLimitExceededError(
      count,
      HOURLY_RATE_LIMIT,
      secondsUntilHourEnd(now),
    );
  }
}

// ---- quota gate ----------------------------------------------------------

export interface QuotaSnapshot {
  plan: Plan;
  used: number;
  /** Number for finite plans, null for "unlimited". Includes any review bonus. */
  limit: number | null;
  /** Bonus checks granted by leaving a review — added to the base plan cap. */
  bonus: number;
  resetAt: string;
}

export async function readQuota(
  userId: string,
  email: string | null | undefined,
): Promise<QuotaSnapshot> {
  const [plan, used, bonus] = await Promise.all([
    getPlan(email),
    getMonthlyUsage(userId),
    getBonusChecks(email),
  ]);
  const baseLimit = PLAN_MONTHLY_LIMIT[plan];
  const limit = baseLimit === null ? null : baseLimit + bonus;
  return { plan, used, limit, bonus, resetAt: monthResetIso() };
}

/**
 * Throws UsageLimitExceededError if the user has already hit the monthly
 * cap. Otherwise returns the snapshot (the caller increments *after*
 * success so a failed pipeline doesn't burn one of the user's checks).
 */
export async function requireQuota(
  userId: string,
  email: string | null | undefined,
): Promise<QuotaSnapshot> {
  const snap = await readQuota(userId, email);
  if (snap.limit !== null && snap.used >= snap.limit) {
    throw new UsageLimitExceededError(snap.used, snap.limit, snap.resetAt);
  }
  return snap;
}

import { kv, monthKey, monthResetIso, secondsUntilMonthEnd } from "./kv";
import { getBonusChecks } from "./reviews";

// Free-tier cap. Single source of truth. Change here to change everywhere.
export const FREE_TIER_LIMIT = 5;

export type Plan = "seed" | "sprout" | "canopy";

export class UsageLimitExceededError extends Error {
  constructor(
    public readonly used: number,
    public readonly limit: number,
    public readonly resetAt: string,
  ) {
    super("usage limit reached");
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

// ---- quota gate ----------------------------------------------------------

export interface QuotaSnapshot {
  plan: Plan;
  used: number;
  /** Number for finite plans, null for "unlimited". Includes any review bonus. */
  limit: number | null;
  /** Bonus checks granted by leaving a review — added to the base free cap. */
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
  const baseLimit = plan === "seed" ? FREE_TIER_LIMIT : null;
  const limit = baseLimit === null ? null : baseLimit + bonus;
  return { plan, used, limit, bonus, resetAt: monthResetIso() };
}

/**
 * Throws UsageLimitExceededError if the user has already hit the cap.
 * Otherwise returns the snapshot (the caller increments *after* success so
 * a failed pipeline doesn't burn one of the user's checks).
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

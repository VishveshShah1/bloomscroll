// Uninstall-retention flow. chrome.runtime.setUninstallURL sends people to
// /comeback after they remove the extension; this grants a one-time bonus of
// checks to anyone signed in who wants to give it another go, and records why
// they left.
//
// The bonus is deliberately tied to the account, not the page: an offer of
// "3 free checks" that isn't actually attached to anyone's quota is just copy.
// It reuses the same `bonus:{email}` counter the review flow writes to, which
// readQuota() already adds on top of the plan cap — so a granted check is
// immediately spendable with no other wiring.

import { kv } from "./kv";

export const COMEBACK_BONUS_CHECKS = 3;

/** Max length we'll persist for the "what wasn't working?" answer. */
const REASON_MAX = 500;

function bonusKey(email: string): string {
  return `bonus:${email.toLowerCase()}`;
}
/** One-time guard, so re-visiting the page can't farm checks. */
function claimKey(email: string): string {
  return `comeback:claimed:${email.toLowerCase()}`;
}
function reasonKey(email: string): string {
  return `comeback:reason:${email.toLowerCase()}`;
}
const REASON_INDEX = "comeback:index";

export async function hasClaimedComeback(
  email: string | null | undefined,
): Promise<boolean> {
  if (!email) return false;
  const raw = await kv().get(claimKey(email));
  return raw !== null && raw !== undefined;
}

export type ComebackResult =
  | { ok: true; bonus: number; alreadyClaimed: false }
  | { ok: true; bonus: 0; alreadyClaimed: true }
  | { ok: false; reason: string };

/**
 * Grants the bonus once per account and stores the (optional) reason.
 *
 * Note the `incrBy` rather than `set`: the review flow writes to the same
 * counter, and a plain set from either side would silently wipe the other's
 * grant. Each grant is guarded by its own one-time key, so adding is safe.
 */
export async function claimComeback(
  email: string | null | undefined,
  reason: string | null | undefined,
): Promise<ComebackResult> {
  if (!email) {
    return { ok: false, reason: "Sign in first so we know which account to add the checks to." };
  }
  const store = kv();
  const trimmed = (reason ?? "").trim().slice(0, REASON_MAX);

  // Record the reason even for a repeat visit — feedback is worth more than
  // the guard, and it's keyed per account so it can't spam.
  if (trimmed) {
    await store.set(reasonKey(email), trimmed);
    const current = (await store.get(REASON_INDEX)) ?? "";
    const list = current.split("|").filter(Boolean);
    const normal = email.toLowerCase();
    if (!list.includes(normal)) {
      list.push(normal);
      await store.set(REASON_INDEX, list.join("|"));
    }
  }

  if (await hasClaimedComeback(email)) {
    return { ok: true, bonus: 0, alreadyClaimed: true };
  }

  await store.incrBy(bonusKey(email), COMEBACK_BONUS_CHECKS);
  await store.set(claimKey(email), new Date().toISOString());
  return { ok: true, bonus: COMEBACK_BONUS_CHECKS, alreadyClaimed: false };
}

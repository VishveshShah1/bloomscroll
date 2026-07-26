import { kv } from "./kv";

/**
 * Reviews are one-per-account and private — stored in the same KV as usage
 * and feedback, never surfaced automatically on the public site. Submitting
 * a genuine review (min-40-char comment) grants a one-time bonus of 3
 * checks on top of the free tier cap.
 *
 * We keep a lightweight `review:index` string (pipe-joined emails) so the
 * admin route can list them without a KEYS/SCAN op. Small volume by design.
 */

export const REVIEW_MIN_COMMENT_LEN = 40;
export const REVIEW_BONUS_CHECKS = 3;

export interface ReviewPayload {
  email: string;
  stars: 1 | 2 | 3 | 4 | 5;
  comment: string;
  timestamp: string;
  bonusGranted: number;
}

function reviewKey(email: string): string {
  return `review:${email.toLowerCase()}`;
}
function bonusKey(email: string): string {
  return `bonus:${email.toLowerCase()}`;
}
const INDEX_KEY = "review:index";

export async function hasSubmittedReview(
  email: string | null | undefined,
): Promise<boolean> {
  if (!email) return false;
  const raw = await kv().get(reviewKey(email));
  return raw !== null && raw !== undefined;
}

export async function getBonusChecks(
  email: string | null | undefined,
): Promise<number> {
  if (!email) return 0;
  const raw = await kv().get(bonusKey(email));
  const n = Number(raw ?? 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

async function appendIndex(email: string): Promise<void> {
  const store = kv();
  const current = (await store.get(INDEX_KEY)) ?? "";
  const list = current.split("|").filter(Boolean);
  const normal = email.toLowerCase();
  if (list.includes(normal)) return;
  list.push(normal);
  await store.set(INDEX_KEY, list.join("|"));
}

export type SubmitResult =
  | { ok: true; bonus: number }
  | { ok: false; reason: string };

export async function submitReview(input: {
  email: string;
  stars: number;
  comment: string;
}): Promise<SubmitResult> {
  const stars = Math.round(input.stars);
  if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
    return { ok: false, reason: "Stars must be between 1 and 5." };
  }
  const comment = (input.comment ?? "").trim();
  if (comment.length < REVIEW_MIN_COMMENT_LEN) {
    return {
      ok: false,
      reason: `Comment must be at least ${REVIEW_MIN_COMMENT_LEN} characters — the bonus is for real feedback, not empty stars.`,
    };
  }
  if (await hasSubmittedReview(input.email)) {
    return {
      ok: false,
      reason: "You've already left a review. Only one per account.",
    };
  }
  const payload: ReviewPayload = {
    email: input.email.toLowerCase(),
    stars: stars as 1 | 2 | 3 | 4 | 5,
    comment: comment.slice(0, 2000),
    timestamp: new Date().toISOString(),
    bonusGranted: REVIEW_BONUS_CHECKS,
  };
  const store = kv();
  await store.set(reviewKey(input.email), JSON.stringify(payload));
  await store.set(bonusKey(input.email), String(REVIEW_BONUS_CHECKS));
  await appendIndex(input.email);
  return { ok: true, bonus: REVIEW_BONUS_CHECKS };
}

/** Admin only. Reads the index + hydrates each record. */
export async function listReviews(): Promise<ReviewPayload[]> {
  const store = kv();
  const idx = (await store.get(INDEX_KEY)) ?? "";
  const emails = idx.split("|").filter(Boolean);
  const out: ReviewPayload[] = [];
  for (const email of emails) {
    const raw = await store.get(reviewKey(email));
    if (!raw) continue;
    try {
      out.push(JSON.parse(raw) as ReviewPayload);
    } catch {
      // skip corrupted record
    }
  }
  // newest first
  return out.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
}

/** Admin gate — matches session email against ADMIN_EMAIL env, case-insensitive. */
export function isAdmin(email: string | null | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (!adminEmail) return false;
  return Boolean(email && email.toLowerCase() === adminEmail);
}

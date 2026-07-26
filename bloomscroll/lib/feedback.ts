import { kv, dayKey, secondsUntilMonthEnd } from "./kv";

/**
 * Lightweight feedback storage — reuses the same KV that powers usage
 * counters and Stripe plan flags. Each submission is stored as one JSON
 * record; running totals per day are kept in a separate counter for cheap
 * "how many thumbs up today" reads later. No PII is stored beyond an
 * optional email (only if the user was signed in when they submitted).
 */

export type FeedbackValue = "up" | "down";

export interface FeedbackPayload {
  value: FeedbackValue;
  /** Optional free-text comment (may be truncated by the API). */
  comment?: string;
  /** Optional graded verdict the feedback is about, if known. */
  verdict?: string;
  /** Optional short hash/tag identifying the claim so we can join later. */
  claimTag?: string;
  /** Signed-in user's email, if any. Never a required field. */
  email?: string | null;
  /** ISO timestamp — set by the server. */
  timestamp: string;
}

const MAX_COMMENT_LEN = 500;
/** Feedback records live for two months, then get evicted. Rolling window. */
const FEEDBACK_TTL_SECONDS = 60 * 60 * 24 * 62;

function feedbackKey(id: string): string {
  return `feedback:record:${id}`;
}

function counterKey(day: string, value: FeedbackValue): string {
  return `feedback:count:${day}:${value}`;
}

function newId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${Date.now().toString(36)}-${rand}`;
}

export async function submitFeedback(
  raw: Omit<FeedbackPayload, "timestamp">,
): Promise<{ id: string }> {
  const payload: FeedbackPayload = {
    value: raw.value,
    comment: raw.comment ? raw.comment.slice(0, MAX_COMMENT_LEN) : undefined,
    verdict: raw.verdict,
    claimTag: raw.claimTag,
    email: raw.email ?? null,
    timestamp: new Date().toISOString(),
  };
  const id = newId();
  const store = kv();
  await store.set(feedbackKey(id), JSON.stringify(payload), {
    ex: FEEDBACK_TTL_SECONDS,
  });
  const day = dayKey();
  const counter = counterKey(day, payload.value);
  const total = await store.incrBy(counter, 1);
  // Set TTL on first hit so counters don't accumulate forever.
  if (total === 1) {
    await store.expire(counter, secondsUntilMonthEnd() + 60 * 60 * 24 * 40);
  }
  return { id };
}

export async function getFeedbackCounts(
  day = dayKey(),
): Promise<{ up: number; down: number }> {
  const store = kv();
  const [up, down] = await Promise.all([
    store.get(counterKey(day, "up")),
    store.get(counterKey(day, "down")),
  ]);
  return {
    up: Number(up ?? 0) || 0,
    down: Number(down ?? 0) || 0,
  };
}

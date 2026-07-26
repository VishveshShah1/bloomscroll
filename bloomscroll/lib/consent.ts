import { kv } from "./kv";

/**
 * Per-account consent record — captured on sign-up (both flags) and
 * mutable from the dashboard for the email opt-in.
 *
 * ToS acceptance is recorded once with a timestamp. The email opt-in
 * is opt-in by default (unchecked at sign-up), can be toggled later,
 * and stores both the last-changed timestamp and the state.
 */
export interface ConsentRecord {
  email: string;
  tosAcceptedAt: string | null;
  emailOptIn: boolean;
  emailOptInChangedAt: string | null;
}

function key(email: string): string {
  return `consent:${email.toLowerCase()}`;
}

export async function getConsent(
  email: string | null | undefined,
): Promise<ConsentRecord | null> {
  if (!email) return null;
  const raw = await kv().get(key(email));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ConsentRecord;
  } catch {
    return null;
  }
}

/** Set both flags atomically. If ToS was previously accepted, keep the
 *  original timestamp — accepting again shouldn't reset the audit trail. */
export async function setConsent(
  email: string,
  input: { tos: boolean; email: boolean },
): Promise<ConsentRecord> {
  const existing = await getConsent(email);
  const now = new Date().toISOString();
  const record: ConsentRecord = {
    email: email.toLowerCase(),
    tosAcceptedAt: input.tos
      ? (existing?.tosAcceptedAt ?? now)
      : (existing?.tosAcceptedAt ?? null),
    emailOptIn: input.email,
    emailOptInChangedAt:
      existing?.emailOptIn === input.email
        ? (existing?.emailOptInChangedAt ?? now)
        : now,
  };
  await kv().set(key(email), JSON.stringify(record));
  return record;
}

/** Update just the email opt-in flag (from the dashboard). */
export async function setEmailOptIn(
  email: string,
  optIn: boolean,
): Promise<ConsentRecord> {
  const existing = await getConsent(email);
  const now = new Date().toISOString();
  const record: ConsentRecord = {
    email: email.toLowerCase(),
    tosAcceptedAt: existing?.tosAcceptedAt ?? null,
    emailOptIn: optIn,
    emailOptInChangedAt: now,
  };
  await kv().set(key(email), JSON.stringify(record));
  return record;
}

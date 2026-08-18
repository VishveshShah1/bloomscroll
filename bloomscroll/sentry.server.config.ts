// Server-side Sentry. Loaded from instrumentation.ts on the Node runtime.
//
// Deliberately inert without a DSN: `enabled` is false when SENTRY_DSN is
// unset, so local dev and any deploy that hasn't been given the env var behave
// exactly as they did before Sentry existed. Monitoring must never be the
// reason something breaks.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  // Errors are the point here. Traces cost quota and we don't need a
  // performance picture yet, so sample them thinly rather than not at all —
  // enough to spot a pathologically slow pipeline run.
  tracesSampleRate: 0.1,
  // The check pipeline streams SSE; don't let Sentry hold references to
  // request bodies, which can contain a user's pasted claim text.
  sendDefaultPii: false,
});

// Edge-runtime Sentry (middleware and any edge route). Same inert-without-DSN
// contract as sentry.server.config.ts.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
});

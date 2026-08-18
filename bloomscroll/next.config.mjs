import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next 14 gates instrumentation.ts behind this flag; it became the default
    // in 15. Without it the Sentry server/edge init never runs.
    instrumentationHook: true,
  },
};

/**
 * Server-side only, on purpose.
 *
 * Adding Sentry's browser SDK took First Load JS from 87.3 kB to 169 kB — it
 * nearly doubled the shared bundle on every page, including the landing page.
 * What we actually needed was to stop being blind to pipeline failures in
 * production, and those are server-side: the Anthropic calls, Europe PMC,
 * the KV layer, Stripe webhooks. None of that needs a browser SDK.
 *
 * If client-side errors become worth tracking later, re-add an
 * instrumentation-client.ts and take the bundle hit deliberately, with the
 * Lighthouse number measured before and after.
 */
export default withSentryConfig(nextConfig, {
  silent: !process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  disableLogger: true,
});

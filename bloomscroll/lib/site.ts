/**
 * Single source of truth for the public origin.
 *
 * Everything user-visible — metadata, the sitemap, install instructions, the
 * extension's default target, anything a person can click — resolves through
 * here. Before this existed the origin was written out by hand in a handful of
 * places and had already drifted three ways: two different *.vercel.app
 * preview URLs, a `bloomscroll.app` that was never registered, and a
 * `bloomscroll.com` that isn't ours either.
 *
 * Deliberately does NOT fall back to NEXTAUTH_URL. That's http://localhost:3000
 * in development, and letting it through would put localhost into the sitemap,
 * canonical tags, and Open Graph URLs on any build where NEXT_PUBLIC_SITE_URL
 * wasn't set — the exact silent-wrong-value failure this module exists to stop.
 */

const RAW = process.env.NEXT_PUBLIC_SITE_URL || "https://getbloomscroll.com";

/** Canonical origin, no trailing slash. e.g. "https://getbloomscroll.com" */
export const SITE_URL = RAW.replace(/\/+$/, "");

/** Bare host for display in copy. e.g. "getbloomscroll.com" */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");

/** Build an absolute URL onto the canonical origin. */
export function siteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

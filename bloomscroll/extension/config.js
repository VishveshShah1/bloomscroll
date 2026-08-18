// Shared config for the popup + service worker. To point the extension at a
// different origin (e.g. localhost:3000 for dev, or your own deploy), change
// DEFAULT_SITE and reload the extension at chrome://extensions.
export const DEFAULT_SITE = "https://getbloomscroll.com";

// Origins we used to ship. `getSite()` prefers whatever is in
// chrome.storage.sync, so bumping DEFAULT_SITE alone does NOT fix an existing
// install — anyone who ran an earlier build still has the old preview URL
// persisted and keeps landing on a 404 forever. Any stored value matching one
// of these is treated as stale and replaced. Matched on hostname so the
// scheme, a trailing slash, or a path can't sneak a stale origin past it.
const STALE_HOSTS = [
  "bloomscroll-maharshi-n-vv.vercel.app",
  "bloomscroll-fawn.vercel.app",
  "bloomscroll.app",
  "bloomscroll.com",
];

function hostOf(value) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

/** True for any origin we've since moved off, or anything unparseable. */
export function isStaleOrigin(value) {
  if (typeof value !== "string" || !value.trim()) return true;
  const host = hostOf(value.trim());
  if (!host) return true;
  // Every *.vercel.app deployment URL is stale by definition — the extension
  // should only ever talk to the canonical domain (or a localhost dev build).
  if (host.endsWith(".vercel.app")) return true;
  return STALE_HOSTS.includes(host);
}

/**
 * Drops a persisted origin that we no longer serve. Called on install AND on
 * update, because an update is exactly when an existing user's stored value
 * needs correcting. Localhost is left alone so a developer's override survives.
 */
export async function migrateStoredSite() {
  try {
    const { site } = await chrome.storage.sync.get("site");
    if (typeof site !== "string" || !site.trim()) return { changed: false };
    const host = hostOf(site);
    if (host === "localhost" || host === "127.0.0.1") return { changed: false };
    if (!isStaleOrigin(site)) return { changed: false };
    await chrome.storage.sync.remove("site");
    return { changed: true, from: site };
  } catch {
    return { changed: false };
  }
}

export async function getSite() {
  try {
    const { site } = await chrome.storage.sync.get("site");
    if (typeof site === "string" && site.trim()) {
      const trimmed = site.trim().replace(/\/+$/, "");
      const host = hostOf(trimmed);
      // Belt-and-braces: even if the migration hasn't run yet (or failed),
      // never actually navigate to a known-dead origin.
      const isLocal = host === "localhost" || host === "127.0.0.1";
      if (isLocal || !isStaleOrigin(trimmed)) return trimmed;
    }
    return DEFAULT_SITE;
  } catch {
    return DEFAULT_SITE;
  }
}

// Targets /dashboard, which is where the checker lives and where a ?q=
// payload is picked up and auto-run. This used to point at the bare origin,
// but the homepage never had a ?q= handler — the query was silently dropped
// and the user just landed on the marketing page.
export function buildCheckUrl(origin, query) {
  return `${origin.replace(/\/+$/, "")}/dashboard?q=${encodeURIComponent(query)}`;
}

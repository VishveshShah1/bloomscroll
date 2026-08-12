// Shared config for the popup + service worker. To point the extension at a
// different origin (e.g. localhost:3000 for dev, or your own deploy), change
// DEFAULT_SITE and reload the extension at chrome://extensions.
export const DEFAULT_SITE = "https://bloomscroll-maharshi-n-vv.vercel.app";

export async function getSite() {
  try {
    const { site } = await chrome.storage.sync.get("site");
    return typeof site === "string" && site.trim() ? site.trim().replace(/\/+$/, "") : DEFAULT_SITE;
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

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

export function buildCheckUrl(origin, query) {
  return `${origin.replace(/\/+$/, "")}/?q=${encodeURIComponent(query)}`;
}

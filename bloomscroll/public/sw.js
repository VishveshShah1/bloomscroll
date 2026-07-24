// Minimal service worker: makes the app installable (required for the Android
// share_target flow). Network passthrough — no caching magic to go stale
// during a hackathon demo.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});

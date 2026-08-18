// Next's server-startup hook. Picks the right Sentry config for whichever
// runtime this instance is, so the Node and edge SDKs don't both load.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

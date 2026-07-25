import Stripe from "stripe";

// Server-side Stripe client. Never expose STRIPE_SECRET_KEY to the browser.
// Instantiated lazily so the module can be imported at build time without keys.

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!cached) {
    cached = new Stripe(key);
  }
  return cached;
}

export type PlanSlug = "sprout" | "canopy";

/**
 * Map of paid plan slug → Stripe Price ID env var. Set these in .env.local
 * once you've created the recurring prices in the Stripe dashboard.
 */
export function priceIdFor(plan: PlanSlug): string | null {
  if (plan === "sprout") return process.env.STRIPE_PRICE_SPROUT ?? null;
  if (plan === "canopy") return process.env.STRIPE_PRICE_CANOPY ?? null;
  return null;
}

export function stripeIsConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

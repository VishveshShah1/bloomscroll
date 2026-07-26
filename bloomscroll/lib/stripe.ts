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
export type BillingInterval = "monthly" | "annual";

/**
 * Map of (paid plan slug, billing interval) → Stripe Price ID env var. Set
 * these in .env.local once you've created the recurring prices in the
 * Stripe dashboard. If the annual price is missing, callers should fall
 * back to the monthly one rather than fail.
 */
export function priceIdFor(
  plan: PlanSlug,
  interval: BillingInterval = "monthly",
): string | null {
  if (interval === "annual") {
    if (plan === "sprout") {
      return (
        process.env.STRIPE_PRICE_SPROUT_ANNUAL ??
        process.env.STRIPE_PRICE_SPROUT ??
        null
      );
    }
    if (plan === "canopy") {
      return (
        process.env.STRIPE_PRICE_CANOPY_ANNUAL ??
        process.env.STRIPE_PRICE_CANOPY ??
        null
      );
    }
    return null;
  }
  if (plan === "sprout") return process.env.STRIPE_PRICE_SPROUT ?? null;
  if (plan === "canopy") return process.env.STRIPE_PRICE_CANOPY ?? null;
  return null;
}

export function stripeIsConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

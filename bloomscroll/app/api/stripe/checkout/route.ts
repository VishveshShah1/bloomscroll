import {
  getStripe,
  priceIdFor,
  stripeIsConfigured,
  type BillingInterval,
  type PlanSlug,
} from "@/lib/stripe";
import { bodyLimitResponse, readJsonBody } from "@/lib/http";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Body is two short enum strings ({plan, interval}). 1 KB is plenty.
const CHECKOUT_MAX_BYTES = 1024;

// Creates a Stripe Checkout Session and returns its URL. The client redirects
// window.location to that URL. Success/cancel routes live at /success and
// /canceled.
//
// Requires env: STRIPE_SECRET_KEY, STRIPE_PRICE_SPROUT, STRIPE_PRICE_CANOPY.
// The frontend also gates the button behind NEXT_PUBLIC_STRIPE_ENABLED so it
// hides gracefully before you've set the keys.
export async function POST(request: Request) {
  if (!stripeIsConfigured()) {
    return Response.json(
      { error: "Stripe is not configured on the server yet." },
      { status: 503 },
    );
  }

  let plan: PlanSlug | null = null;
  let interval: BillingInterval = "monthly";
  try {
    const body = await readJsonBody<{ plan?: unknown; interval?: unknown }>(request, {
      maxBytes: CHECKOUT_MAX_BYTES,
      maxStringLen: 32,
      maxDepth: 2,
      maxArrayItems: 4,
    });
    if (body.plan === "sprout" || body.plan === "canopy") {
      plan = body.plan;
    }
    if (body.interval === "annual" || body.interval === "monthly") {
      interval = body.interval;
    }
  } catch (err) {
    const limited = bodyLimitResponse(err);
    if (limited) return limited;
    // any other parse failure falls through to the invalid-plan branch below
  }
  if (!plan) {
    return Response.json({ error: "Unknown plan." }, { status: 400 });
  }

  const priceId = priceIdFor(plan, interval);
  if (!priceId) {
    return Response.json(
      { error: `Price ID for "${plan}" (${interval}) is not configured.` },
      { status: 503 },
    );
  }

  // Always the canonical origin — never the request's own. Falling back to the
  // Origin header meant a visitor who arrived on a *.vercel.app deployment URL
  // got returned there by Stripe after paying, landing on a preview host with
  // a live subscription. SITE_URL is the single source of truth.
  const origin = SITE_URL;

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/canceled`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: { plan, interval },
    });
    if (!session.url) {
      return Response.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
    }
    return Response.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Stripe error";
    return Response.json({ error: message }, { status: 500 });
  }
}

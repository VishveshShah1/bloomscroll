import { getStripe, priceIdFor, stripeIsConfigured, type PlanSlug } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  try {
    const body = (await request.json()) as { plan?: unknown };
    if (body.plan === "sprout" || body.plan === "canopy") {
      plan = body.plan;
    }
  } catch {
    // fall through to the invalid-plan branch below
  }
  if (!plan) {
    return Response.json({ error: "Unknown plan." }, { status: 400 });
  }

  const priceId = priceIdFor(plan);
  if (!priceId) {
    return Response.json(
      { error: `Price ID for "${plan}" is not configured.` },
      { status: 503 },
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    request.headers.get("origin") ??
    new URL(request.url).origin;

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/canceled`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: { plan },
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

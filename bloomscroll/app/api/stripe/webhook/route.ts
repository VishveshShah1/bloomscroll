import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { clearPlan, setPlan, type Plan } from "@/lib/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe → us webhook. Verifies the signature against STRIPE_WEBHOOK_SECRET,
// then flips the user's plan in KV so the /api/check quota gate sees the
// right tier on the very next call. No user database needed — we key on
// the Stripe customer's billing email.
//
// Local dev: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
// prints a whsec_… value to paste into STRIPE_WEBHOOK_SECRET.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Webhook secret not configured", { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "signature verification failed";
    return new Response(`Webhook error: ${message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_details?.email ?? session.customer_email ?? null;
        const plan = normalizePlan(session.metadata?.plan);
        console.log(
          "[stripe] checkout completed",
          JSON.stringify({
            id: session.id,
            plan,
            email,
            customer: session.customer,
            subscription: session.subscription,
          }),
        );
        if (email && plan) {
          await setPlan(email, plan);
        }
        break;
      }
      case "customer.subscription.updated": {
        // Downgrades / cancellations arriving as updates. If the sub is no
        // longer active we clear the user's plan.
        const sub = event.data.object as Stripe.Subscription;
        const isActive = sub.status === "active" || sub.status === "trialing";
        const email = await customerEmail(sub.customer);
        console.log(
          "[stripe] subscription updated",
          JSON.stringify({ id: sub.id, status: sub.status, email }),
        );
        if (email && !isActive) await clearPlan(email);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const email = await customerEmail(sub.customer);
        console.log("[stripe] subscription deleted", JSON.stringify({ id: sub.id, email }));
        if (email) await clearPlan(email);
        break;
      }
      default:
        console.log("[stripe] unhandled event", event.type);
    }
  } catch (err) {
    console.error("[stripe] handler failed", err);
    // Return 500 so Stripe retries.
    return new Response("handler error", { status: 500 });
  }

  return Response.json({ received: true });
}

function normalizePlan(raw: unknown): Plan | null {
  if (raw === "sprout" || raw === "canopy") return raw;
  return null;
}

async function customerEmail(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): Promise<string | null> {
  if (!customer) return null;
  if (typeof customer !== "string") {
    if ("deleted" in customer) return null;
    return customer.email ?? null;
  }
  try {
    const c = await getStripe().customers.retrieve(customer);
    if ("deleted" in c) return null;
    return c.email ?? null;
  } catch {
    return null;
  }
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getConsent, setConsent, setEmailOptIn } from "@/lib/consent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Read the current user's consent record. */
export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return Response.json({ signedIn: false, record: null });
  const record = await getConsent(email);
  return Response.json({ signedIn: true, record });
}

/**
 * Post-signup sync + dashboard toggle in one endpoint.
 *
 * Body shapes accepted:
 * - `{ tos: true, email: boolean }` — from ConsentSync right after OAuth.
 * - `{ emailOptIn: boolean }` — from the dashboard email-preference toggle.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return Response.json({ error: "sign in required" }, { status: 401 });
  }
  let body: {
    tos?: unknown;
    email?: unknown;
    emailOptIn?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }
  try {
    if (typeof body.emailOptIn === "boolean") {
      const record = await setEmailOptIn(email, body.emailOptIn);
      return Response.json({ ok: true, record });
    }
    if (body.tos === true && typeof body.email === "boolean") {
      const record = await setConsent(email, { tos: true, email: body.email });
      return Response.json({ ok: true, record });
    }
    return Response.json({ error: "unknown body shape" }, { status: 400 });
  } catch (err) {
    console.error("[consent] write failed", err);
    return Response.json({ error: "write failed" }, { status: 500 });
  }
}

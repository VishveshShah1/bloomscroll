import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { claimComeback, hasClaimedComeback, COMEBACK_BONUS_CHECKS } from "@/lib/comeback";
import { bodyLimitResponse, readJsonBody } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Body is one short free-text reason. 4 KB covers it after UTF-8 expansion.
const COMEBACK_MAX_BYTES = 4 * 1024;

/** Whether this account can still claim the comeback bonus. */
export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return Response.json({ signedIn: false, claimed: false, bonus: COMEBACK_BONUS_CHECKS });
  }
  return Response.json({
    signedIn: true,
    claimed: await hasClaimedComeback(email),
    bonus: COMEBACK_BONUS_CHECKS,
  });
}

/** Claim the bonus and record why they uninstalled. Auth required — the
 *  checks have to land on a real account to mean anything. */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return Response.json({ error: "sign in required" }, { status: 401 });
  }

  let reason = "";
  try {
    const body = await readJsonBody<{ reason?: unknown }>(request, {
      maxBytes: COMEBACK_MAX_BYTES,
    });
    reason = typeof body?.reason === "string" ? body.reason : "";
  } catch (err) {
    const limited = bodyLimitResponse(err);
    if (limited) return limited;
    return Response.json({ error: "bad request" }, { status: 400 });
  }

  const result = await claimComeback(email, reason);
  if (!result.ok) {
    return Response.json({ error: result.reason }, { status: 400 });
  }
  return Response.json({
    ok: true,
    bonus: result.bonus,
    alreadyClaimed: result.alreadyClaimed,
  });
}

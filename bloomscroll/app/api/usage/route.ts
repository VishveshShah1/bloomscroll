import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { readQuota, FREE_TIER_LIMIT } from "@/lib/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Client polls this on /check mount to show "3 of 5 free checks used".
// Anonymous callers get a 200 with `signedIn: false` so the UI can decide
// what to render — no separate 401 branch to complicate the client.
export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) {
    return Response.json({
      signedIn: false,
      plan: "seed",
      used: 0,
      limit: FREE_TIER_LIMIT,
      bonus: 0,
      resetAt: null,
    });
  }
  const snap = await readQuota(email, email);
  return Response.json({
    signedIn: true,
    plan: snap.plan,
    used: snap.used,
    limit: snap.limit,
    bonus: snap.bonus,
    resetAt: snap.resetAt,
    email,
  });
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { isAdmin, listReviews } from "@/lib/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-only. Requires ADMIN_EMAIL env var to match the signed-in user's
// email exactly. Returns every stored review, newest first. Reviews are
// never surfaced on the public site — this endpoint is for the operator
// to eyeball submissions and pick real quotes to feature manually.
export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!isAdmin(email)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const reviews = await listReviews();
  return Response.json({ reviews, count: reviews.length });
}

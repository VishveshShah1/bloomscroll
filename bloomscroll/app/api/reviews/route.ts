import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { hasSubmittedReview, submitReview } from "@/lib/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Whether the currently-signed-in user has already submitted a review. */
export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return Response.json({ signedIn: false, hasSubmitted: false });
  const submitted = await hasSubmittedReview(email);
  return Response.json({ signedIn: true, hasSubmitted: submitted });
}

/** Submit a review. Auth required. Grants a one-time 3-check bonus on
 *  first successful submission. */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return Response.json({ error: "sign in required" }, { status: 401 });
  }

  let stars = 0;
  let comment = "";
  try {
    const body = (await request.json()) as {
      stars?: unknown;
      comment?: unknown;
    };
    if (typeof body.stars === "number") stars = body.stars;
    if (typeof body.comment === "string") comment = body.comment;
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  const result = await submitReview({ email, stars, comment });
  if (!result.ok) {
    return Response.json({ error: result.reason }, { status: 400 });
  }
  return Response.json({ ok: true, bonus: result.bonus });
}

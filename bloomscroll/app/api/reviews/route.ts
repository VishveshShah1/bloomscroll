import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { hasSubmittedReview, submitReview } from "@/lib/reviews";
import { bodyLimitResponse, readJsonBody } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Reviews are 1-5 stars plus a comment truncated to 2000 chars server-side.
// 8 KB leaves room for the full comment even after UTF-8 expansion.
const REVIEW_MAX_BYTES = 8 * 1024;

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
    const body = await readJsonBody<{ stars?: unknown; comment?: unknown }>(request, {
      maxBytes: REVIEW_MAX_BYTES,
      maxStringLen: 4_000,
      maxDepth: 2,
      maxArrayItems: 8,
    });
    if (typeof body.stars === "number") stars = body.stars;
    if (typeof body.comment === "string") comment = body.comment;
  } catch (err) {
    const limited = bodyLimitResponse(err);
    if (limited) return limited;
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  // Name and picture come from the verified session, never from the request
  // body — otherwise a caller could attach any name or avatar URL they liked
  // to their review.
  const result = await submitReview({
    email,
    name: session.user?.name,
    image: session.user?.image,
    stars,
    comment,
  });
  if (!result.ok) {
    return Response.json({ error: result.reason }, { status: 400 });
  }
  return Response.json({ ok: true, bonus: result.bonus });
}

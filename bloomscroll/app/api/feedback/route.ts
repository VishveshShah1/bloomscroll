import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { submitFeedback, type FeedbackValue } from "@/lib/feedback";
import { bodyLimitResponse, readJsonBody } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Comment is capped at 500 chars in lib/feedback.ts; 4 KB gives room for that
// plus the small enum/tag fields with headroom for future additions.
const FEEDBACK_MAX_BYTES = 4 * 1024;

// Accepts one feedback submission from the /check result panel.
// - No auth required (anonymous thumbs are allowed).
// - Email is captured only if the user is already signed in.
// - Comment is capped in lib/feedback.ts.
export async function POST(request: Request) {
  let value: FeedbackValue | null = null;
  let comment: string | undefined;
  let verdict: string | undefined;
  let claimTag: string | undefined;
  try {
    const body = await readJsonBody<{
      value?: unknown;
      comment?: unknown;
      verdict?: unknown;
      claimTag?: unknown;
    }>(request, {
      maxBytes: FEEDBACK_MAX_BYTES,
      maxStringLen: 2_000,
      maxDepth: 3,
      maxArrayItems: 8,
    });
    if (body.value === "up" || body.value === "down") value = body.value;
    if (typeof body.comment === "string" && body.comment.trim()) {
      comment = body.comment.trim();
    }
    if (typeof body.verdict === "string") verdict = body.verdict;
    if (typeof body.claimTag === "string") claimTag = body.claimTag;
  } catch (err) {
    const limited = bodyLimitResponse(err);
    if (limited) return limited;
    // any other parse failure falls through to the invalid-value branch
  }
  if (!value) {
    return Response.json(
      { error: "value must be 'up' or 'down'" },
      { status: 400 },
    );
  }

  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  try {
    const { id } = await submitFeedback({
      value,
      comment,
      verdict,
      claimTag,
      email,
    });
    return Response.json({ ok: true, id });
  } catch (err) {
    console.error("[feedback] submit failed", err);
    return Response.json(
      { error: "Couldn't store feedback. Try again in a moment." },
      { status: 500 },
    );
  }
}

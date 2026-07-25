import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { runPipeline } from "@/lib/pipeline";
import {
  incrementMonthlyUsage,
  readQuota,
  requireQuota,
  UsageLimitExceededError,
} from "@/lib/usage";
import type { Lang } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Phase 5 + launch-prep: streams pipeline stage events to the client over SSE.
// Now also enforces:
//   • Sign-in required. Anonymous callers get 401 immediately.
//   • FREE_TIER_LIMIT per calendar month per signed-in user. Paid plans
//     (Sprout/Canopy) bypass. Checked BEFORE the pipeline runs, so a
//     rejected call never burns an Anthropic token.
//   • The pipeline itself is protected by a separate global spend cap
//     (see lib/spend.ts) — no extra logic here.
// On a successful `done` event we increment the user's monthly counter and
// stream a `usage` event with the fresh snapshot so the UI can update.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email ?? null;

  if (!userId) {
    return new Response(
      JSON.stringify({ error: "sign_in_required", message: "Sign in to run a check." }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
  }

  let input = "";
  let lang: Lang = "en";
  try {
    const parsed = (await request.json()) as { input?: unknown; lang?: unknown };
    if (typeof parsed.input === "string") input = parsed.input.trim();
    if (parsed.lang === "fr") lang = "fr";
  } catch {
    // malformed body → empty input error below
  }
  if (!input) {
    return new Response(JSON.stringify({ error: "empty_input" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // Quota gate — before the pipeline runs. Paid plans have `limit: null`.
  let quota;
  try {
    quota = await requireQuota(userId, session?.user?.email ?? null);
  } catch (err) {
    if (err instanceof UsageLimitExceededError) {
      return new Response(
        JSON.stringify({
          error: "usage_limit",
          used: err.used,
          limit: err.limit,
          resetAt: err.resetAt,
        }),
        { status: 429, headers: { "content-type": "application/json" } },
      );
    }
    throw err;
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        for await (const ev of runPipeline(input, lang)) {
          send(ev);
          if (ev.stage === "done") {
            // Only charge the user's quota on a real "done" (resolveError
            // means we never touched the AI pipeline; skip in that case).
            const isResolveError = Boolean(ev.payload.resolveError);
            if (!isResolveError) {
              try {
                await incrementMonthlyUsage(userId);
                const snap = await readQuota(userId, session?.user?.email ?? null);
                send({ stage: "usage", ...snap });
              } catch (e) {
                console.error("[check] failed to increment usage:", e);
              }
            } else {
              // Give the UI a snapshot anyway so it can render current counts.
              send({ stage: "usage", ...quota });
            }
          }
        }
      } catch (err) {
        console.error("[check] pipeline error", err);
        send({ stage: "error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}

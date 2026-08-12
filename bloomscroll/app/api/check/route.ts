import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { runPipeline } from "@/lib/pipeline";
import {
  enforceHourlyRate,
  HOURLY_RATE_LIMIT,
  incrementMonthlyUsage,
  RateLimitExceededError,
  readQuota,
  requireQuota,
  UsageLimitExceededError,
} from "@/lib/usage";
import type { Lang } from "@/lib/i18n";
import { isExampleClaim } from "@/lib/examples";
import { bodyLimitResponse, readJsonBody } from "@/lib/http";
import type { SpendContext } from "@/lib/spend";

// A "check input" is either a short URL or a pasted claim. 16 KB is far more
// than any real client sends, but generous enough that pastes from very long
// article URLs still land.
const CHECK_MAX_BYTES = 16 * 1024;
const CHECK_MAX_STRING_LEN = 12_000; // matches MAX_TEXT in lib/resolve.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Phase 5 + launch-prep: streams pipeline stage events to the client over SSE.
// Now also enforces:
//   • Sign-in required. Anonymous callers get 401 immediately.
//   • Per-account hourly rate limit (HOURLY_RATE_LIMIT). Applies to EVERY
//     tier — including Canopy — as a safeguard against a compromised or
//     scripted account hammering the pipeline. Charged on attempt, not on
//     success, since the point is to stop hammering.
//   • Monthly cap per plan (see PLAN_MONTHLY_LIMIT). Canopy is unlimited;
//     Sprout is bounded so a single paid account can't drive runaway cost;
//     Seed uses the free-tier number. Checked BEFORE the pipeline runs so
//     a rejected call never burns an Anthropic token.
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
    const parsed = await readJsonBody<{ input?: unknown; lang?: unknown }>(request, {
      maxBytes: CHECK_MAX_BYTES,
      maxStringLen: CHECK_MAX_STRING_LEN,
      maxDepth: 3,
      maxArrayItems: 8,
    });
    if (typeof parsed.input === "string") input = parsed.input.trim();
    if (parsed.lang === "fr") lang = "fr";
  } catch (err) {
    const limited = bodyLimitResponse(err);
    if (limited) return limited;
    // any other parse failure falls through to the empty-input branch below
  }
  if (!input) {
    return new Response(JSON.stringify({ error: "empty_input" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // Free-run flag for the built-in example claims. Computed from the input
  // itself so it can't be spoofed by the caller. The hourly rate limit and
  // the global spend cap still apply — "free" here means "doesn't decrement
  // the monthly counter", not "unmetered".
  const isExample = isExampleClaim(input);

  // Hourly rate gate — applies to every tier, atomic incr-then-check. Runs
  // FIRST because it's a single KV op and stops hammering earliest.
  try {
    await enforceHourlyRate(userId);
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return new Response(
        JSON.stringify({
          error: "rate_limit",
          used: err.used,
          limit: err.limit,
          retryAfterSeconds: err.retryAfterSeconds,
          message: `You've hit the ${HOURLY_RATE_LIMIT}/hour safety cap. Try again in a bit.`,
        }),
        {
          status: 429,
          headers: {
            "content-type": "application/json",
            "retry-after": String(err.retryAfterSeconds),
          },
        },
      );
    }
    throw err;
  }

  // Monthly quota gate — Canopy has `limit: null` and always passes.
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

  // Derive the spend bucket from the caller's plan. Seed → free bucket (hard
  // monthly cap, falls back to sample on exhaustion). Sprout/Canopy → paid
  // bucket (never auto-degrades; only logs an alert when nearing the cap).
  // Canopy plan + email are passed through so the per-user soft flag can fire
  // if a single Canopy account crosses the internal $/mo visibility threshold.
  const spendCtx: SpendContext = {
    tier: quota.plan === "seed" ? "free" : "paid",
    plan: quota.plan,
    email: userId,
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        for await (const ev of runPipeline(input, lang, spendCtx)) {
          send(ev);
          if (ev.stage === "done") {
            // Only charge the user's quota on a real "done" (resolveError
            // means we never touched the AI pipeline; skip in that case).
            //
            // Built-in example claims are also free: they exist to show a
            // new user what the product does, so spending one of their five
            // monthly checks on a demo is a bad first impression. Decided
            // here, server-side, against the canonical list — the client
            // never gets to declare its own request free.
            const isResolveError = Boolean(ev.payload.resolveError);
            if (!isResolveError && !isExample) {
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

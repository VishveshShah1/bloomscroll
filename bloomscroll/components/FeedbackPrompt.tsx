"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  /** Short tag identifying the claim (e.g. its hashed text) — optional. */
  claimTag?: string;
  /** The graded verdict, if any — optional context stored with the feedback. */
  verdict?: string;
}

type Phase = "idle" | "picked" | "sending" | "sent" | "error" | "dismissed";

/**
 * Optional feedback prompt that appears under a graded result. Two thumbs
 * plus a short comment box. Never blocks the result; the whole panel can
 * be dismissed with the ✕ in the corner and won't come back for that
 * result on this page mount.
 */
export default function FeedbackPrompt({ claimTag, verdict }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [choice, setChoice] = useState<"up" | "down" | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  // When the visitor picks a thumb, jump focus into the comment box so
  // they can either type or hit submit / dismiss without a mouse move.
  useEffect(() => {
    if (phase === "picked") commentRef.current?.focus();
  }, [phase]);

  async function post(finalComment: string) {
    if (!choice) return;
    setPhase("sending");
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: choice,
          comment: finalComment || undefined,
          verdict,
          claimTag,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setPhase("sent");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Couldn't send that");
      setPhase("error");
    }
  }

  if (phase === "dismissed") return null;

  return (
    <div className="relative rounded-2xl border border-ink/10 bg-white/60 p-5 sm:p-6">
      {/* dismiss */}
      {phase !== "sent" && (
        <button
          type="button"
          aria-label="Dismiss feedback prompt"
          onClick={() => setPhase("dismissed")}
          className="focus-ring absolute right-3 top-3 rounded-full p-1.5 text-bark transition hover:bg-ink/5 hover:text-ink"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path
              d="M2 2 L12 12 M12 2 L2 12"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}

      {phase === "idle" && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] font-medium text-ink">Was this helpful?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setChoice("up");
                setPhase("picked");
              }}
              className="focus-ring inline-flex items-center gap-2 rounded-full border border-ink/12 bg-white px-4 py-2 text-[13.5px] font-semibold text-ink transition hover:-translate-y-0.5 hover:border-forest/40 hover:bg-moss/40"
            >
              <ThumbIcon direction="up" /> Yes
            </button>
            <button
              type="button"
              onClick={() => {
                setChoice("down");
                setPhase("picked");
              }}
              className="focus-ring inline-flex items-center gap-2 rounded-full border border-ink/12 bg-white px-4 py-2 text-[13.5px] font-semibold text-ink transition hover:-translate-y-0.5 hover:border-warn/40 hover:bg-warn/10"
            >
              <ThumbIcon direction="down" /> Not really
            </button>
          </div>
        </div>
      )}

      {(phase === "picked" || phase === "sending" || phase === "error") && (
        <div>
          <p className="text-[13px] text-bark">
            {choice === "up"
              ? "Nice. Anything you'd flag as extra useful?"
              : "Sorry. What was off?"}{" "}
            <span className="text-bark/70">(optional)</span>
          </p>
          <textarea
            ref={commentRef}
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 500))}
            rows={3}
            placeholder="Type it here"
            className="focus-ring mt-2 block w-full resize-y rounded-xl border border-ink/12 bg-white px-3.5 py-2.5 text-[14px] text-ink placeholder:text-bark/60"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11.5px] text-bark/70">
              {comment.length}/500
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPhase("dismissed")}
                className="focus-ring rounded-full border border-ink/10 px-4 py-2 text-[13px] font-semibold text-bark transition hover:border-ink/25 hover:text-ink"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={() => void post(comment.trim())}
                disabled={phase === "sending"}
                className="btn-primary focus-ring px-5 py-2 text-[13.5px]"
              >
                {phase === "sending" ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
          {phase === "error" && error && (
            <p className="mt-2 text-[12.5px] text-warn">{error}</p>
          )}
        </div>
      )}

      {phase === "sent" && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-[14px] font-medium text-ink">Thanks. Noted.</p>
          <button
            type="button"
            onClick={() => setPhase("dismissed")}
            className="focus-ring rounded-full border border-ink/10 px-3 py-1.5 text-[12px] font-semibold text-bark transition hover:border-ink/25 hover:text-ink"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

function ThumbIcon({ direction }: { direction: "up" | "down" }) {
  const flip = direction === "down" ? "rotate(180deg)" : undefined;
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: flip }}
      aria-hidden="true"
    >
      <path d="M7 22V11l5-8a3 3 0 0 1 5 2.9L15 10h4.5a2 2 0 0 1 2 2.3l-1.4 7A2 2 0 0 1 18 21H7z" />
    </svg>
  );
}

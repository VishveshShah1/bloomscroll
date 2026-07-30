"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  /** The claim text — trimmed and sent as claimTag so we know which one. */
  claim: string;
  /** The graded verdict, so a mistake report is scoped to that grade. */
  verdict: string;
}

type Phase = "closed" | "open" | "sending" | "sent" | "error";

/** Per-card "Report a mistake" — small text link that expands to a
 *  compact textarea and posts a `down` vote plus comment to /api/feedback.
 *  Intentionally quieter than FeedbackPrompt: no dismiss chip, no thumbs,
 *  just a link that opens a mini form and collapses back after sending. */
export default function ReportMistake({ claim, verdict }: Props) {
  const [phase, setPhase] = useState<Phase>("closed");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (phase === "open") textareaRef.current?.focus();
  }, [phase]);

  async function send() {
    setPhase("sending");
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: "down",
          comment: comment.trim() ? `[report] ${comment.trim()}` : "[report] (no detail)",
          verdict,
          claimTag: claim.slice(0, 120),
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

  if (phase === "sent") {
    return (
      <p className="mt-4 text-[12px] text-bark">
        Thanks — logged for review.
      </p>
    );
  }

  if (phase === "closed") {
    return (
      <button
        type="button"
        onClick={() => setPhase("open")}
        className="focus-ring mt-4 text-[12px] font-medium text-bark underline underline-offset-[3px] transition hover:text-ink"
      >
        Report a mistake
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-ink/10 bg-white/60 p-3.5">
      <p className="text-[12.5px] font-semibold text-ink">
        What looks wrong here?
      </p>
      <p className="mt-1 text-[12px] text-bark">
        Wrong verdict, misread source, off topic citation — whatever caught it.
      </p>
      <textarea
        ref={textareaRef}
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 400))}
        rows={3}
        placeholder="Optional detail"
        className="focus-ring mt-2 block w-full resize-y rounded-lg border border-ink/12 bg-white px-3 py-2 text-[13px] text-ink placeholder:text-bark/60"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-bark/70">{comment.length}/400</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setPhase("closed");
              setComment("");
              setError(null);
            }}
            className="focus-ring rounded-full border border-ink/10 px-3 py-1.5 text-[12px] font-semibold text-bark transition hover:border-ink/25 hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void send()}
            disabled={phase === "sending"}
            className="focus-ring rounded-full border border-forest/40 bg-forest px-4 py-1.5 text-[12.5px] font-semibold text-canvas transition hover:bg-ink disabled:opacity-60"
          >
            {phase === "sending" ? "Sending…" : "Send report"}
          </button>
        </div>
      </div>
      {phase === "error" && error && (
        <p className="mt-2 text-[11.5px] text-warn">{error}</p>
      )}
    </div>
  );
}

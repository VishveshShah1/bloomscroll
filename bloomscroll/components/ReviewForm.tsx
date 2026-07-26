"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const MIN_LEN = 40;

type Phase = "loading" | "empty" | "already" | "editing" | "sending" | "sent" | "error";

/**
 * One-per-account review widget. Five stars + a comment with a real
 * minimum length (no empty-tap farming). On first successful submit,
 * the API grants a 3-check bonus that lands in the next /api/usage
 * poll. Displayed on the dashboard.
 *
 * Reviews are stored privately — this form never asks for consent to
 * publish and nothing is shown publicly. See lib/reviews.ts.
 */
export default function ReviewForm({
  signedIn,
  onBonusGranted,
}: {
  signedIn: boolean;
  onBonusGranted?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [bonus, setBonus] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!signedIn) {
      setPhase("empty");
      return;
    }
    let cancelled = false;
    fetch("/api/reviews", { cache: "no-store" })
      .then(async (r) => (await r.json()) as { hasSubmitted: boolean })
      .then((data) => {
        if (cancelled) return;
        setPhase(data.hasSubmitted ? "already" : "empty");
      })
      .catch(() => {
        if (!cancelled) setPhase("empty");
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  async function submit() {
    setError(null);
    if (stars < 1) {
      setError("Pick a star rating.");
      return;
    }
    if (comment.trim().length < MIN_LEN) {
      setError(`A little more detail please — at least ${MIN_LEN} characters.`);
      textareaRef.current?.focus();
      return;
    }
    setPhase("sending");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars, comment: comment.trim() }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        bonus?: number;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setBonus(data.bonus ?? 0);
      setPhase("sent");
      onBonusGranted?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Couldn't send that.");
      setPhase("error");
    }
  }

  if (!signedIn) {
    return (
      <div className="surface rounded-[24px] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-forest">
          leave a review
        </p>
        <p className="mt-2 text-[14px] leading-relaxed text-bark">
          Sign in to leave a review. Genuine ones (with a real sentence or two)
          come with a small bonus.
        </p>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="surface rounded-[24px] p-6">
        <p className="text-[13px] text-bark">Loading review status…</p>
      </div>
    );
  }

  if (phase === "already") {
    return (
      <div className="surface rounded-[24px] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-forest">
          review received
        </p>
        <p className="mt-2 text-[14px] leading-relaxed text-bark">
          You&apos;ve already left a review — one per account, so this slot is
          done. The 3-check bonus is applied to your monthly quota above.
        </p>
      </div>
    );
  }

  if (phase === "sent") {
    return (
      <div className="section-review-sent rounded-[24px] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-forest">
          thanks — bonus applied
        </p>
        <h3 className="mt-2 text-[20px] font-semibold text-ink">
          +{bonus} bonus checks this month.
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-bark">
          Since you&apos;re on the free tier: Sprout ($4.99/mo) removes the cap
          entirely and adds saved history. No pressure — cap resets at the top
          of the month either way.
        </p>
        <Link
          href="/#pricing"
          className="focus-ring mt-4 inline-flex items-center gap-2 rounded-full border border-forest/30 px-4 py-2 text-[13px] font-semibold text-forest transition hover:bg-forest hover:text-canvas"
        >
          See plans →
        </Link>
      </div>
    );
  }

  const filled = hover || stars;
  const commentLen = comment.trim().length;

  return (
    <div className="surface rounded-[24px] p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-forest">
        leave a review
      </p>
      <h3 className="mt-2 text-[18px] font-semibold leading-snug text-ink">
        How&apos;s Bloomscroll going?
      </h3>
      <p className="mt-1 text-[13px] text-bark">
        Genuine reviews (with a sentence or two) unlock +3 checks this month.
        One per account. Reviews are private unless we ask permission to quote
        you later.
      </p>

      {/* stars */}
      <div
        className="mt-4 flex items-center gap-1.5"
        onMouseLeave={() => setHover(0)}
        role="radiogroup"
        aria-label="Star rating"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onClick={() => setStars(n)}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            aria-checked={stars === n}
            role="radio"
            className="focus-ring rounded-md p-1 transition"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill={n <= filled ? "#1E4D2B" : "none"}
              stroke={n <= filled ? "#1E4D2B" : "rgba(18,32,26,0.35)"}
              strokeWidth="1.6"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="12,2 15,9 22,9.5 17,14.5 18.5,22 12,18 5.5,22 7,14.5 2,9.5 9,9" />
            </svg>
          </button>
        ))}
        <span className="ml-2 text-[13px] text-bark">
          {stars ? `${stars}/5` : "pick a rating"}
        </span>
      </div>

      {/* comment */}
      <label
        htmlFor="review-comment"
        className="mt-4 block text-[11.5px] font-semibold uppercase tracking-[0.1em] text-bark"
      >
        what worked / what didn&apos;t
      </label>
      <textarea
        id="review-comment"
        ref={textareaRef}
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 2000))}
        rows={4}
        placeholder="A real sentence or two — the more specific, the more it actually helps."
        className="focus-ring mt-2 block w-full resize-y rounded-2xl border border-ink/12 bg-white px-4 py-3 text-[14px] leading-relaxed text-ink placeholder:text-bark/60"
      />
      <div className="mt-1 flex justify-between text-[11.5px] text-bark/80">
        <span>
          {commentLen < MIN_LEN
            ? `${MIN_LEN - commentLen} more character${
                MIN_LEN - commentLen === 1 ? "" : "s"
              } to unlock the bonus`
            : "✓ long enough for the bonus"}
        </span>
        <span>{commentLen}/2000</span>
      </div>

      {error && <p className="mt-3 text-[12.5px] text-warn">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={phase === "sending"}
        className="btn-primary focus-ring mt-4 w-full sm:w-auto"
      >
        {phase === "sending" ? "Sending…" : "Send review + claim +3 checks"}
      </button>
    </div>
  );
}

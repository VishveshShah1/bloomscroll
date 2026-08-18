"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Wordmark from "@/components/Wordmark";

/**
 * Where chrome.runtime.setUninstallURL sends people after they remove the
 * extension. Chrome opens this once the extension is already gone, so there
 * are no extension APIs here — it's an ordinary page.
 *
 * Two jobs, in this order of honesty: find out what went wrong, and offer a
 * reason to come back. The bonus is a real grant against the signed-in
 * account (lib/comeback.ts → the same counter the review bonus uses), not a
 * page that says "3 free checks" and does nothing.
 *
 * Client component because it reads claim state and posts feedback. Kept out
 * of the index — it's an exit page, not a destination.
 */

const REASONS = [
  "It didn't work / kept erroring",
  "I didn't use it enough",
  "Results weren't useful",
  "Too slow",
  "Privacy concerns",
  "Just testing it",
];

export default function ComebackPage() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [bonus, setBonus] = useState(3);
  const [picked, setPicked] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/comeback")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setSignedIn(Boolean(d.signedIn));
        setClaimed(Boolean(d.claimed));
        if (typeof d.bonus === "number") setBonus(d.bonus);
      })
      .catch(() => !cancelled && setSignedIn(false));
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit() {
    setState("sending");
    setError("");
    const reason = [picked, detail.trim()].filter(Boolean).join(" — ");
    try {
      const r = await fetch("/api/comeback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d?.error ?? "Something went wrong.");
        setState("error");
        return;
      }
      setClaimed(true);
      setState("done");
    } catch {
      setError("Couldn't reach the server. Try again in a moment.");
      setState("error");
    }
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="mx-auto w-full max-w-3xl px-4 pt-10 sm:px-8">
        <Link href="/" className="focus-ring inline-block rounded-lg">
          <Wordmark className="text-[22px]" />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-12 sm:px-8">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-forest">
          extension removed
        </p>
        <h1 className="mt-3 max-w-[20ch] text-[34px] font-semibold leading-[1.05] tracking-display text-ink sm:text-[48px]">
          What wasn&rsquo;t working?
        </h1>
        <p className="mt-5 max-w-[58ch] text-[17px] leading-relaxed text-bark">
          One tap, no essay required. It genuinely changes what gets fixed next
          — and the web app still works without the extension.
        </p>

        {state !== "done" && (
          <>
            <div className="mt-9 flex flex-wrap gap-2.5">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setPicked(picked === r ? null : r)}
                  aria-pressed={picked === r}
                  className={`focus-ring rounded-full border px-4 py-2 text-[14px] font-medium transition ${
                    picked === r
                      ? "border-forest bg-forest text-canvas"
                      : "border-ink/15 bg-white/70 text-ink hover:border-ink/30 hover:bg-white"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <label className="mt-6 block">
              <span className="text-[13px] font-semibold text-ink">
                Anything else? (optional)
              </span>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="The bit that annoyed you most."
                className="focus-ring mt-2 w-full rounded-2xl border border-ink/15 bg-white/80 px-4 py-3 text-[15px] text-ink placeholder:text-bark/60"
              />
            </label>
          </>
        )}

        <div className="mt-9 rounded-[22px] border border-forest/25 bg-moss/50 p-7">
          {state === "done" ? (
            <>
              <h2 className="text-[22px] font-semibold tracking-display text-ink">
                Thanks — that&rsquo;s logged.
              </h2>
              <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-bark">
                {claimed && bonus > 0
                  ? `We've added ${bonus} checks to your account. They're on your allowance now, whether you reinstall the extension or just use the web app.`
                  : "Your feedback is recorded."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/dashboard" className="btn-primary focus-ring">
                  Open the checker →
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-[22px] font-semibold tracking-display text-ink">
                Give it one more shot?
              </h2>
              <p className="mt-3 max-w-[54ch] text-[15px] leading-relaxed text-bark">
                {signedIn === false
                  ? `Sign in and we'll add ${bonus} checks to your account — the offer needs an account to land on.`
                  : claimed
                    ? "You've already claimed this one, but your feedback still counts."
                    : `Send your answer and we'll add ${bonus} checks to your account, on top of your monthly allowance.`}
              </p>

              {error && <p className="mt-4 text-[13px] text-warn">{error}</p>}

              <div className="mt-6 flex flex-wrap gap-3">
                {signedIn === false ? (
                  <Link href="/signin" className="btn-primary focus-ring">
                    Sign in to claim {bonus} checks →
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={state === "sending" || (!picked && !detail.trim())}
                    className="btn-primary focus-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {state === "sending"
                      ? "sending…"
                      : claimed
                        ? "Send feedback"
                        : `Send and claim ${bonus} checks`}
                  </button>
                )}
                <Link
                  href="/"
                  className="focus-ring inline-flex items-center rounded-full border border-ink/12 bg-white/70 px-6 py-3 text-[15px] font-semibold text-ink transition hover:-translate-y-0.5 hover:border-ink/25 hover:bg-white"
                >
                  No thanks
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="mt-8 text-[13px] text-bark">
          Reinstalling later?{" "}
          <Link href="/access" className="font-semibold text-forest underline underline-offset-2">
            Install guides
          </Link>{" "}
          ·{" "}
          <Link href="/support" className="font-semibold text-forest underline underline-offset-2">
            Contact us
          </Link>
        </p>
      </main>
    </div>
  );
}

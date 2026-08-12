"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import FeedbackPrompt from "@/components/FeedbackPrompt";
import ReportMistake from "@/components/ReportMistake";
import { STRINGS, useLang, type Lang, type Strings } from "@/lib/i18n";
import { EXAMPLES } from "@/lib/examples";
import type { CheckResponse, UsageSnapshot, Verdict } from "@/lib/types";
import { VERDICT_COLORS } from "@/lib/verdicts";

/**
 * The whole checker — input, examples, streaming stages, graded results —
 * as a mountable block. Lifted out of the old /check page so the dashboard
 * can host it directly (the dashboard is now the one place everything
 * lives; /check just redirects there).
 *
 * Auth is the host page's job: this renders assuming a signed-in user,
 * because /dashboard already gates on that.
 *
 * Usage state is owned by the PARENT and passed down, so a check that
 * consumes a credit updates the dashboard's usage card in the same tick
 * instead of the two components each polling /api/usage separately.
 */

type Stage =
  | { stage: "reading" }
  | { stage: "claims"; n: number }
  | { stage: "searching" }
  | { stage: "grading" };

interface LimitError {
  used: number;
  limit: number;
  resetAt: string;
}

/** Small, dismissible upgrade nudge that sits in place of the usage pill.
 *  Only shows for free-tier users with 1–2 checks left. The parent
 *  decides whether to render this or the pill (never both) so the
 *  count isn't repeated side-by-side. */
function UsageNudge({
  remaining,
  onDismiss,
}: {
  remaining: number;
  onDismiss: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-forest/30 bg-canvas px-3 py-1.5 text-[12px] font-semibold text-forest shadow-[0_2px_6px_rgba(30,77,43,0.08)]">
      <span>
        {remaining === 1 ? "1 check left this month" : `${remaining} checks left this month`}
      </span>
      <span aria-hidden="true">·</span>
      <Link
        href="/#pricing"
        className="focus-ring rounded underline underline-offset-[3px] hover:text-ink"
      >
        see plans
      </Link>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="focus-ring ml-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full p-1 text-bark/70 transition hover:text-ink"
      >
        <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true">
          <path
            d="M2 2 L10 10 M10 2 L2 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

/** Non-blocking inline upgrade prompt shown after a graded result for
 *  free-tier users. Sits before the FeedbackPrompt, above the ↑fold of
 *  the citation-list block. Nothing covers the result. */
function AfterResultUpgrade() {
  return (
    <div className="rounded-2xl border border-forest/25 bg-moss/40 p-4 sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-forest">
        want more of this?
      </p>
      <p className="mt-2 text-[14px] leading-relaxed text-ink">
        Sprout ($4.99/mo) gives you 150 checks a month and saves your history.
        Canopy ($19.99/mo) is the one that removes the cap entirely, plus
        faster processing and deeper citation detail.
      </p>
      <Link
        href="/#pricing"
        className="focus-ring mt-3 inline-flex items-center gap-2 rounded-full border border-forest/30 px-3.5 py-1.5 text-[12.5px] font-semibold text-forest transition hover:bg-forest hover:text-canvas"
      >
        See plans →
      </Link>
    </div>
  );
}

function stageText(stage: Stage | null, t: Strings): string {
  if (!stage) return t.status.checking;
  switch (stage.stage) {
    case "reading":
      return t.stages.reading;
    case "claims":
      return t.stages.claims.replace("{n}", String(stage.n));
    case "searching":
      return t.stages.searching;
    case "grading":
      return t.stages.grading;
    default:
      return t.status.checking;
  }
}

function Badge({ verdict, label }: { verdict: Verdict; label: string }) {
  const v = VERDICT_COLORS[verdict];
  return (
    <span
      className="inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.06em]"
      style={{ background: v.bg, color: v.text, borderColor: v.border }}
    >
      {label}
    </span>
  );
}

function formatDate(iso: string, lang: Lang): string {
  try {
    return new Date(iso).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function UsagePill({ snap, t, lang }: { snap: UsageSnapshot; t: Strings; lang: Lang }) {
  if (!snap.signedIn) return null;
  const isPaid = snap.plan !== "seed";
  const label = isPaid
    ? `${t.check.unlimited} · ${snap.plan[0].toUpperCase()}${snap.plan.slice(1)}`
    : t.check.used
        .replace("{used}", String(snap.used))
        .replace("{limit}", String(snap.limit ?? 0));
  return (
    <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-ink/10 bg-moss/60 px-3.5 py-1.5">
      <span className="text-[12.5px] font-semibold text-forest">{label}</span>
      {!isPaid && snap.resetAt && (
        <span className="text-[11.5px] text-bark">
          {t.check.resetsOn.replace("{date}", formatDate(snap.resetAt, lang))}
        </span>
      )}
    </div>
  );
}

function LimitCard({ err, t, lang }: { err: LimitError; t: Strings; lang: Lang }) {
  return (
    <div className="surface p-6 sm:p-7">
      <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-forest">
        {t.check.used
          .replace("{used}", String(err.used))
          .replace("{limit}", String(err.limit))}
      </p>
      <h3 className="mt-2 text-[22px] font-semibold leading-snug text-ink">
        {t.check.limitTitle}
      </h3>
      <p className="mt-3 text-[15px] leading-relaxed text-bark">
        {t.check.limitBody.replace("{date}", formatDate(err.resetAt, lang))}
      </p>
      <Link href="/#pricing" className="btn-primary focus-ring mt-6">
        {t.check.upgradeCta} →
      </Link>
    </div>
  );
}

export default function Checker({
  usage,
  onUsageChange,
  onBusyChange,
}: {
  /** Current snapshot, owned by the parent. */
  usage: UsageSnapshot | null;
  /** Fired when the stream reports fresh counts, so the parent's card updates. */
  onUsageChange: (snap: UsageSnapshot) => void;
  /** Lets the host reflect check-in-progress (e.g. animate the wordmark). */
  onBusyChange?: (busy: boolean) => void;
}) {
  const [lang] = useLang();
  const t = STRINGS[lang];
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "done" | "error">("idle");
  const [stage, setStage] = useState<Stage | null>(null);
  const [data, setData] = useState<CheckResponse | null>(null);
  const [limitErr, setLimitErr] = useState<LimitError | null>(null);
  const [rateErr, setRateErr] = useState<string | null>(null);
  const langRef = useRef(lang);
  langRef.current = lang;
  const runningRef = useRef(false);

  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setNudgeDismissed(sessionStorage.getItem("bloom:usage-nudge-dismissed") === "1");
  }, []);

  useEffect(() => {
    onBusyChange?.(status === "checking");
  }, [status, onBusyChange]);

  const runCheck = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || runningRef.current) return;
      runningRef.current = true;
      setStatus("checking");
      setStage(null);
      setData(null);
      setLimitErr(null);
      setRateErr(null);
      try {
        const res = await fetch("/api/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: trimmed, lang: langRef.current }),
        });

        if (res.status === 401) {
          setStatus("idle");
          return;
        }
        if (res.status === 429) {
          // Two flavors: monthly cap (offer upgrade) or hourly safety cap
          // (transient — just tell them to slow down; Canopy is capped too).
          const body = (await res.json()) as {
            error?: string;
            used?: number;
            limit?: number;
            resetAt?: string;
            message?: string;
            retryAfterSeconds?: number;
          };
          if (body.error === "rate_limit") {
            const mins = Math.max(1, Math.ceil((body.retryAfterSeconds ?? 3600) / 60));
            setRateErr(
              body.message ??
                `Slow down — you've hit the hourly safety cap. Try again in about ${mins} min.`,
            );
          } else {
            setLimitErr({
              used: body.used ?? 0,
              limit: body.limit ?? 0,
              resetAt: body.resetAt ?? new Date().toISOString(),
            });
          }
          setStatus("idle");
          return;
        }
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let settled = false;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split("\n\n");
          buf = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.replace(/^data: ?/, "").trim();
            if (!line) continue;
            const msg = JSON.parse(line) as
              | Stage
              | { stage: "done"; payload: CheckResponse }
              | ({ stage: "usage" } & UsageSnapshot)
              | { stage: "error" };
            if (msg.stage === "done") {
              setData(msg.payload);
              setStatus("done");
              settled = true;
            } else if (msg.stage === "usage") {
              // Fresh counts straight from the pipeline. Hand them up so the
              // dashboard's usage card moves without a second fetch.
              onUsageChange({
                signedIn: true,
                plan: msg.plan,
                used: msg.used,
                limit: msg.limit,
                bonus: msg.bonus,
                resetAt: msg.resetAt,
              });
            } else if (msg.stage === "error") {
              setStatus("error");
              settled = true;
            } else {
              setStage(msg);
            }
          }
        }
        if (!settled) setStatus("error");
      } catch {
        setStatus("error");
      } finally {
        runningRef.current = false;
      }
    },
    [onUsageChange],
  );

  function clearAll() {
    setInput("");
    setData(null);
    setStatus("idle");
    setStage(null);
    setLimitErr(null);
    document.getElementById("check-input")?.focus();
  }

  // Share targets, bookmarklet, and extension all arrive as ?q=… on whatever
  // route hosts the checker. Strip the param after reading it so a refresh
  // doesn't silently re-run (and re-charge) the same check.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (!q) return;
    setInput(q);
    void runCheck(q);
    window.history.replaceState({}, "", window.location.pathname);
  }, [runCheck]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void runCheck(input);
  }

  const nudgeEligible =
    usage?.plan === "seed" &&
    usage.limit !== null &&
    usage.limit - usage.used > 0 &&
    usage.limit - usage.used <= 2;
  const showNudge = Boolean(nudgeEligible) && !nudgeDismissed;

  return (
    <div className="surface-lg rounded-[24px] p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-forest">
            run a check
          </p>
          <h2 className="mt-2 text-[26px] font-semibold leading-snug tracking-display text-ink sm:text-[30px]">
            What are we checking?
          </h2>
        </div>
        {usage &&
          (showNudge ? (
            <UsageNudge
              remaining={usage.limit! - usage.used}
              onDismiss={() => {
                sessionStorage.setItem("bloom:usage-nudge-dismissed", "1");
                setNudgeDismissed(true);
              }}
            />
          ) : (
            <UsagePill snap={usage} t={t} lang={lang} />
          ))}
      </div>

      {limitErr ? (
        <div className="mt-6">
          <LimitCard err={limitErr} t={t} lang={lang} />
        </div>
      ) : (
        <>
          <form onSubmit={onSubmit} className="mt-6">
            <label htmlFor="check-input" className="sr-only">
              {t.hero.placeholder}
            </label>
            <div className="surface flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-2 sm:pl-5">
              <input
                id="check-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.hero.placeholder}
                autoComplete="off"
                className="focus-ring min-w-0 flex-1 bg-transparent px-2 py-3 text-[16.5px] text-ink placeholder:text-bark/85 focus:outline-none"
              />
              <button
                type="submit"
                disabled={status === "checking"}
                className="btn-primary shrink-0"
              >
                {status === "checking" ? t.status.checking : t.hero.check}
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-bark">
              {t.hero.tryOne}
            </span>
            {EXAMPLES[lang].map((x) => (
              <button
                key={x}
                type="button"
                onClick={() => {
                  setInput(x);
                  void runCheck(x);
                }}
                className="focus-ring rounded-full border border-ink/10 bg-white/50 px-3.5 py-1.5 text-[13px] text-ink/80 transition hover:-translate-y-0.5 hover:border-ink/25"
              >
                {x}
              </button>
            ))}
            <span className="rounded-full border border-forest/30 bg-moss/60 px-2.5 py-1 text-[11px] font-semibold text-forest">
              free — these don&apos;t use a check
            </span>
          </div>

          <p className="mt-4 text-[13.5px] text-bark">{t.hero.disclaimer}</p>

          {rateErr && (
            <div
              role="status"
              className="mt-5 flex items-start gap-3 rounded-2xl border border-warn/40 bg-warn/10 p-4 text-[13.5px] leading-relaxed text-warn"
            >
              <span aria-hidden="true" className="mt-0.5 text-[15px]">
                ⏱
              </span>
              <p>{rateErr}</p>
            </div>
          )}
        </>
      )}

      {/* --- status / results --- */}
      <section aria-live="polite" className="mt-8 empty:mt-0">
        {status === "checking" && (
          <p className="flex items-center gap-2.5 text-[13.5px] text-bark">
            <span className="h-2 w-2 animate-pulse rounded-full bg-forest motion-reduce:animate-none" />
            {stageText(stage, t)}
          </p>
        )}

        {status === "error" && <p className="text-[13.5px] text-warn">{t.status.error}</p>}

        {status === "done" && data?.resolveError && (
          <div className="flex flex-col gap-3">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={clearAll}
                className="focus-ring rounded-full border border-ink/10 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-bark transition hover:text-ink"
              >
                {t.ui.clear}
              </button>
            </div>
            <div className="surface max-w-2xl p-6">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-bark">
                {t.status.couldntRead}
              </p>
              <p className="mt-2 text-[15px] leading-relaxed text-ink">
                {data.resolveError.message}
              </p>
            </div>
          </div>
        )}

        {status === "done" && data && !data.resolveError && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                {data.source && (
                  <p className="text-[12px] uppercase tracking-[0.1em] text-bark">
                    {t.status.read} · {data.source.type}
                    {data.source.title ? ` — ${data.source.title.slice(0, 60)}` : ""}
                    {data.source.chars ? ` · ${data.source.chars} ${t.status.chars}` : ""}
                  </p>
                )}
                {data.mock && (
                  <p className="text-[12px] uppercase tracking-[0.1em] text-warn">
                    {t.status.sample}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={clearAll}
                className="focus-ring rounded-full border border-ink/10 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-bark transition hover:text-ink"
              >
                {t.ui.clear}
              </button>
            </div>

            {data.inputWarning && (
              <div className="rounded-2xl border border-warn/40 bg-warn/10 p-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-warn">
                  ⚠ {data.inputWarning.label}
                </p>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink">
                  {data.inputWarning.message}
                </p>
              </div>
            )}

            <div
              className="flex flex-col gap-6"
              key={`claims-${data.claims?.length ?? 0}-${data.claims?.[0]?.claim ?? ""}`}
            >
              {data.claims?.map((c) => {
                const citedUrls = new Set(c.citations.map((cit) => cit.url));
                const papers = c.papers ?? [];
                return (
                  <article key={c.claim} className="surface anim-rise p-6 sm:p-7">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-bark">
                      {t.results.claimLabel}
                    </p>
                    <p className="mt-1 text-[20px] font-semibold leading-snug text-ink sm:text-[22px]">
                      &ldquo;{c.claim}&rdquo;
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                      <Badge verdict={c.verdict} label={t.verdictLabels[c.verdict]} />
                      <span className="text-[13px] font-medium text-bark">
                        {t.verdictMeanings[c.verdict]}
                      </span>
                    </div>
                    {c.safety && (
                      <p className="mt-4 rounded-xl border border-warn/40 bg-warn/10 p-3 text-[13px] leading-relaxed text-warn">
                        ⚠ {c.safety.message}
                      </p>
                    )}
                    <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-bark">
                      {t.results.verdictWhy}
                    </p>
                    <p className="mt-1.5 text-[15.5px] leading-relaxed text-ink/85">
                      {c.summary}
                    </p>

                    {c.citations.length > 0 && (
                      <div className="mt-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-bark">
                          {t.results.citedTitle}
                        </p>
                        <ul className="mt-2 flex flex-col gap-2.5">
                          {c.citations.map((cit) => (
                            <li key={cit.url + cit.title}>
                              <a
                                href={cit.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="focus-ring block rounded-xl border border-forest/25 bg-moss/50 px-4 py-3 transition hover:-translate-y-0.5 hover:border-forest/50"
                              >
                                <span className="block text-[14.5px] font-semibold leading-snug text-ink">
                                  {cit.title}
                                </span>
                                <span className="mt-1 block text-[12px] text-bark">
                                  {cit.journal} · {cit.year || "n.d."}
                                </span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {papers.length > 0 && (
                      <details className="group mt-5 border-t border-ink/10 pt-3">
                        <summary className="focus-ring flex cursor-pointer list-none items-center justify-between text-[11px] font-semibold uppercase tracking-[0.1em] text-bark transition hover:text-ink [&::-webkit-details-marker]:hidden">
                          <span>
                            {t.results.poolTitle} ({papers.length})
                          </span>
                          <span
                            aria-hidden="true"
                            className="text-[16px] font-bold leading-none text-forest transition-transform duration-200 group-open:rotate-45"
                          >
                            +
                          </span>
                        </summary>
                        <p className="mt-2.5 text-[13px] leading-relaxed text-bark">
                          {t.results.poolHint}
                        </p>
                        <ul className="mt-3 flex flex-col gap-2.5">
                          {papers.map((p) => {
                            const isCited = citedUrls.has(p.url);
                            const snippet =
                              p.abstract.length > 260
                                ? p.abstract.slice(0, 260).replace(/\s+\S*$/, "") + "…"
                                : p.abstract;
                            return (
                              <li
                                key={p.id}
                                className="rounded-xl border border-ink/8 bg-white/40 p-3"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <a
                                    href={p.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="focus-ring text-[14px] font-semibold leading-snug text-ink underline-offset-[3px] hover:text-forest hover:underline"
                                  >
                                    {p.title}
                                  </a>
                                  {isCited && (
                                    <span className="shrink-0 rounded-md border border-forest/40 bg-moss/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-forest">
                                      {t.results.cited}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-[11.5px] text-bark">
                                  {p.journal} · {p.year ?? "n.d."}
                                </p>
                                <p className="mt-2 text-[13px] leading-relaxed text-bark">
                                  {snippet}
                                </p>
                              </li>
                            );
                          })}
                        </ul>
                      </details>
                    )}

                    {papers.length === 0 &&
                      c.verdict !== "not_empirical" &&
                      c.citations.length === 0 && (
                        <p className="mt-4 rounded-xl border border-ink/8 bg-white/40 p-3 text-[12px] text-bark">
                          {t.results.poolEmpty}
                        </p>
                      )}
                    {/* TODO(share-result): per-card "copy shareable summary"
                        + result permalink are deferred. Revisit once we hit
                        $100 in revenue — the product's core value is
                        spreading calm evidence, so a share affordance here
                        is high-signal, but it's not blocking for launch. */}
                    <ReportMistake claim={c.claim} verdict={c.verdict} />
                  </article>
                );
              })}
            </div>
            {data.claims && data.claims.length > 0 && (
              <>
                {/* Contextual upgrade nudge — only for free-tier users,
                    inline with the result, non-blocking. Skipped for paid
                    plans since the message wouldn't apply. */}
                {usage?.plan === "seed" && <AfterResultUpgrade />}
                <FeedbackPrompt
                  // Fresh mount per result so a new check clears any prior
                  // dismiss / sent state and lets the visitor rate this one.
                  key={`fb-${data.claims[0].claim}`}
                  claimTag={data.claims[0].claim.slice(0, 120)}
                  verdict={data.claims[0].verdict}
                />
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

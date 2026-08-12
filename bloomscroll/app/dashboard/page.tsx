"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Wordmark from "@/components/Wordmark";
import ReviewForm from "@/components/ReviewForm";
import Checker from "@/components/Checker";
import type { Plan, UsageSnapshot } from "@/lib/types";

const PLAN_LABEL: Record<Plan, string> = {
  seed: "Seed",
  sprout: "Sprout",
  canopy: "Canopy",
};

const PLAN_TAGLINE: Record<Plan, string> = {
  seed: "For the casual scroller",
  sprout: "For the daily scroller",
  canopy: "For the completionist",
};

function formatReset(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return "—";
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return null;
  return Math.max(0, Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [snap, setSnap] = useState<UsageSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  // Mirrors the checker's in-flight state so the nav wordmark can animate
  // while a check streams, same as the old /check page did.
  const [checking, setChecking] = useState(false);

  // TEMP: ?preview=1 lets us view the dashboard UI without a real session,
  // for design review. Delete when the sign-in flow is stable.
  //
  // Gated behind `mounted` because reading window.location during render
  // makes the server (no window → false) and the client's first render
  // (preview → true) disagree, which React reports as a hydration failure
  // and then throws away the server HTML. Deferring to after mount keeps
  // both first renders identical.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isPreview =
    mounted &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("preview") === "1";

  const previewSession = isPreview
    ? {
        user: { name: "Arhaan", email: "you@example.com", image: null },
      }
    : null;
  const previewSnap: UsageSnapshot | null = isPreview
    ? {
        signedIn: true,
        plan: "seed" as Plan,
        used: 4,
        limit: 5,
        bonus: 0,
        resetAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 8).toISOString(),
        email: "you@example.com",
      }
    : null;

  // Kick anonymous visitors to sign-in with a callback back to /dashboard.
  // Waits for `mounted` so a preview load isn't bounced to /signin in the
  // one render before isPreview can be resolved.
  useEffect(() => {
    if (!mounted || isPreview) return;
    if (status === "unauthenticated") {
      // Carry the query string through sign-in. The extension, bookmarklet,
      // and share target all arrive as /dashboard?q=…, and a signed-out user
      // is the common first-use case — dropping the param here would land
      // them on an empty checker with no idea what they'd clicked.
      const target = `/dashboard${window.location.search}`;
      router.replace(`/signin?callbackUrl=${encodeURIComponent(target)}`);
    }
  }, [status, router, isPreview, mounted]);

  // Fetch usage — extracted so ReviewForm can trigger a refresh after
  // the bonus is granted so the new limit shows up immediately.
  const refreshUsage = useCallback(async () => {
    if (isPreview) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/usage", { cache: "no-store" });
      if (!res.ok) throw new Error(`usage ${res.status}`);
      const data = (await res.json()) as UsageSnapshot;
      setSnap(data);
      setErr(null);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "couldn't load usage");
    } finally {
      setLoading(false);
    }
  }, [isPreview]);

  useEffect(() => {
    if (isPreview) {
      setLoading(false);
      return;
    }
    if (status !== "authenticated") return;
    void refreshUsage();
  }, [status, isPreview, refreshUsage]);

  if (!mounted || (!isPreview && (status === "loading" || status === "unauthenticated"))) {
    return (
      <div className="flex min-h-screen items-center justify-center text-bark">
        <p className="text-[14px]">Loading…</p>
      </div>
    );
  }

  const activeSnap = isPreview ? previewSnap : snap;
  const activeSession = isPreview ? previewSession : session;
  const plan: Plan = activeSnap?.plan ?? "seed";
  const used = activeSnap?.used ?? 0;
  const limit = activeSnap?.limit ?? null;
  const pct = limit ? Math.min(1, used / limit) : 0;
  const remaining = limit ? Math.max(0, limit - used) : Infinity;
  const isFree = plan === "seed";
  const showUpgradePrompt = isFree && limit !== null && (pct >= 0.6 || remaining <= 2);
  const days = daysUntil(activeSnap?.resetAt ?? null);

  return (
    <div className="min-h-screen">
      <nav className="border-b border-ink/5 bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="focus-ring rounded-md">
              <Wordmark busy={checking} className="text-[22px]" />
            </Link>
            <Link
              href="/"
              aria-label="Back to home"
              className="focus-ring hidden sm:inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white/60 px-3 py-1.5 text-[12.5px] font-semibold text-bark transition hover:-translate-y-0.5 hover:border-ink/25 hover:text-ink"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              home
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {/* No "open the checker" link any more — the checker lives on
                this page now, so pointing elsewhere would be a round trip
                back to where you already are. */}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="focus-ring rounded-full border border-ink/10 px-3 py-2 text-[13px] font-semibold text-bark transition hover:border-ink/25 hover:text-ink"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="relative mx-auto w-full max-w-6xl overflow-hidden px-5 pb-24 pt-16 sm:px-8">
        {/* soft blob decorations */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-32 h-[420px] w-[420px] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #DDE7DA 0%, transparent 70%)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-20 h-[360px] w-[360px] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #E8EDDE 0%, transparent 70%)" }}
        />

        {/* Header row: greeting + avatar */}
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-forest">
              your dashboard
            </p>
            <h1 className="mt-3 text-[36px] font-semibold leading-tight tracking-display text-ink sm:text-[52px]">
              {activeSession?.user?.name ? `Hi, ${activeSession.user.name.split(" ")[0]}.` : "Hi there."}
            </h1>
            <p className="mt-3 text-[15px] text-bark">
              {activeSession?.user?.email}
            </p>
          </div>
          {activeSession?.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeSession.user.image}
              alt=""
              referrerPolicy="no-referrer"
              loading="lazy"
              width={80}
              height={80}
              className="h-20 w-20 rounded-full ring-4 ring-forest/25"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-forest text-[28px] font-bold text-canvas ring-4 ring-forest/25">
              {(activeSession?.user?.name?.[0] ?? "b").toUpperCase()}
            </span>
          )}
        </div>

        {/* The checker itself — the main thing you come here to do, so it
            sits directly under the greeting and above the account cards.
            It shares the parent's usage snapshot, so a check that spends a
            credit moves the usage card below without a refetch. */}
        <div className="relative mt-10" id="checker">
          <Checker
            usage={activeSnap}
            onUsageChange={setSnap}
            onBusyChange={setChecking}
          />
        </div>

        {/* Review widget. One per account, private, grants +3 checks on first
            successful submit; triggers a usage refresh so the new limit shows
            up without a page reload.

            Sits directly under the checker, ahead of the account cards. It
            used to live at the very bottom, which measured 2.6 viewports down
            once a result had rendered — two full screens of scrolling, so
            most people would never have seen it. Here it lands at the end of
            the result the user just read, which is both the highest-traffic
            spot on the page and the moment they actually have an opinion
            worth writing down. */}
        <div className="relative mt-6">
          <ReviewForm
            signedIn={Boolean(activeSession?.user?.email) || isPreview}
            onBonusGranted={() => void refreshUsage()}
          />
        </div>

        <div className="relative mt-12 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          {/* Usage card */}
          <div className="surface-lg rounded-[24px] p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-forest">
                  usage this month
                </p>
                <p className="mt-2 text-[36px] font-semibold leading-none tracking-display text-ink">
                  {loading ? "—" : used}
                  <span className="text-[18px] font-medium text-bark">
                    {" "}
                    / {limit === null ? "unlimited" : limit}
                  </span>
                </p>
                {activeSnap && (activeSnap.bonus ?? 0) > 0 && (
                  <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-forest/30 bg-moss/60 px-2.5 py-0.5 text-[11px] font-semibold text-forest">
                    +{activeSnap.bonus} review bonus applied
                  </p>
                )}
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] ${
                  isFree
                    ? "border border-forest/40 bg-moss/70 text-forest"
                    : "bg-forest text-canvas"
                }`}
              >
                {PLAN_LABEL[plan]}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-bark">{PLAN_TAGLINE[plan]}</p>

            {/* Progress bar (only for finite plans) */}
            {limit !== null && (
              <>
                <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-moss">
                  <div
                    className="h-full rounded-full bg-forest transition-[width] duration-500 ease-out"
                    style={{ width: `${Math.round(pct * 100)}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[13px] text-bark">
                  <span>
                    {remaining === Infinity
                      ? "Unlimited checks"
                      : `${remaining} check${remaining === 1 ? "" : "s"} left`}
                  </span>
                  <span>
                    resets {formatReset(activeSnap?.resetAt ?? null)}
                    {days !== null && ` · ${days} day${days === 1 ? "" : "s"}`}
                  </span>
                </div>
              </>
            )}
            {limit === null && (
              <p className="mt-4 text-[13px] text-bark">
                Your plan has no monthly cap. Check as much as you want.
              </p>
            )}

            {err && (
              <p className="mt-4 text-[13px] text-warn">
                Couldn&apos;t load usage: {err}. Try refreshing.
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {/* Same-page jump now that the checker is above, rather than a
                  navigation to a route that no longer renders it. */}
              <a
                href="#checker"
                className="focus-ring inline-flex items-center gap-2 rounded-full bg-forest px-5 py-3 text-[14px] font-semibold text-canvas shadow-[0_8px_22px_rgba(30,77,43,0.2)] transition hover:-translate-y-0.5 hover:bg-[#16391f]"
              >
                Run a check ↑
              </a>
              <Link
                href="/access"
                className="focus-ring inline-flex items-center gap-2 rounded-full border border-ink/12 px-5 py-3 text-[14px] font-semibold text-ink transition hover:border-ink/25 hover:bg-white/60"
              >
                Install on my device
              </Link>
            </div>
          </div>

          {/* Right column: upgrade nudge OR plan status card */}
          <div className="flex flex-col gap-6">
            {showUpgradePrompt ? (
              <div
                className="section-dark relative overflow-hidden rounded-[24px] p-8"
                style={{ color: "#F6F3EA" }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-canvas/70">
                  running low
                </p>
                <h2 className="mt-2 text-[26px] font-semibold leading-snug tracking-display">
                  {remaining === 0
                    ? "You've used your free checks for the month."
                    : `Only ${remaining} free check${remaining === 1 ? "" : "s"} left.`}
                </h2>
                <p className="mt-3 text-[14px] leading-relaxed text-canvas/75">
                  Sprout ($4.99/mo) unlocks unlimited checks, saved history, and
                  priority pipeline. Canopy ($19.99/mo) adds faster processing,
                  deeper citation detail, and early access to new features.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/#pricing"
                    className="focus-ring inline-flex items-center gap-2 rounded-full bg-canvas px-5 py-3 text-[14px] font-semibold text-forest shadow-[0_8px_22px_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 hover:bg-white"
                  >
                    See plans →
                  </Link>
                  {remaining > 0 && (
                    <p className="self-center text-[12px] text-canvas/60">
                      or wait — resets {formatReset(activeSnap?.resetAt ?? null)}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="surface rounded-[24px] p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-forest">
                  your plan
                </p>
                <h2 className="mt-2 text-[26px] font-semibold leading-snug tracking-display text-ink">
                  {PLAN_LABEL[plan]}
                </h2>
                <p className="mt-2 text-[14px] text-bark">{PLAN_TAGLINE[plan]}</p>
                <p className="mt-6 text-[13px] leading-relaxed text-bark">
                  {isFree
                    ? "You're on the free tier. Bloomscroll's core stays free forever."
                    : "You're on a paid plan. Manage or cancel from the Stripe portal."}
                </p>
                {isFree && (
                  <Link
                    href="/#pricing"
                    className="focus-ring mt-6 inline-flex items-center gap-2 rounded-full border border-forest/30 px-4 py-2 text-[13px] font-semibold text-forest transition hover:bg-forest hover:text-canvas"
                  >
                    Compare plans →
                  </Link>
                )}
              </div>
            )}

            {/* Tiny help card. A real support inbox is on the way; for
                now, the review flow above is the fastest way to send
                anything through. TODO: swap to support@bloomscroll.app
                once the mailbox exists. */}
            <div className="surface rounded-[24px] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-forest">
                need something?
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-bark">
                A dedicated support inbox is coming soon. Until then, use the
                review form above or the feedback prompt on a check result —
                both land in the same place.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-10 text-[12px] text-bark">
          © 2026 Bloomscroll. All rights reserved.
        </p>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Wordmark from "@/components/Wordmark";

type Plan = "seed" | "sprout" | "canopy";
type UsageSnapshot = {
  signedIn: boolean;
  plan: Plan;
  used: number;
  /** null = unlimited (paid tier) */
  limit: number | null;
  resetAt: string | null;
  email?: string;
};

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

  // TEMP: ?preview=1 lets us view the dashboard UI without a real session,
  // for design review. Delete when the sign-in flow is stable.
  const isPreview =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("preview") === "1";

  const previewSession = isPreview
    ? {
        user: { name: "Arhaan", email: "arhaanie09@gmail.com", image: null },
      }
    : null;
  const previewSnap: UsageSnapshot | null = isPreview
    ? {
        signedIn: true,
        plan: "seed" as Plan,
        used: 4,
        limit: 5,
        resetAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 8).toISOString(),
        email: "arhaanie09@gmail.com",
      }
    : null;

  // Kick anonymous visitors to sign-in with a callback back to /dashboard.
  useEffect(() => {
    if (isPreview) return;
    if (status === "unauthenticated") {
      router.replace("/signin?callbackUrl=/dashboard");
    }
  }, [status, router, isPreview]);

  // Fetch usage once we know the user is authed.
  useEffect(() => {
    if (isPreview) {
      setLoading(false);
      return;
    }
    if (status !== "authenticated") return;
    let cancelled = false;
    setLoading(true);
    fetch("/api/usage", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`usage ${r.status}`);
        return (await r.json()) as UsageSnapshot;
      })
      .then((data) => {
        if (!cancelled) setSnap(data);
      })
      .catch((e: unknown) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "couldn't load usage");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, isPreview]);

  if (!isPreview && (status === "loading" || status === "unauthenticated")) {
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
          <Link href="/" className="focus-ring rounded-md">
            <Wordmark className="text-[22px]" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/check"
              className="focus-ring rounded-full bg-forest px-4 py-2 text-[13px] font-semibold text-canvas shadow-[0_6px_18px_rgba(30,77,43,0.2)] transition hover:-translate-y-0.5 hover:bg-[#16391f]"
            >
              Open the checker →
            </Link>
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
              className="h-20 w-20 rounded-full ring-4 ring-forest/25"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-forest text-[28px] font-bold text-canvas ring-4 ring-forest/25">
              {(activeSession?.user?.name?.[0] ?? "b").toUpperCase()}
            </span>
          )}
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
              <Link
                href="/check"
                className="focus-ring inline-flex items-center gap-2 rounded-full bg-forest px-5 py-3 text-[14px] font-semibold text-canvas shadow-[0_8px_22px_rgba(30,77,43,0.2)] transition hover:-translate-y-0.5 hover:bg-[#16391f]"
              >
                Run a check →
              </Link>
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

            {/* Tiny help card */}
            <div className="surface rounded-[24px] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-forest">
                need something?
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-bark">
                Bug, feature idea, or account help — one inbox goes straight to
                the person who built this:
              </p>
              <a
                href="mailto:vishvesh380@gmail.com?subject=Bloomscroll%3A%20dashboard"
                className="focus-ring mt-3 inline-block text-[14px] font-semibold text-forest underline underline-offset-[3px]"
              >
                vishvesh380@gmail.com
              </a>
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

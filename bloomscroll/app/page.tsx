"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import Wordmark, { BMark } from "@/components/Wordmark";
import {
  StepInputArt,
  StepScanArt,
  StepGradedArt,
  UseCaseArt,
} from "@/components/PlaceholderArt";
import HeroPhoneAnimation from "@/components/HeroPhoneAnimation";
import { BrandIcon, brandKindFor } from "@/components/BrandIcon";
import { STRINGS, useLang, type Lang } from "@/lib/i18n";
import type { Verdict } from "@/lib/types";
import { VERDICT_TINT } from "@/lib/verdicts";

const VERDICT_ORDER: Verdict[] = ["supported", "mixed", "weak", "no_evidence", "not_empirical"];

type PlanSlug = "sprout" | "canopy";
const PLAN_SLUGS = ["seed", "sprout", "canopy"] as const;
const STRIPE_ENABLED = process.env.NEXT_PUBLIC_STRIPE_ENABLED === "1";

// TODO: swap to a real support inbox once the mailbox exists
// (e.g. "support@bloomscroll.app"). Until then the footer shows a
// "contact coming soon" note instead of exposing a personal address.
const CONTACT_EMAIL: string | null = null;

type PlatformKind = "iphone" | "android" | "desktop";

function detectPlatform(): PlatformKind {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iphone";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function usePlatform(): PlatformKind | null {
  const [p, setP] = useState<PlatformKind | null>(null);
  useEffect(() => {
    setP(detectPlatform());
  }, []);
  return p;
}

/** Reveal every `[data-reveal]` element as it enters the viewport so CSS
 *  can fade + slide it in. Manual getBoundingClientRect on scroll (rAF
 *  throttled) instead of IntersectionObserver so it works in every browser
 *  and every embedded/headless context — and does an initial pass so
 *  above-the-fold content is visible on first paint. Respects
 *  prefers-reduced-motion via the CSS override. */
function useRevealOnScroll() {
  useEffect(() => {
    const collect = () =>
      Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.in)"));
    let els = collect();
    if (!els.length) return;

    let ticking = false;
    const reveal = () => {
      ticking = false;
      const vh = window.innerHeight || document.documentElement.clientHeight || 0;
      const trigger = vh * 0.92;
      els = els.filter((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < trigger && r.bottom > 0) {
          el.classList.add("in");
          return false;
        }
        return true;
      });
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(reveal);
    };

    // Initial pass (rAF so layout has settled).
    requestAnimationFrame(reveal);
    // Second pass after Splash finishes to catch anything that just came in.
    const late = window.setTimeout(reveal, 1700);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.clearTimeout(late);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
}

function VerdictChip({ verdict, label }: { verdict: Verdict; label: string }) {
  const v = VERDICT_TINT[verdict];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.06em] shadow-[0_2px_6px_rgba(18,32,26,0.08)]"
      style={{ background: v.bg, color: v.text, borderColor: v.border }}
    >
      <span aria-hidden="true" className="text-[13px] leading-none">
        {v.glyph}
      </span>
      {label}
    </span>
  );
}

function PlatformIcon({ kind, size = 22 }: { kind: "android" | "iphone" | "desktop"; size?: number }) {
  if (kind === "iphone") {
    // Classic Apple logo, filled with currentColor so it inherits button text tone.
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
      </svg>
    );
  }
  if (kind === "android") {
    // Android robot head — the classic mascot with two eyes and two antennae.
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-2.86-1.21-6.08-1.21-8.94 0L5.65 5.67c-.19-.29-.58-.38-.87-.2C4.5 5.65 4.41 6 4.56 6.29L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z" />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20 L16 20" />
      <path d="M12 16 L12 20" />
    </svg>
  );
}

function Nav({
  lang,
  signedIn,
  avatar,
  userName,
}: {
  lang: Lang;
  signedIn: boolean;
  avatar?: string | null;
  userName?: string | null;
}) {
  const t = STRINGS[lang];
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const links = [
    { href: "#how", label: t.nav.how },
    { href: "#verdicts", label: t.nav.verdicts },
    { href: "#access", label: t.nav.getApp },
    { href: "#pricing", label: t.nav.pricing },
  ];
  // Clicking the wordmark always returns home; if already on '/', asks the
  // Splash to replay (throttled inside Splash so mashing it doesn't loop).
  function onWordmarkClick(e: React.MouseEvent) {
    if (pathname === "/") {
      e.preventDefault();
      window.dispatchEvent(new Event("bloom:splash-replay"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
  return (
    <nav className="sticky top-0 z-40 border-b border-ink/5 bg-canvas/85 backdrop-blur">
      {/* 3-column: logo left, links dead-center, controls right. */}
      <div className="mx-auto grid h-16 w-full max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-8">
        <Link href="/" onClick={onWordmarkClick} className="focus-ring rounded-md">
          <Wordmark className="text-[22px]" />
        </Link>
        <div className="hidden items-center justify-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="nav-link focus-ring text-[14.5px] font-medium text-bark transition hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          {signedIn ? (
            <Link
              href="/dashboard"
              aria-label="Open dashboard"
              className="focus-ring group flex items-center gap-2 rounded-full border border-ink/10 bg-white/70 py-1 pl-1 pr-3 text-[13px] font-semibold text-ink shadow-[0_4px_14px_rgba(18,32,26,0.06)] transition hover:-translate-y-0.5 hover:border-forest/40 hover:bg-white"
            >
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-7 w-7 rounded-full ring-2 ring-forest/30 transition group-hover:ring-forest"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest text-[11px] font-bold text-canvas">
                  {(userName?.[0] ?? "b").toUpperCase()}
                </span>
              )}
              <span className="hidden sm:inline">dashboard</span>
            </Link>
          ) : (
            <>
              <Link
                href="/signin"
                className="focus-ring hidden rounded-full border border-ink/12 px-4 py-2 text-[13.5px] font-semibold text-ink transition hover:border-ink/25 hover:bg-white/60 sm:inline-block"
              >
                log in
              </Link>
              <Link
                href="/signin"
                className="focus-ring hidden rounded-full bg-forest px-5 py-2.5 text-[13.5px] font-semibold text-canvas shadow-[0_8px_22px_rgba(30,77,43,0.22)] ring-2 ring-forest/15 transition hover:-translate-y-0.5 hover:bg-[#16391f] sm:inline-block"
              >
                {t.nav.startFree}
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={t.nav.menu}
            aria-expanded={open}
            className="focus-ring rounded-full border border-ink/10 px-3 py-1.5 text-[15px] font-bold text-ink md:hidden"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>
      {open && (
        <div className="absolute inset-x-0 top-16 border-b border-ink/10 bg-canvas/95 px-5 py-5 backdrop-blur md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="focus-ring text-[16px] font-semibold text-ink"
              >
                {l.label}
              </a>
            ))}
            {signedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="focus-ring text-[16px] font-semibold text-forest"
              >
                dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/signin"
                  onClick={() => setOpen(false)}
                  className="focus-ring text-[16px] font-semibold text-ink"
                >
                  log in
                </Link>
                <Link
                  href="/signin"
                  onClick={() => setOpen(false)}
                  className="focus-ring text-[16px] font-semibold text-forest"
                >
                  {t.nav.startFree}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

/**
 * A framed slot for a product screenshot. Prefers a real PNG at the given
 * `src`; if that image is missing (or fails to load), renders the passed
 * SVG `fallback` so the page never looks broken.
 *
 * Real screenshots go in public/screenshots/. The slot names are stable
 * so dropping in hero.png / step-1.png / step-2.png / step-3.png works
 * without any code change.
 */
function ScreenFrame({
  src,
  alt,
  fallback,
  emphasis = false,
  phone = false,
}: {
  src: string;
  alt: string;
  fallback: ReactNode;
  emphasis?: boolean;
  phone?: boolean;
}) {
  // Start with the SVG fallback. Try to load the PNG in the background —
  // only swap to it once the browser confirms the load. This avoids the
  // classic broken-image flash when the file doesn't exist yet.
  const [imgOk, setImgOk] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const probe = new window.Image();
    probe.onload = () => {
      if (!cancelled) setImgOk(true);
    };
    probe.onerror = () => {
      if (!cancelled) setImgOk(false);
    };
    probe.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);
  // Phone frames are transparent (the PhoneHeroArt draws its own chrome);
  // browser/laptop screenshots sit inside a surface card. Both add a subtle
  // hover-tilt so the illustrations feel interactive rather than static.
  if (phone) {
    return (
      <div className="art-hover is-phone mx-auto aspect-[400/820] w-full">
        {imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className="block h-full w-full rounded-[54px] object-cover object-top"
          />
        ) : (
          fallback
        )}
      </div>
    );
  }
  const surface = emphasis ? "surface-lg" : "surface";
  return (
    <div className={`art-hover ${surface} overflow-hidden`} style={{ padding: 12 }}>
      <div className="aspect-[16/11] overflow-hidden rounded-[18px]">
        {imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className="block h-full w-full object-cover object-top"
          />
        ) : (
          fallback
        )}
      </div>
    </div>
  );
}

// Named alias — used to be its own component; kept as an alias so the JSX
// still reads as "screenshot slot" at each call site.
const ScreenSlot = ScreenFrame;

// A canned sample verdict used by the TryDemo panel. Written once here so
// the panel doesn't need any i18n plumbing or backend call.
const DEMO_CLAIM = "Daily sunscreen use reduces skin cancer risk over time.";
const DEMO_SUMMARY =
  "Multiple randomized trials and large cohorts show daily broad-spectrum sunscreen lowers melanoma and squamous cell risk. Effect size is modest per year and adds up over decades.";
// Real papers backing the sample claim. URLs point at each paper's
// public index page so clicks land on something real, not a dead demo.
const DEMO_CITATIONS = [
  {
    title: "Green AC et al., Reduced melanoma after regular sunscreen use",
    meta: "J Clin Oncol, 2011",
    url: "https://pubmed.ncbi.nlm.nih.gov/21135266/",
  },
  {
    title: "van der Pols JC et al., Prolonged prevention of squamous cell carcinoma of the skin",
    meta: "Cancer Epidemiol Biomarkers Prev, 2006",
    url: "https://pubmed.ncbi.nlm.nih.gov/17148725/",
  },
  {
    title: "Bath-Hextall FJ et al., Interventions for preventing non-melanoma skin cancers",
    meta: "Cochrane Database Syst Rev, 2007",
    url: "https://pubmed.ncbi.nlm.nih.gov/17253544/",
  },
];

/** Interactive demo panel — pre-filled sample claim, one click reveals a
 *  graded verdict card with mock citations. Never touches the real API. */
function TryDemo() {
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [progress, setProgress] = useState(0);

  function runDemo() {
    if (phase === "running") return;
    setPhase("running");
    setProgress(0);
    const start = performance.now();
    const tick = () => {
      const elapsed = performance.now() - start;
      const p = Math.min(1, elapsed / 1400);
      setProgress(p);
      if (p < 1) requestAnimationFrame(tick);
      else setPhase("done");
    };
    requestAnimationFrame(tick);
  }

  function reset() {
    setPhase("idle");
    setProgress(0);
  }

  return (
    <section aria-label="Try a live demo" className="relative overflow-hidden py-14 sm:py-20">
      <div className="brand-watermark -bottom-10 -left-16 hidden sm:block">
        <BMark className="h-[280px] w-auto" strokeWidth={2.4} />
      </div>
      <div className="brand-watermark top-6 right-[-3%] hidden md:block">
        <BMark className="h-[200px] w-auto" strokeWidth={2.4} />
      </div>
      <div className="relative mx-auto w-full max-w-5xl px-4 sm:px-8">
        <div data-reveal className="reveal">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-forest">
            try it now
          </p>
          <h2 className="mt-3 text-[30px] font-semibold leading-[1.05] tracking-display text-ink sm:text-[42px]">
            See a graded verdict — no signup.
          </h2>
          <p className="mt-4 max-w-[54ch] text-[16px] leading-relaxed text-bark sm:text-[17px]">
            One click on a real, prefilled sample claim. The output below is what
            you get when you run your own.
          </p>
        </div>

        <div data-reveal data-d="1" className="reveal surface-lg mt-8 rounded-[24px] p-6 sm:p-8">
          {/* Input row */}
          <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-bark">
            sample claim
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-[15px] italic text-ink">
              &ldquo;{DEMO_CLAIM}&rdquo;
            </div>
            <button
              type="button"
              onClick={phase === "done" ? reset : runDemo}
              disabled={phase === "running"}
              className="btn-primary focus-ring shrink-0"
            >
              {phase === "idle" && "Run demo →"}
              {phase === "running" && "Checking…"}
              {phase === "done" && "Reset"}
            </button>
          </div>

          {/* Progress bar */}
          {phase !== "idle" && (
            <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-moss/60">
              <div
                className="h-full rounded-full bg-forest transition-[width] duration-100 ease-linear"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          )}

          {/* Result reveal */}
          {phase === "done" && (
            <div className="mt-6 rounded-[18px] border border-ink/6 bg-canvas p-5 sm:p-6">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-bark">
                verdict
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <VerdictChip verdict="supported" label={STRINGS.en.verdictLabels.supported} />
                <span className="text-[13px] text-bark">
                  Consistent evidence across multiple decent studies.
                </span>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-ink">{DEMO_SUMMARY}</p>
              <p className="mt-6 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-bark">
                cited in the answer
              </p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {DEMO_CITATIONS.map((c, i) => (
                  <li key={c.title}>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="focus-ring flex gap-3 rounded-xl border border-forest/25 bg-moss/40 p-3 transition hover:-translate-y-0.5 hover:border-forest/50 hover:bg-moss/60"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-forest text-[11px] font-bold text-canvas">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold leading-snug text-ink">
                          {c.title}
                        </p>
                        <p className="mt-0.5 text-[12px] text-bark">
                          {c.meta} · opens on PubMed ↗
                        </p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[12px] text-bark">
                Sample output — for your own claim, sign in and run a real check.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const [lang] = useLang();
  const t = STRINGS[lang];
  const { data: session, status: authStatus } = useSession();
  const signedIn = authStatus === "authenticated";
  const platform = usePlatform();
  useRevealOnScroll();

  const [checkoutPlan, setCheckoutPlan] = useState<PlanSlug | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  // Default to annual — it's the fairer per-month price for the user and
  // aligns with the way we frame the plans in the copy. Visitors can flip
  // back to monthly with one click.
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">(
    "annual",
  );

  async function handleSubscribe(plan: PlanSlug) {
    if (checkoutPlan) return;
    setCheckoutPlan(plan);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval: billingInterval }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "checkout failed");
      window.location.href = data.url;
    } catch {
      setCheckoutError(t.pricing.stripeError);
      setCheckoutPlan(null);
    }
  }

  // Real inbox coming later; for now the footer shows a placeholder note
  // rather than exposing a personal address. `mailto` stays typed so the
  // switch is a one-line change when CONTACT_EMAIL becomes non-null.
  const mailto: string | null = CONTACT_EMAIL
    ? `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(t.contact.subject)}`
    : null;

  return (
    <div>
      <Nav
        lang={lang}
        signedIn={signedIn}
        avatar={session?.user?.image ?? null}
        userName={session?.user?.name ?? null}
      />

      {/* Hero -------------------------------------------------------------- */}
      <section className="relative overflow-hidden">
        {/* soft decorative blobs so the sides never look empty on wide screens */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -left-40 h-[520px] w-[520px] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #E8EDDE 0%, transparent 70%)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-40 h-[480px] w-[480px] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #DDE7DA 0%, transparent 70%)" }}
        />
        {/* huge b-mark watermark, right side of hero, low opacity — brand
            presence without being loud. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-8 right-[-6%] hidden opacity-[0.045] lg:block"
        >
          <BMark className="h-[560px] w-auto text-forest" strokeWidth={2.4} />
        </div>
        <div className="relative mx-auto grid w-full max-w-7xl gap-6 px-4 pb-12 pt-4 sm:px-8 sm:pt-6 lg:grid-cols-[1.05fr_0.85fr] lg:items-start lg:gap-14 lg:pb-16 lg:pt-6">
          <div className="flex flex-col justify-start">
            <p data-reveal className="reveal text-[13px] font-semibold uppercase tracking-[0.14em] text-forest">
              {t.hero.tagline}
            </p>
            <h1 data-reveal data-d="1" className="reveal mt-4 text-[46px] font-semibold leading-[0.98] tracking-display text-ink sm:text-[68px] xl:text-[84px]">
              {t.hero.line1}
              <br />
              <span className="text-forest">{t.hero.line2}</span>
            </h1>
            <p data-reveal data-d="2" className="reveal mt-5 max-w-[42ch] text-[18px] leading-relaxed text-bark sm:mt-6 sm:text-[19px]">
              {t.hero.sub}
            </p>
            <div data-reveal data-d="3" className="reveal mt-7">
              <Link
                href={signedIn ? "/check" : "/signin"}
                className="btn-primary focus-ring text-[17px]"
              >
                {signedIn ? t.nav.check : t.hero.primaryCta} →
              </Link>
            </div>

            {/* Download row — one row of "Download for X" pills. Visitor's own
                platform is solid forest with a "you" tag, the other two are
                ghost. */}
            <div data-reveal data-d="4" className="reveal mt-8">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-bark">
                download
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {(
                  [
                    { key: "iphone", label: "iPhone" },
                    { key: "android", label: "Android" },
                    { key: "desktop", label: "Desktop" },
                  ] as const
                ).map((tile) => {
                  const isYou = platform === tile.key;
                  return (
                    <Link
                      key={tile.key}
                      href="/access"
                      aria-current={isYou ? "true" : undefined}
                      className={`focus-ring inline-flex items-center gap-2.5 rounded-full px-5 py-3 text-[15px] font-semibold transition hover:-translate-y-0.5 ${
                        isYou
                          ? "border border-forest bg-forest text-canvas shadow-[0_10px_26px_rgba(30,77,43,0.22)] ring-2 ring-forest/15 hover:bg-[#16391f]"
                          : "border border-ink/12 bg-white/70 text-ink shadow-[0_3px_10px_rgba(18,32,26,0.05)] hover:border-ink/25 hover:bg-white"
                      }`}
                    >
                      <PlatformIcon kind={tile.key} size={20} />
                      Download for {tile.label}
                      {isYou && (
                        <span className="ml-1 rounded-full bg-canvas/22 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]">
                          you
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            <p className="mt-6 text-[13px] text-bark">{t.hero.disclaimer}</p>
          </div>

          {/* Animated phone hero — passive vignette that loops through
              claim → checking → verdict without touching the real API. */}
          <div className="mx-auto w-full max-w-[280px] sm:max-w-[340px] lg:-mt-4 lg:max-w-[380px]">
            <ScreenSlot
              src="/screenshots/hero.png"
              alt="Bloomscroll checker with a graded verdict card"
              fallback={<HeroPhoneAnimation />}
              phone
              emphasis
            />
          </div>
        </div>
      </section>

      {/* Trust strip — compact stats band right under the hero so the pitch
          lands before the "how it works" scroll. */}
      <section aria-label="At a glance" className="py-8 sm:py-10">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
          <div
            data-reveal
            className="reveal surface flex flex-col gap-6 rounded-[22px] px-6 py-6 sm:flex-row sm:items-stretch sm:justify-between sm:gap-2 sm:px-8"
          >
            {t.stats.map((s, i) => (
              <div
                key={s.label}
                className={`flex-1 ${i > 0 ? "sm:border-l sm:border-ink/8 sm:pl-6" : ""}`}
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-[30px] font-semibold leading-none tracking-display text-forest sm:text-[36px]">
                    {s.value}
                  </span>
                  {i === 0 && <span className="trust-dot" aria-hidden="true" />}
                </div>
                <p className="mt-2 max-w-[24ch] text-[13px] leading-snug text-bark">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Try-a-demo — pre-filled interactive panel. Client-only mock so
          visitors can see a graded verdict without signing up. */}
      <TryDemo />

      {/* How it works ------------------------------------------------------ */}
      <section
        id="how"
        className="scroll-mt-20 relative overflow-hidden py-20 sm:py-28"
      >
        <div className="brand-watermark -top-10 right-[3%] hidden md:block">
          <BMark className="h-[220px] w-auto" strokeWidth={2.4} />
        </div>
        <div className="brand-watermark -bottom-16 left-[6%] hidden lg:block">
          <BMark className="h-[300px] w-auto" strokeWidth={2.4} />
        </div>
        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-8">
          <div data-reveal className="reveal max-w-[54ch]">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-forest">
              how it works
            </p>
            <h2 className="mt-3 text-[34px] font-semibold leading-[1.02] tracking-display text-ink sm:text-[52px]">
              {t.how.title}
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-ink/90 sm:text-[18px]">{t.how.sub}</p>
          </div>
          <div className="mt-14 flex flex-col gap-16">
            {t.how.steps.map((s, i) => {
              const art =
                i === 0 ? <StepInputArt /> : i === 1 ? <StepScanArt /> : <StepGradedArt />;
              const flip = i % 2 === 1;
              // Later steps sit deeper in the scroll where the body
              // backdrop is already trending toward forest. Bump those
              // paragraphs to near-cream so they stay legible.
              const bodyTint =
                i === 0
                  ? "text-ink/90"
                  : i === 1
                    ? "text-canvas/95"
                    : "text-canvas";
              return (
                <div
                  key={s.title}
                  className={`grid gap-10 lg:grid-cols-2 lg:items-center ${
                    flip ? "lg:[&>div:first-child]:order-2" : ""
                  }`}
                >
                  <div data-reveal className="reveal">
                    <ScreenSlot
                      src={`/screenshots/step-${i + 1}.png`}
                      alt={s.title}
                      fallback={art}
                    />
                  </div>
                  <div data-reveal data-d="1" className="reveal">
                    <p
                      className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${
                        i === 0 ? "text-forest" : "text-canvas/75"
                      }`}
                    >
                      Step 0{i + 1}
                    </p>
                    <h3
                      className={`mt-2 text-[26px] font-semibold leading-tight tracking-display sm:text-[34px] ${
                        i === 0 ? "text-ink" : "text-canvas"
                      }`}
                    >
                      {s.title}
                    </h3>
                    <p className={`mt-4 max-w-[42ch] text-[16.5px] leading-relaxed sm:text-[17px] ${bodyTint}`}>
                      {s.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use cases — transparent so the shared ScrollBackground body tint
          shows through, matching every other section. */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="brand-watermark top-12 -left-16 hidden md:block">
          <BMark className="h-[260px] w-auto" strokeWidth={2.4} />
        </div>
        <div className="brand-watermark -bottom-14 right-[8%] hidden lg:block">
          <BMark className="h-[200px] w-auto" strokeWidth={2.4} />
        </div>
        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-8">
          <div data-reveal className="reveal max-w-[54ch]">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-forest">
              use cases
            </p>
            <h2 className="mt-3 text-[34px] font-semibold leading-[1.02] tracking-display text-ink sm:text-[52px]">
              {t.useCases.title}
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-bark sm:text-[18px]">{t.useCases.sub}</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {t.useCases.items.map((u, i) => {
              const brand = brandKindFor(u.tag);
              return (
                <div
                  key={u.title}
                  data-reveal
                  data-d={String((i % 3) + 1)}
                  className="reveal surface card-lift flex h-full flex-col overflow-hidden"
                >
                  <div className="relative border-b border-ink/6 bg-moss/40">
                    <UseCaseArt kind={u.tag} />
                    {/* branded platform mark, top-right of the mockup area */}
                    <div className="absolute right-3 top-3 rounded-xl bg-canvas/95 p-1.5 shadow-[0_4px_14px_rgba(18,32,26,0.14)]">
                      <BrandIcon kind={brand} size={28} />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-7">
                    <div className="flex items-center gap-2">
                      <BrandIcon kind={brand} size={18} />
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-forest">
                        {u.tag}
                      </p>
                    </div>
                    <h3 className="mt-3 text-[19px] font-semibold leading-snug text-ink">
                      {u.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-bark">{u.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Verdicts — transparent so it joins the shared body scroll tint
          instead of jumping to a hardcoded dark forest. Cards keep their
          surface treatment; watermarks flip to the forest-on-light
          variant. */}
      <section
        id="verdicts"
        className="scroll-mt-20 relative overflow-hidden py-24 sm:py-32"
      >
        <div className="brand-watermark-light -bottom-24 -right-10 sm:-right-24">
          <BMark className="h-[380px] w-auto sm:h-[560px]" strokeWidth={2.4} />
        </div>
        <div className="brand-watermark-light -top-16 -left-10 sm:-left-20">
          <BMark className="h-[300px] w-auto sm:h-[420px]" strokeWidth={2.4} />
        </div>
        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-8">
          <div data-reveal className="reveal max-w-[62ch]">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-canvas/75">
              verdict scale
            </p>
            <h2 className="mt-3 text-[36px] font-semibold leading-[1.02] tracking-display text-canvas sm:text-[56px]">
              {t.verdictsTitle}
            </h2>
            <p className="mt-5 max-w-[52ch] text-[16.5px] leading-relaxed text-canvas/80 sm:text-[17.5px]">
              Every check lands on one of five tiers. Never a bare true or false —
              always the honest picture of how much the literature actually says.
            </p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VERDICT_ORDER.map((verdict, i) => (
              <div
                key={verdict}
                data-reveal
                data-d={String((i % 3) + 1)}
                className="reveal surface card-lift h-full p-6 text-ink"
              >
                <VerdictChip verdict={verdict} label={t.verdictLabels[verdict]} />
                <p className="mt-4 text-[16px] font-semibold leading-snug text-ink">
                  {t.verdictMeanings[verdict]}
                </p>
                <p className="mt-4 text-[14px] leading-relaxed text-bark">
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-forest">
                    {t.verdictExtra.looksLike} ·{" "}
                  </span>
                  {t.verdictDetails[verdict].evidence}
                </p>
                <p className="mt-4 border-t border-ink/8 pt-4 text-[13px] italic leading-relaxed text-bark">
                  {t.verdictExtra.forExample}: {t.verdictDetails[verdict].example}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Access — reference's download-buttons row pattern. Sits deep in
          the scroll where --bg-color is deep forest, so text + buttons
          adopt the on-dark cream palette. */}
      <section id="access" className="scroll-mt-20 relative overflow-hidden py-20 sm:py-28">
        <div className="brand-watermark-light -top-10 -right-14 hidden md:block">
          <BMark className="h-[280px] w-auto" strokeWidth={2.4} />
        </div>
        <div className="brand-watermark-light bottom-4 -left-12 hidden lg:block">
          <BMark className="h-[220px] w-auto" strokeWidth={2.4} />
        </div>
        <div className="relative mx-auto w-full max-w-5xl px-4 text-center sm:px-8">
          <div data-reveal className="reveal">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-canvas/75">
              install
            </p>
            <h2 className="mt-3 text-[34px] font-semibold leading-[1.02] tracking-display text-canvas sm:text-[52px]">
              {t.access.title}
            </h2>
            <p className="mx-auto mt-5 max-w-[58ch] text-[17px] leading-relaxed text-canvas/80 sm:text-[18px]">
              {t.access.sub}
            </p>
          </div>

          {/* The hero already renders the three-platform download picker
              at the top of the page. This section used to duplicate it
              verbatim, which read as a template glitch. Now it's a single
              callout that jumps to the /access guides, personalized to
              the visitor's own platform when we can detect it. */}
          <div data-reveal data-d="1" className="reveal mt-12 flex flex-col items-center justify-center gap-3">
            <Link
              href="/access"
              aria-label="Open the install guides"
              className="download-btn on-dark focus-ring"
            >
              {platform && <PlatformIcon kind={platform} size={22} />}
              <span>
                {platform === "iphone" && "See the iPhone install guide"}
                {platform === "android" && "See the Android install guide"}
                {platform === "desktop" && "See the Chrome install guide"}
                {!platform && "See install guides for every platform"}
              </span>
            </Link>
            <p className="text-[13.5px] text-canvas/70">
              Takes about a minute — iPhone, Android, or Chrome.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing ----------------------------------------------------------- */}
      <section
        id="pricing"
        className="scroll-mt-20 relative overflow-hidden py-20 sm:py-28"
      >
        <div className="brand-watermark-light top-8 right-[4%] hidden md:block">
          <BMark className="h-[260px] w-auto" strokeWidth={2.4} />
        </div>
        <div className="brand-watermark-light -bottom-10 left-[8%] hidden lg:block">
          <BMark className="h-[220px] w-auto" strokeWidth={2.4} />
        </div>
        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-8">
          <div data-reveal className="reveal max-w-[62ch]">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-canvas/75">
              pricing
            </p>
            <h2 className="mt-3 text-[34px] font-semibold leading-[1.02] tracking-display text-canvas sm:text-[52px]">
              {t.pricing.title}
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-canvas/80 sm:text-[18px]">
              {t.pricing.sub}
            </p>
          </div>

          {/* Monthly / Annual toggle — annual is a soft nudge, not a
              default. Free tier ignores it since it's always $0. Toggle
              container brightened so it reads on the deep-forest bg. */}
          <div
            data-reveal
            className="reveal mt-10 flex items-center justify-center"
          >
            <div className="inline-flex items-center gap-1 rounded-full border border-canvas/25 bg-canvas/12 p-1 shadow-[0_4px_14px_rgba(0,0,0,0.15)] backdrop-blur">
              {(["monthly", "annual"] as const).map((k) => {
                const active = billingInterval === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setBillingInterval(k)}
                    aria-pressed={active}
                    className={`focus-ring inline-flex items-center gap-2 rounded-full px-5 py-2 text-[13.5px] font-semibold transition ${
                      active
                        ? "bg-canvas text-forest shadow-[0_4px_14px_rgba(0,0,0,0.22)]"
                        : "text-canvas/80 hover:text-canvas"
                    }`}
                  >
                    {k === "monthly" ? t.pricing.monthly : t.pricing.annual}
                    {k === "annual" && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${
                          active
                            ? "bg-forest/15 text-forest"
                            : "bg-canvas/25 text-canvas"
                        }`}
                      >
                        {t.pricing.saveHint}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {t.pricing.plans.map((p, i) => {
              const slug = PLAN_SLUGS[i];
              const isPaid = slug !== "seed";
              const paidPlan: PlanSlug | null =
                slug === "sprout" || slug === "canopy" ? slug : null;
              const canSubscribe = isPaid && STRIPE_ENABLED && paidPlan !== null;
              const isLoading = checkoutPlan === paidPlan && checkoutPlan !== null;
              const isFeatured = slug === "sprout";
              // Canopy is the only tier with truly unlimited checks — that's
              // the reason to move up from Sprout, so the card carries a
              // distinct "unlimited" chip and emphasizes its first feature.
              const isUnlimited = slug === "canopy";
              const displayPrice =
                billingInterval === "annual" && isPaid
                  ? p.priceAnnual ?? p.price
                  : p.price;
              const displaySuffix = isPaid
                ? billingInterval === "annual"
                  ? t.pricing.perYear
                  : t.pricing.perMonth
                : null;
              return (
                <div
                  key={p.name}
                  data-reveal
                  data-d={String((i % 3) + 1)}
                  className={`reveal card-lift relative flex h-full flex-col rounded-[24px] p-8 ${
                    isFeatured
                      ? "border-2 border-forest bg-canvas shadow-[0_20px_50px_rgba(30,77,43,0.16)] ring-4 ring-forest/10"
                      : isUnlimited
                        ? "border border-forest/40 bg-canvas shadow-[0_14px_36px_rgba(30,77,43,0.10)]"
                        : "surface"
                  }`}
                >
                  {isFeatured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-forest px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-canvas shadow-[0_6px_18px_rgba(30,77,43,0.28)]">
                      {t.pricing.mostPopular}
                    </span>
                  )}
                  {isUnlimited && (
                    <span className="absolute -top-3 right-6 inline-flex items-center gap-1 rounded-full border border-forest/45 bg-canvas px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-forest shadow-[0_4px_12px_rgba(30,77,43,0.14)]">
                      <span aria-hidden="true">∞</span>
                      {t.pricing.unlimited}
                    </span>
                  )}
                  <div className="flex items-baseline justify-between gap-4">
                    <h3
                      className={`text-[26px] font-semibold tracking-display text-ink ${
                        isFeatured ? "text-forest" : ""
                      }`}
                    >
                      {p.name}
                    </h3>
                    <span className="text-right text-[18px] font-semibold text-ink">
                      {displayPrice}
                      {displaySuffix && (
                        <span className="text-[12px] font-medium text-bark">
                          {displaySuffix}
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] uppercase tracking-[0.1em] text-bark">
                    {p.tagline}
                  </p>
                  <ul className="mt-6 flex flex-col gap-3">
                    {p.features.map((f, fi) => {
                      // Canopy's first feature is the "unlimited" line — give
                      // it heavier weight and forest color so the eye lands on
                      // the actual differentiator, not the "everything in
                      // Sprout" carry-over row below it.
                      const emphasize = isUnlimited && fi === 0;
                      return (
                        <li
                          key={f}
                          className={`flex gap-3 text-[15px] leading-relaxed ${
                            emphasize ? "font-semibold text-ink" : "text-bark"
                          }`}
                        >
                          <span
                            className={`font-bold ${
                              isFeatured || emphasize ? "text-forest" : "text-forest/70"
                            }`}
                          >
                            {emphasize ? "∞" : "✓"}
                          </span>
                          {f}
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-auto pt-8">
                    {!isPaid && (
                      <span className="block w-full rounded-full border border-forest/40 bg-moss/70 px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-[0.08em] text-forest">
                        {t.pricing.freeBeta}
                      </span>
                    )}
                    {isPaid && canSubscribe && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => paidPlan && handleSubscribe(paidPlan)}
                        className={
                          isFeatured
                            ? "btn-primary focus-ring w-full"
                            : "focus-ring block w-full rounded-full border border-ink/12 bg-white/70 px-4 py-3 text-center text-[14px] font-semibold text-ink transition hover:-translate-y-0.5 hover:border-ink/25 hover:bg-white"
                        }
                      >
                        {isLoading ? t.pricing.opening : `${t.pricing.get} ${p.name}`}
                      </button>
                    )}
                    {isPaid && !canSubscribe && (
                      <span className="block w-full rounded-full border border-ink/10 bg-white/40 px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-[0.08em] text-bark">
                        {t.pricing.soon}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {checkoutError && (
            <p className="mt-4 text-[13px] text-warn">{checkoutError}</p>
          )}
        </div>
      </section>

      {/* Final CTA — sits deep in the scroll where --bg-color is at the
          forest endpoint. Buttons + text switch to cream so they contrast
          the dark backdrop; watermarks flip to the light variant. */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="brand-watermark-light -bottom-16 -right-14 sm:-right-24">
          <BMark className="h-[340px] w-auto sm:h-[500px]" strokeWidth={2.4} />
        </div>
        <div className="brand-watermark-light -top-10 -left-12">
          <BMark className="h-[240px] w-auto sm:h-[360px]" strokeWidth={2.4} />
        </div>
        <div className="relative mx-auto w-full max-w-4xl px-4 sm:px-8">
          <div data-reveal className="reveal text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-canvas/70">
              ready when you are
            </p>
            <p className="mx-auto mt-4 max-w-[22ch] text-[34px] font-semibold leading-[1.05] tracking-display text-canvas sm:text-[58px]">
              {t.cta.title}
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={signedIn ? "/check" : "/signin"}
                className="focus-ring inline-flex items-center gap-2 rounded-full bg-canvas px-8 py-4 text-[16px] font-semibold text-forest shadow-[0_10px_30px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 hover:bg-white"
              >
                {signedIn ? t.nav.check : t.cta.button} →
              </Link>
              {!signedIn && (
                <Link
                  href="/signin"
                  className="focus-ring inline-flex items-center gap-2 rounded-full border border-canvas/40 px-7 py-[15px] text-[15px] font-semibold text-canvas transition hover:border-canvas/70 hover:bg-canvas/10"
                >
                  log in
                </Link>
              )}
            </div>
            <p className="mt-6 text-[13px] text-canvas/65">
              No credit card. Free tier stays free.
            </p>
          </div>
        </div>
      </section>

      {/* Footer — the scroll tint is at the forest endpoint here, so the
          whole footer switches to a cream palette to stay legible. */}
      <footer className="border-t border-canvas/15 py-14 text-canvas">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
          <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <Wordmark inverted className="text-[20px]" />
              <p className="mt-3 max-w-[38ch] text-[14px] leading-relaxed text-canvas/80">
                {t.hero.line1} {t.hero.line2}
              </p>
              <p className="mt-4 max-w-[46ch] text-[12.5px] leading-relaxed text-canvas/65">
                {t.footer.disclaimer}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-canvas/70">
                {t.footer.product}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <a href="#how" className="focus-ring w-fit text-[14px] font-semibold text-canvas/85 transition hover:text-canvas">
                  {t.nav.how}
                </a>
                <a href="#verdicts" className="focus-ring w-fit text-[14px] font-semibold text-canvas/85 transition hover:text-canvas">
                  {t.nav.verdicts}
                </a>
                <a href="#access" className="focus-ring w-fit text-[14px] font-semibold text-canvas/85 transition hover:text-canvas">
                  {t.nav.getApp}
                </a>
                <a href="#pricing" className="focus-ring w-fit text-[14px] font-semibold text-canvas/85 transition hover:text-canvas">
                  {t.nav.pricing}
                </a>
                <Link href="/access" className="focus-ring w-fit text-[14px] font-semibold text-canvas/85 transition hover:text-canvas">
                  install guides
                </Link>
                <Link href="/privacy" className="focus-ring w-fit text-[14px] font-semibold text-canvas/85 transition hover:text-canvas">
                  privacy
                </Link>
                <Link href="/terms" className="focus-ring w-fit text-[14px] font-semibold text-canvas/85 transition hover:text-canvas">
                  terms of service
                </Link>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-canvas/70">
                {t.footer.about}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {mailto ? (
                  <a
                    href={mailto}
                    className="focus-ring w-fit text-[14px] font-semibold text-canvas/85 transition hover:text-canvas"
                  >
                    {t.footer.contactLink}
                  </a>
                ) : (
                  <span
                    className="w-fit text-[14px] font-semibold text-canvas/70"
                    title="A dedicated support inbox is coming soon."
                  >
                    contact · coming soon
                  </span>
                )}
                {signedIn ? (
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="focus-ring w-fit text-left text-[14px] font-semibold text-canvas/85 transition hover:text-canvas"
                  >
                    {t.signin.signOut}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => signIn("google", { callbackUrl: "/check" })}
                    className="focus-ring w-fit text-left text-[14px] font-semibold text-canvas/85 transition hover:text-canvas"
                  >
                    {t.nav.signIn}
                  </button>
                )}
                <p className="text-[14px] text-canvas/70">{t.footer.tks}</p>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col justify-between gap-2 border-t border-canvas/15 pt-6 sm:flex-row">
            <p className="text-[12.5px] text-canvas/65">
              {session?.user?.email ? `${t.signin.signedInAs} ${session.user.email}` : ""}
            </p>
            <p className="text-[12px] font-medium text-canvas/70">
              © 2026 Bloomscroll. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

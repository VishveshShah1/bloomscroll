"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import Wordmark, { BMark } from "@/components/Wordmark";
import {
  PhoneHeroArt,
  StepInputArt,
  StepScanArt,
  StepGradedArt,
  UseCaseArt,
} from "@/components/PlaceholderArt";
import { STRINGS, useLang, type Lang } from "@/lib/i18n";
import type { Verdict } from "@/lib/types";

const VERDICT_ORDER: Verdict[] = ["supported", "mixed", "weak", "no_evidence", "not_empirical"];

type PlanSlug = "sprout" | "canopy";
const PLAN_SLUGS = ["seed", "sprout", "canopy"] as const;
const STRIPE_ENABLED = process.env.NEXT_PUBLIC_STRIPE_ENABLED === "1";

const CONTACT_EMAIL = "vishvesh380@gmail.com";

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

const VERDICT_TINT: Record<Verdict, { bg: string; text: string; border: string }> = {
  supported: { bg: "#DDE7DA", text: "#204628", border: "#B8CCB8" },
  mixed: { bg: "#EEE7CE", text: "#6B5015", border: "#DCC896" },
  weak: { bg: "#F1E1CE", text: "#7A4E1B", border: "#DCC29A" },
  no_evidence: { bg: "#E8E9E4", text: "#4B554E", border: "#C8CDC4" },
  not_empirical: { bg: "#E4E1EE", text: "#4D4A72", border: "#C6C4DC" },
};

function VerdictChip({ verdict, label }: { verdict: Verdict; label: string }) {
  const v = VERDICT_TINT[verdict];
  return (
    <span
      className="inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.06em]"
      style={{ background: v.bg, color: v.text, borderColor: v.border }}
    >
      {label}
    </span>
  );
}

function PlatformIcon({ kind, size = 22 }: { kind: "android" | "iphone" | "desktop"; size?: number }) {
  const common = {
    width: size,
    height: size,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.7",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (kind === "android") {
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <rect x="6" y="9" width="12" height="10" rx="2" />
        <path d="M9 9 L8 6" />
        <path d="M15 9 L16 6" />
        <path d="M3 12 L3 16" />
        <path d="M21 12 L21 16" />
        <path d="M9 19 L9 22" />
        <path d="M15 19 L15 22" />
      </svg>
    );
  }
  if (kind === "iphone") {
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
        <path d="M10 5 L14 5" />
        <circle cx="12" cy="18.5" r="0.7" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" {...common}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20 L16 20" />
      <path d="M12 16 L12 20" />
    </svg>
  );
}

function Nav({
  lang,
  signedIn,
}: {
  lang: Lang;
  signedIn: boolean;
}) {
  const t = STRINGS[lang];
  const [open, setOpen] = useState(false);
  const links = [
    { href: "#how", label: t.nav.how },
    { href: "#verdicts", label: t.nav.verdicts },
    { href: "#access", label: t.nav.getApp },
    { href: "#pricing", label: t.nav.pricing },
  ];
  return (
    <nav className="sticky top-0 z-40 border-b border-ink/5 bg-canvas/85 backdrop-blur">
      {/* 3-column: logo left, links dead-center, controls right. */}
      <div className="mx-auto grid h-16 w-full max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-8">
        <Link href="/" className="focus-ring rounded-md">
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
          {!signedIn && (
            <Link
              href="/signin"
              className="focus-ring hidden rounded-full border border-ink/12 px-4 py-2 text-[13.5px] font-semibold text-ink transition hover:border-ink/25 hover:bg-white/60 sm:inline-block"
            >
              log in
            </Link>
          )}
          <Link
            href={signedIn ? "/check" : "/signin"}
            className="focus-ring hidden rounded-full bg-forest px-5 py-2.5 text-[13.5px] font-semibold text-canvas shadow-[0_8px_22px_rgba(30,77,43,0.22)] ring-2 ring-forest/15 transition hover:-translate-y-0.5 hover:bg-[#16391f] sm:inline-block"
          >
            {signedIn ? t.nav.check : t.nav.startFree}
          </Link>
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
            <Link
              href={signedIn ? "/check" : "/signin"}
              onClick={() => setOpen(false)}
              className="focus-ring text-[16px] font-semibold text-forest"
            >
              {signedIn ? t.nav.check : t.nav.startFree}
            </Link>
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

export default function LandingPage() {
  const [lang] = useLang();
  const t = STRINGS[lang];
  const { data: session, status: authStatus } = useSession();
  const signedIn = authStatus === "authenticated";
  const platform = usePlatform();
  useRevealOnScroll();

  const [checkoutPlan, setCheckoutPlan] = useState<PlanSlug | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  async function handleSubscribe(plan: PlanSlug) {
    if (checkoutPlan) return;
    setCheckoutPlan(plan);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "checkout failed");
      window.location.href = data.url;
    } catch {
      setCheckoutError(t.pricing.stripeError);
      setCheckoutPlan(null);
    }
  }

  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(t.contact.subject)}`;

  return (
    <div>
      <Nav lang={lang} signedIn={signedIn} />

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
        <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 pb-14 pt-3 sm:px-8 sm:pt-6 lg:grid-cols-[1.05fr_0.85fr] lg:gap-14 lg:pb-20 lg:pt-10">
          <div className="flex flex-col justify-start">
            <p data-reveal className="reveal text-[13px] font-semibold uppercase tracking-[0.14em] text-forest">
              {t.hero.tagline}
            </p>
            <h1 data-reveal data-d="1" className="reveal mt-4 text-[46px] font-semibold leading-[0.98] tracking-display text-ink sm:text-[68px] xl:text-[84px]">
              {t.hero.line1}
              <br />
              <span className="text-forest">{t.hero.line2}</span>
            </h1>
            <p data-reveal data-d="2" className="reveal mt-5 max-w-[52ch] text-[17px] leading-relaxed text-bark sm:mt-6 sm:text-[18px]">
              {t.hero.sub}
            </p>
            <div data-reveal data-d="3" className="reveal mt-7 flex flex-wrap items-center gap-3">
              <Link href={signedIn ? "/check" : "/signin"} className="btn-primary focus-ring">
                {signedIn ? t.nav.check : t.hero.primaryCta} →
              </Link>
              <a href="#how" className="btn-ghost focus-ring">
                {t.hero.secondaryCta}
              </a>
            </div>

            {/* Above-the-fold platform row so all 3 options are visible immediately.
                Chunky pill buttons — the visitor's own platform is solid forest,
                the other two are ghost. */}
            <div data-reveal data-d="4" className="reveal mt-8">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-bark">
                available on
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
                      {tile.label}
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

          {/* Phone-mockup hero visual — sized so the hero doesn't feel dominated
              by the graphic. Tilts a hair on hover. */}
          <div className="mx-auto w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[360px]">
            <ScreenSlot
              src="/screenshots/hero.png"
              alt="Bloomscroll checker with a graded verdict card"
              fallback={<PhoneHeroArt />}
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

      {/* How it works ------------------------------------------------------ */}
      <section
        id="how"
        className="scroll-mt-20 py-20 sm:py-28"
        style={{
          background:
            "linear-gradient(180deg, #F6F3EA 0%, #EEF0E2 12%, #EEF0E2 88%, #F6F3EA 100%)",
        }}
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
          <div data-reveal className="reveal max-w-[54ch]">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-forest">
              how it works
            </p>
            <h2 className="mt-3 text-[34px] font-semibold leading-[1.02] tracking-display text-ink sm:text-[52px]">
              {t.how.title}
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-bark sm:text-[18px]">{t.how.sub}</p>
          </div>
          <div className="mt-14 flex flex-col gap-16">
            {t.how.steps.map((s, i) => {
              const art =
                i === 0 ? <StepInputArt /> : i === 1 ? <StepScanArt /> : <StepGradedArt />;
              const flip = i % 2 === 1;
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
                    <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-forest">
                      Step 0{i + 1}
                    </p>
                    <h3 className="mt-2 text-[26px] font-semibold leading-tight tracking-display text-ink sm:text-[34px]">
                      {s.title}
                    </h3>
                    <p className="mt-4 max-w-[42ch] text-[16.5px] leading-relaxed text-bark sm:text-[17px]">
                      {s.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use cases --------------------------------------------------------- */}
      <section
        className="relative overflow-hidden py-20 sm:py-28"
        style={{
          background:
            "linear-gradient(180deg, #F6F3EA 0%, #E8EDDE 40%, #DDE7DA 100%)",
        }}
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
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
            {t.useCases.items.map((u, i) => (
              <div
                key={u.title}
                data-reveal
                data-d={String((i % 3) + 1)}
                className="reveal surface card-lift flex h-full flex-col overflow-hidden"
              >
                <div className="border-b border-ink/6 bg-moss/40">
                  <UseCaseArt kind={u.tag} />
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-forest">
                    {u.tag}
                  </p>
                  <h3 className="mt-3 text-[19px] font-semibold leading-snug text-ink">
                    {u.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-bark">{u.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verdicts — DARK forest section for real light/dark rhythm on scroll */}
      <section
        id="verdicts"
        className="section-dark scroll-mt-20 relative overflow-hidden py-24 sm:py-32"
      >
        <div className="brand-water -bottom-24 -right-10 sm:-right-24">
          <BMark className="h-[380px] w-auto sm:h-[560px]" strokeWidth={2.4} />
        </div>
        <div className="brand-water -top-16 -left-10 opacity-[0.03] sm:-left-20">
          <BMark className="h-[300px] w-auto sm:h-[420px]" strokeWidth={2.4} />
        </div>
        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-8">
          <div data-reveal className="reveal max-w-[62ch]">
            <p className="eyebrow text-[13px] font-semibold uppercase tracking-[0.14em]">
              verdict scale
            </p>
            <h2 className="heading mt-3 text-[36px] font-semibold leading-[1.02] tracking-display sm:text-[56px]">
              {t.verdictsTitle}
            </h2>
            <p className="mt-5 max-w-[52ch] text-[16.5px] leading-relaxed text-canvas/75 sm:text-[17.5px]">
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
                className="reveal card-lift h-full rounded-[24px] bg-canvas p-6 text-ink shadow-[0_18px_48px_rgba(0,0,0,0.18)]"
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

      {/* Access — reference's download-buttons row pattern ---------------- */}
      <section id="access" className="scroll-mt-20 py-20 sm:py-28">
        <div className="mx-auto w-full max-w-5xl px-4 text-center sm:px-8">
          <div data-reveal className="reveal">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-forest">
              install
            </p>
            <h2 className="mt-3 text-[34px] font-semibold leading-[1.02] tracking-display text-ink sm:text-[52px]">
              {t.access.title}
            </h2>
            <p className="mx-auto mt-5 max-w-[58ch] text-[17px] leading-relaxed text-bark sm:text-[18px]">
              {t.access.sub}
            </p>
          </div>

          <div data-reveal data-d="1" className="reveal mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap">
            {(
              [
                { key: "iphone", label: t.access.iphoneTitle },
                { key: "android", label: t.access.androidTitle },
                { key: "desktop", label: t.access.desktopTitle },
              ] as const
            ).map((tile) => {
              // Once the platform is known, the visitor's own tile stays solid
              // and the other two go ghost. Before that, first tile is solid
              // so the layout doesn't look empty on first paint.
              const isYou = platform === tile.key;
              const isSolid = platform === null ? tile.key === "iphone" : isYou;
              return (
                <Link
                  key={tile.key}
                  href="/access"
                  aria-current={isYou ? "true" : undefined}
                  className={`download-btn focus-ring ${isSolid ? "" : "is-ghost"} ${isYou ? "is-you" : ""}`}
                >
                  <PlatformIcon kind={tile.key} size={22} />
                  <span>Get it on {tile.label}</span>
                  {isYou && <span className="you-tag">you</span>}
                </Link>
              );
            })}
          </div>
          <p className="mt-6 text-[13.5px] text-bark">
            All three take about a minute to set up.{" "}
            <Link href="/access" className="focus-ring font-semibold text-forest underline underline-offset-[3px]">
              Step-by-step guides
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Pricing ----------------------------------------------------------- */}
      <section
        id="pricing"
        className="scroll-mt-20 py-20 sm:py-28"
        style={{
          background:
            "linear-gradient(180deg, #F6F3EA 0%, #EEF0E2 12%, #EEF0E2 88%, #F6F3EA 100%)",
        }}
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
          <div data-reveal className="reveal max-w-[54ch]">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-forest">
              pricing
            </p>
            <h2 className="mt-3 text-[34px] font-semibold leading-[1.02] tracking-display text-ink sm:text-[52px]">
              {t.pricing.title}
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-bark sm:text-[18px]">{t.pricing.sub}</p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {t.pricing.plans.map((p, i) => {
              const slug = PLAN_SLUGS[i];
              const isPaid = slug !== "seed";
              const paidPlan: PlanSlug | null =
                slug === "sprout" || slug === "canopy" ? slug : null;
              const canSubscribe = isPaid && STRIPE_ENABLED && paidPlan !== null;
              const isLoading = checkoutPlan === paidPlan && checkoutPlan !== null;
              return (
                <div
                  key={p.name}
                  data-reveal
                  data-d={String((i % 3) + 1)}
                  className={`reveal surface card-lift flex h-full flex-col p-8 ${
                    i === 1 ? "ring-2 ring-forest/30" : ""
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-[26px] font-semibold tracking-display text-ink">
                      {p.name}
                    </h3>
                    <span className="text-[16px] font-semibold text-ink">
                      {p.price}
                      {isPaid && (
                        <span className="text-[12px] font-medium text-bark">
                          {t.pricing.perMonth}
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] uppercase tracking-[0.1em] text-bark">
                    {p.tagline}
                  </p>
                  <ul className="mt-6 flex flex-col gap-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-3 text-[15px] leading-relaxed text-bark">
                        <span className="font-bold text-forest">✓</span>
                        {f}
                      </li>
                    ))}
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
                        className="btn-primary focus-ring w-full"
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

      {/* Final CTA — dark forest matching the verdicts section, so the page
          bookends the light content with two moments of visual weight. */}
      <section className="section-dark relative overflow-hidden py-20 sm:py-28">
        <div className="brand-water -bottom-16 -right-14 sm:-right-24">
          <BMark className="h-[340px] w-auto sm:h-[500px]" strokeWidth={2.4} />
        </div>
        <div className="brand-water -top-10 -left-12 opacity-[0.03]">
          <BMark className="h-[240px] w-auto sm:h-[360px]" strokeWidth={2.4} />
        </div>
        <div className="relative mx-auto w-full max-w-4xl px-4 sm:px-8">
          <div data-reveal className="reveal text-center">
            <p className="eyebrow text-[12px] font-semibold uppercase tracking-[0.16em]">
              ready when you are
            </p>
            <p className="heading mx-auto mt-4 max-w-[22ch] text-[34px] font-semibold leading-[1.05] tracking-display sm:text-[58px]">
              {t.cta.title}
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={signedIn ? "/check" : "/signin"}
                className="focus-ring inline-flex items-center gap-2 rounded-full bg-canvas px-8 py-4 text-[16px] font-semibold text-forest shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 hover:bg-white"
              >
                {signedIn ? t.nav.check : t.cta.button} →
              </Link>
              {!signedIn && (
                <Link
                  href="/signin"
                  className="focus-ring inline-flex items-center gap-2 rounded-full border border-canvas/25 px-7 py-[15px] text-[15px] font-semibold text-canvas transition hover:border-canvas/45 hover:bg-white/5"
                >
                  log in
                </Link>
              )}
            </div>
            <p className="mt-6 text-[13px] text-canvas/55">
              No credit card. Free tier stays free.
            </p>
          </div>
        </div>
      </section>

      {/* Footer ------------------------------------------------------------ */}
      <footer className="border-t border-ink/8 py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
          <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <Wordmark className="text-[20px]" />
              <p className="mt-3 max-w-[38ch] text-[14px] leading-relaxed text-bark">
                {t.hero.line1} {t.hero.line2}
              </p>
              <p className="mt-4 max-w-[46ch] text-[12.5px] leading-relaxed text-bark">
                {t.footer.disclaimer}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-bark">
                {t.footer.product}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <a href="#how" className="focus-ring w-fit text-[14px] font-semibold text-bark transition hover:text-ink">
                  {t.nav.how}
                </a>
                <a href="#verdicts" className="focus-ring w-fit text-[14px] font-semibold text-bark transition hover:text-ink">
                  {t.nav.verdicts}
                </a>
                <a href="#access" className="focus-ring w-fit text-[14px] font-semibold text-bark transition hover:text-ink">
                  {t.nav.getApp}
                </a>
                <a href="#pricing" className="focus-ring w-fit text-[14px] font-semibold text-bark transition hover:text-ink">
                  {t.nav.pricing}
                </a>
                <Link href="/access" className="focus-ring w-fit text-[14px] font-semibold text-bark transition hover:text-ink">
                  install guides
                </Link>
                <Link href="/privacy" className="focus-ring w-fit text-[14px] font-semibold text-bark transition hover:text-ink">
                  privacy
                </Link>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-bark">
                {t.footer.about}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <a href={mailto} className="focus-ring w-fit text-[14px] font-semibold text-bark transition hover:text-ink">
                  {t.footer.contactLink}
                </a>
                {signedIn ? (
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="focus-ring w-fit text-left text-[14px] font-semibold text-bark transition hover:text-ink"
                  >
                    {t.signin.signOut}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => signIn("google", { callbackUrl: "/check" })}
                    className="focus-ring w-fit text-left text-[14px] font-semibold text-bark transition hover:text-ink"
                  >
                    {t.nav.signIn}
                  </button>
                )}
                <p className="text-[14px] text-bark">{t.footer.tks}</p>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col justify-between gap-2 border-t border-ink/8 pt-6 sm:flex-row">
            <p className="text-[12.5px] text-bark">
              {session?.user?.email ? `${t.signin.signedInAs} ${session.user.email}` : ""}
            </p>
            <p className="text-[11.5px] text-bark">{t.footer.rights}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

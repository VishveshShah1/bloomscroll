"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import { STRINGS, useLang } from "@/lib/i18n";

// Three platform tiles get equal visual weight — Android, iPhone, Desktop.
// The bookmarklet is a small extra card underneath, honest about being the
// "any browser" fallback rather than a promoted path.
export default function AccessPage() {
  const [lang] = useLang();
  const t = STRINGS[lang];
  const bookmarkletRef = useRef<HTMLAnchorElement>(null);
  const [origin, setOrigin] = useState("https://bloomscroll-maharshi-n-vv.vercel.app");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // React blocks javascript: hrefs in JSX (rightly) — the bookmarklet is the
  // one legitimate use, so it's set imperatively.
  useEffect(() => {
    const code = `javascript:(()=>{location.href='${origin}/check?q='+encodeURIComponent(location.href)})()`;
    bookmarkletRef.current?.setAttribute("href", code);
  }, [origin]);

  type PlatformKey = "android" | "iphone" | "desktop";
  const platforms: Array<{
    key: PlatformKey;
    title: string;
    lede: string;
    steps: readonly string[];
    note: string | null;
    /** Primary CTA per platform — deep-links directly to the install
     *  where possible. Empty string when the target isn't published yet
     *  (renders a "coming soon" chip instead). */
    primaryUrl: string;
    primaryLabel: string;
    icon: React.ReactNode;
  }> = [
    {
      key: "android",
      title: t.access.androidTitle,
      lede: t.access.androidLede,
      steps: t.access.androidSteps,
      note: null,
      // Android is just "add to home screen" — no external target needed.
      primaryUrl: "https://bloomscroll.app",
      primaryLabel: "Open bloomscroll.com",
      icon: (
        <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="6" y="9" width="12" height="10" rx="2" />
          <path d="M9 9 L8 6" />
          <path d="M15 9 L16 6" />
          <path d="M3 12 L3 16" />
          <path d="M21 12 L21 16" />
          <path d="M9 19 L9 22" />
          <path d="M15 19 L15 22" />
        </svg>
      ),
    },
    {
      key: "iphone",
      title: t.access.iphoneTitle,
      lede: t.access.iphoneLede,
      steps: t.access.iphoneSteps,
      note: t.access.iphoneNote,
      primaryUrl: t.access.iphoneShortcutUrl,
      primaryLabel: "Add the shortcut",
      icon: (
        <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
          <path d="M10 5 L14 5" />
          <circle cx="12" cy="18.5" r="0.7" fill="currentColor" />
        </svg>
      ),
    },
    {
      key: "desktop",
      title: t.access.desktopTitle,
      lede: t.access.desktopLede,
      steps: t.access.desktopSteps,
      note: null,
      primaryUrl: t.access.extensionUrl,
      primaryLabel: "Get the Chrome extension",
      icon: (
        <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20 L16 20" />
          <path d="M12 16 L12 20" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <nav className="border-b border-ink/5 bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="focus-ring rounded-md">
            <Wordmark className="text-[22px]" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="focus-ring text-[14px] font-semibold text-bark transition hover:text-ink"
            >
              ← {t.access.back}
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative mx-auto w-full max-w-7xl overflow-hidden px-5 pb-24 pt-16 sm:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-40 h-[520px] w-[520px] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #E8EDDE 0%, transparent 70%)" }}
        />
        <p className="relative text-[13px] font-semibold uppercase tracking-[0.14em] text-forest">
          install
        </p>
        <h1 className="relative mt-3 max-w-[24ch] text-[42px] font-semibold leading-[1.02] tracking-display text-ink sm:text-[60px]">
          {t.access.title}
        </h1>
        <p className="relative mt-5 max-w-[62ch] text-[18px] leading-relaxed text-bark">{t.access.sub}</p>

        {/* Three equal tiles */}
        <div className="relative mt-14 grid gap-6 lg:grid-cols-3">
          {platforms.map((p) => {
            const walkthrough = t.access.walkthroughUrls[p.key];
            const primaryReady = Boolean(p.primaryUrl);
            return (
              <div key={p.key} className="surface flex h-full flex-col p-8">
                <div className="text-forest">{p.icon}</div>
                <h2 className="mt-4 text-[22px] font-semibold text-ink">{p.title}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-bark">{p.lede}</p>

                {/* Primary CTA — one big obvious button per platform. When
                    the target URL isn't set yet, renders a coming-soon chip
                    so it's still visually anchored. */}
                <div className="mt-5">
                  {primaryReady ? (
                    <a
                      href={p.primaryUrl}
                      target={p.key === "desktop" || p.key === "iphone" ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="btn-primary focus-ring inline-flex w-full items-center justify-center gap-2 text-[14.5px]"
                    >
                      {p.primaryLabel} →
                    </a>
                  ) : (
                    <span className="block w-full rounded-full border border-ink/12 bg-white/50 px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-[0.08em] text-bark">
                      {p.primaryLabel} · coming soon
                    </span>
                  )}
                </div>

                {/* Optional 30-second walkthrough — hidden until a real
                    YouTube URL is set in i18n.access.walkthroughUrls. */}
                {walkthrough && (
                  <a
                    href={walkthrough}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-forest underline underline-offset-[3px] hover:text-ink"
                  >
                    ▶ {t.access.walkthroughLabel}
                  </a>
                )}

                <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.1em] text-bark">
                  Or step-by-step
                </p>
                <ol className="mt-2 flex flex-col gap-2.5">
                  {p.steps.map((s, i) => (
                    <li key={s} className="flex gap-3 text-[14px] leading-relaxed text-bark">
                      <span className="min-w-[1.4rem] shrink-0 text-[12px] font-semibold text-forest">
                        {i + 1}
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
                {p.note && (
                  <p className="mt-5 border-t border-ink/8 pt-4 text-[12.5px] leading-relaxed text-bark">
                    {p.note}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Bookmarklet — smaller, honest fallback */}
        <div className="surface mt-8 flex flex-col items-start justify-between gap-5 p-7 sm:flex-row sm:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-forest">
              {t.access.bookmarkletTitle}
            </p>
            <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-bark">
              {t.access.bookmarkletLede}
            </p>
          </div>
          <a
            ref={bookmarkletRef}
            draggable
            onClick={(e) => e.preventDefault()}
            className="btn-primary focus-ring shrink-0 cursor-grab"
          >
            {t.access.bookmarklet}
          </a>
        </div>

        <p className="mt-8 max-w-[70ch] rounded-2xl border border-ink/8 bg-white/40 p-5 text-[14px] leading-relaxed text-bark">
          {t.access.igNote}
        </p>
      </main>
    </div>
  );
}

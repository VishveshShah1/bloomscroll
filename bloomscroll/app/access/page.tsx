"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
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
        <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor" aria-hidden="true">
          <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-2.86-1.21-6.08-1.21-8.94 0L5.65 5.67c-.19-.29-.58-.38-.87-.2C4.5 5.65 4.41 6 4.56 6.29L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z" />
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
        <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor" aria-hidden="true">
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
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
            // QR only on mobile tiles — a desktop QR would be scanned by the
            // device it's meant to install on, which makes no sense.
            const showQr = primaryReady && (p.key === "android" || p.key === "iphone");
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

                {showQr && (
                  <div className="mt-5 flex items-center gap-4 rounded-xl border border-ink/8 bg-white/50 p-3">
                    <div className="shrink-0 rounded-lg bg-white p-2 shadow-[0_1px_3px_rgba(18,32,26,0.06)]">
                      <QRCodeSVG
                        value={p.primaryUrl}
                        size={84}
                        bgColor="#ffffff"
                        fgColor="#12201A"
                        level="M"
                        aria-label={`QR code linking to ${p.primaryLabel}`}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-forest">
                        On a laptop?
                      </p>
                      <p className="mt-1 text-[12.5px] leading-snug text-bark">
                        Scan to open the install straight on your phone.
                      </p>
                    </div>
                  </div>
                )}

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
                  Or step by step
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

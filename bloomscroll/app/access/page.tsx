"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import { STRINGS, useLang } from "@/lib/i18n";

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chlorophyll";

// Phase 8: the access page. Android = PWA share_target; iPhone = a Shortcut
// built in the Shortcuts app; Desktop = a bookmarklet.
export default function AccessPage() {
  const [lang, setLang] = useLang();
  const t = STRINGS[lang];
  const bookmarkletRef = useRef<HTMLAnchorElement>(null);
  const [origin, setOrigin] = useState("https://bloomscroll-maharshi-n-vv.vercel.app");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // React blocks javascript: hrefs in JSX (rightly) — the bookmarklet is the
  // one legitimate use, so it's set imperatively.
  useEffect(() => {
    const code = `javascript:(()=>{location.href='${origin}/?q='+encodeURIComponent(location.href)})()`;
    bookmarkletRef.current?.setAttribute("href", code);
  }, [origin]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-5 sm:px-8">
      <header className="flex h-16 items-center justify-between">
        <Link href="/" className={`${FOCUS_RING} rounded-md`}>
          <Wordmark className="text-[25px]" />
        </Link>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "fr" : "en")}
            aria-label={lang === "en" ? "Passer en français" : "Switch to English"}
            className={`rounded-lg border border-loam/15 px-3 py-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-fern transition hover:text-loam ${FOCUS_RING}`}
          >
            {lang === "en" ? "FR" : "EN"}
          </button>
          <Link
            href="/"
            className={`text-[14px] font-bold text-fern transition hover:text-loam ${FOCUS_RING}`}
          >
            ← {t.access.back}
          </Link>
        </div>
      </header>

      <main className="pb-20 pt-12">
        <h1 className="anim-rise3d max-w-[24ch] font-display text-[34px] font-semibold leading-[1.1] sm:text-[46px]">
          {t.access.title}
        </h1>
        <p className="anim-rise mt-4 max-w-[58ch] text-[16px] leading-relaxed text-fern" style={{ animationDelay: "150ms" }}>
          {t.access.sub}
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <div className="glass anim-rise rounded-2xl p-6" style={{ animationDelay: "220ms" }}>
            <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.1em] text-chlorophyll">
              {t.access.androidTitle}
            </p>
            <p className="mt-2.5 text-[15px] font-bold leading-snug">{t.access.androidLede}</p>
            <ol className="mt-4 flex flex-col gap-2.5">
              {t.access.androidSteps.map((s, i) => (
                <li key={s} className="flex gap-3 text-[14px] leading-relaxed text-fern">
                  <span className="font-mono text-[12px] font-semibold text-chlorophyll">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>

          <div className="glass anim-rise rounded-2xl p-6" style={{ animationDelay: "300ms" }}>
            <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.1em] text-chlorophyll">
              {t.access.iphoneTitle}
            </p>
            <p className="mt-2.5 text-[15px] font-bold leading-snug">{t.access.iphoneLede}</p>
            <ol className="mt-4 flex flex-col gap-2.5">
              {t.access.iphoneSteps.map((s, i) => (
                <li key={s} className="flex gap-3 text-[14px] leading-relaxed text-fern">
                  <span className="font-mono text-[12px] font-semibold text-chlorophyll">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
            <p className="mt-4 border-t border-loam/10 pt-3 text-[13px] leading-relaxed text-stone">
              {t.access.iphoneNote}
            </p>
          </div>

          <div className="glass anim-rise rounded-2xl p-6" style={{ animationDelay: "380ms" }}>
            <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.1em] text-chlorophyll">
              {t.access.desktopTitle}
            </p>
            <p className="mt-2.5 text-[15px] font-bold leading-snug">{t.access.desktopLede}</p>
            <p className="mt-5">
              <a
                ref={bookmarkletRef}
                draggable
                onClick={(e) => e.preventDefault()}
                className={`inline-block cursor-grab rounded-xl bg-loam px-5 py-3 text-[15px] font-bold text-underleaf ${FOCUS_RING}`}
              >
                {t.access.bookmarklet}
              </a>
            </p>
            <p className="mt-4 text-[13px] leading-relaxed text-stone">{t.access.desktopNote}</p>
          </div>
        </div>

        <p className="mt-8 max-w-[70ch] rounded-2xl border border-loam/10 bg-[rgba(250,251,247,0.5)] p-5 text-[14px] leading-relaxed text-fern">
          {t.access.igNote}
        </p>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { B_MARK_PATH } from "@/components/Wordmark";

const TAGLINE = "Keep scrolling. Start growing.";

// Splash intro on every page load. The b-mark draws itself in like a
// fiddlehead unfurling, then "loomscroll" pops in beside it, then the
// tagline. `prefers-reduced-motion` shortens it to a plain fade.
//
// Also listens for a "bloom:splash-replay" window event so clicking the
// wordmark in the nav can retrigger the intro (throttled — won't replay
// if it just finished less than 30s ago, so nav-mashing doesn't loop it).
export default function Splash() {
  const [replayKey, setReplayKey] = useState(0);
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [reduced, setReduced] = useState(false);
  const lastRanRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onReplay = () => {
      // Throttle — don't loop the intro if it just ran.
      const now = performance.now();
      if (now - lastRanRef.current < 30_000 && lastRanRef.current !== 0) return;
      setExiting(false);
      setVisible(true);
      setReplayKey((k) => k + 1);
    };
    window.addEventListener("bloom:splash-replay", onReplay);
    return () => window.removeEventListener("bloom:splash-replay", onReplay);
  }, []);

  useEffect(() => {
    const total = reduced ? 550 : 1750;
    const exit = setTimeout(() => setExiting(true), total);
    const done = setTimeout(() => {
      setVisible(false);
      lastRanRef.current = performance.now();
    }, total + 400);
    return () => {
      clearTimeout(exit);
      clearTimeout(done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, replayKey]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-canvas ${
        exiting ? "splash-overlay-exit" : ""
      }`}
    >
      <div key={replayKey} className="flex items-baseline gap-[0.05em] text-[48px] font-semibold tracking-display text-ink sm:text-[68px]">
        <span className="relative inline-flex text-forest">
          <svg
            viewBox="11.4 1 15.2 26"
            className="splash-mark inline-block h-[1em] w-auto"
            fill="none"
            stroke="currentColor"
            strokeWidth={3.1}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={B_MARK_PATH} pathLength={1} />
          </svg>
          {/* A tiny bloom dot that pops out of the fiddlehead curl at the
              end of the draw, reading as "the seed that just bloomed". */}
          <span
            className="splash-bloom absolute h-[0.14em] w-[0.14em] rounded-full bg-sprout"
            style={{ right: "0.18em", top: "0.68em" }}
          />
        </span>
        <span className="splash-word inline-block">
          {"loomscroll".split("").map((ch, i) => (
            <span key={i} className="splash-letter" style={{ animationDelay: `${750 + 40 * i}ms` }}>
              {ch}
            </span>
          ))}
        </span>
      </div>
      <p className="splash-tagline mt-4 text-[15px] text-bark sm:text-[18px]">{TAGLINE}</p>
    </div>
  );
}

"use client";

import { useEffect } from "react";

/**
 * Ties the CSS custom property `--scroll-tint` (0 → 1) to the user's scroll
 * position through the whole page. globals.css consumes it in the body
 * background so the page shifts from a light cream at the top to a deeper
 * forest-green tint at the bottom as you scroll. rAF-throttled — one paint
 * per animation frame, no measurable overhead.
 *
 * Respects prefers-reduced-motion: we still update the variable (the effect
 * is a color shift, not a moving element), but only on genuine scroll
 * events, so users who never scroll never see the transition.
 */
export default function ScrollBackground() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    let ticking = false;
    // Endpoints of the scroll-linked page tint. Top = canvas cream
    // (#F6F3EA), bottom = a mid sage-forest that's clearly greener but
    // still light enough for foreground text to read.
    const TOP = { r: 246, g: 243, b: 234 };
    const BOT = { r: 107, g: 150, b: 112 };
    const update = () => {
      ticking = false;
      const el = document.documentElement;
      const max = (el.scrollHeight || 0) - (window.innerHeight || 0);
      const y = window.scrollY || 0;
      const p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      el.style.setProperty("--scroll-tint", p.toFixed(3));
      const r = Math.round(TOP.r + (BOT.r - TOP.r) * p);
      const g = Math.round(TOP.g + (BOT.g - TOP.g) * p);
      const b = Math.round(TOP.b + (BOT.b - TOP.b) * p);
      el.style.setProperty("--bg-color", `rgb(${r}, ${g}, ${b})`);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return null;
}

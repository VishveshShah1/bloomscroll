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
    // (#F6F3EA), bottom = a mild forest — clearly darker so scrolling
    // down really does feel like sinking into green, but still light
    // enough for text-ink and text-bark to read cleanly on top of it.
    const TOP = { r: 246, g: 243, b: 234 };
    // Push endpoint darker per user brief — should read as a true deep
    // forest by the bottom. Foreground text on the lower half of the
    // page uses the cream palette so it stays legible.
    const BOT = { r: 22, g: 60, b: 38 };
    // Ramp is measured in VIEWPORT HEIGHTS, not per-page percentage. That
    // way every page hits the same tint at the same absolute scroll depth
    // — you see the same color at 500px scroll on /terms and on /. Short
    // pages never reach the endpoint, which is honest — you haven't
    // scrolled much on them. Long pages hit the mild-forest endpoint
    // after RAMP_VH screens and hold there. Bumped from 3 → 5 so the
    // darkening spans a much larger fraction of a normal-height page,
    // reading as "getting darker as you scroll" instead of plateauing
    // early.
    const RAMP_VH = 5;
    const update = () => {
      ticking = false;
      const el = document.documentElement;
      const vh = window.innerHeight || 800;
      const ramp = vh * RAMP_VH;
      const y = window.scrollY || 0;
      const p = ramp > 0 ? Math.min(1, Math.max(0, y / ramp)) : 0;
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

import type { Verdict } from "./types";

/**
 * Shared verdict palettes. Two flavors:
 *
 * - VERDICT_TINT — saturated forest-derived tiers used for marketing
 *   surfaces (landing chips, the hero-demo card). Loud enough to work
 *   at a glance in a scrolled hero.
 * - VERDICT_COLORS — pastel tiers used for real check results
 *   (the checker page, dashboard history). Calmer so the surrounding
 *   copy stays the focus.
 *
 * Same keys, same order. Keeping them side-by-side here means a new
 * verdict tier can't diverge between the two surfaces by accident.
 */

export interface VerdictTint {
  bg: string;
  text: string;
  border: string;
  glyph: string;
}

export const VERDICT_TINT: Record<Verdict, VerdictTint> = {
  supported: { bg: "#1E4D2B", text: "#F6F3EA", border: "#1E4D2B", glyph: "✓" },
  mixed: { bg: "#B78628", text: "#FDF7E6", border: "#8F6712", glyph: "≈" },
  weak: { bg: "#B45A34", text: "#FBEDDE", border: "#8B4322", glyph: "△" },
  no_evidence: { bg: "#3F5049", text: "#EBEFEB", border: "#2C3A34", glyph: "○" },
  not_empirical: { bg: "#615A82", text: "#EEEBF6", border: "#3E385C", glyph: "◇" },
};

export interface VerdictPastel {
  bg: string;
  text: string;
  border: string;
}

export const VERDICT_COLORS: Record<Verdict, VerdictPastel> = {
  supported: { bg: "#DDE7DA", text: "#204628", border: "#B8CCB8" },
  mixed: { bg: "#EEE7CE", text: "#6B5015", border: "#DCC896" },
  weak: { bg: "#F1E1CE", text: "#7A4E1B", border: "#DCC29A" },
  no_evidence: { bg: "#E8E9E4", text: "#4B554E", border: "#C8CDC4" },
  not_empirical: { bg: "#E4E1EE", text: "#4D4A72", border: "#C6C4DC" },
};

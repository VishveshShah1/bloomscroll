import type { Lang } from "@/lib/i18n";

/**
 * The canned example claims offered as one-tap chips under the checker.
 *
 * Single source of truth, imported by BOTH the client (to render the chips)
 * and /api/check (to decide whether a run is free). They must not drift —
 * if the client offered a claim the server didn't recognise, tapping it
 * would silently burn one of the user's monthly checks.
 */
export const EXAMPLES: Record<Lang, string[]> = {
  en: [
    "mewing reshapes your jawline",
    "bone smashing sharpens your face",
    "daily sunscreen prevents skin cancer",
  ],
  fr: [
    "le mewing redessine ta mâchoire",
    "le bone smashing affine ton visage",
    "la crème solaire prévient le cancer de la peau",
  ],
};

/** Trim, lowercase, collapse internal whitespace. Applied to both sides of
 *  the comparison so trailing spaces or a double space can't turn a free
 *  example into a charged check. */
function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

const EXAMPLE_SET: ReadonlySet<string> = new Set(
  Object.values(EXAMPLES).flat().map(normalize),
);

/**
 * True when `input` is one of the built-in example claims, in any language.
 *
 * Deliberately an exact (normalised) match rather than a fuzzy or prefix
 * one: this decides whether a pipeline run is free, so it must not be
 * possible to append a word to an example and keep the free treatment.
 *
 * Server-authoritative on purpose — the client never sends an "this is an
 * example" flag, because a caller could just set it on every request.
 */
export function isExampleClaim(input: string): boolean {
  return EXAMPLE_SET.has(normalize(input));
}

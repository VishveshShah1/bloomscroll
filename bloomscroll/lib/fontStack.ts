/**
 * The one type stack, for contexts that can't use the Tailwind `font-sans`
 * class — i.e. SVG `fontFamily` attributes, which take a raw font list.
 *
 * Keep this in sync with tailwind.config.ts `fontFamily.sans`. Both resolve
 * to San Francisco on Apple and to the self-hosted Source Sans 3 elsewhere
 * (--font-fallback-sans is declared on <html> in app/layout.tsx).
 *
 * This exists because a dozen SVG components had `-apple-system, Inter,
 * sans-serif` inlined, which pinned them to a family the site never loaded
 * and drifted from the real stack the moment it changed.
 */
export const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, var(--font-fallback-sans), Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif";

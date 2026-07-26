/**
 * The b-mark: a stem that rises out of a curl. Reads as a lowercase "b" and
 * completes the wordmark as [b]loomscroll. The curl is the rolled feed; the
 * stem is what grows out of it.
 */
export const B_MARK_PATH =
  "M13.5 3 L13.5 17 C13.5 24.2 22.6 26.1 23.8 20.6 C24.8 16 19.3 13.8 16.9 16.8 C15.3 18.8 16.7 21.4 19 21.1";

export function BMark({
  className = "",
  strokeWidth = 3.1,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="11.4 1 15.2 26"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={B_MARK_PATH} pathLength={1} />
    </svg>
  );
}

export default function Wordmark({
  className = "",
  busy = false,
  inverted = false,
}: {
  className?: string;
  busy?: boolean;
  /** Flip the mark + text to cream — for placement on a dark forest
   *  backdrop (e.g. the footer once the scroll-tint hits the endpoint). */
  inverted?: boolean;
}) {
  const wrap = inverted ? "text-canvas" : "text-ink";
  const mark = inverted ? "text-canvas" : "text-forest";
  return (
    <span className={`inline-flex items-baseline font-semibold tracking-display ${wrap} ${className}`}>
      <span className="sr-only">bloomscroll</span>
      <span aria-hidden="true" className="whitespace-nowrap">
        <BMark
          className={`${busy ? "draw-loop " : ""}draw-once inline-block h-[0.9em] w-auto translate-y-[0.04em] align-baseline ${mark}`}
        />
        <span>loomscroll</span>
      </span>
    </span>
  );
}

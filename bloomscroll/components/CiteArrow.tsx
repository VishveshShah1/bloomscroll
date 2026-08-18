/**
 * The external-link tick used on citation rows.
 *
 * Same two-stroke mark as the citation rows in step 04 of the landing page's
 * pipeline diagram (`PipelineArt.tsx` -> `PipeGradeArt`), redrawn on a 16x16
 * grid so it can sit in normal flow instead of that diagram's SVG coordinate
 * space. Shared by the real checker and the landing demo so the two can't
 * drift apart.
 *
 * `currentColor`, so the caller sets the colour with a text-* class.
 */
export default function CiteArrow({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* arrowhead: the top-right corner bracket */}
      <path
        d="M6 4 L12 4 L12 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* the diagonal running back down-left out of that corner */}
      <path
        d="M12 4 L4 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Per-stage model routing for the check pipeline.
//
// The two AI stages have genuinely different requirements, so they no longer
// share one model:
//
//   EXTRACT — pull the checkable sentences out of the input and translate the
//             slang into clinical search terms. Structured, bounded, and
//             graded against a strict JSON shape we re-prompt on. A small fast
//             model does this as well as a large one, and it runs on the full
//             input text, which is the token-heavy half of a check.
//
//   GRADE   — read real abstracts and decide how strong the evidence actually
//             is. This is the judgment the whole product rests on, and it's
//             also where a weaker model would quietly start over-claiming
//             "supported". It stays on the stronger model.
//
// Extraction was previously on the grading model, which is where most of the
// per-check cost was going for no accuracy gain.
//
// Both are overridable per stage. There is deliberately no single knob that
// sets both: the old BLOOMSCROLL_MODEL did exactly that, and leaving it in
// place would mean one stale env var in a dashboard silently collapsing the
// split back into the expensive configuration.

/** Claim extraction. Small + fast; runs on the full input text. */
export const EXTRACT_MODEL =
  process.env.BLOOMSCROLL_EXTRACT_MODEL ?? "claude-haiku-4-5";

/** Evidence grading. Stronger model — this is the verdict, don't cheapen it. */
export const GRADE_MODEL =
  process.env.BLOOMSCROLL_GRADE_MODEL ?? "claude-sonnet-4-6";

// One-time nudge if the retired single-model override is still set somewhere.
// Silence here would look like the split was applied when it wasn't.
if (process.env.BLOOMSCROLL_MODEL) {
  console.warn(
    `[models] BLOOMSCROLL_MODEL is set ("${process.env.BLOOMSCROLL_MODEL}") but is no longer read. ` +
      `Extraction and grading are routed separately now — use BLOOMSCROLL_EXTRACT_MODEL / ` +
      `BLOOMSCROLL_GRADE_MODEL, and delete BLOOMSCROLL_MODEL. ` +
      `Currently: extract=${EXTRACT_MODEL}, grade=${GRADE_MODEL}.`,
  );
}

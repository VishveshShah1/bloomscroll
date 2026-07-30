import { resolveContent } from "./resolve";
import { extractClaims, MissingKeyError } from "./extract";
import { searchLiterature } from "./literature";
import { gradeClaim } from "./grade";
import { checkSafety } from "./safety";
import { cacheKey, getCached, setCached } from "./cache";
import { SpendCapExceededError, type SpendContext } from "./spend";
import type { Lang } from "./i18n";
import type { CheckResponse, ClaimResult } from "./types";

// Phase 5: the pipeline. resolve → extract → search → grade, streamed as stage
// events so the UI can show live progress (reading → found N → searching →
// weighing). Claims are searched and graded in parallel. Results are cached by
// a hash of the input so repeat checks (and demo re-runs) are instant.

export type PipelineEvent =
  | { stage: "reading" }
  | { stage: "claims"; n: number }
  | { stage: "searching" }
  | { stage: "grading" }
  | { stage: "done"; payload: CheckResponse };

// Until ANTHROPIC_API_KEY exists, extraction throws MissingKeyError and we
// stream these labeled samples instead. Citations are marked as sample data —
// no invented papers, ever.
const MOCK_CLAIMS: Omit<ClaimResult, "safety" | "papers">[] = [
  {
    claim: "Mewing permanently reshapes the adult jawline.",
    category: "biomedical",
    verdict: "weak",
    summary:
      "Placeholder summary. Once the live grader is switched on, this names the actual evidence type found — e.g. small observational studies on tongue posture, with no controlled trials in adults.",
    citations: [
      {
        title: "Sample citation — real Europe PMC results arrive once the API key is set",
        journal: "Sample data",
        year: 2026,
        url: "https://europepmc.org",
      },
    ],
  },
  {
    claim: "Daily sunscreen use reduces long-term skin cancer risk.",
    category: "biomedical",
    verdict: "supported",
    summary:
      "Placeholder summary for a well-supported claim, so both ends of the verdict scale render end-to-end before the live grader exists.",
    citations: [
      {
        title: "Sample citation — real Europe PMC results arrive once the API key is set",
        journal: "Sample data",
        year: 2026,
        url: "https://europepmc.org",
      },
    ],
  },
];

export async function* runPipeline(
  input: string,
  lang: Lang,
  spendCtx: SpendContext,
): AsyncGenerator<PipelineEvent> {
  const key = cacheKey(input, lang);
  const cached = getCached(key);
  if (cached) {
    yield { stage: "done", payload: cached };
    return;
  }

  yield { stage: "reading" };
  const resolved = await resolveContent(input);
  if (!resolved.ok) {
    // Resolve failures aren't cached — the source might come back next time.
    yield {
      stage: "done",
      payload: {
        resolveError: {
          code: resolved.code,
          source: resolved.source,
          message: resolved.message,
        },
      },
    };
    return;
  }

  // Phase 7 safety override: applied to the resolved content up front,
  // regardless of what retrieval later finds.
  const inputWarning = checkSafety(resolved.text, lang) ?? undefined;
  const source = {
    type: resolved.source,
    title: resolved.title,
    chars: resolved.text.length,
  };

  let extracted;
  try {
    extracted = await extractClaims(resolved.text, spendCtx);
  } catch (err) {
    // Missing key → labeled sample. Free-tier monthly cap → labeled sample
    // (paid users never take this path — ensureCanSpend won't throw for them).
    // Any other Anthropic failure (out of credit, rate limit, network) also
    // drops to sample rather than nuking the UI — console.error preserves the
    // real stack for debugging.
    if (err instanceof SpendCapExceededError) {
      console.warn("[pipeline] free-tier spend cap tripped during extract, falling back to sample");
    } else if (!(err instanceof MissingKeyError)) {
      console.error("[pipeline] extractClaims failed, falling back to sample:", err);
    }
    const claims: ClaimResult[] = MOCK_CLAIMS.map((c) => ({
      ...c,
      papers: [],
      safety: checkSafety(c.claim, lang) ?? undefined,
    }));
    yield { stage: "done", payload: { mock: true, source, claims, inputWarning } };
    return; // never cache the mock
  }

  yield { stage: "claims", n: extracted.length };
  if (extracted.length === 0) {
    const payload: CheckResponse = { source, claims: [], inputWarning };
    setCached(key, payload);
    yield { stage: "done", payload };
    return;
  }

  yield { stage: "searching" };
  const paperSets = await Promise.all(
    extracted.map((c) => searchLiterature(c.search_terms).catch(() => [])),
  );

  yield { stage: "grading" };
  let graded;
  try {
    graded = await Promise.all(
      extracted.map((c, i) => gradeClaim(c.claim, paperSets[i], spendCtx)),
    );
  } catch (err) {
    // Same graceful-degradation contract as extract: if the free-tier monthly
    // spend cap trips mid-run (or any other Anthropic failure hits), serve
    // labeled sample data instead of exploding the response. Paid callers
    // will never see SpendCapExceededError here — ensureCanSpend only throws
    // for the free bucket.
    if (err instanceof SpendCapExceededError) {
      console.warn("[pipeline] free-tier spend cap tripped during grading, falling back to sample");
    } else {
      console.error("[pipeline] gradeClaim failed, falling back to sample:", err);
    }
    const claims: ClaimResult[] = MOCK_CLAIMS.map((c) => ({
      ...c,
      papers: [],
      safety: checkSafety(c.claim, lang) ?? undefined,
    }));
    yield { stage: "done", payload: { mock: true, source, claims, inputWarning } };
    return;
  }

  const claims: ClaimResult[] = extracted.map((c, i) => ({
    claim: c.claim,
    category: c.category,
    verdict: graded[i].verdict,
    summary: graded[i].summary,
    citations: graded[i].citations,
    papers: paperSets[i],
    safety: checkSafety(c.claim, lang) ?? undefined,
  }));

  const payload: CheckResponse = { source, claims, inputWarning };
  setCached(key, payload);
  yield { stage: "done", payload };
}

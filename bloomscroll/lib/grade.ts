// Server-only: this module reads ANTHROPIC_API_KEY and imports the Anthropic
// SDK. Same rationale as lib/extract.ts — trip loudly if bundled for browser.
if (typeof window !== "undefined") {
  throw new Error("lib/grade.ts is server-only and must not run in the browser");
}

import Anthropic from "@anthropic-ai/sdk";
import { MissingKeyError } from "./extract";
import { chargeSpend, ensureCanSpend, type SpendContext } from "./spend";
import { GRADE_MODEL } from "./models";
import type { Citation, Paper, Verdict } from "./types";

// Phase 4: evidence grading + the anti-hallucination citation gate.
//
// The gate (validateCitations) is the single most important guarantee in this
// product: the grader may only cite papers from the numbered list we handed it,
// and BEFORE anything renders we drop every citation index that isn't in the
// retrieved set. A fabricated citation cannot reach the screen — a judge who
// clicks a fake link ends the demo. The gate is a pure function so it can be
// (and is) tested without any API key.

// Deliberately the stronger of the two pipeline models — see lib/models.ts.
const MODEL = GRADE_MODEL;

const VERDICTS: Verdict[] = ["supported", "mixed", "weak", "no_evidence", "not_empirical"];

export interface GradedClaim {
  verdict: Verdict;
  summary: string;
  citations: Citation[];
}

interface GraderOutput {
  verdict: Verdict;
  summary: string;
  citation_ids: number[];
}

/**
 * THE GATE. Given the grader's chosen 1-based indices and the exact papers we
 * retrieved, return only the citations that genuinely exist in that set.
 * Anything out of range, duplicated, or non-numeric is silently dropped.
 */
export function validateCitations(citationIds: unknown, papers: Paper[]): Citation[] {
  if (!Array.isArray(citationIds)) return [];
  const seen = new Set<number>();
  const out: Citation[] = [];
  for (const raw of citationIds) {
    const idx = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isInteger(idx)) continue;
    if (idx < 1 || idx > papers.length) continue; // out of the retrieved set — reject
    if (seen.has(idx)) continue;
    seen.add(idx);
    const p = papers[idx - 1];
    out.push({
      title: p.title,
      journal: p.journal,
      year: p.year ?? 0,
      url: p.url, // the URL comes from OUR retrieval, never from the model
    });
  }
  return out;
}

function buildSystem(): string {
  return `You grade whether a claim is supported by the scientific papers provided.

You are given a claim and a NUMBERED list of real paper abstracts that were retrieved from Europe PMC.

Return strict JSON only (no markdown fences, no commentary):
{"verdict": "...", "summary": "...", "citation_ids": [1, 2]}

verdict is exactly one of:
- "supported": multiple decent studies point the same way.
- "mixed": real studies exist and they disagree.
- "weak": something exists but it's thin (tiny samples, animal studies, no controls).
- "no_evidence": the papers don't actually address the claim, or the list is empty.
- "not_empirical": the claim is an opinion/aesthetic judgment, not testable.

summary: 2-3 SHORT sentences. Just enough to prove the point — no filler, no hedging paragraphs. Name the ACTUAL evidence type in one phrase ("randomized trials", "small observational studies", "one mouse study") and, if it's short, note the biggest limitation. Aim for ~50 words total. Write for a curious teenager, not a journal.

citation_ids: ONLY integers from the numbered list above. You may NEVER invent a title, author, journal, or ID that is not in the provided list. If the pool is empty or the papers don't actually address the claim, use []. Otherwise cite 4-8 of the most relevant papers so the reader sees a real body of evidence — not just one or two.`;
}

function papersBlock(papers: Paper[]): string {
  if (papers.length === 0) return "(no papers were retrieved for this claim)";
  return papers
    .map((p, i) => `[${i + 1}] ${p.title} (${p.journal}, ${p.year ?? "n.d."})\n${p.abstract}`)
    .join("\n\n");
}

function parseGraderJson(raw: string): GraderOutput | null {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(s.slice(start, end + 1)) as Record<string, unknown>;
    const verdict = VERDICTS.includes(parsed.verdict as Verdict)
      ? (parsed.verdict as Verdict)
      : "no_evidence";
    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    const citation_ids = Array.isArray(parsed.citation_ids)
      ? (parsed.citation_ids as number[])
      : [];
    if (!summary) return null;
    return { verdict, summary, citation_ids };
  } catch {
    return null;
  }
}

export async function gradeClaim(
  claim: string,
  papers: Paper[],
  spendCtx: SpendContext,
): Promise<GradedClaim> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new MissingKeyError("ANTHROPIC_API_KEY is not configured");
  }
  // No papers at all → don't even ask the model; it's a clean "no evidence".
  if (papers.length === 0) {
    return {
      verdict: "no_evidence",
      summary:
        "We searched the biomedical literature and found no papers that directly address this claim.",
      citations: [],
    };
  }

  const client = new Anthropic();
  const userContent = `CLAIM: ${claim}\n\nPAPERS:\n${papersBlock(papers)}`;
  let output: GraderOutput | null = null;

  for (let attempt = 0; attempt < 2 && !output; attempt++) {
    await ensureCanSpend(spendCtx);
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: buildSystem(),
      messages: [{ role: "user", content: userContent }],
    });
    await chargeSpend(res.usage, MODEL, spendCtx);
    const raw = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    output = parseGraderJson(raw);
  }

  if (!output) {
    return {
      verdict: "no_evidence",
      summary: "We couldn't reliably weigh the evidence for this claim. Treat it as unverified.",
      citations: [],
    };
  }

  // THE GATE runs here, before this ever becomes a rendered result.
  return {
    verdict: output.verdict,
    summary: output.summary,
    citations: validateCitations(output.citation_ids, papers),
  };
}

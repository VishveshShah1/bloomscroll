// Server-only: this module reads ANTHROPIC_API_KEY and imports the Anthropic
// SDK. It must never be bundled for the browser. The key has no NEXT_PUBLIC_
// prefix so Next.js won't inline it, but this guard trips loudly if the graph
// ever accidentally reaches a client component.
if (typeof window !== "undefined") {
  throw new Error("lib/extract.ts is server-only and must not run in the browser");
}

import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedClaim } from "./types";
import { chargeSpend, ensureCanSpend, type SpendContext } from "./spend";
import { EXTRACT_MODEL } from "./models";

// Phase 2: claim extraction via the Anthropic API. Written and ready — the
// route activates it once ANTHROPIC_API_KEY exists in the environment.
// Model routing (and why extraction is on the cheaper one) lives in
// lib/models.ts.

export class MissingKeyError extends Error {}

const MODEL = EXTRACT_MODEL;

const SYSTEM = `You extract checkable factual claims from social media content so they can be verified against scientific literature.

Rules:
- Extract up to 3 claims, prioritizing health, body, and appearance claims.
- Each claim: one plain, self-contained sentence stating what the content asserts.
- "category" is one of: "biomedical" (health, body, medicine), "general_scientific" (testable but not biomedical), "not_empirical" (opinion, aesthetic judgment, or untestable).
- "search_terms": 2-4 proper clinical/scientific search terms for literature databases. Translate slang into real terminology, e.g. "mewing" -> "tongue posture", "orofacial myofunctional therapy"; "bone smashing" -> "bone remodeling", "mechanical loading", "Wolff's law". For not_empirical claims, still give the nearest relevant terms.
- If the content has nothing checkable, return [].

Respond with ONLY a JSON array, no markdown fences, no commentary:
[{"claim": "...", "category": "biomedical", "search_terms": ["...", "..."]}]`;

const CATEGORIES = ["biomedical", "general_scientific", "not_empirical"] as const;

function parseClaimsJson(raw: string): ExtractedClaim[] | null {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();
  const start = s.indexOf("[");
  const end = s.lastIndexOf("]");
  if (start === -1 || end <= start) return null;
  try {
    const parsed: unknown = JSON.parse(s.slice(start, end + 1));
    if (!Array.isArray(parsed)) return null;
    const valid: ExtractedClaim[] = [];
    for (const row of parsed as Record<string, unknown>[]) {
      if (typeof row?.claim !== "string" || !row.claim.trim()) continue;
      const category = CATEGORIES.includes(row.category as (typeof CATEGORIES)[number])
        ? (row.category as ExtractedClaim["category"])
        : "general_scientific";
      const terms = Array.isArray(row.search_terms)
        ? row.search_terms
            .filter((t): t is string => typeof t === "string" && !!t.trim())
            .map((t) => t.trim())
            .slice(0, 4)
        : [];
      valid.push({ claim: row.claim.trim(), category, search_terms: terms });
      if (valid.length === 3) break;
    }
    return valid;
  } catch {
    return null;
  }
}

export async function extractClaims(
  text: string,
  spendCtx: SpendContext,
): Promise<ExtractedClaim[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new MissingKeyError("ANTHROPIC_API_KEY is not configured");
  }
  const client = new Anthropic();
  const input = text.slice(0, 9000);
  let lastRaw = "";

  for (let attempt = 0; attempt < 2; attempt++) {
    const messages: Anthropic.MessageParam[] =
      attempt === 0
        ? [{ role: "user", content: input }]
        : [
            { role: "user", content: input },
            { role: "assistant", content: lastRaw.slice(0, 2000) || "(empty)" },
            {
              role: "user",
              content:
                "That was not valid JSON. Respond again with ONLY the JSON array, nothing else.",
            },
          ];

    await ensureCanSpend(spendCtx);
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM,
      messages,
    });
    await chargeSpend(res.usage, MODEL, spendCtx);

    lastRaw = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const parsed = parseClaimsJson(lastRaw);
    if (parsed) return parsed;
  }
  throw new Error("Claim extraction returned malformed JSON twice");
}

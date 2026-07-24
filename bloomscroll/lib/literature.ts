import type { Paper } from "./types";

// Phase 3: Europe PMC literature retrieval. No API key required.
// Empty array = "the literature has nothing" — a meaningful result, not a failure.
// Network failure (after both query variants fail) throws, so the pipeline can
// distinguish "no evidence" from "couldn't search".

const PMC_ENDPOINT = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";

interface EuropePmcResult {
  id?: string;
  source?: string;
  pmid?: string;
  doi?: string;
  title?: string;
  abstractText?: string;
  pubYear?: string;
  journalInfo?: { journal?: { title?: string } };
  pubTypeList?: { pubType?: string[] };
}

function quoted(term: string): string {
  return `"${term.replace(/"/g, "")}"`;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function runQuery(query: string, pageSize: number): Promise<EuropePmcResult[]> {
  const params = new URLSearchParams({
    query,
    format: "json",
    pageSize: String(pageSize),
    resultType: "core",
  });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(`${PMC_ENDPOINT}?${params}`, {
      cache: "no-store",
      signal: ctrl.signal,
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Europe PMC HTTP ${res.status}`);
    const data = (await res.json()) as { resultList?: { result?: EuropePmcResult[] } };
    return data.resultList?.result ?? [];
  } finally {
    clearTimeout(timer);
  }
}

export async function searchLiterature(searchTerms: string[]): Promise<Paper[]> {
  const terms = searchTerms.map((t) => t.trim()).filter(Boolean).slice(0, 4);
  if (terms.length === 0) return [];

  // Two variants per claim: precise (all terms) and broad (any term).
  const precise = `(${terms.map(quoted).join(" AND ")}) AND HAS_ABSTRACT:Y`;
  const broad = `(${terms.map(quoted).join(" OR ")}) AND HAS_ABSTRACT:Y`;

  const settled = await Promise.allSettled([runQuery(precise, 8), runQuery(broad, 8)]);
  const fulfilled = settled.filter(
    (s): s is PromiseFulfilledResult<EuropePmcResult[]> => s.status === "fulfilled",
  );
  if (fulfilled.length === 0) {
    throw new Error("Europe PMC unreachable");
  }

  // Merge precise-first, dedupe by id, keep only results with real abstracts.
  const seen = new Set<string>();
  const papers: Paper[] = [];
  for (const result of fulfilled.flatMap((s) => s.value)) {
    const id = result.id ?? result.pmid ?? result.doi;
    if (!id || seen.has(id)) continue;
    seen.add(id);

    const abstract = stripTags(result.abstractText ?? "");
    if (abstract.length < 80) continue;

    papers.push({
      id: String(id),
      title: stripTags(result.title ?? "Untitled"),
      abstract: abstract.slice(0, 2400),
      year: Number(result.pubYear) || undefined,
      journal: result.journalInfo?.journal?.title ?? "Unknown journal",
      url:
        result.source && result.id
          ? `https://europepmc.org/article/${result.source}/${result.id}`
          : result.doi
            ? `https://doi.org/${result.doi}`
            : `https://europepmc.org/search?query=${encodeURIComponent(String(id))}`,
      pubType: result.pubTypeList?.pubType?.join(", "),
    });
    if (papers.length >= 10) break;
  }
  return papers;
}

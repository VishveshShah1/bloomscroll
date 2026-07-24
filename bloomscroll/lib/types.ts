export type Verdict =
  | "supported"
  | "mixed"
  | "weak"
  | "no_evidence"
  | "not_empirical";

export type SourceType = "youtube" | "tiktok" | "reddit" | "article" | "pasted";

export interface Citation {
  title: string;
  journal: string;
  year: number;
  url: string;
}

export interface SafetyNote {
  label: string;
  message: string;
}

export interface ClaimResult {
  claim: string;
  category: "biomedical" | "general_scientific" | "not_empirical";
  verdict: Verdict;
  summary: string;
  citations: Citation[];
  safety?: SafetyNote;
}

export interface Paper {
  id: string;
  title: string;
  abstract: string;
  year?: number;
  journal: string;
  url: string;
  pubType?: string;
}

export interface ExtractedClaim {
  claim: string;
  category: "biomedical" | "general_scientific" | "not_empirical";
  search_terms: string[];
}

export type ResolveErrorCode =
  | "empty_input"
  | "no_captions"
  | "unavailable"
  | "extract_failed";

export interface ResolveError {
  code: ResolveErrorCode;
  source: SourceType | "unknown";
  message: string;
}

export interface CheckResponse {
  mock?: boolean;
  source?: { type: SourceType; title?: string; chars?: number };
  claims?: ClaimResult[];
  resolveError?: ResolveError;
  inputWarning?: SafetyNote;
}

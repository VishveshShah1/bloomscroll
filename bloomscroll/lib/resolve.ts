import type { ResolveError, SourceType } from "./types";

export type ResolveResult =
  | { ok: true; text: string; title?: string; source: SourceType }
  | ({ ok: false } & ResolveError);

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const MAX_TEXT = 12000;

function fail(
  source: ResolveError["source"],
  code: ResolveError["code"],
  message: string,
): ResolveResult {
  return { ok: false, source, code, message };
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  ms = 8000,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      ...init,
      signal: ctrl.signal,
      cache: "no-store",
      headers: { "user-agent": UA, ...(init.headers ?? {}) },
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Treat input as a URL only when it's a single spaceless token that parses. */
function parseAsUrl(input: string): URL | null {
  if (/\s/.test(input)) return null;
  const candidate = /^https?:\/\//i.test(input)
    ? input
    : /^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#]|$)/i.test(input)
      ? `https://${input}`
      : null;
  if (!candidate) return null;
  try {
    return new URL(candidate);
  } catch {
    return null;
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function collapse(s: string): string {
  return s.replace(/[ \t ]+/g, " ").replace(/\s*\n\s*(\s*\n\s*)+/g, "\n\n").trim();
}

/* ---------------------------------- YouTube --------------------------------- */

function youTubeVideoId(url: URL): string | null {
  const host = url.hostname.replace(/^(www|m|music)\./, "");
  if (host === "youtu.be") return url.pathname.slice(1).split("/")[0] || null;
  if (url.pathname.startsWith("/watch")) return url.searchParams.get("v");
  const m = url.pathname.match(/^\/(shorts|live|embed)\/([\w-]{6,})/);
  return m ? m[2] : null;
}

/** Extract the balanced JSON array that follows `"captionTracks":` in page HTML. */
function extractCaptionTracksJson(html: string): string | null {
  const key = '"captionTracks":';
  const at = html.indexOf(key);
  if (at === -1) return null;
  const start = html.indexOf("[", at + key.length);
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  return null;
}

type CaptionTrack = { baseUrl?: string; languageCode?: string; kind?: string };

function pickCaptionTrack(tracks: CaptionTrack[] | undefined): CaptionTrack | undefined {
  if (!tracks?.length) return undefined;
  return (
    tracks.find((t) => t.languageCode?.startsWith("en") && t.kind !== "asr") ??
    tracks.find((t) => t.languageCode?.startsWith("en")) ??
    tracks[0]
  );
}

/** Fetch a caption track and return plain text; handles json3 and XML formats. */
async function fetchCaptionText(rawBaseUrl: string): Promise<string | null> {
  const base = rawBaseUrl.replace(/\\u0026/g, "&");
  const sep = base.includes("?") ? "&" : "?";
  const res = await fetchWithTimeout(`${base}${sep}fmt=json3`);
  if (res.ok) {
    const raw = await res.text();
    try {
      const cap = JSON.parse(raw) as { events?: { segs?: { utf8?: string }[] }[] };
      const text = collapse(
        (cap.events ?? [])
          .flatMap((e) => e.segs ?? [])
          .map((s) => s.utf8 ?? "")
          .join(" "),
      );
      if (text) return text;
    } catch {
      // some clients get XML back regardless of fmt — strip tags instead
      const text = collapse(decodeEntities(raw.replace(/<[^>]+>/g, " ")));
      if (text) return text;
    }
  }
  const xmlRes = await fetchWithTimeout(base);
  if (xmlRes.ok) {
    const xml = await xmlRes.text();
    const text = collapse(decodeEntities(xml.replace(/<[^>]+>/g, " ")));
    if (text) return text;
  }
  return null;
}

/** Primary path: YouTube's own innertube player API (no key needed). */
async function resolveYouTubeViaPlayerApi(id: string): Promise<ResolveResult | null> {
  const res = await fetchWithTimeout("https://www.youtube.com/youtubei/v1/player", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      context: { client: { clientName: "ANDROID", clientVersion: "20.10.38", hl: "en" } },
      videoId: id,
    }),
  });
  if (!res.ok) return null;
  let j: {
    playabilityStatus?: { status?: string };
    videoDetails?: { title?: string };
    captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: CaptionTrack[] } };
  };
  try {
    j = await res.json();
  } catch {
    return null;
  }
  const status = j.playabilityStatus?.status;
  if (status && status !== "OK") {
    return fail(
      "youtube",
      "unavailable",
      "YouTube wouldn't let us load that video — it may be private, removed, or age-gated. Paste what it says instead.",
    );
  }
  const title = j.videoDetails?.title;
  const pick = pickCaptionTrack(j.captions?.playerCaptionsTracklistRenderer?.captionTracks);
  if (pick?.baseUrl) {
    const text = await fetchCaptionText(pick.baseUrl);
    if (text) return { ok: true, text: text.slice(0, MAX_TEXT), title, source: "youtube" };
  }
  return fail(
    "youtube",
    "no_captions",
    "This video has no captions we can read, so there's nothing to check yet — paste what it claims instead.",
  );
}

async function resolveYouTube(url: URL): Promise<ResolveResult> {
  const id = youTubeVideoId(url);
  if (!id) {
    return fail("youtube", "unavailable", "That YouTube link doesn't point to a video we can open.");
  }
  try {
    const viaApi = await resolveYouTubeViaPlayerApi(id);
    if (viaApi) return viaApi;
  } catch {
    // fall through to scraping the watch page
  }
  const page = await fetchWithTimeout(`https://www.youtube.com/watch?v=${id}&hl=en`);
  if (!page.ok) {
    return fail(
      "youtube",
      "unavailable",
      "YouTube wouldn't let us load that video — it may be private, removed, or age-gated. Paste what it says instead.",
    );
  }
  const html = await page.text();
  const rawTitle =
    html.match(/<meta name="title" content="([^"]*)"/)?.[1] ??
    decodeEntities(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "").replace(/ - YouTube$/, "");
  const title = rawTitle || undefined;

  const tracksJson = extractCaptionTracksJson(html);
  if (!tracksJson) {
    return fail(
      "youtube",
      "no_captions",
      "This video has no captions we can read, so there's nothing to check yet — paste what it claims instead.",
    );
  }

  let tracks: { baseUrl?: string; languageCode?: string; kind?: string }[] = [];
  try {
    tracks = JSON.parse(tracksJson);
  } catch {
    return fail("youtube", "no_captions", "We couldn't read this video's captions — paste what it claims instead.");
  }
  const pick = pickCaptionTrack(tracks);
  if (!pick?.baseUrl) {
    return fail("youtube", "no_captions", "We couldn't read this video's captions — paste what it claims instead.");
  }
  const text = await fetchCaptionText(pick.baseUrl);
  if (text) {
    return { ok: true, text: text.slice(0, MAX_TEXT), title, source: "youtube" };
  }
  return fail("youtube", "no_captions", "We couldn't read this video's captions — paste what it claims instead.");
}

/* ---------------------------------- TikTok ---------------------------------- */

async function resolveTikTok(url: URL): Promise<ResolveResult> {
  const res = await fetchWithTimeout(
    `https://www.tiktok.com/oembed?url=${encodeURIComponent(url.toString())}`,
    { headers: { accept: "application/json" } },
  );
  if (!res.ok) {
    return fail(
      "tiktok",
      "unavailable",
      "TikTok blocked us or the video is private — every third-party tool hits this wall. Paste the caption instead.",
    );
  }
  let data: { title?: string; author_name?: string } = {};
  try {
    data = await res.json();
  } catch {
    return fail("tiktok", "unavailable", "TikTok sent back something unreadable — paste the caption instead.");
  }
  const text = (data.title ?? "").trim();
  if (!text) {
    return fail(
      "tiktok",
      "no_captions",
      "That TikTok has no caption text to check — type what it claims instead.",
    );
  }
  return {
    ok: true,
    text: text.slice(0, MAX_TEXT),
    title: data.author_name ? `TikTok by ${data.author_name}` : "TikTok video",
    source: "tiktok",
  };
}

/* ---------------------------------- Reddit ---------------------------------- */

async function resolveReddit(url: URL): Promise<ResolveResult> {
  const clean = new URL(url.toString());
  clean.hostname = "www.reddit.com";
  clean.search = "";
  clean.hash = "";
  clean.pathname = clean.pathname.replace(/\/+$/, "");
  const res = await fetchWithTimeout(`${clean.toString()}.json?raw_json=1&limit=1`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    return fail(
      "reddit",
      "unavailable",
      "Reddit wouldn't hand over that post — it may be private, removed, or rate-limited. Paste its text instead.",
    );
  }
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return fail("reddit", "extract_failed", "Reddit sent back something unreadable — paste the post text instead.");
  }
  const listing = Array.isArray(data) ? data[0] : data;
  const post = (listing as { data?: { children?: { data?: { title?: string; selftext?: string } }[] } })
    ?.data?.children?.[0]?.data;
  if (!post?.title) {
    return fail("reddit", "extract_failed", "We couldn't find a post at that Reddit link — paste its text instead.");
  }
  const text = collapse([post.title, post.selftext ?? ""].filter(Boolean).join("\n\n"));
  return { ok: true, text: text.slice(0, MAX_TEXT), title: post.title, source: "reddit" };
}

/* ---------------------------------- Article --------------------------------- */

function extractReadableText(html: string): string {
  let s = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|iframe|template)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(nav|header|footer|aside|form)[\s\S]*?<\/\1>/gi, " ");
  const article = s.match(/<article[\s\S]*?<\/article>/i)?.[0];
  const main = s.match(/<main[\s\S]*?<\/main>/i)?.[0];
  const body = s.match(/<body[\s\S]*?<\/body>/i)?.[0];
  s = article ?? main ?? body ?? s;
  s = s
    .replace(/<\/(p|h[1-6]|li|blockquote|tr|div)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  return collapse(decodeEntities(s));
}

async function resolveArticle(url: URL): Promise<ResolveResult> {
  const res = await fetchWithTimeout(url.toString(), {
    headers: { accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
  });
  if (!res.ok) {
    return fail(
      "article",
      "unavailable",
      `That site answered with an error (HTTP ${res.status}) — paste the text you want checked instead.`,
    );
  }
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("html") && !contentType.includes("text")) {
    return fail("article", "extract_failed", "That link isn't a readable page — paste the text instead.");
  }
  const html = await res.text();
  const title =
    decodeEntities(
      html.match(/<meta property="og:title" content="([^"]*)"/i)?.[1] ??
        html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ??
        "",
    ).trim() || undefined;
  const text = extractReadableText(html);
  if (text.length < 200) {
    return fail(
      "article",
      "extract_failed",
      "We couldn't pull readable text from that page — it may be behind a login or built entirely in JavaScript. Paste the text instead.",
    );
  }
  return { ok: true, text: text.slice(0, MAX_TEXT), title, source: "article" };
}

/* ---------------------------------- Entry ----------------------------------- */

export async function resolveContent(input: string): Promise<ResolveResult> {
  const trimmed = input.trim();
  if (!trimmed) {
    return fail("unknown", "empty_input", "Paste a link or a claim first.");
  }
  const url = parseAsUrl(trimmed);
  if (!url) {
    return { ok: true, text: trimmed.slice(0, MAX_TEXT), source: "pasted" };
  }
  const host = url.hostname.replace(/^(www|m)\./, "");
  try {
    if (host === "youtube.com" || host === "youtu.be" || host === "music.youtube.com") {
      return await resolveYouTube(url);
    }
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
      return await resolveTikTok(url);
    }
    if (host === "reddit.com" || host.endsWith(".reddit.com") || host === "redd.it") {
      return await resolveReddit(url);
    }
    return await resolveArticle(url);
  } catch {
    return fail(
      "unknown",
      "unavailable",
      "We couldn't reach that link (it timed out or refused us) — paste the text you want checked instead.",
    );
  }
}

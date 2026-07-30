/**
 * Request-body limits for App Router route handlers.
 *
 * Next.js 14 App Router (unlike the old Pages API config) has no built-in
 * body size cap — `request.json()` / `request.text()` will happily buffer
 * whatever the client sends. That's a memory/CPU DoS risk, so every route
 * that reads a body must go through `readRawBody` or `readJsonBody`.
 *
 * Layers of defense:
 *   1. Content-Length pre-check — fail fast without allocating.
 *   2. Streamed read that aborts the moment we exceed the cap (defeats
 *      clients that lie about Content-Length or omit it).
 *   3. For JSON: bounded depth + array-length walk so a 30 KB payload can't
 *      still exhaust the stack via `[[[[[[…]]]]]]`.
 */

/** Global default cap for JSON POST bodies. Small on purpose — every form
 *  in this app is short. Individual routes can override via `maxBytes`. */
export const DEFAULT_JSON_MAX_BYTES = 32 * 1024; // 32 KB

/** Structural limits applied to every parsed JSON body. */
export const DEFAULT_JSON_MAX_DEPTH = 8;
export const DEFAULT_JSON_MAX_ARRAY_ITEMS = 100;
export const DEFAULT_JSON_MAX_STRING_LEN = 20_000;

export class PayloadTooLargeError extends Error {
  readonly status = 413;
  constructor(readonly limit: number, readonly kind: "bytes" | "depth" | "array" | "string") {
    super(`payload too large (${kind}, limit ${limit})`);
    this.name = "PayloadTooLargeError";
  }
}

export class InvalidBodyError extends Error {
  readonly status = 400;
  constructor(message: string) {
    super(message);
    this.name = "InvalidBodyError";
  }
}

/**
 * Read the request body as raw bytes, aborting if it exceeds `maxBytes`.
 * Also inspects `Content-Length` up front so a client that advertises an
 * oversized body is rejected before we allocate anything.
 */
export async function readRawBody(request: Request, maxBytes: number): Promise<Uint8Array> {
  const declared = request.headers.get("content-length");
  if (declared) {
    const n = Number(declared);
    if (Number.isFinite(n) && n > maxBytes) {
      throw new PayloadTooLargeError(maxBytes, "bytes");
    }
  }

  const body = request.body;
  if (!body) return new Uint8Array(0);

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      try {
        await reader.cancel();
      } catch {
        // reader already closed — nothing to do
      }
      throw new PayloadTooLargeError(maxBytes, "bytes");
    }
    chunks.push(value);
  }

  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

/** Convenience: read the body as text with a byte cap. */
export async function readRawText(request: Request, maxBytes: number): Promise<string> {
  const bytes = await readRawBody(request, maxBytes);
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export interface JsonLimits {
  maxBytes?: number;
  maxDepth?: number;
  maxArrayItems?: number;
  maxStringLen?: number;
}

/**
 * Read + parse a JSON body under strict size, depth, array, and string
 * limits. Throws PayloadTooLargeError or InvalidBodyError, which the route
 * handler should translate to 413 / 400 respectively.
 */
export async function readJsonBody<T = unknown>(
  request: Request,
  limits: JsonLimits = {},
): Promise<T> {
  const maxBytes = limits.maxBytes ?? DEFAULT_JSON_MAX_BYTES;
  const maxDepth = limits.maxDepth ?? DEFAULT_JSON_MAX_DEPTH;
  const maxArrayItems = limits.maxArrayItems ?? DEFAULT_JSON_MAX_ARRAY_ITEMS;
  const maxStringLen = limits.maxStringLen ?? DEFAULT_JSON_MAX_STRING_LEN;

  const text = await readRawText(request, maxBytes);
  if (text.length === 0) {
    throw new InvalidBodyError("empty body");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new InvalidBodyError("invalid JSON");
  }

  assertJsonShape(parsed, { maxDepth, maxArrayItems, maxStringLen });
  return parsed as T;
}

function assertJsonShape(
  node: unknown,
  limits: { maxDepth: number; maxArrayItems: number; maxStringLen: number },
  depth = 0,
): void {
  if (depth > limits.maxDepth) {
    throw new PayloadTooLargeError(limits.maxDepth, "depth");
  }
  if (typeof node === "string") {
    if (node.length > limits.maxStringLen) {
      throw new PayloadTooLargeError(limits.maxStringLen, "string");
    }
    return;
  }
  if (Array.isArray(node)) {
    if (node.length > limits.maxArrayItems) {
      throw new PayloadTooLargeError(limits.maxArrayItems, "array");
    }
    for (const item of node) assertJsonShape(item, limits, depth + 1);
    return;
  }
  if (node && typeof node === "object") {
    const keys = Object.keys(node as Record<string, unknown>);
    if (keys.length > limits.maxArrayItems) {
      throw new PayloadTooLargeError(limits.maxArrayItems, "array");
    }
    for (const k of keys) {
      if (k.length > limits.maxStringLen) {
        throw new PayloadTooLargeError(limits.maxStringLen, "string");
      }
      assertJsonShape((node as Record<string, unknown>)[k], limits, depth + 1);
    }
  }
}

/** Build a JSON `Response` for a thrown body-limit error. */
export function bodyLimitResponse(err: unknown): Response | null {
  if (err instanceof PayloadTooLargeError) {
    return Response.json(
      { error: "payload_too_large", limit: err.limit, kind: err.kind },
      { status: 413 },
    );
  }
  if (err instanceof InvalidBodyError) {
    return Response.json({ error: err.message }, { status: 400 });
  }
  return null;
}

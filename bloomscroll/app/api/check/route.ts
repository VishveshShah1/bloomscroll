import { runPipeline } from "@/lib/pipeline";
import type { Lang } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Phase 5: streams the pipeline's stage events to the client over SSE, so the
// UI shows live progress (reading → found N → searching → weighing → done).
export async function POST(request: Request) {
  let input = "";
  let lang: Lang = "en";
  try {
    const parsed = (await request.json()) as { input?: unknown; lang?: unknown };
    if (typeof parsed.input === "string") input = parsed.input.trim();
    if (parsed.lang === "fr") lang = "fr";
  } catch {
    // malformed body → empty input error below
  }
  if (!input) {
    return new Response(JSON.stringify({ error: "empty_input" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        for await (const ev of runPipeline(input, lang)) send(ev);
      } catch {
        send({ stage: "error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}

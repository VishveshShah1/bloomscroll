"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-level error boundary. Any client-render throw inside a route
 * segment lands here instead of blanking the tab. The layout (nav,
 * splash, background gradient) stays mounted — we just replace the
 * failing page with a friendly recover-or-go-home card.
 *
 * `reset()` re-renders the segment; useful when the failure was
 * transient (bad state, one-off fetch). If the throw is in the
 * layout itself, Next escalates to app/global-error.tsx.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Route errors are already logged by Next in dev; in prod we could
    // wire this to a telemetry beacon later. For now, keep a console
    // breadcrumb for local debugging.
    console.error("[route-error]", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
      <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-forest">
        something broke
      </p>
      <h1 className="mt-3 text-[32px] font-semibold leading-tight tracking-display text-ink sm:text-[42px]">
        This page hit an error.
      </h1>
      <p className="mt-4 max-w-[52ch] text-[15.5px] leading-relaxed text-bark">
        Not your fault. The rest of the app is fine — try loading this page
        again, or head back home and give it another go.
      </p>
      {error.digest && (
        <p className="mt-4 rounded-full border border-ink/10 bg-white/60 px-3 py-1 text-[11.5px] font-mono text-bark">
          ref: {error.digest}
        </p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="btn-primary focus-ring"
        >
          Try again
        </button>
        <Link href="/" className="btn-ghost focus-ring">
          Back to home
        </Link>
      </div>
    </main>
  );
}

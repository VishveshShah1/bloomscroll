import Link from "next/link";
import Wordmark from "@/components/Wordmark";

/**
 * Custom 404. Next renders this for any unmatched route (and for an
 * explicit notFound() call). The root layout carries no nav or footer, so
 * this page brings its own — same chrome as /signin and /dashboard, so a
 * wrong URL still looks like the rest of the site.
 *
 * Background is pinned to `bg-canvas` rather than inherited. The body
 * background is normally driven by ScrollBackground through the
 * `--bg-color` custom property, which lerps toward a deep forest green as
 * you scroll; anything left over from a previous page would put dark-green
 * text on a dark-green ground here. An error page is the one place that
 * must never be at the mercy of leftover state, so it paints its own
 * ground: warm cream, with sage only as an accent.
 *
 * Static by design: no "use client", no session read. A 404 shouldn't
 * depend on auth state resolving.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas">
      <nav className="border-b border-ink/5 bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="focus-ring rounded-md">
            <Wordmark className="text-[22px]" />
          </Link>
          <Link
            href="/"
            className="focus-ring text-[14px] font-semibold text-bark transition hover:text-ink"
          >
            ← home
          </Link>
        </div>
      </nav>

      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-xl flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
        {/* One sage panel on cream — the site's card treatment, giving the
            message a shape to sit in without adding clutter. */}
        <div className="w-full rounded-[24px] border border-forest/15 bg-moss/40 p-8 sm:p-10">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-forest">
            404 · page not found
          </p>
          <h1 className="mt-4 text-[32px] font-semibold leading-[1.1] tracking-display text-ink sm:text-[40px]">
            We couldn&apos;t find this one.
          </h1>
          <p className="mx-auto mt-4 max-w-[46ch] text-[15.5px] leading-relaxed text-bark">
            No sources, no citations, nothing in the literature. Either the link
            is wrong or the page never existed — and we&apos;d rather say so than
            guess.
          </p>
          <Link href="/" className="btn-primary focus-ring mt-8">
            Back to home
          </Link>
        </div>

        <p className="mt-10 text-[12px] text-bark">
          © 2026 Bloomscroll. All rights reserved.
        </p>
      </main>
    </div>
  );
}

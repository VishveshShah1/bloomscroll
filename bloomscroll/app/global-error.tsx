"use client";

/**
 * Root-level fallback — fires when the failure is inside the root
 * layout itself (splash, auth provider, scroll background). Next
 * mounts this outside the normal <html>/<body> tree so it has to
 * render its own document skeleton with inline styles.
 *
 * Deliberately austere: no framework CSS is available here, so we
 * hand-style a minimal recovery card that matches the brand palette
 * closely enough to feel intentional.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const shell: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "#f6f3ea",
    color: "#12201a",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif',
  };
  const card: React.CSSProperties = {
    width: "100%",
    maxWidth: 480,
    background: "#fbfaf3",
    border: "1px solid rgba(18,32,26,0.08)",
    borderRadius: 24,
    padding: 28,
    textAlign: "center",
    boxShadow: "0 12px 40px rgba(18,32,26,0.08)",
  };
  const eyebrow: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#1e4d2b",
    margin: 0,
  };
  const h1: React.CSSProperties = {
    fontSize: 26,
    fontWeight: 600,
    lineHeight: 1.15,
    margin: "10px 0 0",
    color: "#12201a",
  };
  const body: React.CSSProperties = {
    fontSize: 14.5,
    lineHeight: 1.55,
    margin: "12px 0 0",
    color: "#5b6b5e",
  };
  const ref: React.CSSProperties = {
    display: "inline-block",
    marginTop: 12,
    padding: "4px 10px",
    fontSize: 11.5,
    fontFamily: "ui-monospace, monospace",
    color: "#5b6b5e",
    background: "rgba(18,32,26,0.05)",
    borderRadius: 999,
  };
  const row: React.CSSProperties = {
    marginTop: 24,
    display: "flex",
    gap: 10,
    justifyContent: "center",
    flexWrap: "wrap",
  };
  const primary: React.CSSProperties = {
    padding: "12px 22px",
    background: "#1e4d2b",
    color: "#f6f3ea",
    borderRadius: 999,
    fontSize: 14.5,
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
  };
  const ghost: React.CSSProperties = {
    padding: "11px 22px",
    background: "transparent",
    color: "#12201a",
    borderRadius: 999,
    fontSize: 14.5,
    fontWeight: 600,
    border: "1px solid rgba(18,32,26,0.14)",
    textDecoration: "none",
    cursor: "pointer",
  };
  return (
    <html lang="en">
      <body style={shell}>
        <div style={card}>
          <p style={eyebrow}>bloomscroll · unexpected</p>
          <h1 style={h1}>Something broke on our end.</h1>
          <p style={body}>
            The whole app hit an error. Try again — if it keeps happening,
            reloading the tab usually clears it.
          </p>
          {error?.digest && <span style={ref}>ref: {error.digest}</span>}
          <div style={row}>
            <button type="button" onClick={reset} style={primary}>
              Try again
            </button>
            <a href="/" style={ghost}>
              Reload home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}

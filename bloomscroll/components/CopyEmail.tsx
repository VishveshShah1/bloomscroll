"use client";

import { useEffect, useState } from "react";

/**
 * Copy-to-clipboard button for the support address.
 *
 * A mailto link is useless to anyone without a desktop mail client wired up —
 * which is most people on a school Chromebook or a phone browser — so the
 * address needs to be grabbable as text too. Falls back to a hidden textarea +
 * execCommand on browsers that block navigator.clipboard outside HTTPS.
 */
export default function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = email;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
      } catch {
        /* clipboard unavailable — the address is still visible on the page */
      }
      document.body.removeChild(ta);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className="focus-ring inline-flex items-center gap-2 rounded-full border border-black/20 px-5 py-2.5 text-[14px] font-semibold text-black transition hover:border-black/40 hover:bg-black/5"
    >
      {copied ? (
        <>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 L9 17 L4 12" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="11" height="11" rx="2.5" />
            <path d="M5 15V5.5A1.5 1.5 0 0 1 6.5 4H15" />
          </svg>
          Copy email
        </>
      )}
    </button>
  );
}

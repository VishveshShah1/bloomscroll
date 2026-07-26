"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

/**
 * Fires once per session when the user just completed OAuth. Reads the
 * consent flags the signin page stashed in sessionStorage
 * (`bloom:pending-consent`), POSTs them to /api/consent so the record
 * lands in KV against the now-known email, then clears the stash.
 *
 * Renders nothing. Mounted globally via app/layout.tsx so it works no
 * matter which callbackUrl the user lands on after Google.
 */
export default function ConsentSync() {
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.email) return;
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("bloom:pending-consent");
    if (!raw) return;
    let parsed: { tos?: boolean; email?: boolean } | null = null;
    try {
      parsed = JSON.parse(raw) as { tos?: boolean; email?: boolean };
    } catch {
      sessionStorage.removeItem("bloom:pending-consent");
      return;
    }
    if (!parsed?.tos) {
      sessionStorage.removeItem("bloom:pending-consent");
      return;
    }
    fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tos: true, email: Boolean(parsed.email) }),
    })
      .then((r) => {
        if (r.ok) sessionStorage.removeItem("bloom:pending-consent");
      })
      .catch(() => {
        // Leave the stash in place so the next auth’d page load can retry.
      });
  }, [status, session?.user?.email]);
  return null;
}

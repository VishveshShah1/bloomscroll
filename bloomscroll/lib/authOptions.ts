import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Google-only sign-in. JWT session (no database) — the token is signed with
// NEXTAUTH_SECRET and lives in an HTTP-only cookie. Add NEXTAUTH_SECRET,
// GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and NEXTAUTH_URL to .env.local
// before the sign-in flow works end-to-end.

// Startup confirmation only — length + short prefix. Never print the full
// client id or secret; anything longer than a prefix is a leak risk.
const rawId = process.env.GOOGLE_CLIENT_ID;
const rawSecret = process.env.GOOGLE_CLIENT_SECRET;
if (typeof window === "undefined") {
  if (rawId && rawId.length > 0) {
    console.log(
      `[auth] GOOGLE_CLIENT_ID present — length ${rawId.length}, starts "${rawId.slice(0, 6)}"`,
    );
  } else {
    console.warn("[auth] GOOGLE_CLIENT_ID is NOT set at runtime");
  }
  if (rawSecret && rawSecret.length > 0) {
    console.log(
      `[auth] GOOGLE_CLIENT_SECRET present — length ${rawSecret.length}, starts "${rawSecret.slice(0, 6)}"`,
    );
  } else {
    console.warn("[auth] GOOGLE_CLIENT_SECRET is NOT set at runtime");
  }
  console.log(`[auth] NEXTAUTH_URL: ${process.env.NEXTAUTH_URL ?? "(unset)"}`);
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  // TEMP: verbose diagnostics for the OAuthCallback failure. The default
  // NextAuth logger swallows the underlying error and only surfaces a code
  // like ?error=OAuthCallback in the URL. Overriding logger.error catches
  // the full error object server-side so we can see the actual cause of a
  // token-exchange or state-verification failure. Delete once sign-in is
  // stable.
  debug: true,
  logger: {
    error(code, metadata) {
      console.error("[auth:logger:error]", code, metadata);
    },
    warn(code) {
      console.warn("[auth:logger:warn]", code);
    },
    debug(code, metadata) {
      console.log("[auth:logger:debug]", code, metadata);
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("[auth:signIn]", {
        userEmail: user?.email,
        accountProvider: account?.provider,
        accountType: account?.type,
        hasIdToken: Boolean(account?.id_token),
        hasAccessToken: Boolean(account?.access_token),
        profileEmail: (profile as { email?: string } | undefined)?.email,
      });
      return true;
    },
  },
  events: {
    async signIn(message) {
      console.log("[auth:event:signIn]", {
        provider: message.account?.provider,
        userEmail: message.user?.email,
        isNewUser: message.isNewUser,
      });
    },
    async signOut() {
      console.log("[auth:event:signOut]");
    },
  },
};

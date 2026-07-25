import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Google-only sign-in. JWT session (no database) — the token is signed with
// NEXTAUTH_SECRET and lives in an HTTP-only cookie. Add NEXTAUTH_SECRET,
// GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and NEXTAUTH_URL to .env.local
// before the sign-in flow works end-to-end.

// TEMP: debugging a 'deleted_client' error. Prints the first 10 characters
// of the client id at module load so we can confirm which credentials Next
// actually picked up at runtime (vs. what's in .env.local). Remove once the
// sign-in flow is stable.
const rawId = process.env.GOOGLE_CLIENT_ID;
if (typeof window === "undefined") {
  if (rawId && rawId.length > 0) {
    console.log(
      `[auth] GOOGLE_CLIENT_ID loaded — first 10 chars: "${rawId.slice(0, 10)}" (length ${rawId.length})`,
    );
  } else {
    console.warn("[auth] GOOGLE_CLIENT_ID is NOT set at runtime");
  }
  console.log(
    `[auth] GOOGLE_CLIENT_SECRET present: ${Boolean(process.env.GOOGLE_CLIENT_SECRET)}`,
  );
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
};

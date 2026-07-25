import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Google-only sign-in. JWT session (no database) — the token is signed with
// NEXTAUTH_SECRET and lives in an HTTP-only cookie. Add NEXTAUTH_SECRET,
// GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and NEXTAUTH_URL to .env.local
// before the sign-in flow works end-to-end.
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

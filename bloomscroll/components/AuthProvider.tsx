"use client";

import { SessionProvider } from "next-auth/react";

// Wraps the tree in NextAuth's SessionProvider so useSession() works anywhere.
// Keeps the layout a server component; the boundary lives here.
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

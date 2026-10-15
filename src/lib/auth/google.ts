import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

/**
 * NextAuth is only the Google OAuth handshake. Access is invite-only: Google can sign in an existing,
 * enabled user (matched by email) but never creates one. /api/auth/google/complete then swaps the
 * NextAuth session for the app's own JWT + refresh cookies, so there is a single session system.
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      // Safe for Google: it only returns verified emails, and it lets an invited user link their Google account.
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const existing = await prisma.user.findFirst({ where: { email: { equals: user.email, mode: "insensitive" } } });
      return !!existing && !existing.disabledAt;
    },
    session({ session, user }) {
      if (session.user) (session.user as { id?: string }).id = user.id;
      return session;
    },
  },
};

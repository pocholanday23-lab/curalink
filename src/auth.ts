import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyImpersonationToken } from "@/lib/impersonation-token";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
      },
      authorize: async (credentials) => {
        const username = (credentials?.username as string | undefined)
          ?.trim()
          .toLowerCase();
        const password = credentials?.password as string | undefined;
        if (!username || !password) return null;

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user || !user.active) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
    Credentials({
      id: "impersonate",
      credentials: { token: {} },
      authorize: async (credentials) => {
        const raw = credentials?.token as string | undefined;
        if (!raw) return null;

        const verified = verifyImpersonationToken(raw);
        if (!verified) return null;

        const target = await prisma.user.findUnique({
          where: { id: verified.sub },
        });
        if (!target || !target.active) return null;

        const by = verified.by
          ? await prisma.user.findUnique({
              where: { id: verified.by },
              select: { name: true },
            })
          : null;

        return {
          id: target.id,
          name: target.name,
          email: target.email,
          role: target.role,
          mustChangePassword: false,
          impersonatorId: verified.by ?? undefined,
          impersonatorName: by?.name ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
        token.mustChangePassword = user.mustChangePassword;
        token.impersonatorId = user.impersonatorId;
        token.impersonatorName = user.impersonatorName ?? null;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.mustChangePassword = token.mustChangePassword;
      session.user.impersonatorId = token.impersonatorId;
      session.user.impersonatorName = token.impersonatorName ?? null;
      return session;
    },
  },
});

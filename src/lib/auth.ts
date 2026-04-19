import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authenticateUser, getAuthenticatedUserById } from "@/features/auth/auth-service";
import { isAppUserRole } from "@/features/auth/roles";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
        redirectTo: {
          label: "Redirect to",
          type: "text",
        },
      },
      async authorize(credentials) {
        return authenticateUser(credentials);
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.projectId = user.projectId;
        token.projectSlug = user.projectSlug;
        token.workspaceId = user.workspaceId;
        token.workspaceSlug = user.workspaceSlug;
        return token;
      }

      if (token.id && (!token.role || token.projectSlug === undefined)) {
        const dbUser = await getAuthenticatedUserById(String(token.id));

        if (dbUser) {
          token.role = dbUser.role;
          token.projectId = dbUser.projectId;
          token.projectSlug = dbUser.projectSlug;
          token.workspaceId = dbUser.workspaceId;
          token.workspaceSlug = dbUser.workspaceSlug;
          token.name = dbUser.name ?? token.name;
          token.email = dbUser.email ?? token.email;
          token.picture = dbUser.image ?? token.picture;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? token.sub ?? "");
        session.user.role = isAppUserRole(token.role)
          ? token.role
          : "customer";
        session.user.projectId =
          typeof token.projectId === "string" ? token.projectId : null;
        session.user.projectSlug =
          typeof token.projectSlug === "string" ? token.projectSlug : null;
        session.user.workspaceId =
          typeof token.workspaceId === "string" ? token.workspaceId : null;
        session.user.workspaceSlug =
          typeof token.workspaceSlug === "string" ? token.workspaceSlug : null;
        session.user.name = token.name ?? session.user.name;
        session.user.email = token.email ?? session.user.email;
        session.user.image =
          typeof token.picture === "string"
            ? token.picture
            : session.user.image;
      }

      return session;
    },
  },
});

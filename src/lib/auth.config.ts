import type { NextAuthConfig } from "next-auth";

import {
  getRoleHomeRoute,
  isProtectedRoute,
  loginRoute,
} from "@/features/auth/routes";
import { isAppUserRole } from "@/features/auth/roles";

export const authConfig = {
  pages: {
    signIn: loginRoute,
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const pathname = nextUrl.pathname;

      if (pathname === loginRoute) {
        if (isLoggedIn) {
          const role = isAppUserRole(auth?.user?.role)
            ? auth.user.role
            : "customer";

          return Response.redirect(new URL(getRoleHomeRoute(role), nextUrl));
        }

        return true;
      }

      if (isProtectedRoute(pathname)) {
        return isLoggedIn;
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;

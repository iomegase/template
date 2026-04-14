import type { DefaultSession } from "next-auth";

import type { AppUserRole } from "@/features/auth/roles";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: AppUserRole;
      projectId: string | null;
      projectSlug: string | null;
    };
  }

  interface User {
    id: string;
    role: AppUserRole;
    projectId: string | null;
    projectSlug: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: AppUserRole;
    projectId?: string | null;
    projectSlug?: string | null;
  }
}

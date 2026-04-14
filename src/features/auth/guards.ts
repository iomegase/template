import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getRoleHomeRoute, loginRoute } from "@/features/auth/routes";
import {
  isAppUserRole,
  type AppUserRole,
  type AuthenticatedUser,
} from "@/features/auth/roles";
import { isProjectOperationalStatus } from "@/features/projects/status";
import { prisma } from "@/lib/prisma";

const getCurrentSession = cache(async () => auth());

export async function getCurrentUserProjectMembership(userId: string) {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      projectId: true,
      project: {
        select: {
          id: true,
          slug: true,
          name: true,
          status: true,
          settings: {
            select: {
              siteName: true,
              billingEnabled: true,
              customerPortalEnabled: true,
            },
          },
        },
      },
    },
  });
}

export async function getOptionalSessionUser(): Promise<AuthenticatedUser | null> {
  const session = await getCurrentSession();
  const user = session?.user;

  if (!user?.id || !isAppUserRole(user.role)) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    name: user.name ?? null,
    image: user.image ?? null,
    role: user.role,
    projectId: user.projectId ?? null,
    projectSlug: user.projectSlug ?? null,
  };
}

export async function requireSessionUser() {
  const user = await getOptionalSessionUser();

  if (!user) {
    redirect(loginRoute);
  }

  return user;
}

export async function requireRole(allowedRoles: AppUserRole | AppUserRole[]) {
  const user = await requireSessionUser();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(user.role)) {
    redirect(getRoleHomeRoute(user.role));
  }

  return user;
}

export async function requireProjectAdmin() {
  const user = await requireRole("admin");
  const membership = await getCurrentUserProjectMembership(user.id);

  if (!membership) {
    redirect(loginRoute);
  }

  if (!membership.projectId || !membership.project) {
    throw new Error("Admin user must be attached to an existing project.");
  }

  return {
    ...user,
    projectId: membership.projectId,
    projectSlug: membership.project.slug,
  };
}

export async function getCustomerProjectAccessState() {
  const user = await requireRole("customer");
  const membership = await getCurrentUserProjectMembership(user.id);

  if (!membership?.projectId || !membership.project) {
    return {
      user,
      project: null,
      isPortalEnabled: false,
    };
  }
  const project = membership.project;

  return {
    user: {
      ...user,
      projectId: membership.projectId,
      projectSlug: project.slug,
    },
    project,
    isPortalEnabled: Boolean(
      isProjectOperationalStatus(project.status) &&
        project.settings?.customerPortalEnabled,
    ),
  };
}

export async function requireEnabledCustomerPortal() {
  const accessState = await getCustomerProjectAccessState();

  if (!accessState.isPortalEnabled) {
    redirect("/customer/disabled");
  }

  return accessState;
}

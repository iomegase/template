import bcrypt from "bcryptjs";

import type {
  ManagedAdminAccountCreateInput,
  ManagedAdminAccountListItem,
  ManagedAdminAccountUpdateInput,
  ProjectOption,
} from "@/features/super-admin/admin-accounts/types";
import { prisma } from "@/lib/prisma";

type ListManagedAdminAccountsOptions = {
  query?: string;
};

export async function listManagedAdminAccounts(
  options: ListManagedAdminAccountsOptions = {},
) {
  const query = options.query?.trim();

  return prisma.user.findMany({
    where: {
      role: "admin",
      ...(query
        ? {
            OR: [
              {
                name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                email: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                project: {
                  name: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              },
              {
                project: {
                  slug: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {}),
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      projectId: true,
      createdAt: true,
      updatedAt: true,
      project: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  }).then((admins) =>
    admins.map(
      (admin) =>
        ({
          id: admin.id,
          name: admin.name,
          email: admin.email,
          projectId: admin.projectId,
          projectName: admin.project?.name ?? null,
          projectSlug: admin.project?.slug ?? null,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt,
        }) satisfies ManagedAdminAccountListItem,
    ),
  );
}

export async function getManagedAdminAccount(userId: string) {
  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "admin",
    },
    select: {
      id: true,
      name: true,
      email: true,
      projectId: true,
      createdAt: true,
      updatedAt: true,
      project: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });
}

export async function listProjectOptions(): Promise<ProjectOption[]> {
  return prisma.project.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
}

export async function createManagedAdminAccount(
  values: ManagedAdminAccountCreateInput,
) {
  const passwordHash = await bcrypt.hash(values.password, 10);

  return prisma.user.create({
    data: {
      name: values.name,
      email: values.email,
      passwordHash,
      role: "admin",
      projectId: values.projectId,
    },
  });
}

export async function updateManagedAdminAccount(
  userId: string,
  values: ManagedAdminAccountUpdateInput,
) {
  const targetUser = await prisma.user.findFirst({
    where: {
      id: userId,
      role: "admin",
    },
    select: {
      id: true,
    },
  });

  if (!targetUser) {
    throw new Error("Managed admin account not found.");
  }

  return prisma.user.update({
    where: {
      id: targetUser.id,
    },
    data: {
      name: values.name,
      email: values.email,
      projectId: values.projectId,
      ...(values.password
        ? {
            passwordHash: await bcrypt.hash(values.password, 10),
          }
        : {}),
    },
  });
}

export async function deleteManagedAdminAccount(userId: string) {
  const targetUser = await prisma.user.findFirst({
    where: {
      id: userId,
      role: "admin",
    },
    select: {
      id: true,
    },
  });

  if (!targetUser) {
    return;
  }

  await prisma.user.delete({
    where: {
      id: targetUser.id,
    },
  });
}

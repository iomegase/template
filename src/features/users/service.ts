import bcrypt from "bcryptjs";

import type {
  AdminUserCreateInput,
  AdminUserListItem,
  AdminUserUpdateInput,
} from "@/features/users/types";
import { prisma } from "@/lib/prisma";

type ListProjectAdminUsersOptions = {
  query?: string;
};

export async function listProjectAdminUsers(
  projectId: string,
  options: ListProjectAdminUsersOptions = {},
) {
  const query = options.query?.trim();

  return prisma.user.findMany({
    where: {
      projectId,
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
      createdAt: true,
      updatedAt: true,
    },
  }) satisfies Promise<AdminUserListItem[]>;
}

export async function getProjectAdminUser(projectId: string, userId: string) {
  return prisma.user.findFirst({
    where: {
      id: userId,
      projectId,
      role: "admin",
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createProjectAdminUser(
  projectId: string,
  values: AdminUserCreateInput,
) {
  const passwordHash = await bcrypt.hash(values.password, 10);

  return prisma.user.create({
    data: {
      name: values.name,
      email: values.email,
      passwordHash,
      role: "admin",
      projectId,
    },
  });
}

export async function updateProjectAdminUser(
  projectId: string,
  userId: string,
  values: AdminUserUpdateInput,
) {
  const targetUser = await prisma.user.findFirst({
    where: {
      id: userId,
      projectId,
      role: "admin",
    },
    select: {
      id: true,
    },
  });

  if (!targetUser) {
    throw new Error("Admin user not found.");
  }

  return prisma.user.update({
    where: {
      id: targetUser.id,
    },
    data: {
      name: values.name,
      email: values.email,
      ...(values.password
        ? {
            passwordHash: await bcrypt.hash(values.password, 10),
          }
        : {}),
    },
  });
}

export async function deleteProjectAdminUser(projectId: string, userId: string) {
  const targetUser = await prisma.user.findFirst({
    where: {
      id: userId,
      projectId,
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

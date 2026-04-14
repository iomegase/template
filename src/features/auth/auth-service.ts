import bcrypt from "bcryptjs";

import { loginSchema } from "@/features/auth/schema";
import {
  isAppUserRole,
  type AuthenticatedUser,
} from "@/features/auth/roles";
import { prisma } from "@/lib/prisma";

function toAuthenticatedUser(user: {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: string;
  projectId: string | null;
  project: { slug: string } | null;
}): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: isAppUserRole(user.role) ? user.role : "customer",
    projectId: user.projectId,
    projectSlug: user.project?.slug ?? null,
  };
}

export async function authenticateUser(credentials: unknown) {
  const parsedCredentials = loginSchema.safeParse(credentials);

  if (!parsedCredentials.success) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      email: parsedCredentials.data.email,
    },
    include: {
      project: {
        select: {
          slug: true,
        },
      },
    },
  });

  if (!user?.passwordHash) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(
    parsedCredentials.data.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    return null;
  }

  return toAuthenticatedUser(user);
}

export async function getAuthenticatedUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    include: {
      project: {
        select: {
          slug: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  return toAuthenticatedUser(user);
}

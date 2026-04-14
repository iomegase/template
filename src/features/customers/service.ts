import bcrypt from "bcryptjs";

import type {
  CustomerCreateInput,
  CustomerListItem,
  CustomerUpdateInput,
} from "@/features/customers/types";
import { prisma } from "@/lib/prisma";

type ListProjectCustomersOptions = {
  query?: string;
};

export async function listProjectCustomers(
  projectId: string,
  options: ListProjectCustomersOptions = {},
) {
  const query = options.query?.trim();

  return prisma.user.findMany({
    where: {
      projectId,
      role: "customer",
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
  }) satisfies Promise<CustomerListItem[]>;
}

export async function getProjectCustomer(projectId: string, customerId: string) {
  return prisma.user.findFirst({
    where: {
      id: customerId,
      projectId,
      role: "customer",
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

export async function createProjectCustomer(
  projectId: string,
  values: CustomerCreateInput,
) {
  const passwordHash = await bcrypt.hash(values.password, 10);

  return prisma.user.create({
    data: {
      name: values.name,
      email: values.email,
      passwordHash,
      role: "customer",
      projectId,
    },
  });
}

export async function updateProjectCustomer(
  projectId: string,
  customerId: string,
  values: CustomerUpdateInput,
) {
  const targetCustomer = await prisma.user.findFirst({
    where: {
      id: customerId,
      projectId,
      role: "customer",
    },
    select: {
      id: true,
    },
  });

  if (!targetCustomer) {
    throw new Error("Customer not found.");
  }

  return prisma.user.update({
    where: {
      id: targetCustomer.id,
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

export async function deleteProjectCustomer(
  projectId: string,
  customerId: string,
) {
  const targetCustomer = await prisma.user.findFirst({
    where: {
      id: customerId,
      projectId,
      role: "customer",
    },
    select: {
      id: true,
    },
  });

  if (!targetCustomer) {
    return;
  }

  await prisma.user.delete({
    where: {
      id: targetCustomer.id,
    },
  });
}

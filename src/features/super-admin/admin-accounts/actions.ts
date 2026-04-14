"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isUniqueConstraintError } from "@/lib/prisma-errors";
import { requireSuperAdmin } from "@/features/super-admin/guards";
import {
  managedAdminAccountCreateSchema,
  managedAdminAccountUpdateSchema,
} from "@/features/super-admin/admin-accounts/schema";
import {
  createManagedAdminAccount,
  deleteManagedAdminAccount,
  updateManagedAdminAccount,
} from "@/features/super-admin/admin-accounts/service";
import {
  getSuperAdminAdminEditRoute,
  superAdminAdminsRoute,
} from "@/features/super-admin/routes";

type ActionResult = {
  error?: string;
};

export async function createManagedAdminAccountAction(
  values: unknown,
): Promise<ActionResult | void> {
  await requireSuperAdmin();
  const parsed = managedAdminAccountCreateSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: "Invalid admin account data.",
    };
  }

  try {
    await createManagedAdminAccount(parsed.data);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        error: "This email is already in use.",
      };
    }

    throw error;
  }

  revalidatePath(superAdminAdminsRoute);
  redirect(superAdminAdminsRoute);
}

export async function updateManagedAdminAccountAction(
  userId: string,
  values: unknown,
): Promise<ActionResult | void> {
  await requireSuperAdmin();
  const parsed = managedAdminAccountUpdateSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: "Invalid admin account data.",
    };
  }

  try {
    await updateManagedAdminAccount(userId, parsed.data);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        error: "This email is already in use.",
      };
    }

    throw error;
  }

  revalidatePath(superAdminAdminsRoute);
  revalidatePath(getSuperAdminAdminEditRoute(userId));
  redirect(superAdminAdminsRoute);
}

export async function deleteManagedAdminAccountAction(userId: string) {
  await requireSuperAdmin();

  await deleteManagedAdminAccount(userId);
  revalidatePath(superAdminAdminsRoute);
}

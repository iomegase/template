"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProjectAdmin } from "@/features/auth/guards";
import {
  adminUserCreateSchema,
  adminUserUpdateSchema,
} from "@/features/users/schema";
import {
  createProjectAdminUser,
  deleteProjectAdminUser,
  updateProjectAdminUser,
} from "@/features/users/service";
import { isUniqueConstraintError } from "@/lib/prisma-errors";

type ActionResult = {
  error?: string;
};

export async function createAdminUserAction(
  values: unknown,
): Promise<ActionResult | void> {
  const admin = await requireProjectAdmin();
  const parsed = adminUserCreateSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: "Invalid admin user data.",
    };
  }

  try {
    await createProjectAdminUser(admin.projectId, parsed.data);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        error: "This email is already in use.",
      };
    }

    throw error;
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateAdminUserAction(
  userId: string,
  values: unknown,
): Promise<ActionResult | void> {
  const admin = await requireProjectAdmin();
  const parsed = adminUserUpdateSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: "Invalid admin user data.",
    };
  }

  try {
    await updateProjectAdminUser(admin.projectId, userId, parsed.data);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        error: "This email is already in use.",
      };
    }

    throw error;
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function deleteAdminUserAction(userId: string) {
  const admin = await requireProjectAdmin();

  await deleteProjectAdminUser(admin.projectId, userId);
  revalidatePath("/admin");
  revalidatePath("/admin/users");
}

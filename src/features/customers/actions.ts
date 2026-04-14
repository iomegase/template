"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProjectAdmin } from "@/features/auth/guards";
import {
  customerCreateSchema,
  customerUpdateSchema,
} from "@/features/customers/schema";
import {
  createProjectCustomer,
  deleteProjectCustomer,
  updateProjectCustomer,
} from "@/features/customers/service";
import { isUniqueConstraintError } from "@/lib/prisma-errors";

type ActionResult = {
  error?: string;
};

export async function createCustomerAction(
  values: unknown,
): Promise<ActionResult | void> {
  const admin = await requireProjectAdmin();
  const parsed = customerCreateSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: "Invalid customer data.",
    };
  }

  try {
    await createProjectCustomer(admin.projectId, parsed.data);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        error: "This email is already in use.",
      };
    }

    throw error;
  }

  revalidatePath("/admin");
  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}

export async function updateCustomerAction(
  customerId: string,
  values: unknown,
): Promise<ActionResult | void> {
  const admin = await requireProjectAdmin();
  const parsed = customerUpdateSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: "Invalid customer data.",
    };
  }

  try {
    await updateProjectCustomer(admin.projectId, customerId, parsed.data);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        error: "This email is already in use.",
      };
    }

    throw error;
  }

  revalidatePath("/admin");
  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}

export async function deleteCustomerAction(customerId: string) {
  const admin = await requireProjectAdmin();

  await deleteProjectCustomer(admin.projectId, customerId);
  revalidatePath("/admin");
  revalidatePath("/admin/customers");
}

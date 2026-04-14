"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProjectAdmin } from "@/features/auth/guards";
import {
  adminProjectSettingsSchema,
  platformProjectSettingsSchema,
} from "@/features/settings/schema";
import {
  updateProjectModuleState,
  updateProjectSettings,
} from "@/features/settings/service";
import { requireSuperAdmin } from "@/features/super-admin/guards";
import type { ProjectModuleKey } from "@/features/super-admin/module-controls";
import {
  getSuperAdminProjectRoute,
  superAdminBaseRoute,
  superAdminProjectsRoute,
} from "@/features/super-admin/routes";

type ActionResult = {
  error?: string;
};

export async function updateAdminProjectSettingsAction(
  values: unknown,
): Promise<ActionResult | void> {
  const admin = await requireProjectAdmin();
  const parsed = adminProjectSettingsSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: "Invalid project settings data.",
    };
  }

  await updateProjectSettings(admin.projectId, parsed.data);
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  redirect("/admin/settings");
}

export async function updatePlatformProjectSettingsAction(
  projectId: string,
  values: unknown,
): Promise<ActionResult | void> {
  await requireSuperAdmin();
  const parsed = platformProjectSettingsSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: "Invalid platform project data.",
    };
  }

  await updateProjectSettings(projectId, parsed.data);
  revalidatePath(superAdminBaseRoute);
  revalidatePath(superAdminProjectsRoute);
  revalidatePath(getSuperAdminProjectRoute(projectId));
  redirect(getSuperAdminProjectRoute(projectId));
}

export async function updateProjectModuleStateAction(
  projectId: string,
  moduleKey: ProjectModuleKey,
  enabled: boolean,
) {
  await requireSuperAdmin();

  await updateProjectModuleState(projectId, moduleKey, enabled);

  revalidatePath(superAdminBaseRoute);
  revalidatePath(superAdminProjectsRoute);
  revalidatePath(getSuperAdminProjectRoute(projectId));
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/billing");
  revalidatePath("/customer");
  revalidatePath("/customer/disabled");
  revalidatePath("/customer/billing");
}

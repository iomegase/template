import {
  getProjectRegistryCompleteness,
  getProjectRegistryEntry,
} from "@/features/projects/service";
import type { ProjectModuleKey } from "@/features/super-admin/module-controls";
import type {
  ProjectSettingsFormValues,
  ProjectSettingsSnapshot,
  ProjectSettingsUpdateInput,
} from "@/features/settings/types";
import { prisma } from "@/lib/prisma";

export async function getProjectSettingsSnapshot(
  projectId: string,
): Promise<ProjectSettingsSnapshot | null> {
  return getProjectRegistryEntry(projectId);
}

export function getProjectSettingsFormDefaults(
  snapshot: ProjectSettingsSnapshot,
): ProjectSettingsFormValues {
  return {
    projectName: snapshot.name,
    description: snapshot.description ?? "",
    siteName: snapshot.settings?.siteName ?? "",
    siteUrl: snapshot.settings?.siteUrl ?? "",
    brandingPrimaryColor: snapshot.settings?.brandingPrimaryColor ?? "",
    brandingLogoUrl: snapshot.settings?.brandingLogoUrl ?? "",
    billingEnabled: snapshot.settings?.billingEnabled ?? false,
    customerPortalEnabled: snapshot.settings?.customerPortalEnabled ?? true,
    status: snapshot.status,
  };
}

export async function updateProjectSettings(
  projectId: string,
  values: ProjectSettingsUpdateInput,
) {
  return prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      name: values.projectName,
      description: values.description ?? null,
      ...(values.status
        ? {
            status: values.status,
          }
        : {}),
      settings: {
        upsert: {
          update: {
            siteName: values.siteName ?? null,
            siteUrl: values.siteUrl ?? null,
            brandingPrimaryColor: values.brandingPrimaryColor ?? null,
            brandingLogoUrl: values.brandingLogoUrl ?? null,
            billingEnabled: values.billingEnabled,
            customerPortalEnabled: values.customerPortalEnabled,
          },
          create: {
            siteName: values.siteName ?? null,
            siteUrl: values.siteUrl ?? null,
            brandingPrimaryColor: values.brandingPrimaryColor ?? null,
            brandingLogoUrl: values.brandingLogoUrl ?? null,
            billingEnabled: values.billingEnabled,
            customerPortalEnabled: values.customerPortalEnabled,
          },
        },
      },
    },
  });
}

export async function updateProjectModuleState(
  projectId: string,
  moduleKey: ProjectModuleKey,
  enabled: boolean,
) {
  return prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      settings: {
        upsert: {
          update:
            moduleKey === "billing"
              ? {
                  billingEnabled: enabled,
                }
              : {
                  customerPortalEnabled: enabled,
                },
          create:
            moduleKey === "billing"
              ? {
                  billingEnabled: enabled,
                }
              : {
                  customerPortalEnabled: enabled,
                },
        },
      },
    },
  });
}

export function getProjectCompleteness(snapshot: ProjectSettingsSnapshot) {
  return getProjectRegistryCompleteness(snapshot);
}

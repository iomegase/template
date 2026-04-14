import type { ProjectStatus } from "@/generated/prisma/enums";
import type { ProjectRegistryEntry } from "@/features/projects/types";

export type ProjectSettingsFormValues = {
  projectName: string;
  description: string;
  siteName: string;
  siteUrl: string;
  brandingPrimaryColor: string;
  brandingLogoUrl: string;
  billingEnabled: boolean;
  customerPortalEnabled: boolean;
  status?: ProjectStatus;
};

export type ProjectSettingsUpdateInput = {
  projectName: string;
  description?: string;
  siteName?: string;
  siteUrl?: string;
  brandingPrimaryColor?: string;
  brandingLogoUrl?: string;
  billingEnabled: boolean;
  customerPortalEnabled: boolean;
  status?: ProjectStatus;
};

export type ProjectSettingsSnapshot = ProjectRegistryEntry;

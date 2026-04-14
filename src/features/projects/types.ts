import type { ProjectStatus } from "@/generated/prisma/enums";

export type ProjectRegistrySettings = {
  siteName: string | null;
  siteUrl: string | null;
  brandingPrimaryColor: string | null;
  brandingLogoUrl: string | null;
  billingEnabled: boolean;
  customerPortalEnabled: boolean;
};

export type ProjectRegistryEntry = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProjectStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  settings: ProjectRegistrySettings | null;
  adminCount: number;
  customerCount: number;
};

export type ProjectRegistryListInput = {
  query?: string;
};

export type ProjectRegistryOverview = {
  totalProjects: number;
  activeProjects: number;
  billingEnabledProjects: number;
  customerPortalProjects: number;
  readyProjects: number;
  setupAttentionProjects: number;
};

export type ProjectRegistryHealth = {
  label: string;
  tone: "default" | "warning";
  detail: string;
};

export type ProjectRegistryAdminContact = {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
};

export type ProjectSetupIssue = {
  label: string;
  detail: string;
  severity: "warning";
};

export type ProjectSetupAudit = {
  blockerCount: number;
  items: ProjectSetupIssue[];
};

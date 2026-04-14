import { ProjectStatus, UserRole } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import type {
  ProjectRegistryAdminContact,
  ProjectRegistryEntry,
  ProjectRegistryHealth,
  ProjectRegistryListInput,
  ProjectRegistryOverview,
  ProjectSetupAudit,
  ProjectSetupIssue,
} from "@/features/projects/types";
import {
  getProjectStatusLabel,
  isProjectOperationalStatus,
} from "@/features/projects/status";
import { prisma } from "@/lib/prisma";

const projectRegistrySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  settings: {
    select: {
      siteName: true,
      siteUrl: true,
      brandingPrimaryColor: true,
      brandingLogoUrl: true,
      billingEnabled: true,
      customerPortalEnabled: true,
    },
  },
} satisfies Prisma.ProjectSelect;

type RawProjectRegistryRecord = Prisma.ProjectGetPayload<{
  select: typeof projectRegistrySelect;
}>;

async function getProjectMemberCounts(projectIds: string[]) {
  if (projectIds.length === 0) {
    return new Map<
      string,
      {
        adminCount: number;
        customerCount: number;
      }
    >();
  }

  const rows = await prisma.user.groupBy({
    by: ["projectId", "role"],
    where: {
      projectId: {
        in: projectIds,
      },
    },
    _count: {
      _all: true,
    },
  });

  const counts = new Map<
    string,
    {
      adminCount: number;
      customerCount: number;
    }
  >();

  for (const row of rows) {
    if (!row.projectId) {
      continue;
    }

    const current = counts.get(row.projectId) ?? {
      adminCount: 0,
      customerCount: 0,
    };

    if (row.role === UserRole.admin) {
      current.adminCount = row._count._all;
    }

    if (row.role === UserRole.customer) {
      current.customerCount = row._count._all;
    }

    counts.set(row.projectId, current);
  }

  return counts;
}

function toProjectRegistryEntry(
  project: RawProjectRegistryRecord,
  memberCounts: {
    adminCount: number;
    customerCount: number;
  } | null,
): ProjectRegistryEntry {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    description: project.description,
    status: project.status,
    isActive: isProjectOperationalStatus(project.status),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    settings: project.settings,
    adminCount: memberCounts?.adminCount ?? 0,
    customerCount: memberCounts?.customerCount ?? 0,
  };
}

export async function getProjectRegistryEntry(
  projectId: string,
): Promise<ProjectRegistryEntry | null> {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: projectRegistrySelect,
  });

  if (!project) {
    return null;
  }

  const memberCounts = await getProjectMemberCounts([project.id]);

  return toProjectRegistryEntry(project, memberCounts.get(project.id) ?? null);
}

export async function listProjectRegistryEntries(
  input: ProjectRegistryListInput = {},
) {
  const query = input.query?.trim();
  const projects = await prisma.project.findMany({
    where: query
      ? {
          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              slug: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        }
      : undefined,
    orderBy: {
      createdAt: "asc",
    },
    select: projectRegistrySelect,
  });

  const memberCounts = await getProjectMemberCounts(
    projects.map((project) => project.id),
  );

  return projects.map((project) =>
    toProjectRegistryEntry(project, memberCounts.get(project.id) ?? null),
  );
}

export async function listProjectRegistryAdmins(
  projectId: string,
): Promise<ProjectRegistryAdminContact[]> {
  return prisma.user.findMany({
    where: {
      projectId,
      role: UserRole.admin,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });
}

export function getProjectRegistryCompleteness(snapshot: ProjectRegistryEntry) {
  const checks = [
    {
      label: "Project name",
      done: snapshot.name.trim().length >= 2,
    },
    {
      label: "Description",
      done: Boolean(snapshot.description?.trim()),
    },
    {
      label: "Site name",
      done: Boolean(snapshot.settings?.siteName?.trim()),
    },
    {
      label: "Site URL",
      done: Boolean(snapshot.settings?.siteUrl?.trim()),
    },
    {
      label: "At least one admin",
      done: snapshot.adminCount > 0,
    },
  ];

  const completedCount = checks.filter((check) => check.done).length;

  return {
    checks,
    completedCount,
    totalCount: checks.length,
    ratio: `${completedCount}/${checks.length}`,
  };
}

export function getProjectRegistryHealth(
  snapshot: ProjectRegistryEntry,
): ProjectRegistryHealth {
  const audit = getProjectSetupAudit(snapshot);

  if (audit.blockerCount === 0 && snapshot.isActive) {
    return {
      label: "Ready",
      tone: "default",
      detail: "Configuration complete and active.",
    };
  }

  if (snapshot.status === ProjectStatus.archived) {
    return {
      label: "Archived",
      tone: "warning",
      detail: "Project is archived and excluded from active operations.",
    };
  }

  if (snapshot.status === ProjectStatus.draft) {
    return {
      label: "Draft",
      tone: "warning",
      detail: "Project is still in draft and not open for live operations yet.",
    };
  }

  if (snapshot.adminCount === 0) {
    return {
      label: "Missing admin",
      tone: "warning",
      detail: "Assign at least one admin before onboarding.",
    };
  }

  return {
    label: "Needs setup",
    tone: "warning",
    detail: `${audit.blockerCount} configuration blocker(s) still require attention.`,
  };
}

export function getProjectSetupAudit(
  snapshot: ProjectRegistryEntry,
): ProjectSetupAudit {
  const items: ProjectSetupIssue[] = [];

  if (snapshot.status === ProjectStatus.draft) {
    items.push({
      label: "Project still in draft",
      detail: "Move the lifecycle to active before exposing the project operationally.",
      severity: "warning",
    });
  }

  if (snapshot.status === ProjectStatus.archived) {
    items.push({
      label: "Project is archived",
      detail: "Archived projects are excluded from live operations and customer access.",
      severity: "warning",
    });
  }

  if (!snapshot.description?.trim()) {
    items.push({
      label: "Description missing",
      detail: "Add a clear project description for onboarding and clone context.",
      severity: "warning",
    });
  }

  if (!snapshot.settings?.siteName?.trim()) {
    items.push({
      label: "Site name missing",
      detail: "Define the customer-facing site name in project settings.",
      severity: "warning",
    });
  }

  if (!snapshot.settings?.siteUrl?.trim()) {
    items.push({
      label: "Site URL missing",
      detail: "Set the canonical URL used by operators and downstream integrations.",
      severity: "warning",
    });
  }

  if (snapshot.adminCount === 0) {
    items.push({
      label: "No admin account assigned",
      detail: "Attach at least one client admin before handoff or onboarding.",
      severity: "warning",
    });
  }

  if (snapshot.settings?.billingEnabled && snapshot.status !== ProjectStatus.billing_enabled) {
    items.push({
      label: "Lifecycle does not reflect billing rollout",
      detail: "Set the project lifecycle to billing-enabled once billing becomes part of the live operating model.",
      severity: "warning",
    });
  }

  if (!snapshot.settings?.billingEnabled && snapshot.status === ProjectStatus.billing_enabled) {
    items.push({
      label: "Billing lifecycle mismatch",
      detail: "The lifecycle says billing-enabled while the module itself is disabled.",
      severity: "warning",
    });
  }

  if (snapshot.settings?.customerPortalEnabled && !isProjectOperationalStatus(snapshot.status)) {
    items.push({
      label: "Customer portal blocked by lifecycle",
      detail: "The customer portal is enabled but the lifecycle state still blocks customer access.",
      severity: "warning",
    });
  }

  return {
    blockerCount: items.length,
    items,
  };
}

export function getProjectRegistryOverview(
  projects: ProjectRegistryEntry[],
): ProjectRegistryOverview {
  return projects.reduce<ProjectRegistryOverview>(
    (summary, project) => {
      const completeness = getProjectRegistryCompleteness(project);
      const audit = getProjectSetupAudit(project);

      summary.totalProjects += 1;

      if (isProjectOperationalStatus(project.status)) {
        summary.activeProjects += 1;
      }

      if (project.settings?.billingEnabled) {
        summary.billingEnabledProjects += 1;
      }

      if (project.settings?.customerPortalEnabled) {
        summary.customerPortalProjects += 1;
      }

      if (
        isProjectOperationalStatus(project.status) &&
        completeness.completedCount === completeness.totalCount
      ) {
        summary.readyProjects += 1;
      }

      if (audit.blockerCount > 0) {
        summary.setupAttentionProjects += 1;
      }

      return summary;
    },
    {
      totalProjects: 0,
      activeProjects: 0,
      billingEnabledProjects: 0,
      customerPortalProjects: 0,
      readyProjects: 0,
      setupAttentionProjects: 0,
    },
  );
}

export { getProjectStatusLabel, isProjectOperationalStatus };

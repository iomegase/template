import { requireProjectAdmin } from "@/features/auth/guards";
import { AdminConsoleOverview } from "@/features/dashboard/components/admin-console-overview";
import { getProjectStatusLabel, isProjectOperationalStatus } from "@/features/projects/status";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const admin = await requireProjectAdmin();
  const project = await prisma.project.findUnique({
    where: {
      id: admin.projectId,
    },
    include: {
      settings: true,
    },
  });

  const [adminCount, customerCount] = await Promise.all([
    prisma.user.count({
      where: {
        projectId: admin.projectId,
        role: "admin",
      },
    }),
    prisma.user.count({
      where: {
        projectId: admin.projectId,
        role: "customer",
      },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">
          Project command center
        </h2>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">
          A darker, productized admin surface inspired by the reference moodboard,
          while keeping the starter scoped to one project and one clear operator space.
        </p>
      </div>
      <AdminConsoleOverview
        projectName={project?.name ?? "Unassigned project"}
        projectSlug={project?.slug ?? "no-project"}
        adminCount={adminCount}
        customerCount={customerCount}
        billingEnabled={Boolean(project?.settings?.billingEnabled)}
        customerPortalEnabled={Boolean(project?.settings?.customerPortalEnabled)}
        isActive={Boolean(project && isProjectOperationalStatus(project.status))}
        projectStatusLabel={project ? getProjectStatusLabel(project.status) : "Draft"}
      />
    </div>
  );
}

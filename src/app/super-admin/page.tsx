import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricGrid } from "@/features/dashboard/components/metric-grid";
import {
  getProjectSetupAudit,
  getProjectRegistryOverview,
  listProjectRegistryEntries,
} from "@/features/projects/service";
import { getCloneReadinessAudit } from "@/features/super-admin/clone-readiness";
import { requireSuperAdmin } from "@/features/super-admin/guards";
import {
  getSuperAdminProjectRoute,
  superAdminAdminsRoute,
  superAdminProjectsRoute,
  superAdminSettingsRoute,
} from "@/features/super-admin/routes";

export default async function SuperAdminPage() {
  await requireSuperAdmin();

  const [projects, cloneAudit] = await Promise.all([
    listProjectRegistryEntries(),
    getCloneReadinessAudit(),
  ]);

  const overview = getProjectRegistryOverview(projects);
  const adminCount = projects.reduce((total, project) => total + project.adminCount, 0);
  const customerCount = projects.reduce(
    (total, project) => total + project.customerCount,
    0,
  );
  const cloneAttentionCount = cloneAudit.totalCount - cloneAudit.readyCount;
  const priorityProjects = projects
    .map((project) => ({
      project,
      audit: getProjectSetupAudit(project),
    }))
    .filter(({ audit }) => audit.blockerCount > 0)
    .sort(
      (left, right) =>
        right.audit.blockerCount - left.audit.blockerCount ||
        right.project.updatedAt.getTime() - left.project.updatedAt.getTime(),
    )
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Platform overview</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Phase 5 turns the super-admin area into an actual productization surface:
          project registry, admin oversight, lifecycle control, module activation and
          clone-readiness without bloating the starter.
        </p>
      </div>

      <MetricGrid
        items={[
          {
            label: "Managed projects",
            value: String(overview.totalProjects),
            hint: "Starter instances currently tracked in the platform registry.",
          },
          {
            label: "Active lifecycle",
            value: String(overview.activeProjects),
            hint: "Projects currently open for live operations.",
          },
          {
            label: "Client admins",
            value: String(adminCount),
            hint: "Admin operators attached to customer back-offices.",
          },
          {
            label: "Portal customers",
            value: String(customerCount),
            hint: "End users currently attached to managed projects.",
          },
          {
            label: "Billing enabled",
            value: String(overview.billingEnabledProjects),
            hint: "Projects where the optional billing module is activated.",
          },
          {
            label: "Needs attention",
            value: String(overview.setupAttentionProjects),
            hint: "Projects with lifecycle drift or missing operational setup.",
            badge:
              overview.setupAttentionProjects > 0 ? "Action required" : "Stable",
          },
          {
            label: "Clone-readiness",
            value: cloneAudit.ratio,
            hint: "Repo-level audit for docs, runtime bootstrap and starter isolation.",
            badge: cloneAttentionCount > 0 ? "Review" : "Ready",
          },
          {
            label: "Customer portal",
            value: String(overview.customerPortalProjects),
            hint: "Projects exposing the end-user dashboard foundation.",
          },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Operational surface</CardTitle>
            <CardDescription>
              The super-admin layer now covers the controls needed to duplicate,
              onboard and supervise starter instances without dropping into page-only logic.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="font-medium text-foreground">Projects registry</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Review lifecycle, module state, readiness blockers and onboarding health
                across all projects.
              </p>
              <Button
                className="mt-4"
                variant="outline"
                render={<Link href={superAdminProjectsRoute} />}
              >
                Open registry
              </Button>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="font-medium text-foreground">Admin oversight</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Create, reassign and retire client admin accounts from a dedicated
                management flow.
              </p>
              <Button
                className="mt-4"
                variant="outline"
                render={<Link href={superAdminAdminsRoute} />}
              >
                Manage admins
              </Button>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="font-medium text-foreground">Clone-readiness</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Validate public docs, runtime scripts and module boundaries before the
                next client clone starts.
              </p>
              <Button
                className="mt-4"
                variant="outline"
                render={<Link href={superAdminSettingsRoute} />}
              >
                Review audit
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform signals</CardTitle>
            <CardDescription>
              Short operator summary for what still blocks the starter from a clean handoff.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span>Clone audit</span>
              <Badge variant="outline">
                {cloneAttentionCount === 0 ? "Ready" : `${cloneAttentionCount} issue(s)`}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span>Operationally ready projects</span>
              <Badge variant="outline">
                {overview.readyProjects}/{overview.totalProjects}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span>Billing rollout coverage</span>
              <Badge variant="outline">
                {overview.billingEnabledProjects}/{overview.totalProjects}
              </Badge>
            </div>
            <div className="rounded-lg border p-4 text-muted-foreground">
              M52 is the stabilization pass: keep the super-admin area wired to real
              services, remove stale placeholders, and leave phase 5 in a clone-ready state.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Priority attention</CardTitle>
          <CardDescription>
            Projects with the most setup blockers right now.
          </CardDescription>
          <CardAction>
            <Button render={<Link href={superAdminProjectsRoute} />}>
              View all projects
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-3">
          {priorityProjects.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              No project currently exposes setup blockers. The registry and clone audit are
              both in a stable state.
            </div>
          ) : (
            priorityProjects.map(({ project, audit }) => (
              <div
                key={project.id}
                className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-start md:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{project.name}</p>
                  <p className="text-xs text-muted-foreground">{project.slug}</p>
                  <p className="text-sm text-muted-foreground">
                    {audit.blockerCount} blocker{audit.blockerCount === 1 ? "" : "s"}.
                    {" "}
                    {audit.items[0]?.label ?? "Configuration review required."}
                  </p>
                </div>
                <Button
                  variant="outline"
                  render={<Link href={getSuperAdminProjectRoute(project.id)} />}
                >
                  Inspect project
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

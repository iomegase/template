import { notFound } from "next/navigation";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAdminBillingSetupIssues,
  getBillingStatusLabel,
  getProjectBillingSummary,
} from "@/features/billing/service";
import { Input } from "@/components/ui/input";
import {
  updatePlatformProjectSettingsAction,
  updateProjectModuleStateAction,
} from "@/features/settings/actions";
import { ProjectSettingsForm } from "@/features/settings/components/project-settings-form";
import {
  getProjectSettingsFormDefaults,
} from "@/features/settings/service";
import {
  getProjectRegistryHealth,
  listProjectRegistryAdmins,
  getProjectRegistryCompleteness,
  getProjectRegistryEntry,
  getProjectSetupAudit,
  getProjectStatusLabel,
} from "@/features/projects/service";
import { requireSuperAdmin } from "@/features/super-admin/guards";
import { projectModuleDefinitions } from "@/features/super-admin/module-controls";
import { superAdminProjectsRoute } from "@/features/super-admin/routes";

export default async function SuperAdminProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await requireSuperAdmin();
  const { projectId } = await params;
  const [project, billing, admins] = await Promise.all([
    getProjectRegistryEntry(projectId),
    getProjectBillingSummary(projectId),
    listProjectRegistryAdmins(projectId),
  ]);

  if (!project) {
    notFound();
  }

  const completeness = getProjectRegistryCompleteness(project);
  const health = getProjectRegistryHealth(project);
  const setupAudit = getProjectSetupAudit(project);
  const billingIssues = billing ? getAdminBillingSetupIssues(billing) : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{project.slug}</Badge>
                <Badge
                  variant="outline"
                  className={
                    health.tone === "warning"
                      ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                      : undefined
                  }
                >
                  {health.label}
                </Badge>
                <Badge variant="outline">
                  {getProjectStatusLabel(project.status)}
                </Badge>
              </div>
              <CardTitle>{project.name}</CardTitle>
            </div>
            <Button variant="outline" render={<Link href={superAdminProjectsRoute} />}>
              Back to projects
            </Button>
          </div>
          <CardDescription>
            Super-admin inspection surface for lifecycle, branding, admin ownership and module state.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border bg-muted/25 p-4">
            <p className="text-sm text-muted-foreground">Setup completeness</p>
            <p className="mt-2 text-3xl font-semibold">{completeness.ratio}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {health.detail}
            </p>
          </div>
          <div className="rounded-xl border bg-muted/25 p-4">
            <p className="text-sm text-muted-foreground">Admin operators</p>
            <p className="mt-2 text-3xl font-semibold">{project.adminCount}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {project.customerCount} customer account{project.customerCount === 1 ? "" : "s"} attached.
            </p>
          </div>
          <div className="rounded-xl border bg-muted/25 p-4">
            <p className="text-sm text-muted-foreground">Billing</p>
            <p className="mt-2 text-3xl font-semibold">
              {billing?.billingEnabled ? "On" : "Off"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {billing ? getBillingStatusLabel(billing.status) : "Not configured"}
            </p>
          </div>
          <div className="rounded-xl border bg-muted/25 p-4">
            <p className="text-sm text-muted-foreground">Last update</p>
            <p className="mt-2 text-3xl font-semibold">
              {project.updatedAt.toLocaleDateString("en-US")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Created {project.createdAt.toLocaleDateString("en-US")}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Project configuration</CardTitle>
            <CardDescription>
              Editable project identity, branding and activation switches for this starter instance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Project slug</p>
                <Input value={project.slug} readOnly />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Site URL</p>
                <Input value={project.settings?.siteUrl ?? "Not configured"} readOnly />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border p-4 text-sm">
                <p className="text-muted-foreground">Site name</p>
                <p className="mt-2 font-medium text-foreground">
                  {project.settings?.siteName ?? "Missing"}
                </p>
              </div>
              <div className="rounded-lg border p-4 text-sm">
                <p className="text-muted-foreground">Brand color</p>
                <p className="mt-2 font-medium text-foreground">
                  {project.settings?.brandingPrimaryColor ?? "Missing"}
                </p>
              </div>
              <div className="rounded-lg border p-4 text-sm">
                <p className="text-muted-foreground">Logo URL</p>
                <p className="mt-2 truncate font-medium text-foreground">
                  {project.settings?.brandingLogoUrl ?? "Missing"}
                </p>
              </div>
            </div>
          <ProjectSettingsForm
            mode="platform"
            defaultValues={getProjectSettingsFormDefaults(project)}
            submitLabel="Save project"
            action={updatePlatformProjectSettingsAction.bind(null, project.id)}
          />
        </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Missing configuration</CardTitle>
              <CardDescription>
                Explicit blockers and mismatches preventing a clean, clone-ready setup.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {setupAudit.blockerCount === 0 ? (
                <div className="rounded-lg border p-4 text-muted-foreground">
                  No core setup blockers detected for this project.
                </div>
              ) : (
                setupAudit.items.map((item) => (
                  <div key={item.label} className="rounded-lg border p-4">
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="mt-2 text-muted-foreground">{item.detail}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Readiness checklist</CardTitle>
              <CardDescription>
                Inspection state before onboarding, billing rollout or cloning.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {completeness.checks.map((check) => (
                <div
                  key={check.label}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span>{check.label}</span>
                  <Badge variant="outline">{check.done ? "Ready" : "Pending"}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin ownership</CardTitle>
              <CardDescription>
                Operators currently attached to this project.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {admins.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-muted-foreground">
                  No admin account is attached to this project yet.
                </div>
              ) : (
                admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {admin.name ?? "Unnamed admin"}
                      </p>
                      <p className="text-muted-foreground">{admin.email}</p>
                    </div>
                    <Badge variant="outline">
                      {admin.createdAt.toLocaleDateString("en-US")}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing inspection</CardTitle>
              <CardDescription>
                Module activation, Stripe readiness and customer linkage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span>Billing state</span>
                <Badge variant="outline">
                  {billing ? getBillingStatusLabel(billing.status) : "Not configured"}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span>Module enabled</span>
                <Badge variant="outline">
                  {billing?.billingEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span>Stripe config</span>
                <Badge variant="outline">
                  {billing?.stripeConfigured ? "Ready" : "Missing key"}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span>Portal readiness</span>
                <Badge variant="outline">
                  {billing?.portalReady ? "Ready" : "Pending"}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span>Stripe customer</span>
                <Badge variant="outline">
                  {billing?.stripeCustomerId ? "Linked" : "Not linked"}
                </Badge>
              </div>
              {billingIssues ? (
                <div className="rounded-lg border border-dashed p-4">
                  <p className="font-medium text-foreground">Billing blockers</p>
                  <ul className="mt-2 space-y-2 text-muted-foreground">
                    {[
                      ...billingIssues.checkout,
                      ...billingIssues.portal,
                      ...billingIssues.guidance,
                    ].length > 0 ? (
                      [...billingIssues.checkout, ...billingIssues.portal, ...billingIssues.guidance].map(
                        (issue) => <li key={issue}>{issue}</li>,
                      )
                    ) : (
                      <li>No billing blockers detected.</li>
                    )}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Module activation</CardTitle>
              <CardDescription>
                Explicit project-level controls for optional modules and customer-facing access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {([
                {
                  key: "billing",
                  enabled: Boolean(project.settings?.billingEnabled),
                },
                {
                  key: "customer_portal",
                  enabled: Boolean(project.settings?.customerPortalEnabled),
                },
              ] as const).map((module) => {
                const config = projectModuleDefinitions[module.key];
                const nextEnabled = !module.enabled;

                return (
                  <div key={module.key} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <p className="font-medium text-foreground">{config.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {config.description}
                        </p>
                        <Badge variant="outline">
                          {module.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {module.enabled
                            ? config.enabledLabel
                            : config.disabledLabel}
                        </p>
                      </div>
                      <form
                        action={updateProjectModuleStateAction.bind(
                          null,
                          project.id,
                          module.key,
                          nextEnabled,
                        )}
                      >
                        <Button
                          type="submit"
                          variant={module.enabled ? "outline" : "default"}
                        >
                          {module.enabled ? "Disable" : "Enable"}
                        </Button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

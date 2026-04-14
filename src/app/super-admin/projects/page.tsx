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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getProjectRegistryHealth,
  getProjectRegistryOverview,
  getProjectRegistryCompleteness,
  getProjectSetupAudit,
  getProjectStatusLabel,
  listProjectRegistryEntries,
} from "@/features/projects/service";
import { requireSuperAdmin } from "@/features/super-admin/guards";
import {
  getSuperAdminProjectRoute,
  superAdminProjectsRoute,
  superAdminSettingsRoute,
} from "@/features/super-admin/routes";

type SuperAdminProjectsPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function SuperAdminProjectsPage({
  searchParams,
}: SuperAdminProjectsPageProps) {
  await requireSuperAdmin();
  const params = searchParams ? await searchParams : undefined;
  const query = params?.q?.trim() ?? "";
  const projects = await listProjectRegistryEntries({ query });
  const overview = getProjectRegistryOverview(projects);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Projects registry</CardTitle>
          <CardDescription>
            Super-admin overview for onboarding, module activation and readiness tracking across all managed starter instances.
          </CardDescription>
          <CardAction>
            <Button render={<Link href={superAdminSettingsRoute} />}>
              Platform settings
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border bg-muted/25 p-4">
            <p className="text-sm text-muted-foreground">Managed projects</p>
            <p className="mt-2 text-3xl font-semibold">{overview.totalProjects}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Total client starter instances in the registry.
            </p>
          </div>
          <div className="rounded-xl border bg-muted/25 p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="mt-2 text-3xl font-semibold">{overview.activeProjects}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Projects currently marked live and operational.
            </p>
          </div>
          <div className="rounded-xl border bg-muted/25 p-4">
            <p className="text-sm text-muted-foreground">Billing enabled</p>
            <p className="mt-2 text-3xl font-semibold">{overview.billingEnabledProjects}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Optional billing module activated per project.
            </p>
          </div>
          <div className="rounded-xl border bg-muted/25 p-4">
            <p className="text-sm text-muted-foreground">Customer portals</p>
            <p className="mt-2 text-3xl font-semibold">{overview.customerPortalProjects}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Projects exposing the end-user dashboard.
            </p>
          </div>
          <div className="rounded-xl border bg-muted/25 p-4">
            <p className="text-sm text-muted-foreground">Ready to onboard</p>
            <p className="mt-2 text-3xl font-semibold">{overview.readyProjects}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Active projects with all core readiness checks complete.
            </p>
          </div>
          <div className="rounded-xl border bg-muted/25 p-4">
            <p className="text-sm text-muted-foreground">Needs attention</p>
            <p className="mt-2 text-3xl font-semibold">{overview.setupAttentionProjects}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Projects with missing configuration or lifecycle mismatches.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between">
            <form className="flex flex-1 gap-2" action={superAdminProjectsRoute}>
              <Input
                name="q"
                defaultValue={query}
                placeholder="Search by project, slug or description"
                className="max-w-md"
              />
              <Button type="submit" variant="outline">
                Search
              </Button>
            </form>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {projects.length} result{projects.length === 1 ? "" : "s"}
              </Badge>
              {query ? (
                <Button
                  variant="ghost"
                  render={<Link href={superAdminProjectsRoute} />}
                >
                  Clear
                </Button>
              ) : null}
            </div>
          </div>
          {projects.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-sm font-medium text-foreground">
                {query ? "No projects match this search." : "No projects registered yet."}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {query
                  ? "Try another slug or clear the current filter."
                  : "Projects will appear here as the starter is duplicated for new client spaces."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Lifecycle</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Readiness</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Last update</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => {
                  const completeness = getProjectRegistryCompleteness(project);
                  const health = getProjectRegistryHealth(project);
                  const audit = getProjectSetupAudit(project);

                  return (
                    <TableRow key={project.id}>
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{project.name}</p>
                          <p className="text-xs text-muted-foreground">{project.slug}</p>
                          <p className="max-w-xs text-xs text-muted-foreground">
                            {project.description ?? "No project description yet."}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="space-y-2">
                          <Badge variant="outline">
                            {getProjectStatusLabel(project.status)}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {health.detail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="space-y-1 text-sm">
                          <p>{project.adminCount} admin</p>
                          <p className="text-muted-foreground">
                            {project.customerCount} customer
                            {project.customerCount === 1 ? "" : "s"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="space-y-2">
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
                          <p className="text-xs text-muted-foreground">
                            {completeness.ratio} checks complete
                          </p>
                          {audit.blockerCount > 0 ? (
                            <p className="text-xs text-amber-200">
                              {audit.blockerCount} blocker{audit.blockerCount === 1 ? "" : "s"}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-col gap-2">
                          <Badge variant="outline">
                            Billing {project.settings?.billingEnabled ? "on" : "off"}
                          </Badge>
                          <Badge variant="outline">
                            Portal {project.settings?.customerPortalEnabled ? "on" : "off"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="align-top text-sm text-muted-foreground">
                        {project.updatedAt.toLocaleDateString("en-US")}
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          render={<Link href={getSuperAdminProjectRoute(project.id)} />}
                        >
                          Open
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

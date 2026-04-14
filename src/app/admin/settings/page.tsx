import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireProjectAdmin } from "@/features/auth/guards";
import { updateAdminProjectSettingsAction } from "@/features/settings/actions";
import { ProjectSettingsForm } from "@/features/settings/components/project-settings-form";
import {
  getProjectCompleteness,
  getProjectSettingsFormDefaults,
  getProjectSettingsSnapshot,
} from "@/features/settings/service";
import { Badge } from "@/components/ui/badge";

export default async function AdminSettingsPage() {
  const admin = await requireProjectAdmin();
  const project = await getProjectSettingsSnapshot(admin.projectId);

  if (!project) {
    throw new Error("Project settings not found.");
  }

  const completeness = getProjectCompleteness(project);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Project settings</CardTitle>
          <CardDescription>
            Typed settings flow with explicit activation flags and reusable validation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectSettingsForm
            mode="admin"
            defaultValues={getProjectSettingsFormDefaults(project)}
            submitLabel="Save settings"
            action={updateAdminProjectSettingsAction}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Configuration state</CardTitle>
          <CardDescription>
            Readiness and module state for the current project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span>Slug</span>
            <Badge variant="outline">
              {project.slug}
            </Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span>Customer portal</span>
            <Badge variant="outline">
              {project.settings?.customerPortalEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span>Billing module</span>
            <Badge variant="outline">
              {project.settings?.billingEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span>Setup completeness</span>
              <Badge variant="outline">{completeness.ratio}</Badge>
            </div>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              {completeness.checks.map((check) => (
                <li key={check.label} className="flex items-center justify-between">
                  <span>{check.label}</span>
                  <Badge variant="outline">{check.done ? "Ready" : "Pending"}</Badge>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span>Brand color</span>
            <Badge variant="outline">
              {project.settings?.brandingPrimaryColor ?? "Not set"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

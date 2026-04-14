import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCustomerProjectAccessState } from "@/features/auth/guards";
import { getProjectStatusLabel } from "@/features/projects/status";

export default async function CustomerDisabledPage() {
  const { project } = await getCustomerProjectAccessState();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer portal unavailable</CardTitle>
        <CardDescription>
          Access is explicitly conditioned by project lifecycle and module activation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="rounded-lg border p-4">
          <p className="font-medium text-foreground">
            This portal is not currently open for customer access.
          </p>
          <p className="mt-2 text-muted-foreground">
            A project admin or super-admin needs to reactivate the project and enable the
            customer portal toggle in project settings.
          </p>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <span>Project</span>
          <Badge variant="outline">{project?.name ?? "Not assigned"}</Badge>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <span>Project status</span>
          <Badge variant="outline">
            {project ? getProjectStatusLabel(project.status) : "Draft"}
          </Badge>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <span>Customer portal</span>
          <Badge variant="outline">
            {project?.settings?.customerPortalEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

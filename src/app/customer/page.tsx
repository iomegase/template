import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricGrid } from "@/features/dashboard/components/metric-grid";
import { requireEnabledCustomerPortal } from "@/features/auth/guards";
import { getProjectStatusLabel } from "@/features/projects/status";

export default async function CustomerPage() {
  const { project } = await requireEnabledCustomerPortal();

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          Welcome back
        </h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          The customer area stays intentionally separate from the admin
          back-office while still reusing the same dashboard shell patterns.
        </p>
      </div>
      <MetricGrid
        items={[
          {
            label: "Workspace",
            value: project?.name ?? "No workspace",
            hint: project?.slug ?? "No project assigned to this account yet.",
          },
          {
            label: "Role",
            value: "Customer",
            hint: "End-user access restricted to the personal portal area.",
          },
          {
            label: "Portal access",
            value: project?.settings?.customerPortalEnabled ? "Enabled" : "Disabled",
            hint: "Controlled centrally from project settings.",
          },
          {
            label: "Billing access",
            value: project?.settings?.billingEnabled ? "Available later" : "Not active",
            hint: "Billing module remains optional in this starter.",
          },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>Portal state</CardTitle>
          <CardDescription>
            Minimal customer-facing foundation before domain-specific features are added.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span>Project lifecycle</span>
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
    </div>
  );
}

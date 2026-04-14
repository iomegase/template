import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireEnabledCustomerPortal } from "@/features/auth/guards";

export default async function CustomerSettingsPage() {
  const { project } = await requireEnabledCustomerPortal();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer settings</CardTitle>
        <CardDescription>
          Early customer-facing configuration visibility for the starter portal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <span>Portal availability</span>
          <Badge variant="outline">
            {project?.settings?.customerPortalEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <span>Billing availability</span>
          <Badge variant="outline">
            {project?.settings?.billingEnabled ? "Future module" : "Not active"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

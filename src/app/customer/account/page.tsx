import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireEnabledCustomerPortal } from "@/features/auth/guards";

export default async function CustomerAccountPage() {
  const { user } = await requireEnabledCustomerPortal();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>
          Personal area kept separate from admin CRUD and project settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium text-foreground">Name</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.name ?? "Unnamed customer"}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium text-foreground">Email</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.email ?? "No email"}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium text-foreground">Role</p>
          <p className="mt-1 text-sm text-muted-foreground">customer</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium text-foreground">Project slug</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.projectSlug ?? "No project"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

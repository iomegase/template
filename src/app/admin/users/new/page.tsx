import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createAdminUserAction } from "@/features/users/actions";
import { AdminUserForm } from "@/features/users/components/admin-user-form";

export default function AdminUserCreatePage() {
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Create admin user</CardTitle>
        <CardDescription>
          Add a new project operator without expanding the fixed role model.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <AdminUserForm
          mode="create"
          submitLabel="Create user"
          action={createAdminUserAction}
        />
        <Button variant="outline" render={<Link href="/admin/users" />}>
          Back to users
        </Button>
      </CardContent>
    </Card>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireProjectAdmin } from "@/features/auth/guards";
import { updateAdminUserAction } from "@/features/users/actions";
import { AdminUserForm } from "@/features/users/components/admin-user-form";
import { getProjectAdminUser } from "@/features/users/service";

export default async function AdminUserEditPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const admin = await requireProjectAdmin();
  const user = await getProjectAdminUser(admin.projectId, userId);

  if (!user) {
    notFound();
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Edit admin user</CardTitle>
        <CardDescription>
          Keep project-local admin accounts explicit and easy to update.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <AdminUserForm
          mode="edit"
          submitLabel="Save user"
          defaultValues={{
            name: user.name ?? "",
            email: user.email,
          }}
          action={updateAdminUserAction.bind(null, user.id)}
        />
        <Button variant="outline" render={<Link href="/admin/users" />}>
          Back to users
        </Button>
      </CardContent>
    </Card>
  );
}

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
import { updateManagedAdminAccountAction } from "@/features/super-admin/admin-accounts/actions";
import { ManagedAdminAccountForm } from "@/features/super-admin/admin-accounts/components/managed-admin-account-form";
import {
  getManagedAdminAccount,
  listProjectOptions,
} from "@/features/super-admin/admin-accounts/service";
import { requireSuperAdmin } from "@/features/super-admin/guards";
import { superAdminAdminsRoute } from "@/features/super-admin/routes";

export default async function SuperAdminEditAdminPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireSuperAdmin();
  const { userId } = await params;
  const [admin, projects] = await Promise.all([
    getManagedAdminAccount(userId),
    listProjectOptions(),
  ]);

  if (!admin) {
    notFound();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit client admin</CardTitle>
        <CardDescription>
          Update identity, password reset and project assignment for this admin account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ManagedAdminAccountForm
          mode="edit"
          projects={projects}
          defaultValues={{
            name: admin.name ?? "",
            email: admin.email,
            projectId: admin.projectId ?? "",
          }}
          submitLabel="Save admin"
          action={updateManagedAdminAccountAction.bind(null, admin.id)}
        />
        <Button variant="outline" render={<Link href={superAdminAdminsRoute} />}>
          Back to admin accounts
        </Button>
      </CardContent>
    </Card>
  );
}

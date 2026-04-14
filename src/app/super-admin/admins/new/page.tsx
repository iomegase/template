import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createManagedAdminAccountAction } from "@/features/super-admin/admin-accounts/actions";
import { ManagedAdminAccountForm } from "@/features/super-admin/admin-accounts/components/managed-admin-account-form";
import { listProjectOptions } from "@/features/super-admin/admin-accounts/service";
import { requireSuperAdmin } from "@/features/super-admin/guards";
import { superAdminAdminsRoute } from "@/features/super-admin/routes";

export default async function SuperAdminNewAdminPage() {
  await requireSuperAdmin();
  const projects = await listProjectOptions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create client admin</CardTitle>
        <CardDescription>
          Create a new admin account and attach it directly to a managed project.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ManagedAdminAccountForm
          mode="create"
          projects={projects}
          submitLabel="Create admin"
          action={createManagedAdminAccountAction}
        />
        <Button variant="outline" render={<Link href={superAdminAdminsRoute} />}>
          Back to admin accounts
        </Button>
      </CardContent>
    </Card>
  );
}

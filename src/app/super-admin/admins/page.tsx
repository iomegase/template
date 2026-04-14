import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteManagedAdminAccountAction } from "@/features/super-admin/admin-accounts/actions";
import { listManagedAdminAccounts } from "@/features/super-admin/admin-accounts/service";
import { requireSuperAdmin } from "@/features/super-admin/guards";
import {
  getSuperAdminAdminEditRoute,
  superAdminAdminsRoute,
  superAdminNewAdminRoute,
} from "@/features/super-admin/routes";

type SuperAdminAdminsPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function SuperAdminAdminsPage({
  searchParams,
}: SuperAdminAdminsPageProps) {
  await requireSuperAdmin();
  const params = searchParams ? await searchParams : undefined;
  const query = params?.q?.trim() ?? "";
  const admins = await listManagedAdminAccounts({ query });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client admin accounts</CardTitle>
        <CardDescription>
          Ownership map and control surface for project back-office access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between">
          <form className="flex flex-1 gap-2" action={superAdminAdminsRoute}>
            <Input
              name="q"
              defaultValue={query}
              placeholder="Search by admin, email or project"
              className="max-w-md"
            />
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
          <div className="flex items-center gap-2">
            <Button render={<Link href={superAdminNewAdminRoute} />}>
              New admin
            </Button>
            <Badge variant="outline">
              {admins.length} result{admins.length === 1 ? "" : "s"}
            </Badge>
            {query ? (
              <Button variant="ghost" render={<Link href={superAdminAdminsRoute} />}>
                Clear
              </Button>
            ) : null}
          </div>
        </div>
        {admins.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="text-sm font-medium text-foreground">
              {query ? "No admin accounts match this search." : "No client admin accounts yet."}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {query
                ? "Try another project slug or email fragment."
                : "Admin accounts will appear here as soon as projects are staffed."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">
                    {admin.name ?? "Unnamed admin"}
                  </TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    {admin.projectName ?? "No project"}
                    <p className="text-xs text-muted-foreground">
                      {admin.projectSlug ?? "n/a"}
                    </p>
                  </TableCell>
                  <TableCell>
                    {admin.createdAt.toLocaleDateString("en-US")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        render={<Link href={getSuperAdminAdminEditRoute(admin.id)} />}
                      >
                        Edit
                      </Button>
                      <form action={deleteManagedAdminAccountAction.bind(null, admin.id)}>
                        <Button size="sm" variant="ghost" type="submit">
                          Remove
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

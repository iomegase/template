import Link from "next/link";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { requireProjectAdmin } from "@/features/auth/guards";
import { deleteAdminUserAction } from "@/features/users/actions";
import { listProjectAdminUsers } from "@/features/users/service";

type AdminUsersPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const admin = await requireProjectAdmin();
  const params = searchParams ? await searchParams : undefined;
  const query = params?.q?.trim() ?? "";
  const users = await listProjectAdminUsers(admin.projectId, {
    query,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>
          Admin-side internal operators for this project.
        </CardDescription>
        <CardAction>
          <Button render={<Link href="/admin/users/new" />}>New user</Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between">
          <form className="flex flex-1 gap-2" action="/admin/users">
            <Input
              name="q"
              defaultValue={query}
              placeholder="Search by name or email"
              className="max-w-md"
            />
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {users.length} result{users.length === 1 ? "" : "s"}
            </Badge>
            {query ? (
              <Button variant="ghost" render={<Link href="/admin/users" />}>
                Clear
              </Button>
            ) : null}
          </div>
        </div>
        {users.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="text-sm font-medium text-foreground">
              {query ? "No admin users match this search." : "No admin users yet."}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {query
                ? "Try another email fragment or clear the current filter."
                : "Create the first operator for this project to validate the reusable CRUD flow."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {record.name ?? "Unnamed user"}
                  </TableCell>
                  <TableCell>{record.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {record.updatedAt.toLocaleDateString("en-US")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        render={<Link href={`/admin/users/${record.id}/edit`} />}
                      >
                        Edit
                      </Button>
                      <form action={deleteAdminUserAction.bind(null, record.id)}>
                        <Button variant="destructive" size="sm" type="submit">
                          Delete
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

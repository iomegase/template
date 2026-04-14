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
import { deleteCustomerAction } from "@/features/customers/actions";
import { listProjectCustomers } from "@/features/customers/service";

type AdminCustomersPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function AdminCustomersPage({
  searchParams,
}: AdminCustomersPageProps) {
  const admin = await requireProjectAdmin();
  const params = searchParams ? await searchParams : undefined;
  const query = params?.q?.trim() ?? "";
  const customers = await listProjectCustomers(admin.projectId, {
    query,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customers</CardTitle>
        <CardDescription>
          Project-local customer list used to validate future CRUD conventions.
        </CardDescription>
        <CardAction>
          <Button render={<Link href="/admin/customers/new" />}>
            New customer
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between">
          <form className="flex flex-1 gap-2" action="/admin/customers">
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
              {customers.length} result{customers.length === 1 ? "" : "s"}
            </Badge>
            {query ? (
              <Button variant="ghost" render={<Link href="/admin/customers" />}>
                Clear
              </Button>
            ) : null}
          </div>
        </div>
        {customers.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="text-sm font-medium text-foreground">
              {query ? "No customers match this search." : "No customers yet."}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {query
                ? "Try another search term or clear the filter."
                : "Add the first customer to validate the second reusable CRUD reference entity."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Last update</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {record.name ?? "Unnamed customer"}
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
                        render={<Link href={`/admin/customers/${record.id}/edit`} />}
                      >
                        Edit
                      </Button>
                      <form action={deleteCustomerAction.bind(null, record.id)}>
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

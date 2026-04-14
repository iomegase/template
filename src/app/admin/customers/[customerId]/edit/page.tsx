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
import { updateCustomerAction } from "@/features/customers/actions";
import { CustomerForm } from "@/features/customers/components/customer-form";
import { getProjectCustomer } from "@/features/customers/service";

export default async function CustomerEditPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const admin = await requireProjectAdmin();
  const customer = await getProjectCustomer(admin.projectId, customerId);

  if (!customer) {
    notFound();
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Edit customer</CardTitle>
        <CardDescription>
          Maintain end-user accounts without mixing them into admin operators.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <CustomerForm
          mode="edit"
          submitLabel="Save customer"
          defaultValues={{
            name: customer.name ?? "",
            email: customer.email,
          }}
          action={updateCustomerAction.bind(null, customer.id)}
        />
        <Button variant="outline" render={<Link href="/admin/customers" />}>
          Back to customers
        </Button>
      </CardContent>
    </Card>
  );
}

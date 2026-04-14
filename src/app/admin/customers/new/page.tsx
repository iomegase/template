import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createCustomerAction } from "@/features/customers/actions";
import { CustomerForm } from "@/features/customers/components/customer-form";

export default function CustomerCreatePage() {
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Create customer</CardTitle>
        <CardDescription>
          Add a new end-user account scoped to the current project portal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <CustomerForm
          mode="create"
          submitLabel="Create customer"
          action={createCustomerAction}
        />
        <Button variant="outline" render={<Link href="/admin/customers" />}>
          Back to customers
        </Button>
      </CardContent>
    </Card>
  );
}

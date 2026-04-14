import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { openCustomerBillingPortalAction } from "@/features/billing/actions";
import { getCustomerBillingAccessState } from "@/features/billing/guards";
import {
  getBillingStatusLabel,
  getCustomerBillingErrorMessage,
  getCustomerBillingMessage,
} from "@/features/billing/service";

type CustomerBillingPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function CustomerBillingPage({
  searchParams,
}: CustomerBillingPageProps) {
  const { project, billingVisible, summary, isPortalEnabled } =
    await getCustomerBillingAccessState();
  const params = searchParams ? await searchParams : undefined;
  const errorMessage = getCustomerBillingErrorMessage(
    params?.error as
      | "customer-billing-unavailable"
      | "portal-not-ready"
      | "stripe-request-failed"
      | undefined,
  );
  const unavailableMessage = getCustomerBillingMessage({
    billingVisible,
    isPortalEnabled,
    billingEnabled: Boolean(summary?.billingEnabled),
    projectActive: Boolean(summary?.projectActive),
    hasStripeCustomer: Boolean(summary?.stripeCustomerId),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing access</CardTitle>
        <CardDescription>
          Customer-facing billing remains conditional on both portal access and module
          activation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {errorMessage ? (
          <div className="rounded-xl border p-5">
            <p className="font-medium text-foreground">{errorMessage.title}</p>
            <p className="mt-2 text-muted-foreground">{errorMessage.description}</p>
          </div>
        ) : null}
        {!billingVisible || !summary ? (
          <div className="rounded-xl border border-dashed p-5">
            <p className="font-medium text-foreground">
              {unavailableMessage.title}
            </p>
            <p className="mt-2 text-muted-foreground">
              {unavailableMessage.description}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="font-medium text-foreground">Project</p>
                <p className="mt-2 text-muted-foreground">
                  {project?.name ?? "Unassigned"}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="font-medium text-foreground">Billing state</p>
                <Badge variant="outline" className="mt-2">
                  {getBillingStatusLabel(summary.status)}
                </Badge>
              </div>
              <div className="rounded-lg border p-4">
                <p className="font-medium text-foreground">Portal status</p>
                <Badge variant="outline" className="mt-2">
                  {summary.portalReady ? "Available" : "Pending"}
                </Badge>
              </div>
            </div>
            <div className="rounded-lg border p-4 text-muted-foreground">
              This route is intentionally lean. It only exposes self-service when the
              project-level billing relationship has already been initialized.
            </div>
            <form action={openCustomerBillingPortalAction}>
              <Button type="submit" disabled={!summary.portalReady}>
                Open billing portal
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}

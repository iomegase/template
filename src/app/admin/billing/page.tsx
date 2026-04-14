import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  openAdminBillingPortalAction,
  startAdminCheckoutAction,
} from "@/features/billing/actions";
import { getAdminBillingAccessState } from "@/features/billing/guards";
import { stripeWebhookRoute } from "@/features/billing/routes";
import {
  getAdminBillingErrorMessage,
  getAdminBillingSetupIssues,
  getBillingStatusLabel,
} from "@/features/billing/service";
import { getProjectStatusLabel } from "@/features/projects/status";

type AdminBillingPageProps = {
  searchParams?: Promise<{
    checkout?: string;
    error?: string;
  }>;
};

function formatCompactValue(value: string | null) {
  if (!value) {
    return "Not connected";
  }

  if (value.length <= 18) {
    return value;
  }

  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

export default async function AdminBillingPage({
  searchParams,
}: AdminBillingPageProps) {
  const { summary } = await getAdminBillingAccessState();
  const params = searchParams ? await searchParams : undefined;
  const checkoutState = params?.checkout;
  const errorMessage = getAdminBillingErrorMessage(
    params?.error as
      | "billing-disabled"
      | "checkout-not-ready"
      | "portal-not-ready"
      | "stripe-request-failed"
      | undefined,
  );
  const setupIssues = getAdminBillingSetupIssues(summary);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
      <div className="space-y-4">
        {errorMessage ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-foreground">{errorMessage.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {errorMessage.description}
              </p>
            </CardContent>
          </Card>
        ) : null}
        {checkoutState ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              {checkoutState === "success"
                ? "Stripe checkout returned successfully. The webhook will finish syncing subscription state."
                : "Stripe checkout was canceled before completion."}
            </CardContent>
          </Card>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>Billing module</CardTitle>
            <CardDescription>
              Optional Stripe extension for this project. It remains isolated from the
              CRUD core and only activates when the project setting is enabled.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium text-foreground">Module state</p>
                <Badge variant="outline" className="mt-2">
                  {summary.billingEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium text-foreground">Subscription state</p>
                <Badge variant="outline" className="mt-2">
                  {getBillingStatusLabel(summary.status)}
                </Badge>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium text-foreground">Stripe customer</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatCompactValue(summary.stripeCustomerId)}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium text-foreground">Renewal date</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {summary.currentPeriodEnd
                    ? summary.currentPeriodEnd.toLocaleDateString("en-US")
                    : "No period scheduled"}
                </p>
              </div>
            </div>

            {!summary.billingEnabled ? (
              <div className="rounded-xl border border-dashed p-5">
                <p className="text-sm font-medium text-foreground">
                  Billing is currently disabled for this project.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enable the billing toggle in project settings before exposing checkout or
                  portal operations.
                </p>
                <div className="mt-4">
                  <Button variant="outline" render={<Link href="/admin/settings" />}>
                    Open project settings
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border p-5">
                <p className="text-sm font-medium text-foreground">Operations</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Checkout initializes the subscription. Portal remains the operational
                  surface for updates after the first connection.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <form action={startAdminCheckoutAction}>
                    <Button type="submit" disabled={!summary.checkoutReady}>
                      Start checkout
                    </Button>
                  </form>
                  <form action={openAdminBillingPortalAction}>
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={!summary.portalReady}
                    >
                      Open billing portal
                    </Button>
                  </form>
                </div>
                {setupIssues.checkout.length > 0 || setupIssues.portal.length > 0 ? (
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-dashed p-4">
                      <p className="text-sm font-medium text-foreground">
                        Checkout blockers
                      </p>
                      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                        {setupIssues.checkout.length > 0 ? (
                          setupIssues.checkout.map((issue) => (
                            <li key={issue}>{issue}</li>
                          ))
                        ) : (
                          <li>Checkout is ready.</li>
                        )}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-dashed p-4">
                      <p className="text-sm font-medium text-foreground">
                        Portal blockers
                      </p>
                      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                        {setupIssues.portal.length > 0 ? (
                          setupIssues.portal.map((issue) => (
                            <li key={issue}>{issue}</li>
                          ))
                        ) : (
                          <li>Billing portal is ready.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Configuration checks</CardTitle>
          <CardDescription>
            Billing stays optional, but once enabled the setup must remain explicit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span>Project lifecycle</span>
            <Badge variant="outline">
              {getProjectStatusLabel(summary.projectStatus)}
            </Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span>STRIPE_SECRET_KEY</span>
            <Badge variant="outline">
              {summary.stripeConfigured ? "Configured" : "Missing"}
            </Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span>STRIPE_PRICE_ID</span>
            <Badge variant="outline">
              {summary.priceConfigured ? "Configured" : "Missing"}
            </Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span>STRIPE_WEBHOOK_SECRET</span>
            <Badge variant="outline">
              {summary.webhookConfigured ? "Configured" : "Missing"}
            </Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span>Admin contact</span>
            <Badge variant="outline">
              {summary.adminEmail ?? "Missing"}
            </Badge>
          </div>
          <div className="rounded-lg border p-3 text-muted-foreground">
            Webhook route: <code>{stripeWebhookRoute}</code>
          </div>
          {setupIssues.guidance.length > 0 ? (
            <div className="rounded-lg border border-dashed p-3">
              <p className="text-sm font-medium text-foreground">Admin guidance</p>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                {setupIssues.guidance.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

import type { BillingStatus, ProjectStatus } from "@/generated/prisma/enums";

export type BillingActionErrorCode =
  | "billing-disabled"
  | "checkout-not-ready"
  | "portal-not-ready"
  | "stripe-request-failed"
  | "customer-billing-unavailable";

export type BillingMessage = {
  title: string;
  description: string;
};

export type BillingSummary = {
  projectId: string;
  projectName: string;
  projectSlug: string;
  projectStatus: ProjectStatus;
  projectActive: boolean;
  billingEnabled: boolean;
  stripeConfigured: boolean;
  webhookConfigured: boolean;
  priceConfigured: boolean;
  checkoutReady: boolean;
  portalReady: boolean;
  adminEmail: string | null;
  siteUrl: string | null;
  status: BillingStatus | "not_started";
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  currentPeriodEnd: Date | null;
};

export type BillingEnvironmentState = {
  appUrl: string;
  stripeSecretKey: string | null;
  stripeWebhookSecret: string | null;
  stripePriceId: string | null;
  stripeConfigured: boolean;
  webhookConfigured: boolean;
  priceConfigured: boolean;
};

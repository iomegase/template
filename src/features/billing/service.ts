import Stripe from "stripe";

import { BillingStatus, UserRole } from "@/generated/prisma/enums";
import { getAdminBillingCheckoutRoute } from "@/features/billing/routes";
import type {
  BillingActionErrorCode,
  BillingEnvironmentState,
  BillingMessage,
  BillingSummary,
} from "@/features/billing/types";
import { isProjectOperationalStatus } from "@/features/projects/status";
import { prisma } from "@/lib/prisma";
import {
  getStripeClient,
  getStripeEnvironmentState,
  getStripeReturnUrl,
  normalizeOptionalValue,
  resolveStripeEntityId,
} from "@/lib/stripe";

function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): BillingStatus {
  switch (status) {
    case "trialing":
    case "active":
      return BillingStatus.active;
    case "past_due":
    case "unpaid":
      return BillingStatus.past_due;
    case "canceled":
      return BillingStatus.canceled;
    default:
      return BillingStatus.inactive;
  }
}

function resolveSubscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const firstItemPeriodEnd = subscription.items.data[0]?.current_period_end;

  if (typeof firstItemPeriodEnd !== "number") {
    return null;
  }

  return new Date(firstItemPeriodEnd * 1000);
}

async function findProjectIdByStripePointers(input: {
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}) {
  const whereClauses = [
    input.stripeCustomerId
      ? {
          stripeCustomerId: input.stripeCustomerId,
        }
      : null,
    input.stripeSubscriptionId
      ? {
          stripeSubscriptionId: input.stripeSubscriptionId,
        }
      : null,
  ].filter((clause) => clause !== null);

  if (whereClauses.length === 0) {
    return null;
  }

  const billing = await prisma.projectBilling.findFirst({
    where: {
      OR: whereClauses,
    },
    select: {
      projectId: true,
    },
  });

  return billing?.projectId ?? null;
}

async function upsertProjectBillingRecord(
  projectId: string,
  data: {
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    stripePriceId?: string | null;
    status?: BillingStatus;
    currentPeriodEnd?: Date | null;
    lastWebhookEventAt?: Date | null;
  },
) {
  const existing = await prisma.projectBilling.findUnique({
    where: {
      projectId,
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    return prisma.projectBilling.update({
      where: {
        projectId,
      },
      data,
    });
  }

  return prisma.projectBilling.create({
    data: {
      projectId,
      status: data.status ?? BillingStatus.inactive,
      stripeCustomerId: data.stripeCustomerId ?? null,
      stripeSubscriptionId: data.stripeSubscriptionId ?? null,
      stripePriceId: data.stripePriceId ?? null,
      currentPeriodEnd: data.currentPeriodEnd ?? null,
      lastWebhookEventAt: data.lastWebhookEventAt ?? null,
    },
  });
}

export function getBillingEnvironmentState(): BillingEnvironmentState {
  const stripe = getStripeEnvironmentState();
  const stripePriceId = normalizeOptionalValue(process.env.STRIPE_PRICE_ID);

  return {
    appUrl: stripe.appUrl,
    stripeSecretKey: stripe.stripeSecretKey,
    stripeWebhookSecret: stripe.stripeWebhookSecret,
    stripePriceId,
    stripeConfigured: stripe.stripeConfigured,
    webhookConfigured: stripe.webhookConfigured,
    priceConfigured: Boolean(stripePriceId),
  };
}

export function getBillingStatusLabel(
  status: BillingSummary["status"],
) {
  switch (status) {
    case "active":
      return "Active";
    case "past_due":
      return "Past due";
    case "canceled":
      return "Canceled";
    case "checkout_pending":
      return "Checkout pending";
    case "inactive":
      return "Inactive";
    default:
      return "Not started";
  }
}

export function getAdminBillingSetupIssues(summary: BillingSummary) {
  const checkout: string[] = [];
  const portal: string[] = [];
  const guidance: string[] = [];

  if (!summary.billingEnabled) {
    guidance.push("Enable the billing module in project settings.");
  }

  if (!summary.projectActive) {
    checkout.push("The project is inactive.");
    portal.push("The project is inactive.");
  }

  if (!summary.stripeConfigured) {
    checkout.push("STRIPE_SECRET_KEY is missing.");
    portal.push("STRIPE_SECRET_KEY is missing.");
  }

  if (!summary.priceConfigured) {
    checkout.push("STRIPE_PRICE_ID is missing.");
  }

  if (!summary.adminEmail && !summary.stripeCustomerId) {
    checkout.push("No admin contact email is available for the first checkout.");
  }

  if (!summary.stripeCustomerId) {
    portal.push("No Stripe customer is connected yet.");
  }

  if (!summary.webhookConfigured) {
    guidance.push("Configure STRIPE_WEBHOOK_SECRET to keep subscription state in sync.");
  }

  return {
    checkout,
    portal,
    guidance,
  };
}

export function getCustomerBillingMessage(input: {
  billingVisible: boolean;
  isPortalEnabled: boolean;
  billingEnabled: boolean;
  projectActive: boolean;
  hasStripeCustomer: boolean;
}) {
  if (!input.isPortalEnabled) {
    return {
      title: "Customer portal is disabled.",
      description:
        "A project admin must re-enable the customer portal before billing self-service can be exposed here.",
    } satisfies BillingMessage;
  }

  if (!input.billingEnabled) {
    return {
      title: "Billing module is disabled.",
      description:
        "This project currently uses the starter core without the optional billing extension.",
    } satisfies BillingMessage;
  }

  if (!input.projectActive) {
    return {
      title: "Project access is inactive.",
      description:
        "Billing self-service stays unavailable while the project lifecycle is marked inactive.",
    } satisfies BillingMessage;
  }

  if (!input.hasStripeCustomer) {
    return {
      title: "Billing setup is not finished yet.",
      description:
        "The billing relationship has not been initialized yet, so the customer portal cannot open a Stripe session.",
    } satisfies BillingMessage;
  }

  if (!input.billingVisible) {
    return {
      title: "Billing is not available.",
      description:
        "Billing remains hidden until both the portal and project configuration are ready.",
    } satisfies BillingMessage;
  }

  return {
    title: "Billing is available.",
    description:
      "Self-service billing can be accessed from this customer workspace.",
  } satisfies BillingMessage;
}

export function getAdminBillingErrorMessage(
  code: BillingActionErrorCode | undefined,
) {
  switch (code) {
    case "billing-disabled":
      return {
        title: "Billing is disabled.",
        description:
          "Enable the billing toggle in project settings before retrying this action.",
      } satisfies BillingMessage;
    case "checkout-not-ready":
      return {
        title: "Checkout is not ready.",
        description:
          "The project is missing part of its Stripe setup, or it is still inactive.",
      } satisfies BillingMessage;
    case "portal-not-ready":
      return {
        title: "Billing portal is not ready.",
        description:
          "A Stripe customer must exist before the portal can be opened for this project.",
      } satisfies BillingMessage;
    case "stripe-request-failed":
      return {
        title: "Stripe request failed.",
        description:
          "The request reached the billing action, but Stripe could not complete it. Check the server logs and environment variables.",
      } satisfies BillingMessage;
    default:
      return null;
  }
}

export function getCustomerBillingErrorMessage(
  code: BillingActionErrorCode | undefined,
) {
  switch (code) {
    case "customer-billing-unavailable":
      return {
        title: "Billing is not available for this customer space.",
        description:
          "The project billing relationship is not ready, or the portal is disabled for customers.",
      } satisfies BillingMessage;
    case "portal-not-ready":
      return {
        title: "Billing portal is not ready.",
        description:
          "The project does not yet have a Stripe customer connection for self-service billing.",
      } satisfies BillingMessage;
    case "stripe-request-failed":
      return {
        title: "Stripe request failed.",
        description:
          "The billing portal could not be opened at this time. Retry after checking the project setup.",
      } satisfies BillingMessage;
    default:
      return null;
  }
}

export async function getProjectBillingSummary(
  projectId: string,
): Promise<BillingSummary | null> {
  const env = getBillingEnvironmentState();
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    include: {
      settings: true,
      billing: true,
      admins: {
        where: {
          role: UserRole.admin,
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          email: true,
        },
        take: 1,
      },
    },
  });

  if (!project) {
    return null;
  }

  const billingEnabled = Boolean(project.settings?.billingEnabled);

  return {
    projectId: project.id,
    projectName: project.name,
    projectSlug: project.slug,
    projectStatus: project.status,
    projectActive: isProjectOperationalStatus(project.status),
    billingEnabled,
    stripeConfigured: env.stripeConfigured,
    webhookConfigured: env.webhookConfigured,
    priceConfigured: env.priceConfigured,
    checkoutReady:
      billingEnabled &&
      isProjectOperationalStatus(project.status) &&
      env.stripeConfigured &&
      env.priceConfigured,
    portalReady:
      billingEnabled &&
      isProjectOperationalStatus(project.status) &&
      env.stripeConfigured &&
      Boolean(project.billing?.stripeCustomerId),
    adminEmail: project.admins[0]?.email ?? null,
    siteUrl: project.settings?.siteUrl ?? null,
    status: project.billing?.status ?? "not_started",
    stripeCustomerId: project.billing?.stripeCustomerId ?? null,
    stripeSubscriptionId: project.billing?.stripeSubscriptionId ?? null,
    stripePriceId: project.billing?.stripePriceId ?? null,
    currentPeriodEnd: project.billing?.currentPeriodEnd ?? null,
  };
}

export async function createCheckoutSessionForProject(projectId: string) {
  const summary = await getProjectBillingSummary(projectId);
  const env = getBillingEnvironmentState();

  if (!summary) {
    throw new Error("Project billing summary not found.");
  }

  if (!summary.billingEnabled) {
    throw new Error("Billing is disabled for this project.");
  }

  if (!summary.checkoutReady || !env.stripePriceId) {
    throw new Error("Stripe checkout is not configured for this project.");
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    allow_promotion_codes: true,
    success_url: getStripeReturnUrl(getAdminBillingCheckoutRoute("success")),
    cancel_url: getStripeReturnUrl(getAdminBillingCheckoutRoute("canceled")),
    line_items: [
      {
        price: env.stripePriceId,
        quantity: 1,
      },
    ],
    client_reference_id: projectId,
    metadata: {
      projectId,
    },
    subscription_data: {
      metadata: {
        projectId,
      },
    },
    customer: summary.stripeCustomerId ?? undefined,
    customer_email:
      summary.stripeCustomerId === null ? summary.adminEmail ?? undefined : undefined,
  });

  await upsertProjectBillingRecord(projectId, {
    status: BillingStatus.checkout_pending,
    stripeCustomerId:
      typeof session.customer === "string"
        ? session.customer
        : summary.stripeCustomerId,
    stripeSubscriptionId:
      typeof session.subscription === "string"
        ? session.subscription
        : summary.stripeSubscriptionId,
    stripePriceId: env.stripePriceId,
  });

  if (!session.url) {
    throw new Error("Stripe checkout session did not return a URL.");
  }

  return session.url;
}

export async function createBillingPortalSessionForProject(
  projectId: string,
  returnPath: string,
) {
  const summary = await getProjectBillingSummary(projectId);

  if (!summary) {
    throw new Error("Project billing summary not found.");
  }

  if (!summary.billingEnabled) {
    throw new Error("Billing is disabled for this project.");
  }

  if (!summary.portalReady || !summary.stripeCustomerId) {
    throw new Error("Stripe billing portal is not available for this project.");
  }

  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: summary.stripeCustomerId,
    return_url: getStripeReturnUrl(returnPath),
  });

  return session.url;
}

export async function syncProjectBillingFromCheckoutSession(
  session: Stripe.Checkout.Session,
) {
  const projectId =
    normalizeOptionalValue(session.metadata?.projectId) ??
    normalizeOptionalValue(session.client_reference_id) ??
    (await findProjectIdByStripePointers({
      stripeCustomerId: resolveStripeEntityId(session.customer),
      stripeSubscriptionId:
        typeof session.subscription === "string" ? session.subscription : null,
    }));

  if (!projectId) {
    return;
  }

  await upsertProjectBillingRecord(projectId, {
    status: BillingStatus.checkout_pending,
    stripeCustomerId: resolveStripeEntityId(session.customer),
    stripeSubscriptionId:
      typeof session.subscription === "string" ? session.subscription : null,
    lastWebhookEventAt: new Date(),
  });
}

export async function syncProjectBillingFromSubscription(
  subscription: Stripe.Subscription,
) {
  const projectId =
    normalizeOptionalValue(subscription.metadata?.projectId) ??
    (await findProjectIdByStripePointers({
      stripeCustomerId: resolveStripeEntityId(subscription.customer),
      stripeSubscriptionId: subscription.id,
    }));

  if (!projectId) {
    return;
  }

  await upsertProjectBillingRecord(projectId, {
    status: mapStripeSubscriptionStatus(subscription.status),
    stripeCustomerId: resolveStripeEntityId(subscription.customer),
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0]?.price.id ?? null,
    currentPeriodEnd: resolveSubscriptionPeriodEnd(subscription),
    lastWebhookEventAt: new Date(),
  });
}

"use server";

import { redirect } from "next/navigation";

import {
  getAdminBillingAccessState,
  getCustomerBillingAccessState,
} from "@/features/billing/guards";
import {
  adminBillingRoute,
  customerBillingRoute,
  getAdminBillingErrorRoute,
  getCustomerBillingErrorRoute,
} from "@/features/billing/routes";
import {
  createBillingPortalSessionForProject,
  createCheckoutSessionForProject,
} from "@/features/billing/service";

export async function startAdminCheckoutAction() {
  const { summary } = await getAdminBillingAccessState();

  if (!summary.billingEnabled) {
    redirect(getAdminBillingErrorRoute("billing-disabled"));
  }

  if (!summary.checkoutReady) {
    redirect(getAdminBillingErrorRoute("checkout-not-ready"));
  }

  let sessionUrl: string;

  try {
    sessionUrl = await createCheckoutSessionForProject(summary.projectId);
  } catch {
    redirect(getAdminBillingErrorRoute("stripe-request-failed"));
  }

  redirect(sessionUrl);
}

export async function openAdminBillingPortalAction() {
  const { summary } = await getAdminBillingAccessState();

  if (!summary.billingEnabled) {
    redirect(getAdminBillingErrorRoute("billing-disabled"));
  }

  if (!summary.portalReady) {
    redirect(getAdminBillingErrorRoute("portal-not-ready"));
  }

  let sessionUrl: string;

  try {
    sessionUrl = await createBillingPortalSessionForProject(
      summary.projectId,
      adminBillingRoute,
    );
  } catch {
    redirect(getAdminBillingErrorRoute("stripe-request-failed"));
  }

  redirect(sessionUrl);
}

export async function openCustomerBillingPortalAction() {
  const { summary, billingVisible } = await getCustomerBillingAccessState();

  if (!billingVisible || !summary) {
    redirect(getCustomerBillingErrorRoute("customer-billing-unavailable"));
  }

  if (!summary.portalReady) {
    redirect(getCustomerBillingErrorRoute("portal-not-ready"));
  }

  let sessionUrl: string;

  try {
    sessionUrl = await createBillingPortalSessionForProject(
      summary.projectId,
      customerBillingRoute,
    );
  } catch {
    redirect(getCustomerBillingErrorRoute("stripe-request-failed"));
  }

  redirect(sessionUrl);
}

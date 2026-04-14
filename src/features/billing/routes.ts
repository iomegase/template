import type { BillingActionErrorCode } from "@/features/billing/types";

export const adminBillingRoute = "/admin/billing";
export const customerBillingRoute = "/customer/billing";
export const stripeWebhookRoute = "/api/webhooks/stripe";

export type BillingCheckoutState = "success" | "canceled";

export function getAdminBillingErrorRoute(code: BillingActionErrorCode) {
  return `${adminBillingRoute}?error=${code}`;
}

export function getCustomerBillingErrorRoute(code: BillingActionErrorCode) {
  return `${customerBillingRoute}?error=${code}`;
}

export function getAdminBillingCheckoutRoute(state: BillingCheckoutState) {
  return `${adminBillingRoute}?checkout=${state}`;
}

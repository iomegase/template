import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export type StripeEnvironmentState = {
  appUrl: string;
  stripeSecretKey: string | null;
  stripeWebhookSecret: string | null;
  stripeConfigured: boolean;
  webhookConfigured: boolean;
};

export function normalizeOptionalValue(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function resolveStripeEntityId(
  value:
    | string
    | {
        id: string;
      }
    | null
    | undefined,
) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return normalizeOptionalValue(value);
  }

  return normalizeOptionalValue(value.id);
}

export function getStripeEnvironmentState(): StripeEnvironmentState {
  const stripeSecretKey = normalizeOptionalValue(process.env.STRIPE_SECRET_KEY);
  const stripeWebhookSecret = normalizeOptionalValue(
    process.env.STRIPE_WEBHOOK_SECRET,
  );
  const appUrl =
    normalizeOptionalValue(process.env.APP_URL) ??
    normalizeOptionalValue(process.env.NEXTAUTH_URL) ??
    "http://localhost:3000";

  return {
    appUrl,
    stripeSecretKey,
    stripeWebhookSecret,
    stripeConfigured: Boolean(stripeSecretKey),
    webhookConfigured: Boolean(stripeSecretKey && stripeWebhookSecret),
  };
}

export function getStripeReturnUrl(path: string) {
  return new URL(path, getStripeEnvironmentState().appUrl).toString();
}

export function getStripeClient() {
  const env = getStripeEnvironmentState();

  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is missing.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.stripeSecretKey);
  }

  return stripeClient;
}

export async function constructStripeWebhookEvent(request: Request) {
  const env = getStripeEnvironmentState();

  if (!env.webhookConfigured || !env.stripeWebhookSecret) {
    throw new Error("Stripe webhook environment is incomplete.");
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    throw new Error("Missing Stripe signature.");
  }

  const payload = await request.text();

  return getStripeClient().webhooks.constructEventAsync(
    payload,
    signature,
    env.stripeWebhookSecret,
  );
}

import { NextResponse } from "next/server";

import {
  syncProjectBillingFromCheckoutSession,
  syncProjectBillingFromSubscription,
} from "@/features/billing/service";
import { syncBookingFromCheckoutSession } from "@/features/payments/service";
import { constructStripeWebhookEvent } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const event = await constructStripeWebhookEvent(request);

    switch (event.type) {
      case "checkout.session.completed": {
        const handled = await syncBookingFromCheckoutSession(event.data.object);

        if (!handled) {
          await syncProjectBillingFromCheckoutSession(event.data.object);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncProjectBillingFromSubscription(event.data.object);
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Stripe webhook error.";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 400,
      },
    );
  }
}

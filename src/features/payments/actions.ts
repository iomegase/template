"use server";

import type { BookingCheckoutActionResult } from "@/features/payments/types";
import { createBookingCheckoutSession } from "@/features/payments/service";

export async function createBookingCheckoutAction(input: {
  offeringSlug: string;
  values: unknown;
}): Promise<BookingCheckoutActionResult> {
  try {
    return await createBookingCheckoutSession(input);
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Booking checkout failed unexpectedly.",
    };
  }
}

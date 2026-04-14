export type BookingCheckoutActionResult =
  | {
      ok: true;
      checkoutUrl: string;
    }
  | {
      ok: false;
      error: string;
    };

export type BookingCheckoutState = "success" | "canceled";

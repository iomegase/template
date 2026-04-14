export const bookingEntryBaseRoute = "/sejour" as const;

export function getBookingEntryRoute(offeringSlug: string) {
  return `${bookingEntryBaseRoute}/${offeringSlug}`;
}

export function getBookingConfirmationRoute(input: {
  offeringSlug: string;
  bookingReference: string;
}) {
  return `${getBookingEntryRoute(input.offeringSlug)}/confirmation/${input.bookingReference}`;
}

export function getBookingCheckoutReturnRoute(input: {
  offeringSlug: string;
  bookingReference: string;
  state: "success" | "canceled";
}) {
  if (input.state === "success") {
    return getBookingConfirmationRoute(input);
  }

  return `${getBookingEntryRoute(input.offeringSlug)}?checkout=${input.state}&booking=${input.bookingReference}`;
}

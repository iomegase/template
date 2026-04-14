import Stripe from "stripe";

import { BookingStatus, CompanionType, PaymentMode } from "@/generated/prisma/enums";
import { bookingFunnelFormSchema } from "@/features/bookings/schema";
import {
  createOrUpdateBookingForCheckout,
  generateBookingReference,
  getBookingById,
  getCompanionTypeFromYogaParticipation,
  getTargetBookingStatusAfterPayment,
  updateBookingPaymentState,
} from "@/features/bookings/service";
import { getPublicOfferingBySlug } from "@/features/offerings/service";
import { getBookingInstallmentPlan, getBookingPricingSnapshot } from "@/features/pricing/service";
import { getBookingCheckoutReturnRoute } from "@/features/payments/routes";
import {
  getStripeClient,
  getStripeEnvironmentState,
  getStripeReturnUrl,
  normalizeOptionalValue,
  resolveStripeEntityId,
} from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export type BookingCheckoutInput = {
  offeringSlug: string;
  values: unknown;
};

function toStripeMetadata(input: {
  bookingId: string;
  bookingReference: string;
  offeringId: string;
  offeringSlug: string;
  offeringType: string;
  roomId: string;
  paymentMode: string;
  totalAmount: number;
  dueNow: number;
  dueLater: number;
  mainGuestEmail: string;
  mainGuestFirstName: string;
  mainGuestLastName: string;
  installmentStep: "initial" | "balance";
}) {
  return {
    flow: "booking",
    installmentStep: input.installmentStep,
    bookingId: input.bookingId,
    bookingReference: input.bookingReference,
    offeringId: input.offeringId,
    offeringSlug: input.offeringSlug,
    offeringType: input.offeringType,
    roomId: input.roomId,
    paymentMode: input.paymentMode,
    totalAmount: String(input.totalAmount),
    amountDueNow: String(input.dueNow),
    amountDueLater: String(input.dueLater),
    mainGuestEmail: input.mainGuestEmail,
    mainGuestFirstName: input.mainGuestFirstName,
    mainGuestLastName: input.mainGuestLastName,
  };
}

function getAmountDueNow(input: {
  paymentMode: PaymentMode;
  totalAmount: number;
  firstInstallmentAmount: number;
  amountRemaining?: number;
  installmentStep?: "initial" | "balance";
}) {
  if (input.installmentStep === "balance") {
    return input.amountRemaining ?? 0;
  }

  if (input.paymentMode === PaymentMode.full) {
    return input.totalAmount;
  }

  return input.firstInstallmentAmount;
}

function asStripeUnitAmount(amount: number) {
  return Math.round(amount * 100);
}

export function isBookingCheckoutEvent(session: Stripe.Checkout.Session) {
  return normalizeOptionalValue(session.metadata?.flow) === "booking";
}

export async function createBookingCheckoutSession(input: BookingCheckoutInput) {
  const parsed = bookingFunnelFormSchema.safeParse(input.values);

  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid booking payload.",
    };
  }

  const offering = await getPublicOfferingBySlug(input.offeringSlug);

  if (!offering) {
    return {
      ok: false as const,
      error: "Offering not found.",
    };
  }

  if (!offering.isBookable) {
    return {
      ok: false as const,
      error: "This offering is not open for booking.",
    };
  }

  const room = offering.rooms.find((candidate) => candidate.id === parsed.data.roomId);

  if (!room || room.isSoldOut) {
    return {
      ok: false as const,
      error: "Selected room is no longer available.",
    };
  }

  const env = getStripeEnvironmentState();

  if (!env.stripeConfigured) {
    return {
      ok: false as const,
      error: "Stripe checkout is not configured yet.",
    };
  }

  const companionType =
    parsed.data.hasCompanion && parsed.data.companionTraveler
      ? getCompanionTypeFromYogaParticipation(
          parsed.data.companionTraveler.participatesInYoga,
        )
      : undefined;

  const pricing = getBookingPricingSnapshot({
    roomBasePrice: room.basePrice,
    companionYogaSurcharge: room.companionYogaSurcharge,
    companionNoYogaSurcharge: room.companionNoYogaSurcharge,
    currency: room.currency,
    paymentMode: parsed.data.paymentMode,
    hasCompanion: parsed.data.hasCompanion,
    companionType,
    offeringStartDate: offering.startDate,
  });

  const installmentPlan = getBookingInstallmentPlan({
    paymentMode: parsed.data.paymentMode,
    totalAmount: pricing.totalAmount,
    firstInstallmentAmount: pricing.firstInstallmentAmount,
    secondInstallmentAmount: pricing.secondInstallmentAmount,
    offeringStartDate: offering.startDate,
  });

  const booking = await createOrUpdateBookingForCheckout({
    offeringId: offering.id,
    roomId: room.id,
    bookingReference: generateBookingReference(),
    status: BookingStatus.payment_pending,
    paymentMode: parsed.data.paymentMode,
    hasCompanion: parsed.data.hasCompanion,
    companionType,
    pricing,
    installmentPlan,
    mainTraveler: parsed.data.mainTraveler,
    companionTraveler: parsed.data.hasCompanion
      ? {
          ...parsed.data.companionTraveler!,
          participatesInYoga:
            companionType === CompanionType.with_yoga,
        }
      : undefined,
  });

  const dueNow = getAmountDueNow({
    paymentMode: booking.paymentMode,
    totalAmount: booking.totalAmount,
    firstInstallmentAmount: booking.firstInstallmentAmount,
  });

  const metadata = toStripeMetadata({
    bookingId: booking.id,
    bookingReference: booking.bookingReference,
    offeringId: offering.id,
    offeringSlug: offering.slug,
    offeringType: offering.offeringType,
    roomId: room.id,
    paymentMode: booking.paymentMode,
    totalAmount: booking.totalAmount,
    dueNow,
    dueLater: booking.secondInstallmentAmount,
    mainGuestEmail: parsed.data.mainTraveler.email,
    mainGuestFirstName: parsed.data.mainTraveler.firstName,
    mainGuestLastName: parsed.data.mainTraveler.lastName,
    installmentStep: "initial",
  });

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: getStripeReturnUrl(
      getBookingCheckoutReturnRoute({
        offeringSlug: offering.slug,
        bookingReference: booking.bookingReference,
        state: "success",
      }),
    ),
    cancel_url: getStripeReturnUrl(
      getBookingCheckoutReturnRoute({
        offeringSlug: offering.slug,
        bookingReference: booking.bookingReference,
        state: "canceled",
      }),
    ),
    client_reference_id: booking.id,
    customer: booking.stripeCustomerId ?? undefined,
    customer_email:
      booking.stripeCustomerId === null
        ? parsed.data.mainTraveler.email
        : undefined,
    metadata,
    payment_intent_data: {
      metadata,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: booking.currency.toLowerCase(),
          unit_amount: asStripeUnitAmount(dueNow),
          product_data: {
            name: offering.title,
            description:
              booking.paymentMode === PaymentMode.full
                ? `${room.name} • full payment`
                : `${room.name} • first installment`,
          },
        },
      },
    ],
  });

  await updateBookingPaymentState({
    bookingId: booking.id,
    status: BookingStatus.payment_pending,
    amountPaid: booking.amountPaid,
    amountRemaining: booking.amountRemaining,
    stripeCheckoutSessionId: session.id,
    stripeCustomerId:
      typeof session.customer === "string"
        ? session.customer
        : booking.stripeCustomerId,
  });

  if (!session.url) {
    return {
      ok: false as const,
      error: "Stripe checkout session did not return a URL.",
    };
  }

  return {
    ok: true as const,
    checkoutUrl: session.url,
  };
}

export async function createRemainingBalanceCheckoutSession(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
    include: {
      offering: true,
      room: true,
      mainTraveler: true,
    },
  });

  if (!booking || !booking.mainTraveler) {
    throw new Error("Booking not found.");
  }

  const amountRemaining = Number(booking.amountRemaining);

  if (
    booking.paymentMode !== PaymentMode.split_2x ||
    amountRemaining <= 0
  ) {
    throw new Error("This booking does not require a balance payment.");
  }

  const stripe = getStripeClient();
  const dueNow = amountRemaining;
  const metadata = toStripeMetadata({
    bookingId: booking.id,
    bookingReference: booking.bookingReference,
    offeringId: booking.offeringId,
    offeringSlug: booking.offering.slug,
    offeringType: booking.offering.offeringType,
    roomId: booking.roomId,
    paymentMode: booking.paymentMode,
    totalAmount: Number(booking.totalAmount),
    dueNow: Number(dueNow),
    dueLater: 0,
    mainGuestEmail: booking.mainTraveler.email,
    mainGuestFirstName: booking.mainTraveler.firstName,
    mainGuestLastName: booking.mainTraveler.lastName,
    installmentStep: "balance",
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: getStripeReturnUrl(
      getBookingCheckoutReturnRoute({
        offeringSlug: booking.offering.slug,
        bookingReference: booking.bookingReference,
        state: "success",
      }),
    ),
    cancel_url: getStripeReturnUrl(
      getBookingCheckoutReturnRoute({
        offeringSlug: booking.offering.slug,
        bookingReference: booking.bookingReference,
        state: "canceled",
      }),
    ),
    client_reference_id: booking.id,
    customer: booking.stripeCustomerId ?? undefined,
    customer_email:
      booking.stripeCustomerId === null ? booking.mainTraveler.email : undefined,
    metadata,
    payment_intent_data: {
      metadata,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: booking.currency.toLowerCase(),
          unit_amount: asStripeUnitAmount(Number(dueNow)),
          product_data: {
            name: booking.offering.title,
            description: `${booking.room.name} • remaining balance`,
          },
        },
      },
    ],
  });

  await updateBookingPaymentState({
    bookingId: booking.id,
    status: BookingStatus.payment_pending,
    amountPaid: Number(booking.amountPaid),
    amountRemaining,
    stripeCheckoutSessionId: session.id,
    stripeCustomerId:
      typeof session.customer === "string"
        ? session.customer
        : booking.stripeCustomerId,
  });

  if (!session.url) {
    throw new Error("Stripe checkout session did not return a URL.");
  }

  return session.url;
}

export async function syncBookingFromCheckoutSession(
  session: Stripe.Checkout.Session,
) {
  if (!isBookingCheckoutEvent(session)) {
    return false;
  }

  const bookingId =
    normalizeOptionalValue(session.metadata?.bookingId) ??
    normalizeOptionalValue(session.client_reference_id);

  if (!bookingId) {
    throw new Error("Booking checkout metadata is missing bookingId.");
  }

  const booking = await getBookingById(bookingId);

  if (!booking) {
    throw new Error("Booking not found for Stripe checkout event.");
  }

  if (session.payment_status !== "paid") {
    return true;
  }

  const amountDueNow = Number(session.metadata?.amountDueNow ?? 0);
  const amountDueLater = Number(session.metadata?.amountDueLater ?? 0);
  const amountTotal = Number(session.metadata?.totalAmount ?? 0);
  const receivedAmount = (session.amount_total ?? 0) / 100;

  if (receivedAmount !== amountDueNow) {
    throw new Error("Stripe amount does not match the verified booking amount due now.");
  }

  if (booking.totalAmount !== amountTotal) {
    throw new Error("Stripe total amount does not match the verified booking total.");
  }

  const installmentStep =
    normalizeOptionalValue(session.metadata?.installmentStep) === "balance"
      ? "balance"
      : "initial";

  const nextAmountPaid =
    installmentStep === "balance"
      ? booking.totalAmount
      : booking.paymentMode === PaymentMode.full
        ? booking.totalAmount
        : booking.totalAmount - amountDueLater;
  const nextAmountRemaining =
    installmentStep === "balance"
      ? 0
      : booking.paymentMode === PaymentMode.full
        ? 0
        : amountDueLater;

  await updateBookingPaymentState({
    bookingId: booking.id,
    status: getTargetBookingStatusAfterPayment({
      paymentMode: booking.paymentMode,
      amountRemaining: nextAmountRemaining,
    }),
    amountPaid: nextAmountPaid,
    amountRemaining: nextAmountRemaining,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : booking.stripePaymentIntentId,
    stripeCustomerId:
      resolveStripeEntityId(session.customer) ?? booking.stripeCustomerId,
  });

  return true;
}

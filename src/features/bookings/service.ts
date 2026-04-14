import { randomUUID } from "node:crypto";

import { BookingStatus, CompanionType, PaymentMode } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import type {
  BookingConfirmationDetail,
  BookingCreateInput,
  BookingRecord,
} from "@/features/bookings/types";
import { prisma } from "@/lib/prisma";

function decimalToNumber(value: Prisma.Decimal | number | string) {
  return Number(value);
}

function toBookingRecord(
  booking: Prisma.BookingGetPayload<object>,
): BookingRecord {
  return {
    id: booking.id,
    bookingReference: booking.bookingReference,
    offeringId: booking.offeringId,
    roomId: booking.roomId,
    customerUserId: booking.customerUserId,
    status: booking.status,
    paymentMode: booking.paymentMode,
    currency: booking.currency,
    roomBasePrice: decimalToNumber(booking.roomBasePrice),
    hasCompanion: booking.hasCompanion,
    companionType: booking.companionType,
    companionSurcharge: decimalToNumber(booking.companionSurcharge),
    totalAmount: decimalToNumber(booking.totalAmount),
    firstInstallmentAmount: decimalToNumber(booking.firstInstallmentAmount),
    secondInstallmentAmount: decimalToNumber(booking.secondInstallmentAmount),
    secondInstallmentDueDate: booking.secondInstallmentDueDate,
    amountPaid: decimalToNumber(booking.amountPaid),
    amountRemaining: decimalToNumber(booking.amountRemaining),
    stripeCheckoutSessionId: booking.stripeCheckoutSessionId,
    stripePaymentIntentId: booking.stripePaymentIntentId,
    stripeCustomerId: booking.stripeCustomerId,
    bookedAt: booking.bookedAt,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };
}

export function generateBookingReference() {
  return `BK-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function findReusableBookingForCheckout(input: {
  offeringId: string;
  roomId: string;
  email: string;
}) {
  return prisma.booking.findFirst({
    where: {
      offeringId: input.offeringId,
      roomId: input.roomId,
      status: {
        in: [
          BookingStatus.pending,
          BookingStatus.payment_pending,
          BookingStatus.partially_paid,
          BookingStatus.paid,
          BookingStatus.health_form_pending,
          BookingStatus.ready,
        ],
      },
      mainTraveler: {
        is: {
          email: input.email,
        },
      },
    },
    select: {
      id: true,
      bookingReference: true,
      companionTraveler: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createOrUpdateBookingForCheckout(input: BookingCreateInput) {
  const existing = await findReusableBookingForCheckout({
    offeringId: input.offeringId,
    roomId: input.roomId,
    email: input.mainTraveler.email,
  });

  const bookingReference = existing?.bookingReference ?? input.bookingReference;

  const booking = existing
    ? await prisma.booking.update({
        where: {
          id: existing.id,
        },
        data: {
          customerUserId: input.customerUserId,
          status: input.status,
          paymentMode: input.paymentMode,
          currency: input.pricing.currency,
          roomBasePrice: input.pricing.roomBasePrice,
          hasCompanion: input.hasCompanion,
          companionType: input.hasCompanion
            ? input.companionType ?? null
            : null,
          companionSurcharge: input.pricing.companionSurcharge,
          totalAmount: input.pricing.totalAmount,
          firstInstallmentAmount: input.pricing.firstInstallmentAmount,
          secondInstallmentAmount: input.pricing.secondInstallmentAmount,
          secondInstallmentDueDate:
            input.installmentPlan.secondInstallmentDueDate ?? null,
          amountPaid: input.pricing.amountPaid,
          amountRemaining: input.pricing.amountRemaining,
          stripeCheckoutSessionId: input.stripeCheckoutSessionId ?? null,
          stripePaymentIntentId: input.stripePaymentIntentId ?? null,
          stripeCustomerId: input.stripeCustomerId ?? null,
          mainTraveler: {
            upsert: {
              update: input.mainTraveler,
              create: input.mainTraveler,
            },
          },
          ...(input.hasCompanion && input.companionTraveler
            ? {
                companionTraveler: {
                  upsert: {
                    update: input.companionTraveler,
                    create: input.companionTraveler,
                  },
                },
              }
            : existing.companionTraveler
              ? {
                  companionTraveler: {
                    delete: true,
                  },
                }
              : {}),
        },
      })
    : await prisma.booking.create({
        data: {
          bookingReference,
          offeringId: input.offeringId,
          roomId: input.roomId,
          customerUserId: input.customerUserId,
          status: input.status,
          paymentMode: input.paymentMode,
          currency: input.pricing.currency,
          roomBasePrice: input.pricing.roomBasePrice,
          hasCompanion: input.hasCompanion,
          companionType: input.hasCompanion
            ? input.companionType ?? null
            : null,
          companionSurcharge: input.pricing.companionSurcharge,
          totalAmount: input.pricing.totalAmount,
          firstInstallmentAmount: input.pricing.firstInstallmentAmount,
          secondInstallmentAmount: input.pricing.secondInstallmentAmount,
          secondInstallmentDueDate:
            input.installmentPlan.secondInstallmentDueDate ?? null,
          amountPaid: input.pricing.amountPaid,
          amountRemaining: input.pricing.amountRemaining,
          stripeCheckoutSessionId: input.stripeCheckoutSessionId ?? null,
          stripePaymentIntentId: input.stripePaymentIntentId ?? null,
          stripeCustomerId: input.stripeCustomerId ?? null,
          mainTraveler: {
            create: input.mainTraveler,
          },
          companionTraveler:
            input.hasCompanion && input.companionTraveler
              ? {
                  create: input.companionTraveler,
                }
              : undefined,
          healthQuestionnaire: {
            create: {},
          },
          satisfactionSurvey: {
            create: {},
          },
        },
      });

  return toBookingRecord(booking);
}

export async function getBookingById(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
  });

  return booking ? toBookingRecord(booking) : null;
}

export async function getBookingConfirmationByReference(input: {
  offeringSlug: string;
  bookingReference: string;
}): Promise<BookingConfirmationDetail | null> {
  const booking = await prisma.booking.findFirst({
    where: {
      bookingReference: input.bookingReference,
      offering: {
        slug: input.offeringSlug,
      },
    },
    include: {
      offering: true,
      room: {
        select: {
          id: true,
          name: true,
        },
      },
      mainTraveler: true,
      companionTraveler: true,
    },
  });

  if (!booking || !booking.mainTraveler) {
    return null;
  }

  return {
    ...toBookingRecord(booking),
    offering: {
      id: booking.offering.id,
      slug: booking.offering.slug,
      title: booking.offering.title,
      offeringType: booking.offering.offeringType,
      startDate: booking.offering.startDate,
      endDate: booking.offering.endDate,
      location: booking.offering.location,
    },
    room: booking.room,
    mainTraveler: {
      firstName: booking.mainTraveler.firstName,
      lastName: booking.mainTraveler.lastName,
      email: booking.mainTraveler.email,
      phone: booking.mainTraveler.phone,
      addressLine1: booking.mainTraveler.addressLine1,
      addressLine2: booking.mainTraveler.addressLine2 ?? undefined,
      postalCode: booking.mainTraveler.postalCode,
      city: booking.mainTraveler.city,
      country: booking.mainTraveler.country,
    },
    companionTraveler: booking.companionTraveler
      ? {
          firstName: booking.companionTraveler.firstName,
          lastName: booking.companionTraveler.lastName,
          email: booking.companionTraveler.email,
          phone: booking.companionTraveler.phone,
          participatesInYoga: booking.companionTraveler.participatesInYoga,
        }
      : null,
  };
}

export async function updateBookingPaymentState(input: {
  bookingId: string;
  status: BookingStatus;
  amountPaid: number;
  amountRemaining: number;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeCustomerId?: string | null;
}) {
  const booking = await prisma.booking.update({
    where: {
      id: input.bookingId,
    },
    data: {
      status: input.status,
      amountPaid: input.amountPaid,
      amountRemaining: input.amountRemaining,
      stripeCheckoutSessionId: input.stripeCheckoutSessionId ?? undefined,
      stripePaymentIntentId: input.stripePaymentIntentId ?? undefined,
      stripeCustomerId: input.stripeCustomerId ?? undefined,
    },
  });

  return toBookingRecord(booking);
}

export function getTargetBookingStatusAfterPayment(input: {
  paymentMode: PaymentMode;
  amountRemaining: number;
}) {
  if (input.paymentMode === PaymentMode.full || input.amountRemaining <= 0) {
    return BookingStatus.health_form_pending;
  }

  return BookingStatus.partially_paid;
}

export function getCompanionTypeFromYogaParticipation(participatesInYoga: boolean) {
  return participatesInYoga
    ? CompanionType.with_yoga
    : CompanionType.without_yoga;
}

import type { OfferingType, PaymentMode } from "@/generated/prisma/enums";

import { getOfferingDisplayLabel } from "@/features/offerings/labels";
import { getPaymentModeLabel } from "@/features/bookings/workflow";
import { formatCurrency } from "@/features/pricing/service";

type BookingEmailSummary = {
  bookingReference: string;
  offeringTitle: string;
  offeringType: OfferingType;
  roomName: string;
  mainGuestName: string;
  mainGuestEmail: string;
  companionSummary: string | null;
  paymentMode: PaymentMode;
  totalAmount: number;
  amountPaid: number;
  amountRemaining: number;
  currency: string;
  healthQuestionnaireUrl: string;
  nextStep: string;
};

function toLines(summary: BookingEmailSummary) {
  return [
    `Booking reference: ${summary.bookingReference}`,
    `Offering: ${summary.offeringTitle} (${getOfferingDisplayLabel(summary.offeringType)})`,
    `Room: ${summary.roomName}`,
    `Main guest: ${summary.mainGuestName} <${summary.mainGuestEmail}>`,
    summary.companionSummary ? `Companion: ${summary.companionSummary}` : null,
    `Payment mode: ${getPaymentModeLabel(summary.paymentMode)}`,
    `Total amount: ${formatCurrency(summary.totalAmount, summary.currency)}`,
    `Amount paid: ${formatCurrency(summary.amountPaid, summary.currency)}`,
    summary.amountRemaining > 0
      ? `Outstanding amount: ${formatCurrency(summary.amountRemaining, summary.currency)}`
      : null,
    `Health questionnaire: ${summary.healthQuestionnaireUrl}`,
    `Next step: ${summary.nextStep}`,
  ].filter(Boolean) as string[];
}

export function buildBookingConfirmationEmail(summary: BookingEmailSummary) {
  return {
    subject: `Booking confirmed • ${summary.offeringTitle} • ${summary.bookingReference}`,
    preview:
      summary.amountRemaining > 0
        ? "Your first payment is confirmed. Complete the health questionnaire and keep track of the remaining balance."
        : "Your payment is confirmed. Complete the health questionnaire to start onboarding.",
    lines: toLines(summary),
  };
}

export function buildHealthQuestionnaireReminderEmail(summary: BookingEmailSummary) {
  return {
    subject: `Reminder • complete your health questionnaire • ${summary.bookingReference}`,
    preview:
      "Your booking is in progress. Complete the health questionnaire to unlock the next onboarding steps.",
    lines: [
      `Reminder for booking ${summary.bookingReference}`,
      `Offering: ${summary.offeringTitle}`,
      `Main guest: ${summary.mainGuestName}`,
      `Questionnaire link: ${summary.healthQuestionnaireUrl}`,
      "This reminder should be sent only if the questionnaire is still incomplete after the configured delay.",
      `Outstanding amount: ${formatCurrency(summary.amountRemaining, summary.currency)}`,
    ],
  };
}

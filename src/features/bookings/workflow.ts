import {
  BookingStatus,
  CompanionType,
  PaymentMode,
} from "@/generated/prisma/enums";

const bookingStatusLabels: Record<BookingStatus, string> = {
  pending: "Pending",
  payment_pending: "Payment pending",
  partially_paid: "Partially paid",
  paid: "Paid",
  health_form_pending: "Health form pending",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
  payment_failed: "Payment failed",
  refunded: "Refunded",
};

const paymentModeLabels: Record<PaymentMode, string> = {
  full: "Full payment",
  split_2x: "2x installment",
};

const companionTypeLabels: Record<CompanionType, string> = {
  with_yoga: "Companion with yoga",
  without_yoga: "Companion without yoga",
};

export function getBookingStatusLabel(status: BookingStatus) {
  return bookingStatusLabels[status];
}

export function getPaymentModeLabel(mode: PaymentMode) {
  return paymentModeLabels[mode];
}

export function getCompanionTypeLabel(type: CompanionType) {
  return companionTypeLabels[type];
}

import type { PaymentMode } from "@/generated/prisma/enums";

export type BookingPricingSnapshot = {
  currency: string;
  roomBasePrice: number;
  companionSurcharge: number;
  totalAmount: number;
  firstInstallmentAmount: number;
  secondInstallmentAmount: number;
  amountPaid: number;
  amountRemaining: number;
};

export type BookingInstallmentPlan = {
  paymentMode: PaymentMode;
  dueNow: number;
  dueLater: number;
  secondInstallmentDueDate: Date | null;
};

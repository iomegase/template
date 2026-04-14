import { CompanionType, PaymentMode } from "@/generated/prisma/enums";
import type { BookingInstallmentPlan, BookingPricingSnapshot } from "@/features/pricing/types";

type PricingInput = {
  roomBasePrice: number;
  companionYogaSurcharge: number;
  companionNoYogaSurcharge: number;
  currency: string;
  paymentMode: PaymentMode;
  hasCompanion: boolean;
  companionType?: CompanionType;
  offeringStartDate: Date;
};

function roundMoney(amount: number) {
  return Math.round(amount * 100) / 100;
}

export function getSecondInstallmentDueDate(offeringStartDate: Date) {
  const dueDate = new Date(offeringStartDate);
  dueDate.setDate(dueDate.getDate() - 30);
  return dueDate;
}

export function getBookingPricingSnapshot(input: PricingInput): BookingPricingSnapshot {
  const companionSurcharge = input.hasCompanion
    ? input.companionType === CompanionType.with_yoga
      ? input.companionYogaSurcharge
      : input.companionNoYogaSurcharge
    : 0;

  const totalAmount = roundMoney(input.roomBasePrice + companionSurcharge);
  const firstInstallmentAmount =
    input.paymentMode === PaymentMode.split_2x
      ? roundMoney(totalAmount / 2)
      : totalAmount;
  const secondInstallmentAmount =
    input.paymentMode === PaymentMode.split_2x
      ? roundMoney(totalAmount - firstInstallmentAmount)
      : 0;

  return {
    currency: input.currency,
    roomBasePrice: roundMoney(input.roomBasePrice),
    companionSurcharge: roundMoney(companionSurcharge),
    totalAmount,
    firstInstallmentAmount,
    secondInstallmentAmount,
    amountPaid: 0,
    amountRemaining: totalAmount,
  };
}

export function getBookingInstallmentPlan(input: {
  paymentMode: PaymentMode;
  totalAmount: number;
  firstInstallmentAmount: number;
  secondInstallmentAmount: number;
  offeringStartDate: Date;
}): BookingInstallmentPlan {
  return {
    paymentMode: input.paymentMode,
    dueNow:
      input.paymentMode === PaymentMode.full
        ? roundMoney(input.totalAmount)
        : roundMoney(input.firstInstallmentAmount),
    dueLater:
      input.paymentMode === PaymentMode.full
        ? 0
        : roundMoney(input.secondInstallmentAmount),
    secondInstallmentDueDate:
      input.paymentMode === PaymentMode.full
        ? null
        : getSecondInstallmentDueDate(input.offeringStartDate),
  };
}

export function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

import type {
  BookingStatus,
  CompanionType,
  PaymentMode,
} from "@/generated/prisma/enums";

import type { BookingInstallmentPlan, BookingPricingSnapshot } from "@/features/pricing/types";

export type MainTravelerValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  city: string;
  country: string;
};

export type CompanionTravelerValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  participatesInYoga: boolean;
};

export type BookingRecord = {
  id: string;
  bookingReference: string;
  offeringId: string;
  roomId: string;
  customerUserId: string | null;
  status: BookingStatus;
  paymentMode: PaymentMode;
  currency: string;
  roomBasePrice: number;
  hasCompanion: boolean;
  companionType: CompanionType | null;
  companionSurcharge: number;
  totalAmount: number;
  firstInstallmentAmount: number;
  secondInstallmentAmount: number;
  secondInstallmentDueDate: Date | null;
  amountPaid: number;
  amountRemaining: number;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeCustomerId: string | null;
  bookedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type BookingConfirmationDetail = BookingRecord & {
  offering: {
    id: string;
    slug: string;
    title: string;
    offeringType: import("@/generated/prisma/enums").OfferingType;
    startDate: Date;
    endDate: Date;
    location: string;
  };
  room: {
    id: string;
    name: string;
  };
  mainTraveler: MainTravelerValues;
  companionTraveler: CompanionTravelerValues | null;
};

export type BookingCreateInput = {
  offeringId: string;
  roomId: string;
  customerUserId?: string;
  bookingReference: string;
  status: BookingStatus;
  paymentMode: PaymentMode;
  hasCompanion: boolean;
  companionType?: CompanionType;
  secondInstallmentDueDate?: Date | null;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  stripeCustomerId?: string;
  pricing: BookingPricingSnapshot;
  installmentPlan: BookingInstallmentPlan;
  mainTraveler: MainTravelerValues;
  companionTraveler?: CompanionTravelerValues;
};

export type BookingUpdateInput = Omit<BookingCreateInput, "offeringId" | "roomId" | "bookingReference">;

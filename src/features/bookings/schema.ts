import { z } from "zod";

import {
  BookingStatus,
  CompanionType,
  PaymentMode,
} from "@/generated/prisma/enums";
import { bookingInstallmentPlanSchema, bookingPricingSnapshotSchema } from "@/features/pricing/schema";

const requiredTrimmedString = z.string().trim().min(2).max(160);
const normalizedEmail = z.string().trim().toLowerCase().email();
const phoneSchema = z.string().trim().min(6).max(30);
const bookingReferenceSchema = z
  .string()
  .trim()
  .min(6)
  .max(40)
  .regex(/^[A-Z0-9-]+$/, {
    message: "Booking reference must use uppercase letters, numbers and hyphens only.",
  });

export const mainTravelerSchema = z.object({
  firstName: requiredTrimmedString,
  lastName: requiredTrimmedString,
  email: normalizedEmail,
  phone: phoneSchema,
  addressLine1: requiredTrimmedString,
  addressLine2: z.string().trim().max(160).optional(),
  postalCode: requiredTrimmedString,
  city: requiredTrimmedString,
  country: requiredTrimmedString,
});

export const companionTravelerSchema = z.object({
  firstName: requiredTrimmedString,
  lastName: requiredTrimmedString,
  email: normalizedEmail,
  phone: phoneSchema,
  participatesInYoga: z.boolean(),
});

const bookingSchemaRefinement = (
  values: {
    hasCompanion: boolean;
    companionType?: CompanionType;
    companionTraveler?: z.infer<typeof companionTravelerSchema>;
    paymentMode: PaymentMode;
    pricing: z.infer<typeof bookingPricingSnapshotSchema>;
    installmentPlan: z.infer<typeof bookingInstallmentPlanSchema>;
  },
  context: z.RefinementCtx,
) => {
  if (!values.hasCompanion) {
    if (values.companionType !== undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companionType"],
        message: "Companion type must stay empty when there is no companion.",
      });
    }

    if (values.companionTraveler !== undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companionTraveler"],
        message: "Companion details are only allowed when a companion is included.",
      });
    }

    if (values.pricing.companionSurcharge !== 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pricing", "companionSurcharge"],
        message: "Companion surcharge must be zero without a companion.",
      });
    }
  }

  if (values.hasCompanion) {
    if (values.companionType === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companionType"],
        message: "Companion type is required when a companion is included.",
      });
    }

    if (values.companionTraveler === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companionTraveler"],
        message: "Companion traveler details are required when a companion is included.",
      });
    }
  }

  if (values.paymentMode !== values.installmentPlan.paymentMode) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["installmentPlan", "paymentMode"],
      message: "Installment plan payment mode must match the booking payment mode.",
    });
  }

  if (
    values.paymentMode === PaymentMode.full &&
    values.pricing.secondInstallmentAmount !== 0
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["pricing", "secondInstallmentAmount"],
      message: "Full payment bookings cannot carry a second installment amount.",
    });
  }

  if (
    values.paymentMode === PaymentMode.split_2x &&
    values.pricing.secondInstallmentAmount <= 0
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["pricing", "secondInstallmentAmount"],
      message: "Split payment bookings require a second installment amount.",
    });
  }
};

const bookingBaseFields = {
    offeringId: z.string().cuid(),
    roomId: z.string().cuid(),
    customerUserId: z.string().cuid().optional(),
    bookingReference: bookingReferenceSchema,
    status: z.nativeEnum(BookingStatus),
    paymentMode: z.nativeEnum(PaymentMode),
    hasCompanion: z.boolean(),
    companionType: z.nativeEnum(CompanionType).optional(),
    secondInstallmentDueDate: z.coerce.date().nullable().optional(),
    stripeCheckoutSessionId: z.string().trim().min(1).max(191).optional(),
    stripePaymentIntentId: z.string().trim().min(1).max(191).optional(),
    stripeCustomerId: z.string().trim().min(1).max(191).optional(),
    pricing: bookingPricingSnapshotSchema,
    installmentPlan: bookingInstallmentPlanSchema,
    mainTraveler: mainTravelerSchema,
    companionTraveler: companionTravelerSchema.optional(),
};

export const bookingBaseSchema = z
  .object(bookingBaseFields)
  .superRefine(bookingSchemaRefinement);

export const bookingCreateSchema = bookingBaseSchema;

const { offeringId, roomId, bookingReference, ...bookingUpdateFields } =
  bookingBaseFields;
void offeringId;
void roomId;
void bookingReference;

export const bookingUpdateSchema = z
  .object(bookingUpdateFields)
  .superRefine(bookingSchemaRefinement);

export const bookingFunnelFormSchema = z
  .object({
    roomId: z.string().cuid({
      message: "Select a room option before continuing.",
    }),
    hasCompanion: z.boolean(),
    companionType: z.nativeEnum(CompanionType).optional(),
    paymentMode: z.nativeEnum(PaymentMode),
    mainTraveler: mainTravelerSchema,
    companionTraveler: companionTravelerSchema.optional(),
    termsAccepted: z.boolean(),
    privacyAccepted: z.boolean(),
  })
  .superRefine((values, context) => {
    if (values.hasCompanion && values.companionType === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companionType"],
        message: "Select how the companion participates.",
      });
    }

    if (values.hasCompanion && values.companionTraveler === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companionTraveler"],
        message: "Companion details are required when a second traveler is included.",
      });
    }

    if (!values.hasCompanion && values.companionTraveler !== undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companionTraveler"],
        message: "Remove companion details if the main guest is traveling alone.",
      });
    }

    if (!values.termsAccepted) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["termsAccepted"],
        message: "You must accept the booking terms.",
      });
    }

    if (!values.privacyAccepted) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["privacyAccepted"],
        message: "You must accept the privacy policy.",
      });
    }
  });

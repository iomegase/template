import { z } from "zod";

import {
  OfferingStatus,
  OfferingType,
} from "@/generated/prisma/enums";

const requiredTrimmedString = z.string().trim().min(2).max(160);
const optionalTrimmedString = z.string().trim().max(500).optional();
const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Slug must use lowercase letters, numbers and hyphens only.",
  });
const moneyAmountSchema = z.coerce.number().finite().nonnegative();
const positiveIntegerSchema = z.coerce.number().int().min(1);
const currencySchema = z.string().trim().length(3).transform((value) => value.toUpperCase());

export const offeringBaseSchema = z
  .object({
    slug: slugSchema,
    title: requiredTrimmedString,
    description: optionalTrimmedString,
    offeringType: z.nativeEnum(OfferingType),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    location: requiredTrimmedString,
    status: z.nativeEnum(OfferingStatus),
    isBookable: z.boolean(),
  })
  .refine((values) => values.endDate >= values.startDate, {
    message: "End date must be later than or equal to the start date.",
    path: ["endDate"],
  });

export const offeringCreateSchema = offeringBaseSchema.extend({
  projectId: z.string().cuid(),
});

export const offeringUpdateSchema = offeringBaseSchema;

export const roomOptionBaseSchema = z.object({
  name: requiredTrimmedString,
  slug: slugSchema,
  description: optionalTrimmedString,
  capacity: positiveIntegerSchema,
  basePrice: moneyAmountSchema,
  currency: currencySchema,
  includedMainGuest: z.boolean(),
  companionYogaSurcharge: moneyAmountSchema,
  companionNoYogaSurcharge: moneyAmountSchema,
  inventory: positiveIntegerSchema,
  isActive: z.boolean(),
});

export const roomOptionCreateSchema = roomOptionBaseSchema.extend({
  offeringId: z.string().cuid(),
});

export const roomOptionUpdateSchema = roomOptionBaseSchema;

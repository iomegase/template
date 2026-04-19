import { z } from "zod"

export const propertyTypeValues = [
  "apartment",
  "house",
  "villa",
  "chalet",
  "studio",
  "loft",
  "other",
] as const

export const createPropertySchema = z.object({
  name: z.string().min(2, "Minimum 2 caractères").max(100),
  slug: z
    .string()
    .min(2, "Minimum 2 caractères")
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Lettres minuscules, chiffres et tirets uniquement"),
  descriptionFr: z.string().min(10, "Minimum 10 caractères").max(5000),
  descriptionEn: z.string().max(5000).optional().default(""),
  type: z.enum(propertyTypeValues),
  address: z.string().min(5, "Adresse requise").max(200),
  city: z.string().min(2, "Ville requise").max(100),
  country: z.string().length(2, "Code pays à 2 lettres (ex: FR)").default("FR"),
  maxGuests: z.coerce.number().int().min(1).max(50),
  bedrooms: z.coerce.number().int().min(0).max(20),
  bathrooms: z.coerce.number().int().min(1).max(20),
  pricePerNight: z.coerce.number().min(1, "Prix requis").max(100000),
  currency: z.enum(["EUR", "GBP"]).default("EUR"),
  cleaningFee: z.coerce.number().min(0).max(10000).default(0),
  depositAmount: z.coerce.number().min(0).max(100000).default(0),
  minNights: z.coerce.number().int().min(1).max(365).default(1),
})

export type CreatePropertySchema = z.infer<typeof createPropertySchema>

export const updatePropertySchema = createPropertySchema.partial().extend({
  status: z.enum(["draft", "active", "archived"]).optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
})

export type UpdatePropertySchema = z.infer<typeof updatePropertySchema>

export const photoUploadSchema = z.object({
  propertyId: z.string().cuid(),
  fileName: z.string().min(1).max(255),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"]),
})

export type PhotoUploadSchema = z.infer<typeof photoUploadSchema>

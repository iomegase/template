import type { PropertyStatus, PropertyType } from "@/generated/prisma/enums"

export type PropertyDescription = {
  fr: string
  en: string
}

export type PropertyPhoto = {
  id: string
  propertyId: string
  url: string
  caption: string | null
  order: number
  createdAt: Date
}

export type PropertyAmenity = {
  id: string
  propertyId: string
  key: string
  createdAt: Date
}

export type PropertyListItem = {
  id: string
  workspaceId: string
  slug: string
  name: string
  type: PropertyType
  status: PropertyStatus
  city: string
  country: string
  pricePerNight: number
  currency: string
  _count: { photos: number }
  createdAt: Date
}

export type PropertyDetail = {
  id: string
  workspaceId: string
  slug: string
  name: string
  description: PropertyDescription
  type: PropertyType
  status: PropertyStatus
  address: string
  city: string
  country: string
  latitude: number | null
  longitude: number | null
  maxGuests: number
  bedrooms: number
  bathrooms: number
  pricePerNight: number
  currency: string
  cleaningFee: number
  depositAmount: number
  minNights: number
  seoTitle: string | null
  seoDescription: string | null
  photos: PropertyPhoto[]
  amenities: PropertyAmenity[]
  createdAt: Date
  updatedAt: Date
}

export type CreatePropertyInput = {
  workspaceId: string
  slug: string
  name: string
  descriptionFr: string
  descriptionEn: string
  type: PropertyType
  address: string
  city: string
  country: string
  maxGuests: number
  bedrooms: number
  bathrooms: number
  pricePerNight: number
  currency: string
  cleaningFee: number
  depositAmount: number
  minNights: number
}

export type UpdatePropertyInput = Partial<
  Omit<CreatePropertyInput, "workspaceId">
> & {
  status?: PropertyStatus
  seoTitle?: string
  seoDescription?: string
}

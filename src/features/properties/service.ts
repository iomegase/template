import { prisma } from "@/lib/prisma"
import type { CreatePropertyInput, UpdatePropertyInput } from "./types"

const propertyWithRelations = {
  photos: { orderBy: { order: "asc" as const } },
  amenities: true,
}

const propertyWithRelationsFlat = {
  photos: true,
  amenities: true,
}

export async function createProperty(input: CreatePropertyInput) {
  return prisma.property.create({
    data: {
      workspaceId: input.workspaceId,
      slug: input.slug,
      name: input.name,
      description: { fr: input.descriptionFr, en: input.descriptionEn },
      type: input.type,
      address: input.address,
      city: input.city,
      country: input.country,
      maxGuests: input.maxGuests,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      pricePerNight: input.pricePerNight,
      currency: input.currency,
      cleaningFee: input.cleaningFee,
      depositAmount: input.depositAmount,
      minNights: input.minNights,
    },
  })
}

export async function getPropertiesByWorkspaceId(workspaceId: string) {
  return prisma.property.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { photos: true } },
    },
  })
}

export async function getPropertyById(id: string, workspaceId: string) {
  return prisma.property.findFirst({
    where: { id, workspaceId },
    include: propertyWithRelations,
  })
}

export async function getPropertyBySlug(workspaceId: string, slug: string) {
  return prisma.property.findFirst({
    where: { workspaceId, slug },
    include: propertyWithRelations,
  })
}

export async function isPropertySlugAvailable(
  workspaceId: string,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const existing = await prisma.property.findFirst({
    where: { workspaceId, slug, NOT: excludeId ? { id: excludeId } : undefined },
  })
  return existing === null
}

export async function updateProperty(
  id: string,
  input: UpdatePropertyInput & { descriptionFr?: string; descriptionEn?: string }
) {
  const { descriptionFr, descriptionEn, ...rest } = input
  const descriptionUpdate =
    descriptionFr !== undefined || descriptionEn !== undefined
      ? { description: { fr: descriptionFr ?? "", en: descriptionEn ?? "" } }
      : {}

  return prisma.property.update({
    where: { id },
    data: { ...rest, ...descriptionUpdate },
    include: propertyWithRelationsFlat,
  })
}

export async function deleteProperty(id: string) {
  return prisma.property.delete({ where: { id } })
}

export async function updatePropertyAmenities(
  propertyId: string,
  keys: string[]
) {
  await prisma.propertyAmenity.deleteMany({ where: { propertyId } })
  await prisma.propertyAmenity.createMany({
    data: keys.map((key) => ({ propertyId, key })),
  })
}

import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    propertyAmenity: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"
import {
  createProperty,
  deleteProperty,
  getPropertiesByWorkspaceId,
  getPropertyById,
  getPropertyBySlug,
  isPropertySlugAvailable,
  updateProperty,
  updatePropertyAmenities,
} from "./service"

const mockProperty = {
  id: "prop_1",
  workspaceId: "ws_1",
  slug: "villa-les-pins",
  name: "Villa Les Pins",
  description: { fr: "Belle villa", en: "Beautiful villa" },
  type: "villa" as const,
  status: "draft" as const,
  address: "12 Rue des Pins",
  city: "Nice",
  country: "FR",
  latitude: null,
  longitude: null,
  maxGuests: 8,
  bedrooms: 4,
  bathrooms: 2,
  pricePerNight: 250,
  currency: "EUR",
  cleaningFee: 80,
  depositAmount: 500,
  minNights: 3,
  seoTitle: null,
  seoDescription: null,
  faqItems: null,
  photos: [],
  amenities: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(() => vi.clearAllMocks())

describe("createProperty", () => {
  it("creates a property with correct data", async () => {
    vi.mocked(prisma.property.create).mockResolvedValue(mockProperty)

    const result = await createProperty({
      workspaceId: "ws_1",
      slug: "villa-les-pins",
      name: "Villa Les Pins",
      descriptionFr: "Belle villa",
      descriptionEn: "Beautiful villa",
      type: "villa",
      address: "12 Rue des Pins",
      city: "Nice",
      country: "FR",
      maxGuests: 8,
      bedrooms: 4,
      bathrooms: 2,
      pricePerNight: 250,
      currency: "EUR",
      cleaningFee: 80,
      depositAmount: 500,
      minNights: 3,
    })

    expect(prisma.property.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        workspaceId: "ws_1",
        slug: "villa-les-pins",
        description: { fr: "Belle villa", en: "Beautiful villa" },
      }),
    })
    expect(result.name).toBe("Villa Les Pins")
  })
})

describe("getPropertiesByWorkspaceId", () => {
  it("returns list of properties with photo count", async () => {
    vi.mocked(prisma.property.findMany).mockResolvedValue([mockProperty])

    const result = await getPropertiesByWorkspaceId("ws_1")

    expect(prisma.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { workspaceId: "ws_1" } })
    )
    expect(result).toHaveLength(1)
  })
})

describe("getPropertyById", () => {
  it("returns property with photos and amenities", async () => {
    vi.mocked(prisma.property.findFirst).mockResolvedValue(mockProperty)

    const result = await getPropertyById("prop_1", "ws_1")

    expect(prisma.property.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "prop_1", workspaceId: "ws_1" },
      })
    )
    expect(result?.id).toBe("prop_1")
  })

  it("returns null when not found", async () => {
    vi.mocked(prisma.property.findFirst).mockResolvedValue(null)

    expect(await getPropertyById("not_found", "ws_1")).toBeNull()
  })
})

describe("getPropertyBySlug", () => {
  it("returns active property by workspace slug and property slug", async () => {
    vi.mocked(prisma.property.findFirst).mockResolvedValue(mockProperty)

    const result = await getPropertyBySlug("ws_1", "villa-les-pins")

    expect(prisma.property.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workspaceId: "ws_1", slug: "villa-les-pins" },
      })
    )
    expect(result?.slug).toBe("villa-les-pins")
  })
})

describe("isPropertySlugAvailable", () => {
  it("returns true when slug is not taken in workspace", async () => {
    vi.mocked(prisma.property.findFirst).mockResolvedValue(null)
    expect(await isPropertySlugAvailable("ws_1", "new-slug")).toBe(true)
  })

  it("returns false when slug exists in workspace", async () => {
    vi.mocked(prisma.property.findFirst).mockResolvedValue(mockProperty)
    expect(await isPropertySlugAvailable("ws_1", "villa-les-pins")).toBe(false)
  })
})

describe("updateProperty", () => {
  it("updates a property", async () => {
    vi.mocked(prisma.property.update).mockResolvedValue({
      ...mockProperty,
      name: "Villa Les Palmiers",
    })

    const result = await updateProperty("prop_1", { name: "Villa Les Palmiers" })

    expect(prisma.property.update).toHaveBeenCalledWith({
      where: { id: "prop_1" },
      data: expect.objectContaining({ name: "Villa Les Palmiers" }),
      include: { photos: true, amenities: true },
    })
    expect(result.name).toBe("Villa Les Palmiers")
  })
})

describe("deleteProperty", () => {
  it("deletes a property by id", async () => {
    vi.mocked(prisma.property.delete).mockResolvedValue(mockProperty)

    await deleteProperty("prop_1")

    expect(prisma.property.delete).toHaveBeenCalledWith({
      where: { id: "prop_1" },
    })
  })
})

describe("updatePropertyAmenities", () => {
  it("replaces amenities with new set", async () => {
    vi.mocked(prisma.propertyAmenity.deleteMany).mockResolvedValue({ count: 2 })
    vi.mocked(prisma.propertyAmenity.createMany).mockResolvedValue({ count: 3 })

    await updatePropertyAmenities("prop_1", ["wifi", "pool", "parking"])

    expect(prisma.propertyAmenity.deleteMany).toHaveBeenCalledWith({
      where: { propertyId: "prop_1" },
    })
    expect(prisma.propertyAmenity.createMany).toHaveBeenCalledWith({
      data: [
        { propertyId: "prop_1", key: "wifi" },
        { propertyId: "prop_1", key: "pool" },
        { propertyId: "prop_1", key: "parking" },
      ],
    })
  })
})

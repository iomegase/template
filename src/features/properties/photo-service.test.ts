import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    propertyPhoto: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock("@/lib/r2", () => ({
  deleteR2Object: vi.fn(),
  extractR2Key: vi.fn((url: string) => url.replace("https://pub.r2.dev/", "")),
}))

import { prisma } from "@/lib/prisma"
import {
  countPropertyPhotos,
  createPropertyPhoto,
  deletePropertyPhoto,
  getPropertyPhotos,
  reorderPropertyPhotos,
} from "./photo-service"

const mockPhoto = {
  id: "photo_1",
  propertyId: "prop_1",
  url: "https://pub.r2.dev/properties/prop_1/abc.jpg",
  caption: null,
  order: 0,
  createdAt: new Date(),
}

beforeEach(() => vi.clearAllMocks())

describe("createPropertyPhoto", () => {
  it("saves a photo record", async () => {
    vi.mocked(prisma.propertyPhoto.create).mockResolvedValue(mockPhoto)

    const result = await createPropertyPhoto(
      "prop_1",
      "https://pub.r2.dev/properties/prop_1/abc.jpg",
      0
    )

    expect(prisma.propertyPhoto.create).toHaveBeenCalledWith({
      data: {
        propertyId: "prop_1",
        url: "https://pub.r2.dev/properties/prop_1/abc.jpg",
        order: 0,
        caption: undefined,
      },
    })
    expect(result.id).toBe("photo_1")
  })
})

describe("getPropertyPhotos", () => {
  it("returns photos ordered by order field", async () => {
    vi.mocked(prisma.propertyPhoto.findMany).mockResolvedValue([mockPhoto])

    const result = await getPropertyPhotos("prop_1")

    expect(prisma.propertyPhoto.findMany).toHaveBeenCalledWith({
      where: { propertyId: "prop_1" },
      orderBy: { order: "asc" },
    })
    expect(result).toHaveLength(1)
  })
})

describe("countPropertyPhotos", () => {
  it("returns the photo count", async () => {
    vi.mocked(prisma.propertyPhoto.count).mockResolvedValue(5)

    const count = await countPropertyPhotos("prop_1")

    expect(prisma.propertyPhoto.count).toHaveBeenCalledWith({
      where: { propertyId: "prop_1" },
    })
    expect(count).toBe(5)
  })
})

describe("deletePropertyPhoto", () => {
  it("deletes photo from DB", async () => {
    vi.mocked(prisma.propertyPhoto.findUnique).mockResolvedValue(mockPhoto)
    vi.mocked(prisma.propertyPhoto.delete).mockResolvedValue(mockPhoto)

    await deletePropertyPhoto("photo_1")

    expect(prisma.propertyPhoto.delete).toHaveBeenCalledWith({
      where: { id: "photo_1" },
    })
  })
})

describe("reorderPropertyPhotos", () => {
  it("updates order for each photo id in sequence", async () => {
    vi.mocked(prisma.propertyPhoto.update).mockResolvedValue(mockPhoto)

    await reorderPropertyPhotos(["photo_3", "photo_1", "photo_2"])

    expect(prisma.propertyPhoto.update).toHaveBeenCalledTimes(3)
    expect(prisma.propertyPhoto.update).toHaveBeenNthCalledWith(1, {
      where: { id: "photo_3" },
      data: { order: 0 },
    })
    expect(prisma.propertyPhoto.update).toHaveBeenNthCalledWith(2, {
      where: { id: "photo_1" },
      data: { order: 1 },
    })
    expect(prisma.propertyPhoto.update).toHaveBeenNthCalledWith(3, {
      where: { id: "photo_2" },
      data: { order: 2 },
    })
  })
})

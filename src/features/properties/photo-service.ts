import { deleteR2Object, extractR2Key } from "@/lib/r2"
import { prisma } from "@/lib/prisma"

export async function createPropertyPhoto(
  propertyId: string,
  url: string,
  order: number,
  caption?: string
) {
  return prisma.propertyPhoto.create({
    data: { propertyId, url, order, caption },
  })
}

export async function getPropertyPhotos(propertyId: string) {
  return prisma.propertyPhoto.findMany({
    where: { propertyId },
    orderBy: { order: "asc" },
  })
}

export async function countPropertyPhotos(propertyId: string): Promise<number> {
  return prisma.propertyPhoto.count({ where: { propertyId } })
}

export async function deletePropertyPhoto(photoId: string): Promise<void> {
  const photo = await prisma.propertyPhoto.findUnique({
    where: { id: photoId },
  })
  if (photo) {
    const key = extractR2Key(photo.url)
    await deleteR2Object(key)
    await prisma.propertyPhoto.delete({ where: { id: photoId } })
  }
}

export async function reorderPropertyPhotos(orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      prisma.propertyPhoto.update({ where: { id }, data: { order: index } })
    )
  )
}

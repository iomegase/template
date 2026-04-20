"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getWorkspaceByOwnerId } from "@/features/workspaces/service"
import { createPropertySchema, updatePropertySchema } from "./schema"
import {
  createProperty,
  deleteProperty,
  isPropertySlugAvailable,
  updateProperty,
  updatePropertyAmenities,
} from "./service"
import { getPropertyPhotos } from "./photo-service"
import { deleteR2Object, extractR2Key } from "@/lib/r2"
import { propertyRoutes } from "./routes"

export async function createPropertyAction(
  _prev: unknown,
  formData: FormData
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "Non autorisé" }
  }

  const workspace = await getWorkspaceByOwnerId(session.user.id)
  if (!workspace) return { error: "Espace introuvable" }

  const parsed = createPropertySchema.safeParse(
    Object.fromEntries(formData.entries())
  )
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  const slugAvailable = await isPropertySlugAvailable(
    workspace.id,
    parsed.data.slug
  )
  if (!slugAvailable) return { error: "Ce slug est déjà utilisé" }

  const property = await createProperty({
    workspaceId: workspace.id,
    ...parsed.data,
    descriptionFr: parsed.data.descriptionFr,
    descriptionEn: parsed.data.descriptionEn ?? "",
  })

  redirect(propertyRoutes.edit(property.id))
}

export async function updatePropertyAction(
  propertyId: string,
  _prev: unknown,
  formData: FormData
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "Non autorisé" }
  }

  const workspace = await getWorkspaceByOwnerId(session.user.id)
  if (!workspace) return { error: "Espace introuvable" }

  const parsed = updatePropertySchema.safeParse(
    Object.fromEntries(formData.entries())
  )
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  const { descriptionFr, descriptionEn, ...rest } = parsed.data
  await updateProperty(propertyId, { ...rest, descriptionFr, descriptionEn })
  revalidatePath(propertyRoutes.edit(propertyId))
  return { success: true }
}

export async function updateAmenitiesAction(
  propertyId: string,
  amenityKeys: string[]
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "Non autorisé" }
  }

  const workspace = await getWorkspaceByOwnerId(session.user.id)
  if (!workspace) return { error: "Espace introuvable" }

  await updatePropertyAmenities(propertyId, amenityKeys)
  revalidatePath(propertyRoutes.edit(propertyId))
  return { success: true }
}

export async function deletePropertyAction(propertyId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "Non autorisé" }
  }

  const workspace = await getWorkspaceByOwnerId(session.user.id)
  if (!workspace) return { error: "Espace introuvable" }

  // Delete R2 photos before removing the property (cascade deletes DB rows but not R2 objects)
  const photos = await getPropertyPhotos(propertyId)
  await Promise.all(
    photos.map((photo) =>
      deleteR2Object(extractR2Key(photo.url)).catch(() => {
        // Best-effort: don't fail the delete if R2 cleanup errors
      })
    )
  )

  await deleteProperty(propertyId)
  redirect(propertyRoutes.list)
}

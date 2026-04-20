"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { getWorkspaceByOwnerId } from "@/features/workspaces/service"
import { getPresignedUploadUrl, getR2PublicUrl } from "@/lib/r2"
import { photoUploadSchema } from "./schema"
import {
  countPropertyPhotos,
  createPropertyPhoto,
  deletePropertyPhoto,
  reorderPropertyPhotos,
} from "./photo-service"
import { getPropertyById } from "./service"
import { propertyRoutes } from "./routes"

export async function getPhotoUploadUrlAction(
  propertyId: string,
  fileName: string,
  contentType: string
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") return { error: "Non autorisé" }

  const workspace = await getWorkspaceByOwnerId(session.user.id)
  if (!workspace) return { error: "Espace introuvable" }

  const property = await getPropertyById(propertyId, workspace.id)
  if (!property) return { error: "Logement introuvable" }

  const parsed = photoUploadSchema.safeParse({ propertyId, fileName, contentType })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Fichier invalide" }
  }

  const count = await countPropertyPhotos(propertyId)
  if (count >= 20) return { error: "Maximum 20 photos atteint" }

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "jpg"
  const key = `properties/${propertyId}/${Date.now()}.${ext}`
  const uploadUrl = await getPresignedUploadUrl(key, contentType)
  const publicUrl = getR2PublicUrl(key)

  return { uploadUrl, publicUrl, key }
}

export async function savePhotoAction(
  propertyId: string,
  url: string,
  caption?: string
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") return { error: "Non autorisé" }

  const workspace = await getWorkspaceByOwnerId(session.user.id)
  if (!workspace) return { error: "Espace introuvable" }

  const property = await getPropertyById(propertyId, workspace.id)
  if (!property) return { error: "Logement introuvable" }

  const count = await countPropertyPhotos(propertyId)
  await createPropertyPhoto(propertyId, url, count, caption)

  revalidatePath(propertyRoutes.edit(propertyId))
  return { success: true }
}

export async function deletePhotoAction(photoId: string, propertyId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") return { error: "Non autorisé" }

  const workspace = await getWorkspaceByOwnerId(session.user.id)
  if (!workspace) return { error: "Espace introuvable" }

  const property = await getPropertyById(propertyId, workspace.id)
  if (!property) return { error: "Logement introuvable" }

  await deletePropertyPhoto(photoId)
  revalidatePath(propertyRoutes.edit(propertyId))
  return { success: true }
}

export async function reorderPhotosAction(
  propertyId: string,
  orderedPhotoIds: string[]
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") return { error: "Non autorisé" }

  const workspace = await getWorkspaceByOwnerId(session.user.id)
  if (!workspace) return { error: "Espace introuvable" }

  const property = await getPropertyById(propertyId, workspace.id)
  if (!property) return { error: "Logement introuvable" }

  await reorderPropertyPhotos(orderedPhotoIds)
  revalidatePath(propertyRoutes.edit(propertyId))
  return { success: true }
}

"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { createWorkspaceSchema, updateWorkspaceSettingsSchema } from "./schema"
import {
  createWorkspace,
  getWorkspaceByOwnerId,
  isSlugAvailable,
  updateWorkspaceSettings,
} from "./service"
import { workspaceRoutes } from "./routes"

export async function createWorkspaceAction(
  _prev: unknown,
  formData: FormData
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "Non autorisé" }
  }

  const existing = await getWorkspaceByOwnerId(session.user.id)
  if (existing) return { error: "Vous avez déjà un espace" }

  const parsed = createWorkspaceSchema.safeParse({
    slug: formData.get("slug"),
    name: formData.get("name"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  const slugFree = await isSlugAvailable(parsed.data.slug)
  if (!slugFree) return { error: "Ce nom d'URL est déjà pris" }

  await createWorkspace({
    slug: parsed.data.slug,
    name: parsed.data.name,
    ownerId: session.user.id,
  })

  redirect(workspaceRoutes.dashboard)
}

export async function updateWorkspaceSettingsAction(
  workspaceId: string,
  _prev: unknown,
  formData: FormData
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "Non autorisé" }
  }

  const parsed = updateWorkspaceSettingsSchema.safeParse({
    siteName: formData.get("siteName") || undefined,
    primaryColor: formData.get("primaryColor") || undefined,
    logoUrl: formData.get("logoUrl") || undefined,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  await updateWorkspaceSettings(workspaceId, parsed.data)
  revalidatePath(workspaceRoutes.dashboard)
  return { success: true }
}

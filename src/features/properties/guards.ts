import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getWorkspaceByOwnerId } from "@/features/workspaces/service"
import { getPropertyById } from "./service"
import type { PropertyDetail } from "./types"

/**
 * Verify session user owns the workspace, then return the property.
 * Redirects to /login or /admin/properties if unauthorized.
 */
export async function requireOwnedProperty(propertyId: string): Promise<PropertyDetail> {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const workspace = await getWorkspaceByOwnerId(session.user.id)
  if (!workspace) redirect("/admin/workspace/new")

  const property = await getPropertyById(propertyId, workspace.id)
  if (!property) redirect("/admin/properties")

  return property as unknown as PropertyDetail
}

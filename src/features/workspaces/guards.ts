import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getWorkspaceByOwnerId } from "./service"
import type { WorkspaceWithSettings } from "./types"

export async function requireWorkspace(): Promise<WorkspaceWithSettings> {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const workspace = await getWorkspaceByOwnerId(session.user.id)
  if (!workspace) redirect("/admin/workspace/new")

  return workspace
}

export async function requireNoWorkspace(): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const workspace = await getWorkspaceByOwnerId(session.user.id)
  if (workspace) redirect("/admin/workspace")
}

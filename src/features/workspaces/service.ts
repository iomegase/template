import { prisma } from "@/lib/prisma"
import type { CreateWorkspaceInput, UpdateWorkspaceSettingsInput } from "./types"

export async function createWorkspace(input: CreateWorkspaceInput) {
  return prisma.workspace.create({
    data: {
      slug: input.slug,
      name: input.name,
      ownerId: input.ownerId,
      settings: { create: { siteName: input.name } },
    },
    include: { settings: true },
  })
}

export async function getWorkspaceBySlug(slug: string) {
  return prisma.workspace.findUnique({
    where: { slug },
    include: { settings: true },
  })
}

export async function getWorkspaceByOwnerId(ownerId: string) {
  return prisma.workspace.findFirst({
    where: { ownerId },
    include: { settings: true },
  })
}

export async function isSlugAvailable(slug: string): Promise<boolean> {
  const existing = await prisma.workspace.findUnique({ where: { slug } })
  return existing === null
}

export async function updateWorkspaceSettings(
  workspaceId: string,
  input: UpdateWorkspaceSettingsInput
) {
  return prisma.workspaceSettings.upsert({
    where: { workspaceId },
    create: { workspaceId, ...input },
    update: input,
  })
}

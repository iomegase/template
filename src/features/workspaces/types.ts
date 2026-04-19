export type WorkspaceSettings = {
  id: string
  workspaceId: string
  siteName: string | null
  primaryColor: string
  logoUrl: string | null
  stripeAccountId: string | null
  stripeOnboarded: boolean
}

export type WorkspaceWithSettings = {
  id: string
  slug: string
  name: string
  ownerId: string
  status: "active" | "suspended"
  settings: WorkspaceSettings | null
  createdAt: Date
  updatedAt: Date
}

export type CreateWorkspaceInput = {
  slug: string
  name: string
  ownerId: string
}

export type UpdateWorkspaceSettingsInput = {
  siteName?: string
  primaryColor?: string
  logoUrl?: string
}

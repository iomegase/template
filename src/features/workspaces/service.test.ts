import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspace: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    workspaceSettings: {
      upsert: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"
import {
  createWorkspace,
  getWorkspaceByOwnerId,
  getWorkspaceBySlug,
  isSlugAvailable,
  updateWorkspaceSettings,
} from "./service"

const mockWorkspace = {
  id: "ws_1",
  slug: "jean-dupont",
  name: "Jean Dupont",
  ownerId: "user_1",
  status: "active" as const,
  settings: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("createWorkspace", () => {
  it("creates workspace with initial settings", async () => {
    vi.mocked(prisma.workspace.create).mockResolvedValue(mockWorkspace)

    const result = await createWorkspace({
      slug: "jean-dupont",
      name: "Jean Dupont",
      ownerId: "user_1",
    })

    expect(prisma.workspace.create).toHaveBeenCalledWith({
      data: {
        slug: "jean-dupont",
        name: "Jean Dupont",
        ownerId: "user_1",
        settings: { create: { siteName: "Jean Dupont" } },
      },
      include: { settings: true },
    })
    expect(result.slug).toBe("jean-dupont")
  })
})

describe("getWorkspaceBySlug", () => {
  it("returns workspace with settings when found", async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue(mockWorkspace)

    const result = await getWorkspaceBySlug("jean-dupont")

    expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
      where: { slug: "jean-dupont" },
      include: { settings: true },
    })
    expect(result).toEqual(mockWorkspace)
  })

  it("returns null when not found", async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue(null)

    const result = await getWorkspaceBySlug("not-found")

    expect(result).toBeNull()
  })
})

describe("getWorkspaceByOwnerId", () => {
  it("returns workspace for the given owner", async () => {
    vi.mocked(prisma.workspace.findFirst).mockResolvedValue(mockWorkspace)

    const result = await getWorkspaceByOwnerId("user_1")

    expect(prisma.workspace.findFirst).toHaveBeenCalledWith({
      where: { ownerId: "user_1" },
      include: { settings: true },
    })
    expect(result).toEqual(mockWorkspace)
  })

  it("returns null when owner has no workspace", async () => {
    vi.mocked(prisma.workspace.findFirst).mockResolvedValue(null)

    const result = await getWorkspaceByOwnerId("user_no_workspace")

    expect(result).toBeNull()
  })
})

describe("isSlugAvailable", () => {
  it("returns true when slug is not taken", async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue(null)

    expect(await isSlugAvailable("new-slug")).toBe(true)
  })

  it("returns false when slug is taken", async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue(mockWorkspace)

    expect(await isSlugAvailable("jean-dupont")).toBe(false)
  })
})

describe("updateWorkspaceSettings", () => {
  it("upserts workspace settings with provided fields", async () => {
    const updatedSettings = {
      id: "wss_1",
      workspaceId: "ws_1",
      siteName: "Ma Villa",
      primaryColor: "#ff5733",
      logoUrl: null,
      stripeAccountId: null,
      stripeOnboarded: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    vi.mocked(prisma.workspaceSettings.upsert).mockResolvedValue(updatedSettings)

    const result = await updateWorkspaceSettings("ws_1", {
      siteName: "Ma Villa",
      primaryColor: "#ff5733",
    })

    expect(prisma.workspaceSettings.upsert).toHaveBeenCalledWith({
      where: { workspaceId: "ws_1" },
      create: {
        workspaceId: "ws_1",
        siteName: "Ma Villa",
        primaryColor: "#ff5733",
      },
      update: { siteName: "Ma Villa", primaryColor: "#ff5733" },
    })
    expect(result.siteName).toBe("Ma Villa")
  })
})

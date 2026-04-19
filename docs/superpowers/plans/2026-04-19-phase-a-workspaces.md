# Phase A: Multi-tenant Workspaces — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `Workspace` model and multi-tenant subdomain routing so each admin gets their own `[slug].taplateforme.com` public site, with a workspace creation flow and dashboard.

**Architecture:** New `Workspace` model added alongside the existing `Project` model. The Next.js middleware reads the request hostname and rewrites subdomain traffic to `/site/[slug]` routes. The `workspaceId`/`workspaceSlug` fields are added to the JWT session (alongside existing `projectId`) using the same auth pattern already established.

**Tech Stack:** Prisma 7, NextAuth 5 JWT, Vitest, Next.js 16 middleware, Zod 4, React Hook Form

---

## Files Overview

**Create:**
- `vitest.config.ts` — test runner config
- `src/test/setup.ts` — test globals setup
- `src/features/workspaces/types.ts` — TypeScript types
- `src/features/workspaces/schema.ts` — Zod validation schemas
- `src/features/workspaces/service.ts` — Prisma DB operations
- `src/features/workspaces/service.test.ts` — unit tests
- `src/features/workspaces/actions.ts` — Next.js server actions
- `src/features/workspaces/guards.ts` — auth guards
- `src/features/workspaces/routes.ts` — route constants
- `src/features/workspaces/components/workspace-create-form.tsx` — creation form
- `src/middleware.ts` — hostname routing
- `src/app/site/[slug]/page.tsx` — public site placeholder
- `src/app/admin/workspace/new/page.tsx` — workspace creation page
- `src/app/admin/workspace/page.tsx` — workspace dashboard

**Modify:**
- `prisma/schema.prisma` — add `Workspace`, `WorkspaceSettings`, `WorkspaceStatus`; add `workspaceId` to `User`
- `src/features/auth/auth-service.ts` — include workspace in user queries
- `src/features/auth/roles.ts` — add `workspaceId`/`workspaceSlug` to `AuthenticatedUser`
- `src/lib/auth.ts` — JWT + session callbacks include workspace fields
- `src/types/next-auth.d.ts` — extend session/user types
- `package.json` — add test scripts

---

## Task 1: Vitest test infrastructure

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Modify: `package.json`

- [ ] Install Vitest dependencies

```bash
cd /Users/daviddevillers/sites/template
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] Create `vitest.config.ts`

```typescript
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

- [ ] Create `src/test/setup.ts`

```typescript
import "@testing-library/jest-dom"
```

- [ ] Add test scripts to `package.json`

In the `"scripts"` section, add after `"lint"`:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] Verify setup works

```bash
npm run test:run
```
Expected: `No test files found, exiting with code 0`

- [ ] Commit

```bash
git add vitest.config.ts src/test/setup.ts package.json package-lock.json
git commit -m "chore: add Vitest test infrastructure"
```

---

## Task 2: Add Workspace models to Prisma

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] Add `WorkspaceStatus` enum to `prisma/schema.prisma`

After the last existing enum (`SatisfactionSurveyStatus`), add:

```prisma
enum WorkspaceStatus {
  active
  suspended
}
```

- [ ] Add `workspaceId` to the `User` model

In `prisma/schema.prisma`, inside the `User` model, after the `project` relation lines, add:

```prisma
  workspaceId   String?
  workspace     Workspace? @relation("WorkspaceOwner", fields: [workspaceId], references: [id], onDelete: SetNull)
```

- [ ] Add `Workspace` and `WorkspaceSettings` models

After the closing `}` of the `Project` model, add:

```prisma
model Workspace {
  id          String            @id @default(cuid())
  slug        String            @unique
  name        String
  ownerId     String            @unique
  owner       User              @relation("WorkspaceOwner", fields: [ownerId], references: [id])
  status      WorkspaceStatus   @default(active)
  settings    WorkspaceSettings?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
}

model WorkspaceSettings {
  id              String    @id @default(cuid())
  workspaceId     String    @unique
  siteName        String?
  primaryColor    String    @default("#6366f1")
  logoUrl         String?
  stripeAccountId String?
  stripeOnboarded Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  workspace       Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}
```

- [ ] Run migration

```bash
npm run db:migrate
```
When prompted for migration name, enter: `add_workspace_models`
Expected: `The following migration(s) have been created and applied`

- [ ] Regenerate Prisma client

```bash
npm run db:generate
```
Expected: `Generated Prisma Client` in output.

- [ ] Commit

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add Workspace and WorkspaceSettings models"
```

---

## Task 3: Workspace types and Zod schemas

**Files:**
- Create: `src/features/workspaces/types.ts`
- Create: `src/features/workspaces/schema.ts`

- [ ] Create `src/features/workspaces/types.ts`

```typescript
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
```

- [ ] Create `src/features/workspaces/schema.ts`

```typescript
import { z } from "zod"

export const createWorkspaceSchema = z.object({
  slug: z
    .string()
    .min(3, "Minimum 3 caractères")
    .max(32, "Maximum 32 caractères")
    .regex(
      /^[a-z0-9-]+$/,
      "Uniquement des lettres minuscules, chiffres et tirets"
    ),
  name: z
    .string()
    .min(2, "Minimum 2 caractères")
    .max(64, "Maximum 64 caractères"),
})

export type CreateWorkspaceSchema = z.infer<typeof createWorkspaceSchema>

export const updateWorkspaceSettingsSchema = z.object({
  siteName: z.string().max(64).optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Format couleur invalide (#RRGGBB)")
    .optional(),
  logoUrl: z.string().url("URL invalide").optional().or(z.literal("")),
})

export type UpdateWorkspaceSettingsSchema = z.infer<
  typeof updateWorkspaceSettingsSchema
>
```

- [ ] Commit

```bash
git add src/features/workspaces/types.ts src/features/workspaces/schema.ts
git commit -m "feat(workspaces): add types and Zod schemas"
```

---

## Task 4: Workspace service with tests

**Files:**
- Create: `src/features/workspaces/service.test.ts`
- Create: `src/features/workspaces/service.ts`

- [ ] Write failing tests — `src/features/workspaces/service.test.ts`

```typescript
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
    vi.mocked(prisma.workspaceSettings.upsert).mockResolvedValue(
      updatedSettings
    )

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
```

- [ ] Run tests to confirm failure

```bash
npm run test:run -- src/features/workspaces/service.test.ts
```
Expected: FAIL — `Cannot find module './service'`

- [ ] Create `src/features/workspaces/service.ts`

```typescript
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
```

- [ ] Run tests to confirm they pass

```bash
npm run test:run -- src/features/workspaces/service.test.ts
```
Expected: `8 tests passed`

- [ ] Commit

```bash
git add src/features/workspaces/service.ts src/features/workspaces/service.test.ts
git commit -m "feat(workspaces): add workspace service with tests"
```

---

## Task 5: Workspace server actions, guards, routes

**Files:**
- Create: `src/features/workspaces/routes.ts`
- Create: `src/features/workspaces/guards.ts`
- Create: `src/features/workspaces/actions.ts`

- [ ] Create `src/features/workspaces/routes.ts`

```typescript
export const workspaceRoutes = {
  dashboard: "/admin/workspace",
  new: "/admin/workspace/new",
  settings: "/admin/workspace/settings",
} as const
```

- [ ] Create `src/features/workspaces/guards.ts`

```typescript
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
```

- [ ] Create `src/features/workspaces/actions.ts`

```typescript
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
    return { error: parsed.error.errors[0]?.message ?? "Données invalides" }
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
    return { error: parsed.error.errors[0]?.message ?? "Données invalides" }
  }

  await updateWorkspaceSettings(workspaceId, parsed.data)
  revalidatePath(workspaceRoutes.dashboard)
  return { success: true }
}
```

- [ ] Commit

```bash
git add src/features/workspaces/actions.ts src/features/workspaces/guards.ts src/features/workspaces/routes.ts
git commit -m "feat(workspaces): add server actions, guards, and routes"
```

---

## Task 6: Update auth session for workspace

Add `workspaceId` and `workspaceSlug` to the JWT token, session, and `AuthenticatedUser` type.

**Files:**
- Modify: `src/features/auth/roles.ts`
- Modify: `src/features/auth/auth-service.ts`
- Modify: `src/types/next-auth.d.ts`
- Modify: `src/lib/auth.ts`

- [ ] Read `src/features/auth/roles.ts` to see the `AuthenticatedUser` type

```bash
cat /Users/daviddevillers/sites/template/src/features/auth/roles.ts
```

- [ ] Update `AuthenticatedUser` in `src/features/auth/roles.ts`

Replace the `AuthenticatedUser` type with:

```typescript
export type AuthenticatedUser = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: AppUserRole;
  projectId: string | null;
  projectSlug: string | null;
  workspaceId: string | null;
  workspaceSlug: string | null;
};
```

- [ ] Update `toAuthenticatedUser` in `src/features/auth/auth-service.ts`

Replace the `toAuthenticatedUser` function with:

```typescript
function toAuthenticatedUser(user: {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: string;
  projectId: string | null;
  project: { slug: string } | null;
  workspace: { id: string; slug: string } | null;
}): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: isAppUserRole(user.role) ? user.role : "customer",
    projectId: user.projectId,
    projectSlug: user.project?.slug ?? null,
    workspaceId: user.workspace?.id ?? null,
    workspaceSlug: user.workspace?.slug ?? null,
  };
}
```

In both `prisma.user.findUnique` calls (in `authenticateUser` and `getAuthenticatedUserById`), add to the `include` object:

```typescript
workspace: {
  select: { id: true, slug: true },
},
```

- [ ] Update `src/types/next-auth.d.ts`

Replace the entire file content:

```typescript
import type { DefaultSession } from "next-auth"
import type { AppUserRole } from "@/features/auth/roles"

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string
      role: AppUserRole
      projectId: string | null
      projectSlug: string | null
      workspaceId: string | null
      workspaceSlug: string | null
    }
  }

  interface User {
    id: string
    role: AppUserRole
    projectId: string | null
    projectSlug: string | null
    workspaceId: string | null
    workspaceSlug: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: AppUserRole
    projectId?: string | null
    projectSlug?: string | null
    workspaceId?: string | null
    workspaceSlug?: string | null
  }
}
```

- [ ] Update `src/lib/auth.ts` JWT callback

In the `jwt` callback, in the `if (user)` branch, after `token.projectSlug = user.projectSlug`, add:

```typescript
token.workspaceId = user.workspaceId;
token.workspaceSlug = user.workspaceSlug;
```

In the refresh branch (`if (token.id && ...)`), after `token.projectSlug = dbUser.projectSlug`, add:

```typescript
token.workspaceId = dbUser.workspaceId;
token.workspaceSlug = dbUser.workspaceSlug;
```

In the `session` callback, after the `session.user.projectSlug = ...` line, add:

```typescript
session.user.workspaceId =
  typeof token.workspaceId === "string" ? token.workspaceId : null;
session.user.workspaceSlug =
  typeof token.workspaceSlug === "string" ? token.workspaceSlug : null;
```

- [ ] Verify TypeScript compiles without errors

```bash
npx tsc --noEmit 2>&1 | head -30
```
Expected: No errors (or only pre-existing errors unrelated to auth).

- [ ] Commit

```bash
git add src/features/auth/roles.ts src/features/auth/auth-service.ts src/types/next-auth.d.ts src/lib/auth.ts
git commit -m "feat(auth): add workspaceId and workspaceSlug to JWT session"
```

---

## Task 7: Multi-tenant middleware

Create `src/middleware.ts` to route subdomain requests to `/site/[slug]` and protect authenticated routes.

**Files:**
- Create: `src/middleware.ts`
- Create: `src/app/site/[slug]/page.tsx`
- Modify: `.env` and `.env.example`

- [ ] Add `ROOT_DOMAIN` to `.env`

```
ROOT_DOMAIN=localhost:3000
```

- [ ] Add `ROOT_DOMAIN` to `.env.example`

```
ROOT_DOMAIN=taplateforme.com
```

- [ ] Create `src/middleware.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const protectedPaths = ["/admin", "/super-admin", "/customer", "/dashboard"]

function isProtected(pathname: string) {
  return protectedPaths.some((p) => pathname.startsWith(p))
}

export default auth(function middleware(req: NextRequest & { auth: unknown }) {
  const { pathname } = req.nextUrl
  const hostname = req.headers.get("host") ?? ""
  const rootDomain = process.env.ROOT_DOMAIN ?? "localhost:3000"

  const isSubdomain =
    hostname !== rootDomain &&
    hostname !== `app.${rootDomain}` &&
    hostname.endsWith(`.${rootDomain}`)

  if (isSubdomain) {
    const slug = hostname.replace(`.${rootDomain}`, "")
    const url = req.nextUrl.clone()
    url.pathname = `/site/${slug}${pathname}`
    return NextResponse.rewrite(url)
  }

  if (isProtected(pathname) && !req.auth) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
```

- [ ] Create `src/app/site/[slug]/page.tsx`

```typescript
import { notFound } from "next/navigation"
import { getWorkspaceBySlug } from "@/features/workspaces/service"

type Props = {
  params: Promise<{ slug: string }>
}

export default async function PublicSitePage({ params }: Props) {
  const { slug } = await params
  const workspace = await getWorkspaceBySlug(slug)

  if (!workspace) notFound()

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">
          {workspace.settings?.siteName ?? workspace.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Bienvenue sur notre espace de réservation
        </p>
      </div>
    </main>
  )
}
```

- [ ] Verify build

```bash
npm run build 2>&1 | tail -20
```
Expected: Build succeeds.

- [ ] Commit

```bash
git add src/middleware.ts src/app/site/ .env.example
git commit -m "feat(middleware): add multi-tenant hostname routing"
```

---

## Task 8: Workspace creation page

Page where a new admin creates their workspace after signing up.

**Files:**
- Create: `src/features/workspaces/components/workspace-create-form.tsx`
- Create: `src/app/admin/workspace/new/page.tsx`

- [ ] Create `src/features/workspaces/components/workspace-create-form.tsx`

```typescript
"use client"

import { useActionState } from "react"
import { createWorkspaceAction } from "@/features/workspaces/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type ActionState = { error?: string; success?: boolean } | undefined

export function WorkspaceCreateForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    createWorkspaceAction,
    undefined
  )

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Créez votre espace</CardTitle>
        <CardDescription>
          Choisissez un nom d&apos;URL pour votre site de réservation. Il sera
          accessible sur{" "}
          <strong>votre-nom.taplateforme.com</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de votre espace</Label>
            <Input
              id="name"
              name="name"
              placeholder="Villa Les Pins"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Adresse de votre site</Label>
            <div className="flex items-center gap-2">
              <Input
                id="slug"
                name="slug"
                placeholder="villa-les-pins"
                pattern="[a-z0-9-]+"
                required
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                .taplateforme.com
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Lettres minuscules, chiffres et tirets uniquement
            </p>
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Création..." : "Créer mon espace"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

- [ ] Create `src/app/admin/workspace/new/page.tsx`

```typescript
import { requireNoWorkspace } from "@/features/workspaces/guards"
import { WorkspaceCreateForm } from "@/features/workspaces/components/workspace-create-form"

export default async function NewWorkspacePage() {
  await requireNoWorkspace()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <WorkspaceCreateForm />
    </div>
  )
}
```

- [ ] Commit

```bash
git add src/features/workspaces/components/ src/app/admin/workspace/new/
git commit -m "feat(workspaces): add workspace creation page"
```

---

## Task 9: Workspace dashboard page

Page d'accueil du workspace dans le dashboard admin.

**Files:**
- Create: `src/app/admin/workspace/page.tsx`

- [ ] Create `src/app/admin/workspace/page.tsx`

```typescript
import { requireWorkspace } from "@/features/workspaces/guards"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function WorkspaceDashboardPage() {
  const workspace = await requireWorkspace()
  const rootDomain = process.env.ROOT_DOMAIN ?? "taplateforme.com"
  const siteUrl = `https://${workspace.slug}.${rootDomain}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{workspace.name}</h1>
        <p className="text-muted-foreground">Tableau de bord de votre espace</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Votre site public</CardTitle>
            <CardDescription>
              URL de votre espace de réservation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-primary hover:underline"
            >
              {siteUrl}
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statut</CardTitle>
            <CardDescription>État de votre espace</CardDescription>
          </CardHeader>
          <CardContent>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                workspace.status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {workspace.status === "active" ? "Actif" : "Suspendu"}
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] Run full test suite

```bash
npm run test:run
```
Expected: `8 tests passed`

- [ ] Verify full build

```bash
npm run build 2>&1 | tail -20
```
Expected: Build succeeds with no new errors.

- [ ] Commit

```bash
git add src/app/admin/workspace/page.tsx
git commit -m "feat(workspaces): add workspace dashboard page"
```

---

## Phase A complete

Phase A delivers:
- ✅ `Workspace` + `WorkspaceSettings` models in Prisma
- ✅ Workspace service with 8 unit tests
- ✅ Server actions for create/update
- ✅ Auth JWT enriched with `workspaceId`/`workspaceSlug`
- ✅ Multi-tenant middleware (hostname → `/site/[slug]`)
- ✅ Admin workspace creation page
- ✅ Admin workspace dashboard page

**Next phase:** Phase B — Properties CRUD + Cloudflare R2 photo upload  
Plan file: `docs/superpowers/plans/2026-04-19-phase-b-properties.md` (à créer)

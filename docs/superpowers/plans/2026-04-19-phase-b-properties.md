# Phase B: Properties CRUD + R2 Photos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admins can create and manage rental properties (multilingual description, photos on Cloudflare R2, amenities); vacanciers can browse property public pages.

**Architecture:** New `src/features/properties/` module following the workspace pattern established in Phase A. A Property belongs to a Workspace (1:N). Photos are stored on Cloudflare R2 via presigned PUT URLs — the client uploads directly to R2 (bypassing Vercel's 4.5 MB payload limit). Amenities are stored as simple key strings per property against a predefined constant list.

**Prerequisite:** Phase A (`feature/phase-a-workspaces`) merged into `main`. The workspace service (`getWorkspaceByOwnerId`) and guards (`requireWorkspace`) must be available.

**Tech Stack:** Prisma 7, Zod 4, `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`, React Hook Form, shadcn/ui, Vitest, Cloudflare R2

---

## Files Overview

**Create:**
- `src/lib/r2.ts` — R2 S3 client, presigned URL generator, delete helper
- `src/features/properties/types.ts` — TypeScript types
- `src/features/properties/schema.ts` — Zod schemas
- `src/features/properties/amenities.ts` — predefined amenity key list
- `src/features/properties/service.ts` — Prisma DB operations
- `src/features/properties/service.test.ts` — unit tests
- `src/features/properties/photo-service.ts` — photo DB operations
- `src/features/properties/photo-service.test.ts` — unit tests
- `src/features/properties/actions.ts` — property CRUD server actions
- `src/features/properties/photo-actions.ts` — photo server actions (presigned URL, save, delete)
- `src/features/properties/guards.ts` — ownership guards
- `src/features/properties/routes.ts` — route constants
- `src/features/properties/components/property-form.tsx` — create/edit form
- `src/features/properties/components/photo-uploader.tsx` — R2 photo upload component
- `src/features/properties/components/amenity-selector.tsx` — amenity checkbox grid
- `src/app/admin/properties/page.tsx` — property list
- `src/app/admin/properties/layout.tsx` — layout with workspace guard
- `src/app/admin/properties/new/page.tsx` — create property page
- `src/app/admin/properties/[propertyId]/edit/page.tsx` — edit property page
- `src/app/site/[slug]/[propertySlug]/page.tsx` — public property page

**Modify:**
- `prisma/schema.prisma` — add Property, PropertyPhoto, PropertyAmenity, enums; add `properties` back-relation to Workspace
- `.env` + `.env.example` — add R2 env vars

---

## Task 1: Prisma Property models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Add enums to `prisma/schema.prisma`**

After the `WorkspaceStatus` enum, add:

```prisma
enum PropertyType {
  apartment
  house
  villa
  chalet
  studio
  loft
  other
}

enum PropertyStatus {
  draft
  active
  archived
}
```

- [ ] **Add `properties` back-relation to `Workspace` model**

Inside the `Workspace` model, after `settings WorkspaceSettings?`, add:

```prisma
  properties  Property[]
```

- [ ] **Add `Property`, `PropertyPhoto`, `PropertyAmenity` models**

After the closing `}` of `WorkspaceSettings`, add:

```prisma
model Property {
  id             String            @id @default(cuid())
  workspaceId    String
  workspace      Workspace         @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  slug           String
  name           String
  description    Json              @default("{}")
  type           PropertyType
  status         PropertyStatus    @default(draft)
  address        String
  city           String
  country        String            @default("FR")
  latitude       Float?
  longitude      Float?
  maxGuests      Int
  bedrooms       Int
  bathrooms      Int
  pricePerNight  Decimal           @db.Decimal(10, 2)
  currency       String            @default("EUR")
  cleaningFee    Decimal           @default(0) @db.Decimal(10, 2)
  depositAmount  Decimal           @default(0) @db.Decimal(10, 2)
  minNights      Int               @default(1)
  seoTitle       String?
  seoDescription String?
  faqItems       Json?
  photos         PropertyPhoto[]
  amenities      PropertyAmenity[]
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  @@unique([workspaceId, slug])
  @@index([workspaceId, status])
}

model PropertyPhoto {
  id         String   @id @default(cuid())
  propertyId String
  property   Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  url        String
  caption    String?
  order      Int      @default(0)
  createdAt  DateTime @default(now())

  @@index([propertyId, order])
}

model PropertyAmenity {
  id         String   @id @default(cuid())
  propertyId String
  property   Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  key        String

  @@unique([propertyId, key])
}
```

- [ ] **Run migration**

```bash
npm run db:migrate
```
When prompted: `add_property_models`
Expected: migration applied.

- [ ] **Regenerate Prisma client**

```bash
npm run db:generate
```
Expected: `Generated Prisma Client`.

- [ ] **Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -10
```
Expected: no errors.

- [ ] **Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add Property, PropertyPhoto, PropertyAmenity models"
```

---

## Task 2: Cloudflare R2 client

**Files:**
- Create: `src/lib/r2.ts`
- Modify: `.env`, `.env.example`

- [ ] **Install AWS SDK packages**

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

- [ ] **Add R2 env vars to `.env`**

```
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://pub-xxxx.r2.dev
```

- [ ] **Add R2 env vars to `.env.example`**

```
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=https://pub-xxxx.r2.dev
```

- [ ] **Create `src/lib/r2.ts`**

```typescript
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

/**
 * Generate a presigned PUT URL. The client uploads directly to R2 using this URL.
 * Expires in 5 minutes.
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string
): Promise<string> {
  const client = getR2Client()
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(client, command, { expiresIn: 300 })
}

/**
 * Delete an object from R2 by its key.
 */
export async function deleteR2Object(key: string): Promise<void> {
  const client = getR2Client()
  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    })
  )
}

/**
 * Build the public URL for a given R2 object key.
 */
export function getR2PublicUrl(key: string): string {
  const base = process.env.R2_PUBLIC_URL!.replace(/\/$/, "")
  return `${base}/${key}`
}

/**
 * Extract the R2 key from a public URL.
 */
export function extractR2Key(publicUrl: string): string {
  const base = process.env.R2_PUBLIC_URL!.replace(/\/$/, "")
  return publicUrl.replace(`${base}/`, "")
}
```

- [ ] **Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -10
```
Expected: no errors.

- [ ] **Commit**

```bash
git add src/lib/r2.ts .env.example package.json package-lock.json
git commit -m "feat(r2): add Cloudflare R2 client helpers"
```

---

## Task 3: Property types, Zod schemas, amenity list

**Files:**
- Create: `src/features/properties/types.ts`
- Create: `src/features/properties/schema.ts`
- Create: `src/features/properties/amenities.ts`

- [ ] **Create `src/features/properties/amenities.ts`**

```typescript
export const AMENITY_KEYS = [
  "wifi",
  "parking",
  "pool",
  "jacuzzi",
  "barbecue",
  "beach_access",
  "mountain_view",
  "garden",
  "terrace",
  "dishwasher",
  "washing_machine",
  "dryer",
  "tv",
  "air_conditioning",
  "heating",
  "gym",
  "elevator",
  "baby_bed",
  "pets_allowed",
  "smoking_allowed",
] as const

export type AmenityKey = (typeof AMENITY_KEYS)[number]

export const AMENITY_LABELS: Record<AmenityKey, string> = {
  wifi: "Wi-Fi",
  parking: "Parking",
  pool: "Piscine",
  jacuzzi: "Jacuzzi",
  barbecue: "Barbecue",
  beach_access: "Accès plage",
  mountain_view: "Vue montagne",
  garden: "Jardin",
  terrace: "Terrasse",
  dishwasher: "Lave-vaisselle",
  washing_machine: "Lave-linge",
  dryer: "Sèche-linge",
  tv: "Télévision",
  air_conditioning: "Climatisation",
  heating: "Chauffage",
  gym: "Salle de sport",
  elevator: "Ascenseur",
  baby_bed: "Lit bébé",
  pets_allowed: "Animaux acceptés",
  smoking_allowed: "Fumeurs acceptés",
}
```

- [ ] **Create `src/features/properties/types.ts`**

```typescript
import type { PropertyStatus, PropertyType } from "@/generated/prisma/enums"

export type PropertyDescription = {
  fr: string
  en: string
}

export type PropertyPhoto = {
  id: string
  propertyId: string
  url: string
  caption: string | null
  order: number
  createdAt: Date
}

export type PropertyAmenity = {
  id: string
  propertyId: string
  key: string
}

export type PropertyListItem = {
  id: string
  workspaceId: string
  slug: string
  name: string
  type: PropertyType
  status: PropertyStatus
  city: string
  country: string
  pricePerNight: number
  currency: string
  _count: { photos: number }
  createdAt: Date
}

export type PropertyDetail = {
  id: string
  workspaceId: string
  slug: string
  name: string
  description: PropertyDescription
  type: PropertyType
  status: PropertyStatus
  address: string
  city: string
  country: string
  latitude: number | null
  longitude: number | null
  maxGuests: number
  bedrooms: number
  bathrooms: number
  pricePerNight: number
  currency: string
  cleaningFee: number
  depositAmount: number
  minNights: number
  seoTitle: string | null
  seoDescription: string | null
  photos: PropertyPhoto[]
  amenities: PropertyAmenity[]
  createdAt: Date
  updatedAt: Date
}

export type CreatePropertyInput = {
  workspaceId: string
  slug: string
  name: string
  descriptionFr: string
  descriptionEn: string
  type: PropertyType
  address: string
  city: string
  country: string
  maxGuests: number
  bedrooms: number
  bathrooms: number
  pricePerNight: number
  currency: string
  cleaningFee: number
  depositAmount: number
  minNights: number
}

export type UpdatePropertyInput = Partial<
  Omit<CreatePropertyInput, "workspaceId">
> & {
  status?: PropertyStatus
  seoTitle?: string
  seoDescription?: string
}
```

- [ ] **Create `src/features/properties/schema.ts`**

```typescript
import { z } from "zod"

export const propertyTypeValues = [
  "apartment",
  "house",
  "villa",
  "chalet",
  "studio",
  "loft",
  "other",
] as const

export const createPropertySchema = z.object({
  name: z.string().min(2, "Minimum 2 caractères").max(100),
  slug: z
    .string()
    .min(2, "Minimum 2 caractères")
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Lettres minuscules, chiffres et tirets uniquement"),
  descriptionFr: z.string().min(10, "Minimum 10 caractères").max(5000),
  descriptionEn: z.string().max(5000).optional().default(""),
  type: z.enum(propertyTypeValues),
  address: z.string().min(5, "Adresse requise").max(200),
  city: z.string().min(2, "Ville requise").max(100),
  country: z.string().length(2, "Code pays à 2 lettres (ex: FR)").default("FR"),
  maxGuests: z.coerce.number().int().min(1).max(50),
  bedrooms: z.coerce.number().int().min(0).max(20),
  bathrooms: z.coerce.number().int().min(1).max(20),
  pricePerNight: z.coerce.number().min(1, "Prix requis").max(100000),
  currency: z.enum(["EUR", "GBP"]).default("EUR"),
  cleaningFee: z.coerce.number().min(0).max(10000).default(0),
  depositAmount: z.coerce.number().min(0).max(100000).default(0),
  minNights: z.coerce.number().int().min(1).max(365).default(1),
})

export type CreatePropertySchema = z.infer<typeof createPropertySchema>

export const updatePropertySchema = createPropertySchema.partial().extend({
  status: z.enum(["draft", "active", "archived"]).optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
})

export type UpdatePropertySchema = z.infer<typeof updatePropertySchema>

export const photoUploadSchema = z.object({
  propertyId: z.string().cuid(),
  fileName: z.string().min(1).max(255),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"]),
})

export type PhotoUploadSchema = z.infer<typeof photoUploadSchema>
```

- [ ] **Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -10
```
Expected: no errors.

- [ ] **Commit**

```bash
git add src/features/properties/types.ts src/features/properties/schema.ts src/features/properties/amenities.ts
git commit -m "feat(properties): add types, schemas, and amenity constants"
```

---

## Task 4: Property service + tests

**Files:**
- Create: `src/features/properties/service.test.ts`
- Create: `src/features/properties/service.ts`

- [ ] **Write failing tests — `src/features/properties/service.test.ts`**

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    propertyAmenity: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"
import {
  createProperty,
  deleteProperty,
  getPropertiesByWorkspaceId,
  getPropertyById,
  getPropertyBySlug,
  isPropertySlugAvailable,
  updateProperty,
  updatePropertyAmenities,
} from "./service"

const mockProperty = {
  id: "prop_1",
  workspaceId: "ws_1",
  slug: "villa-les-pins",
  name: "Villa Les Pins",
  description: { fr: "Belle villa", en: "Beautiful villa" },
  type: "villa" as const,
  status: "draft" as const,
  address: "12 Rue des Pins",
  city: "Nice",
  country: "FR",
  latitude: null,
  longitude: null,
  maxGuests: 8,
  bedrooms: 4,
  bathrooms: 2,
  pricePerNight: 250,
  currency: "EUR",
  cleaningFee: 80,
  depositAmount: 500,
  minNights: 3,
  seoTitle: null,
  seoDescription: null,
  faqItems: null,
  photos: [],
  amenities: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(() => vi.clearAllMocks())

describe("createProperty", () => {
  it("creates a property with correct data", async () => {
    vi.mocked(prisma.property.create).mockResolvedValue(mockProperty)

    const result = await createProperty({
      workspaceId: "ws_1",
      slug: "villa-les-pins",
      name: "Villa Les Pins",
      descriptionFr: "Belle villa",
      descriptionEn: "Beautiful villa",
      type: "villa",
      address: "12 Rue des Pins",
      city: "Nice",
      country: "FR",
      maxGuests: 8,
      bedrooms: 4,
      bathrooms: 2,
      pricePerNight: 250,
      currency: "EUR",
      cleaningFee: 80,
      depositAmount: 500,
      minNights: 3,
    })

    expect(prisma.property.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        workspaceId: "ws_1",
        slug: "villa-les-pins",
        description: { fr: "Belle villa", en: "Beautiful villa" },
      }),
    })
    expect(result.name).toBe("Villa Les Pins")
  })
})

describe("getPropertiesByWorkspaceId", () => {
  it("returns list of properties with photo count", async () => {
    vi.mocked(prisma.property.findMany).mockResolvedValue([mockProperty])

    const result = await getPropertiesByWorkspaceId("ws_1")

    expect(prisma.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { workspaceId: "ws_1" } })
    )
    expect(result).toHaveLength(1)
  })
})

describe("getPropertyById", () => {
  it("returns property with photos and amenities", async () => {
    vi.mocked(prisma.property.findFirst).mockResolvedValue(mockProperty)

    const result = await getPropertyById("prop_1", "ws_1")

    expect(prisma.property.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "prop_1", workspaceId: "ws_1" },
      })
    )
    expect(result?.id).toBe("prop_1")
  })

  it("returns null when not found", async () => {
    vi.mocked(prisma.property.findFirst).mockResolvedValue(null)

    expect(await getPropertyById("not_found", "ws_1")).toBeNull()
  })
})

describe("getPropertyBySlug", () => {
  it("returns active property by workspace slug and property slug", async () => {
    vi.mocked(prisma.property.findFirst).mockResolvedValue(mockProperty)

    const result = await getPropertyBySlug("ws_1", "villa-les-pins")

    expect(prisma.property.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workspaceId: "ws_1", slug: "villa-les-pins" },
      })
    )
    expect(result?.slug).toBe("villa-les-pins")
  })
})

describe("isPropertySlugAvailable", () => {
  it("returns true when slug is not taken in workspace", async () => {
    vi.mocked(prisma.property.findFirst).mockResolvedValue(null)
    expect(await isPropertySlugAvailable("ws_1", "new-slug")).toBe(true)
  })

  it("returns false when slug exists in workspace", async () => {
    vi.mocked(prisma.property.findFirst).mockResolvedValue(mockProperty)
    expect(await isPropertySlugAvailable("ws_1", "villa-les-pins")).toBe(false)
  })
})

describe("updateProperty", () => {
  it("updates a property", async () => {
    vi.mocked(prisma.property.update).mockResolvedValue({
      ...mockProperty,
      name: "Villa Les Palmiers",
    })

    const result = await updateProperty("prop_1", { name: "Villa Les Palmiers" })

    expect(prisma.property.update).toHaveBeenCalledWith({
      where: { id: "prop_1" },
      data: expect.objectContaining({ name: "Villa Les Palmiers" }),
      include: { photos: true, amenities: true },
    })
    expect(result.name).toBe("Villa Les Palmiers")
  })
})

describe("deleteProperty", () => {
  it("deletes a property by id", async () => {
    vi.mocked(prisma.property.delete).mockResolvedValue(mockProperty)

    await deleteProperty("prop_1")

    expect(prisma.property.delete).toHaveBeenCalledWith({
      where: { id: "prop_1" },
    })
  })
})

describe("updatePropertyAmenities", () => {
  it("replaces amenities with new set", async () => {
    vi.mocked(prisma.propertyAmenity.deleteMany).mockResolvedValue({ count: 2 })
    vi.mocked(prisma.propertyAmenity.createMany).mockResolvedValue({ count: 3 })

    await updatePropertyAmenities("prop_1", ["wifi", "pool", "parking"])

    expect(prisma.propertyAmenity.deleteMany).toHaveBeenCalledWith({
      where: { propertyId: "prop_1" },
    })
    expect(prisma.propertyAmenity.createMany).toHaveBeenCalledWith({
      data: [
        { propertyId: "prop_1", key: "wifi" },
        { propertyId: "prop_1", key: "pool" },
        { propertyId: "prop_1", key: "parking" },
      ],
    })
  })
})
```

- [ ] **Run tests to confirm failure**

```bash
npm run test:run -- src/features/properties/service.test.ts
```
Expected: FAIL — `Cannot find module './service'`

- [ ] **Create `src/features/properties/service.ts`**

```typescript
import { prisma } from "@/lib/prisma"
import type { CreatePropertyInput, UpdatePropertyInput } from "./types"

const propertyWithRelations = {
  photos: { orderBy: { order: "asc" as const } },
  amenities: true,
}

export async function createProperty(input: CreatePropertyInput) {
  return prisma.property.create({
    data: {
      workspaceId: input.workspaceId,
      slug: input.slug,
      name: input.name,
      description: { fr: input.descriptionFr, en: input.descriptionEn },
      type: input.type,
      address: input.address,
      city: input.city,
      country: input.country,
      maxGuests: input.maxGuests,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      pricePerNight: input.pricePerNight,
      currency: input.currency,
      cleaningFee: input.cleaningFee,
      depositAmount: input.depositAmount,
      minNights: input.minNights,
    },
    include: propertyWithRelations,
  })
}

export async function getPropertiesByWorkspaceId(workspaceId: string) {
  return prisma.property.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { photos: true } },
    },
  })
}

export async function getPropertyById(id: string, workspaceId: string) {
  return prisma.property.findFirst({
    where: { id, workspaceId },
    include: propertyWithRelations,
  })
}

export async function getPropertyBySlug(workspaceId: string, slug: string) {
  return prisma.property.findFirst({
    where: { workspaceId, slug },
    include: propertyWithRelations,
  })
}

export async function isPropertySlugAvailable(
  workspaceId: string,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const existing = await prisma.property.findFirst({
    where: { workspaceId, slug, NOT: excludeId ? { id: excludeId } : undefined },
  })
  return existing === null
}

export async function updateProperty(
  id: string,
  input: UpdatePropertyInput & { descriptionFr?: string; descriptionEn?: string }
) {
  const { descriptionFr, descriptionEn, ...rest } = input
  const descriptionUpdate =
    descriptionFr !== undefined || descriptionEn !== undefined
      ? { description: { fr: descriptionFr ?? "", en: descriptionEn ?? "" } }
      : {}

  return prisma.property.update({
    where: { id },
    data: { ...rest, ...descriptionUpdate },
    include: propertyWithRelations,
  })
}

export async function deleteProperty(id: string) {
  return prisma.property.delete({ where: { id } })
}

export async function updatePropertyAmenities(
  propertyId: string,
  keys: string[]
) {
  await prisma.propertyAmenity.deleteMany({ where: { propertyId } })
  await prisma.propertyAmenity.createMany({
    data: keys.map((key) => ({ propertyId, key })),
  })
}
```

- [ ] **Run tests to confirm they pass**

```bash
npm run test:run -- src/features/properties/service.test.ts
```
Expected: `10 tests passed`

- [ ] **Commit**

```bash
git add src/features/properties/service.ts src/features/properties/service.test.ts
git commit -m "feat(properties): add property service with tests"
```

---

## Task 5: Photo service + tests

**Files:**
- Create: `src/features/properties/photo-service.test.ts`
- Create: `src/features/properties/photo-service.ts`

- [ ] **Write failing tests — `src/features/properties/photo-service.test.ts`**

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    propertyPhoto: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock("@/lib/r2", () => ({
  deleteR2Object: vi.fn(),
  extractR2Key: vi.fn((url: string) => url.replace("https://pub.r2.dev/", "")),
}))

import { prisma } from "@/lib/prisma"
import {
  countPropertyPhotos,
  createPropertyPhoto,
  deletePropertyPhoto,
  getPropertyPhotos,
  reorderPropertyPhotos,
} from "./photo-service"

const mockPhoto = {
  id: "photo_1",
  propertyId: "prop_1",
  url: "https://pub.r2.dev/properties/prop_1/abc.jpg",
  caption: null,
  order: 0,
  createdAt: new Date(),
}

beforeEach(() => vi.clearAllMocks())

describe("createPropertyPhoto", () => {
  it("saves a photo record", async () => {
    vi.mocked(prisma.propertyPhoto.create).mockResolvedValue(mockPhoto)

    const result = await createPropertyPhoto(
      "prop_1",
      "https://pub.r2.dev/properties/prop_1/abc.jpg",
      0
    )

    expect(prisma.propertyPhoto.create).toHaveBeenCalledWith({
      data: {
        propertyId: "prop_1",
        url: "https://pub.r2.dev/properties/prop_1/abc.jpg",
        order: 0,
        caption: undefined,
      },
    })
    expect(result.id).toBe("photo_1")
  })
})

describe("getPropertyPhotos", () => {
  it("returns photos ordered by order field", async () => {
    vi.mocked(prisma.propertyPhoto.findMany).mockResolvedValue([mockPhoto])

    const result = await getPropertyPhotos("prop_1")

    expect(prisma.propertyPhoto.findMany).toHaveBeenCalledWith({
      where: { propertyId: "prop_1" },
      orderBy: { order: "asc" },
    })
    expect(result).toHaveLength(1)
  })
})

describe("countPropertyPhotos", () => {
  it("returns the photo count", async () => {
    vi.mocked(prisma.propertyPhoto.count).mockResolvedValue(5)

    const count = await countPropertyPhotos("prop_1")

    expect(prisma.propertyPhoto.count).toHaveBeenCalledWith({
      where: { propertyId: "prop_1" },
    })
    expect(count).toBe(5)
  })
})

describe("deletePropertyPhoto", () => {
  it("deletes photo from DB", async () => {
    vi.mocked(prisma.propertyPhoto.findUnique).mockResolvedValue(mockPhoto)
    vi.mocked(prisma.propertyPhoto.delete).mockResolvedValue(mockPhoto)

    await deletePropertyPhoto("photo_1")

    expect(prisma.propertyPhoto.delete).toHaveBeenCalledWith({
      where: { id: "photo_1" },
    })
  })
})

describe("reorderPropertyPhotos", () => {
  it("updates order for each photo id in sequence", async () => {
    vi.mocked(prisma.propertyPhoto.update).mockResolvedValue(mockPhoto)

    await reorderPropertyPhotos(["photo_3", "photo_1", "photo_2"])

    expect(prisma.propertyPhoto.update).toHaveBeenCalledTimes(3)
    expect(prisma.propertyPhoto.update).toHaveBeenNthCalledWith(1, {
      where: { id: "photo_3" },
      data: { order: 0 },
    })
    expect(prisma.propertyPhoto.update).toHaveBeenNthCalledWith(2, {
      where: { id: "photo_1" },
      data: { order: 1 },
    })
    expect(prisma.propertyPhoto.update).toHaveBeenNthCalledWith(3, {
      where: { id: "photo_2" },
      data: { order: 2 },
    })
  })
})
```

- [ ] **Run to confirm failure**

```bash
npm run test:run -- src/features/properties/photo-service.test.ts
```
Expected: FAIL — `Cannot find module './photo-service'`

- [ ] **Create `src/features/properties/photo-service.ts`**

```typescript
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
```

- [ ] **Run tests to confirm they pass**

```bash
npm run test:run -- src/features/properties/photo-service.test.ts
```
Expected: `6 tests passed`

- [ ] **Run all tests**

```bash
npm run test:run
```
Expected: `18 tests passed` (8 workspace + 10 property service + 6 photo service = 24 — adjust if counts differ).

- [ ] **Commit**

```bash
git add src/features/properties/photo-service.ts src/features/properties/photo-service.test.ts
git commit -m "feat(properties): add photo service with R2 delete and reorder"
```

---

## Task 6: Property + photo server actions

**Files:**
- Create: `src/features/properties/routes.ts`
- Create: `src/features/properties/guards.ts`
- Create: `src/features/properties/actions.ts`
- Create: `src/features/properties/photo-actions.ts`

- [ ] **Create `src/features/properties/routes.ts`**

```typescript
export const propertyRoutes = {
  list: "/admin/properties",
  new: "/admin/properties/new",
  edit: (id: string) => `/admin/properties/${id}/edit`,
} as const
```

- [ ] **Create `src/features/properties/guards.ts`**

```typescript
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

  return property as PropertyDetail
}
```

- [ ] **Create `src/features/properties/actions.ts`**

```typescript
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

  await deleteProperty(propertyId)
  redirect(propertyRoutes.list)
}
```

- [ ] **Create `src/features/properties/photo-actions.ts`**

```typescript
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
  if (!session?.user?.id) return { error: "Non autorisé" }

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
  if (!session?.user?.id) return { error: "Non autorisé" }

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
  if (!session?.user?.id) return { error: "Non autorisé" }

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
  if (!session?.user?.id) return { error: "Non autorisé" }

  const workspace = await getWorkspaceByOwnerId(session.user.id)
  if (!workspace) return { error: "Espace introuvable" }

  const property = await getPropertyById(propertyId, workspace.id)
  if (!property) return { error: "Logement introuvable" }

  await reorderPropertyPhotos(orderedPhotoIds)
  revalidatePath(propertyRoutes.edit(propertyId))
  return { success: true }
}
```

- [ ] **Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Run all tests**

```bash
npm run test:run
```
Expected: all pass.

- [ ] **Commit**

```bash
git add src/features/properties/routes.ts src/features/properties/guards.ts src/features/properties/actions.ts src/features/properties/photo-actions.ts
git commit -m "feat(properties): add CRUD and photo server actions"
```

---

## Task 7: Admin property list page

**Files:**
- Create: `src/app/admin/properties/layout.tsx`
- Create: `src/app/admin/properties/page.tsx`

- [ ] **Create `src/app/admin/properties/layout.tsx`**

```typescript
import { requireWorkspace } from "@/features/workspaces/guards"

export default async function PropertiesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireWorkspace()
  return <>{children}</>
}
```

- [ ] **Create `src/app/admin/properties/page.tsx`**

```typescript
import Link from "next/link"
import { PlusIcon } from "lucide-react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getWorkspaceByOwnerId } from "@/features/workspaces/service"
import { getPropertiesByWorkspaceId } from "@/features/properties/service"
import { propertyRoutes } from "@/features/properties/routes"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: "Appartement",
  house: "Maison",
  villa: "Villa",
  chalet: "Chalet",
  studio: "Studio",
  loft: "Loft",
  other: "Autre",
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-gray-100 text-gray-700" },
  active: { label: "Actif", className: "bg-green-100 text-green-800" },
  archived: { label: "Archivé", className: "bg-red-100 text-red-700" },
}

export default async function PropertiesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const workspace = await getWorkspaceByOwnerId(session.user.id)
  if (!workspace) redirect("/admin/workspace/new")

  const properties = await getPropertiesByWorkspaceId(workspace.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mes logements</h1>
          <p className="text-muted-foreground">
            {properties.length} logement{properties.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href={propertyRoutes.new}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Ajouter un logement
          </Link>
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Aucun logement</CardTitle>
            <CardDescription>
              Ajoutez votre premier logement pour commencer à recevoir des
              réservations directes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={propertyRoutes.new}>Créer un logement</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => {
            const status = STATUS_LABELS[property.status] ?? STATUS_LABELS.draft
            return (
              <Card key={property.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{property.name}</CardTitle>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <CardDescription>
                    {PROPERTY_TYPE_LABELS[property.type] ?? property.type} ·{" "}
                    {property.city}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    {Number(property.pricePerNight).toLocaleString("fr-FR", {
                      style: "currency",
                      currency: property.currency,
                    })}{" "}
                    / nuit ·{" "}
                    {"_count" in property
                      ? (property as { _count: { photos: number } })._count.photos
                      : 0}{" "}
                    photo(s)
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={propertyRoutes.edit(property.id)}>
                      Modifier
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Commit**

```bash
git add src/app/admin/properties/
git commit -m "feat(properties): add admin property list page"
```

---

## Task 8: Property form component + create page

**Files:**
- Create: `src/features/properties/components/property-form.tsx`
- Create: `src/app/admin/properties/new/page.tsx`

- [ ] **Create `src/features/properties/components/property-form.tsx`**

```typescript
"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createPropertyAction, updatePropertyAction } from "@/features/properties/actions"
import { propertyTypeValues } from "@/features/properties/schema"
import type { PropertyDetail } from "@/features/properties/types"

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: "Appartement",
  house: "Maison",
  villa: "Villa",
  chalet: "Chalet",
  studio: "Studio",
  loft: "Loft",
  other: "Autre",
}

type ActionState = { error?: string; success?: boolean } | undefined

type Props = {
  property?: PropertyDetail
}

export function PropertyForm({ property }: Props) {
  const isEdit = Boolean(property)

  const action = isEdit
    ? updatePropertyAction.bind(null, property!.id)
    : createPropertyAction

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    action,
    undefined
  )

  const description = property?.description as
    | { fr?: string; en?: string }
    | undefined

  return (
    <form action={formAction} className="space-y-6">
      {/* Basic info */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nom du logement *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={property?.name}
            placeholder="Villa Les Pins"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug URL *</Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={property?.slug}
            placeholder="villa-les-pins"
            pattern="[a-z0-9-]+"
            required
          />
        </div>
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label htmlFor="type">Type de logement *</Label>
        <Select name="type" defaultValue={property?.type ?? "apartment"}>
          <SelectTrigger id="type">
            <SelectValue placeholder="Choisir un type" />
          </SelectTrigger>
          <SelectContent>
            {propertyTypeValues.map((t) => (
              <SelectItem key={t} value={t}>
                {PROPERTY_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Descriptions */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="descriptionFr">Description (Français) *</Label>
          <Textarea
            id="descriptionFr"
            name="descriptionFr"
            defaultValue={description?.fr}
            placeholder="Décrivez votre logement en français…"
            rows={6}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="descriptionEn">Description (English)</Label>
          <Textarea
            id="descriptionEn"
            name="descriptionEn"
            defaultValue={description?.en}
            placeholder="Describe your property in English…"
            rows={6}
          />
        </div>
      </div>

      {/* Location */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Adresse *</Label>
          <Input
            id="address"
            name="address"
            defaultValue={property?.address}
            placeholder="12 Rue des Pins"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Pays *</Label>
          <Input
            id="country"
            name="country"
            defaultValue={property?.country ?? "FR"}
            maxLength={2}
            placeholder="FR"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">Ville *</Label>
        <Input
          id="city"
          name="city"
          defaultValue={property?.city}
          placeholder="Nice"
          required
        />
      </div>

      {/* Capacity */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="maxGuests">Voyageurs max *</Label>
          <Input
            id="maxGuests"
            name="maxGuests"
            type="number"
            min={1}
            max={50}
            defaultValue={property?.maxGuests ?? 2}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bedrooms">Chambres *</Label>
          <Input
            id="bedrooms"
            name="bedrooms"
            type="number"
            min={0}
            max={20}
            defaultValue={property?.bedrooms ?? 1}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bathrooms">Salles de bain *</Label>
          <Input
            id="bathrooms"
            name="bathrooms"
            type="number"
            min={1}
            max={20}
            defaultValue={property?.bathrooms ?? 1}
            required
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="pricePerNight">Prix / nuit (€) *</Label>
          <Input
            id="pricePerNight"
            name="pricePerNight"
            type="number"
            min={1}
            step="0.01"
            defaultValue={property ? Number(property.pricePerNight) : ""}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Devise</Label>
          <Select name="currency" defaultValue={property?.currency ?? "EUR"}>
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR €</SelectItem>
              <SelectItem value="GBP">GBP £</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cleaningFee">Frais ménage (€)</Label>
          <Input
            id="cleaningFee"
            name="cleaningFee"
            type="number"
            min={0}
            step="0.01"
            defaultValue={property ? Number(property.cleaningFee) : 0}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="depositAmount">Caution (€)</Label>
          <Input
            id="depositAmount"
            name="depositAmount"
            type="number"
            min={0}
            step="0.01"
            defaultValue={property ? Number(property.depositAmount) : 0}
          />
        </div>
      </div>

      <div className="space-y-2 max-w-xs">
        <Label htmlFor="minNights">Séjour minimum (nuits)</Label>
        <Input
          id="minNights"
          name="minNights"
          type="number"
          min={1}
          max={365}
          defaultValue={property?.minNights ?? 1}
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600">Modifications enregistrées.</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending
          ? isEdit
            ? "Enregistrement…"
            : "Création…"
          : isEdit
            ? "Enregistrer"
            : "Créer le logement"}
      </Button>
    </form>
  )
}
```

- [ ] **Create `src/app/admin/properties/new/page.tsx`**

```typescript
import { PropertyForm } from "@/features/properties/components/property-form"

export default function NewPropertyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouveau logement</h1>
        <p className="text-muted-foreground">
          Renseignez les informations de votre logement
        </p>
      </div>
      <PropertyForm />
    </div>
  )
}
```

- [ ] **Check if `Textarea` component exists**

```bash
ls src/components/ui/ | grep textarea
```
If missing: `npx shadcn@latest add textarea`

- [ ] **Check if `Select` component exists**

```bash
ls src/components/ui/ | grep select
```
If missing: `npx shadcn@latest add select`

- [ ] **Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Commit**

```bash
git add src/features/properties/components/property-form.tsx src/app/admin/properties/new/
git commit -m "feat(properties): add property form component and create page"
```

---

## Task 9: Photo uploader + amenity selector + edit page

**Files:**
- Create: `src/features/properties/components/photo-uploader.tsx`
- Create: `src/features/properties/components/amenity-selector.tsx`
- Create: `src/app/admin/properties/[propertyId]/edit/page.tsx`

- [ ] **Create `src/features/properties/components/photo-uploader.tsx`**

```typescript
"use client"

import { useRef, useState } from "react"
import { TrashIcon, UploadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getPhotoUploadUrlAction,
  savePhotoAction,
  deletePhotoAction,
} from "@/features/properties/photo-actions"
import type { PropertyPhoto } from "@/features/properties/types"

type Props = {
  propertyId: string
  photos: PropertyPhoto[]
  maxPhotos?: number
}

export function PhotoUploader({ propertyId, photos, maxPhotos = 20 }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setError(null)
    setUploading(true)

    for (const file of files) {
      if (photos.length >= maxPhotos) {
        setError(`Maximum ${maxPhotos} photos atteint`)
        break
      }
      // 1. Get presigned URL
      const urlResult = await getPhotoUploadUrlAction(
        propertyId,
        file.name,
        file.type as "image/jpeg" | "image/png" | "image/webp" | "image/avif"
      )
      if ("error" in urlResult) {
        setError(urlResult.error ?? "Erreur lors de l'upload")
        break
      }

      // 2. Upload directly to R2
      const uploadResp = await fetch(urlResult.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      })
      if (!uploadResp.ok) {
        setError("Échec de l'upload vers le stockage")
        break
      }

      // 3. Save URL to DB
      const saveResult = await savePhotoAction(propertyId, urlResult.publicUrl)
      if ("error" in saveResult) {
        setError(saveResult.error ?? "Erreur lors de la sauvegarde")
        break
      }
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
    // Reload to show new photos (server component re-fetch)
    window.location.reload()
  }

  async function handleDelete(photoId: string) {
    const result = await deletePhotoAction(photoId, propertyId)
    if ("error" in result) {
      setError(result.error ?? "Erreur lors de la suppression")
      return
    }
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      {/* Existing photos */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo) => (
          <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={photo.caption ?? "Photo du logement"}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleDelete(photo.id)}
              className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Supprimer la photo"
            >
              <TrashIcon className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Upload button */}
      {photos.length < maxPhotos && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon className="mr-2 h-4 w-4" />
            {uploading ? "Upload en cours…" : "Ajouter des photos"}
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">
            {photos.length}/{maxPhotos} photos · JPEG, PNG, WebP, AVIF
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
```

- [ ] **Create `src/features/properties/components/amenity-selector.tsx`**

```typescript
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { updateAmenitiesAction } from "@/features/properties/actions"
import {
  AMENITY_KEYS,
  AMENITY_LABELS,
  type AmenityKey,
} from "@/features/properties/amenities"
import type { PropertyAmenity } from "@/features/properties/types"

type Props = {
  propertyId: string
  amenities: PropertyAmenity[]
}

export function AmenitySelector({ propertyId, amenities }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(amenities.map((a) => a.key))
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    setMessage(null)
  }

  async function handleSave() {
    setSaving(true)
    const result = await updateAmenitiesAction(propertyId, Array.from(selected))
    setSaving(false)
    setMessage("error" in result ? (result.error ?? "Erreur") : "Équipements sauvegardés")
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {AMENITY_KEYS.map((key) => {
          const isOn = selected.has(key)
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                isOn
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {AMENITY_LABELS[key as AmenityKey]}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={saving} size="sm">
          {saving ? "Sauvegarde…" : "Sauvegarder les équipements"}
        </Button>
        {message && (
          <span className="text-sm text-muted-foreground">{message}</span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Create `src/app/admin/properties/[propertyId]/edit/page.tsx`**

```typescript
import { Separator } from "@/components/ui/separator"
import { requireOwnedProperty } from "@/features/properties/guards"
import { PropertyForm } from "@/features/properties/components/property-form"
import { PhotoUploader } from "@/features/properties/components/photo-uploader"
import { AmenitySelector } from "@/features/properties/components/amenity-selector"
import type { PropertyPhoto, PropertyAmenity } from "@/features/properties/types"

type Props = {
  params: Promise<{ propertyId: string }>
}

export default async function EditPropertyPage({ params }: Props) {
  const { propertyId } = await params
  const property = await requireOwnedProperty(propertyId)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{property.name}</h1>
        <p className="text-muted-foreground">Modifier le logement</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Informations générales</h2>
        <PropertyForm property={property} />
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Photos</h2>
        <PhotoUploader
          propertyId={property.id}
          photos={property.photos as PropertyPhoto[]}
        />
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Équipements</h2>
        <AmenitySelector
          propertyId={property.id}
          amenities={property.amenities as PropertyAmenity[]}
        />
      </section>
    </div>
  )
}
```

- [ ] **Check if `Separator` component exists**

```bash
ls src/components/ui/ | grep separator
```
If missing: `npx shadcn@latest add separator`

- [ ] **Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Run all tests**

```bash
npm run test:run
```
Expected: all tests pass.

- [ ] **Commit**

```bash
git add src/features/properties/components/ src/app/admin/properties/
git commit -m "feat(properties): add photo uploader, amenity selector, and edit page"
```

---

## Task 10: Public property page

**Files:**
- Create: `src/app/site/[slug]/[propertySlug]/page.tsx`

- [ ] **Create `src/app/site/[slug]/[propertySlug]/page.tsx`**

```typescript
import { notFound } from "next/navigation"
import { BedDoubleIcon, BathIcon, UsersIcon, StarIcon } from "lucide-react"
import { getWorkspaceBySlug } from "@/features/workspaces/service"
import { getPropertyBySlug } from "@/features/properties/service"
import {
  AMENITY_KEYS,
  AMENITY_LABELS,
  type AmenityKey,
} from "@/features/properties/amenities"
import type { PropertyPhoto } from "@/features/properties/types"

type Props = {
  params: Promise<{ slug: string; propertySlug: string }>
}

export default async function PublicPropertyPage({ params }: Props) {
  const { slug, propertySlug } = await params

  const workspace = await getWorkspaceBySlug(slug)
  if (!workspace) notFound()

  const property = await getPropertyBySlug(workspace.id, propertySlug)
  if (!property || property.status !== "active") notFound()

  const description = property.description as { fr?: string; en?: string }
  const amenityKeys = property.amenities.map((a) => a.key)
  const photos = property.photos as PropertyPhoto[]

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      {/* Photo gallery */}
      {photos.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {photos.slice(0, 5).map((photo, i) => (
            <div
              key={photo.id}
              className={`overflow-hidden rounded-lg ${i === 0 ? "sm:col-span-2" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.caption ?? property.name}
                className="h-64 w-full object-cover sm:h-80"
              />
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{property.name}</h1>
        <p className="text-muted-foreground">
          {property.city}, {property.country}
        </p>
      </div>

      {/* Key stats */}
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="flex items-center gap-1">
          <UsersIcon className="h-4 w-4" />
          {property.maxGuests} voyageurs
        </span>
        <span className="flex items-center gap-1">
          <BedDoubleIcon className="h-4 w-4" />
          {property.bedrooms} chambre{property.bedrooms !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <BathIcon className="h-4 w-4" />
          {property.bathrooms} salle{property.bathrooms !== 1 ? "s" : ""} de bain
        </span>
      </div>

      {/* Description */}
      {description.fr && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">À propos</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {description.fr}
          </p>
        </div>
      )}

      {/* Pricing */}
      <div className="rounded-xl border p-6 space-y-3">
        <div className="text-2xl font-bold">
          {Number(property.pricePerNight).toLocaleString("fr-FR", {
            style: "currency",
            currency: property.currency,
          })}
          <span className="text-base font-normal text-muted-foreground">
            {" "}
            / nuit
          </span>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          {Number(property.cleaningFee) > 0 && (
            <p>
              Frais de ménage :{" "}
              {Number(property.cleaningFee).toLocaleString("fr-FR", {
                style: "currency",
                currency: property.currency,
              })}
            </p>
          )}
          {Number(property.depositAmount) > 0 && (
            <p>
              Caution :{" "}
              {Number(property.depositAmount).toLocaleString("fr-FR", {
                style: "currency",
                currency: property.currency,
              })}
            </p>
          )}
          <p>Séjour minimum : {property.minNights} nuit{property.minNights !== 1 ? "s" : ""}</p>
        </div>
        {/* Booking CTA — Phase D */}
        <div className="pt-2">
          <button
            disabled
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground opacity-60 cursor-not-allowed"
          >
            Réserver (bientôt disponible)
          </button>
        </div>
      </div>

      {/* Amenities */}
      {amenityKeys.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Équipements</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {amenityKeys
              .filter((k) => AMENITY_KEYS.includes(k as AmenityKey))
              .map((key) => (
                <span key={key} className="flex items-center gap-2 text-sm">
                  <StarIcon className="h-3 w-3 text-muted-foreground" />
                  {AMENITY_LABELS[key as AmenityKey]}
                </span>
              ))}
          </div>
        </div>
      )}
    </main>
  )
}
```

- [ ] **Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Run all tests**

```bash
npm run test:run
```
Expected: all tests pass.

- [ ] **Run full build**

```bash
npm run build 2>&1 | tail -20
```
Expected: clean build.

- [ ] **Commit**

```bash
git add src/app/site/
git commit -m "feat(properties): add public property page"
```

---

## Phase B complete

Phase B delivers:
- ✅ Property, PropertyPhoto, PropertyAmenity Prisma models
- ✅ Cloudflare R2 client with presigned upload URLs
- ✅ Property service (10 tests) + photo service (6 tests) = 16 new tests
- ✅ Full CRUD server actions with ownership checks
- ✅ Admin property list + create + edit pages
- ✅ Photo uploader (client → R2 directly)
- ✅ Amenity selector (20 predefined amenities)
- ✅ Public property page at `[slug]/[propertySlug]`

**Next phase:** Phase C — iCal calendar sync  
Plan file: `docs/superpowers/plans/2026-04-19-phase-c-calendars.md` (à créer)

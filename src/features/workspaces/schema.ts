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

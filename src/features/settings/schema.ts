import { z } from "zod";
import { ProjectStatus } from "@/generated/prisma/enums";

const optionalTextInput = z.string().trim().max(255);
const optionalUrlInput = z
  .string()
  .trim()
  .max(255)
  .refine(
    (value) =>
      value === "" ||
      z.string().url().safeParse(value).success,
    {
      message: "Please enter a valid URL or leave the field empty.",
    },
  );
const optionalHexColorInput = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value),
    {
      message: "Please enter a valid hex color or leave the field empty.",
    },
  );
const optionalText = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmedValue = value.trim();
    return trimmedValue === "" ? undefined : trimmedValue;
  },
  z.string().max(255).optional(),
);

const optionalUrl = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmedValue = value.trim();
    return trimmedValue === "" ? undefined : trimmedValue;
  },
  z.string().url().max(255).optional(),
);

const optionalHexColor = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmedValue = value.trim();
    return trimmedValue === "" ? undefined : trimmedValue;
  },
  z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
);

export const adminProjectSettingsFormSchema = z.object({
  projectName: z.string().trim().min(2).max(120),
  description: optionalTextInput,
  siteName: optionalTextInput,
  siteUrl: optionalUrlInput,
  brandingPrimaryColor: optionalHexColorInput,
  brandingLogoUrl: optionalUrlInput,
  billingEnabled: z.boolean(),
  customerPortalEnabled: z.boolean(),
});

export const platformProjectSettingsFormSchema =
  adminProjectSettingsFormSchema.extend({
    status: z.nativeEnum(ProjectStatus),
  });

export const adminProjectSettingsSchema = z.object({
  projectName: z.string().trim().min(2).max(120),
  description: optionalText,
  siteName: optionalText,
  siteUrl: optionalUrl,
  brandingPrimaryColor: optionalHexColor,
  brandingLogoUrl: optionalUrl,
  billingEnabled: z.boolean(),
  customerPortalEnabled: z.boolean(),
});

export const platformProjectSettingsSchema = adminProjectSettingsSchema.extend({
  status: z.nativeEnum(ProjectStatus),
});

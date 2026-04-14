import { z } from "zod";

const requiredTrimmedString = z.string().trim().min(2).max(120);
const normalizedEmail = z.string().trim().toLowerCase().email();
const requiredPassword = z.string().trim().min(8).max(72);
const requiredProjectId = z.string().trim().min(1, "Project is required.");
const optionalPasswordInput = z
  .string()
  .trim()
  .max(72)
  .refine((value) => value === "" || value.length >= 8, {
    message: "Password must be at least 8 characters or empty.",
  });
const optionalPassword = z
  .union([requiredPassword, z.literal("")])
  .transform((value) => (value === "" ? undefined : value));

export const managedAdminAccountCreateFormSchema = z.object({
  name: requiredTrimmedString,
  email: normalizedEmail,
  password: requiredPassword,
  projectId: requiredProjectId,
});

export const managedAdminAccountUpdateFormSchema = z.object({
  name: requiredTrimmedString,
  email: normalizedEmail,
  password: optionalPasswordInput,
  projectId: requiredProjectId,
});

export const managedAdminAccountCreateSchema = z.object({
  name: requiredTrimmedString,
  email: normalizedEmail,
  password: requiredPassword,
  projectId: requiredProjectId,
});

export const managedAdminAccountUpdateSchema = z.object({
  name: requiredTrimmedString,
  email: normalizedEmail,
  password: optionalPassword,
  projectId: requiredProjectId,
});

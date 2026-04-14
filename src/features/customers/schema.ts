import { z } from "zod";

const requiredTrimmedString = z.string().trim().min(2).max(120);
const normalizedEmail = z.string().trim().toLowerCase().email();
const requiredPassword = z.string().trim().min(8).max(72);
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

export const customerCreateFormSchema = z.object({
  name: requiredTrimmedString,
  email: normalizedEmail,
  password: requiredPassword,
});

export const customerUpdateFormSchema = z.object({
  name: requiredTrimmedString,
  email: normalizedEmail,
  password: optionalPasswordInput,
});

export const customerCreateSchema = z.object({
  name: requiredTrimmedString,
  email: normalizedEmail,
  password: requiredPassword,
});

export const customerUpdateSchema = z.object({
  name: requiredTrimmedString,
  email: normalizedEmail,
  password: optionalPassword,
});

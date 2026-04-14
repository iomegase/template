import { z } from "zod";

const requiredTrimmedString = z.string().trim().min(2).max(160);
const optionalTrimmedString = z.string().trim().max(2000).optional();
const phoneSchema = z.string().trim().min(6).max(30);

export const healthQuestionnaireSubmissionSchema = z.object({
  consentAccepted: z.boolean().refine((value) => value, {
    message: "Consent must be accepted before submitting the health questionnaire.",
  }),
  emergencyContactName: requiredTrimmedString,
  emergencyContactPhone: phoneSchema,
  allergies: optionalTrimmedString,
  medicalConditions: optionalTrimmedString,
  currentMedications: optionalTrimmedString,
  mobilityLimitations: optionalTrimmedString,
  additionalNotes: optionalTrimmedString,
});

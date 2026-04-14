import type { HealthQuestionnaireStatus } from "@/generated/prisma/enums";

export type HealthQuestionnaireRecord = {
  id: string;
  bookingId: string;
  status: HealthQuestionnaireStatus;
  submittedAt: Date | null;
  consentAccepted: boolean;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  allergies: string | null;
  medicalConditions: string | null;
  currentMedications: string | null;
  mobilityLimitations: string | null;
  additionalNotes: string | null;
  accessTokenHash: string | null;
  accessExpiresAt: Date | null;
  lastAccessedAt: Date | null;
  submittedIpHash: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type HealthQuestionnaireFormValues = {
  consentAccepted: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
  allergies?: string;
  medicalConditions?: string;
  currentMedications?: string;
  mobilityLimitations?: string;
  additionalNotes?: string;
};

import type { SatisfactionSurveyStatus } from "@/generated/prisma/enums";

export type SatisfactionSurveyRecord = {
  id: string;
  bookingId: string;
  status: SatisfactionSurveyStatus;
  sentAt: Date | null;
  submittedAt: Date | null;
  rating: number | null;
  comment: string | null;
  wouldRecommend: boolean | null;
  testimonialConsent: boolean;
  accessTokenHash: string | null;
  accessExpiresAt: Date | null;
  lastAccessedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SatisfactionSurveyFormValues = {
  rating: number;
  comment?: string;
  wouldRecommend: boolean;
  testimonialConsent: boolean;
};

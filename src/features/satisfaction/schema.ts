import { z } from "zod";

export const satisfactionSurveySubmissionSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
  wouldRecommend: z.boolean(),
  testimonialConsent: z.boolean(),
});

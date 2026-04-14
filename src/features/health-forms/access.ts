import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueHealthQuestionnaireAccessToken(bookingId: string) {
  const token = randomBytes(24).toString("hex");
  const accessTokenHash = hashToken(token);
  const accessExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);

  await prisma.healthQuestionnaire.upsert({
    where: {
      bookingId,
    },
    update: {
      accessTokenHash,
      accessExpiresAt,
    },
    create: {
      bookingId,
      accessTokenHash,
      accessExpiresAt,
    },
  });

  return {
    token,
    accessExpiresAt,
  };
}

export async function getHealthQuestionnaireByAccessToken(token: string) {
  const accessTokenHash = hashToken(token);

  const questionnaire = await prisma.healthQuestionnaire.findFirst({
    where: {
      accessTokenHash,
      accessExpiresAt: {
        gt: new Date(),
      },
    },
    include: {
      booking: {
        include: {
          offering: true,
          room: true,
          mainTraveler: true,
          companionTraveler: true,
        },
      },
    },
  });

  if (!questionnaire) {
    return null;
  }

  await prisma.healthQuestionnaire.update({
    where: {
      id: questionnaire.id,
    },
    data: {
      lastAccessedAt: new Date(),
    },
  });

  return questionnaire;
}

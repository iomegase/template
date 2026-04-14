import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import {
  BillingStatus,
  BookingStatus,
  CompanionType,
  OfferingStatus,
  OfferingType,
  PaymentMode,
  ProjectStatus,
  UserRole,
} from "../src/generated/prisma/enums";
import { resolvePrismaConnectionUrl } from "../src/lib/prisma-connection-url";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing");
}

const { directUrl } = resolvePrismaConnectionUrl(databaseUrl);
const adapter = new PrismaPg({ connectionString: directUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("Admin123!", 10);

  const project = await prisma.project.upsert({
    where: { slug: "demo-project" },
    update: {
      name: "Demo Project",
      description: "Projet de démonstration",
      status: ProjectStatus.active,
      settings: {
        upsert: {
          update: {
            siteName: "Demo Project",
            billingEnabled: false,
            customerPortalEnabled: true,
          },
          create: {
            siteName: "Demo Project",
            billingEnabled: false,
            customerPortalEnabled: true,
          },
        },
      },
    },
    create: {
      name: "Demo Project",
      slug: "demo-project",
      description: "Projet de démonstration",
      status: ProjectStatus.active,
      settings: {
        create: {
          siteName: "Demo Project",
          billingEnabled: false,
          customerPortalEnabled: true,
        },
      },
    },
  });

  await prisma.projectBilling.upsert({
    where: {
      projectId: project.id,
    },
    update: {},
    create: {
      projectId: project.id,
      status: BillingStatus.inactive,
    },
  });

  await prisma.user.upsert({
    where: { email: "superadmin@example.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "superadmin@example.com",
      passwordHash,
      role: UserRole.super_admin,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin Project",
      email: "admin@example.com",
      passwordHash,
      role: UserRole.admin,
      projectId: project.id,
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      name: "Customer Demo",
      email: "customer@example.com",
      passwordHash,
      role: UserRole.customer,
      projectId: project.id,
    },
  });

  const offering = await prisma.offering.upsert({
    where: {
      projectId_slug: {
        projectId: project.id,
        slug: "provence-autumn-retreat-2026",
      },
    },
    update: {
      title: "Provence Autumn Retreat",
      description: "Séjour bien-être de démonstration pour valider la future funnel booking.",
      offeringType: OfferingType.stay,
      startDate: new Date("2026-09-18T16:00:00.000Z"),
      endDate: new Date("2026-09-22T10:00:00.000Z"),
      location: "Luberon, France",
      status: OfferingStatus.scheduled,
      isBookable: true,
    },
    create: {
      projectId: project.id,
      slug: "provence-autumn-retreat-2026",
      title: "Provence Autumn Retreat",
      description: "Séjour bien-être de démonstration pour valider la future funnel booking.",
      offeringType: OfferingType.stay,
      startDate: new Date("2026-09-18T16:00:00.000Z"),
      endDate: new Date("2026-09-22T10:00:00.000Z"),
      location: "Luberon, France",
      status: OfferingStatus.scheduled,
      isBookable: true,
    },
  });

  const room = await prisma.roomOption.upsert({
    where: {
      offeringId_slug: {
        offeringId: offering.id,
        slug: "olive-suite-double",
      },
    },
    update: {
      name: "Olive Suite Double",
      description: "Chambre double premium avec terrasse privative.",
      capacity: 2,
      basePrice: 1450,
      currency: "EUR",
      includedMainGuest: true,
      companionYogaSurcharge: 550,
      companionNoYogaSurcharge: 320,
      inventory: 4,
      isActive: true,
    },
    create: {
      offeringId: offering.id,
      name: "Olive Suite Double",
      slug: "olive-suite-double",
      description: "Chambre double premium avec terrasse privative.",
      capacity: 2,
      basePrice: 1450,
      currency: "EUR",
      includedMainGuest: true,
      companionYogaSurcharge: 550,
      companionNoYogaSurcharge: 320,
      inventory: 4,
      isActive: true,
    },
  });

  const booking = await prisma.booking.upsert({
    where: {
      bookingReference: "BK-DEMO-2026-001",
    },
    update: {
      offeringId: offering.id,
      roomId: room.id,
      customerUserId: customerUser.id,
      status: BookingStatus.partially_paid,
      paymentMode: PaymentMode.split_2x,
      currency: "EUR",
      roomBasePrice: 1450,
      hasCompanion: true,
      companionType: CompanionType.with_yoga,
      companionSurcharge: 550,
      totalAmount: 2000,
      firstInstallmentAmount: 1000,
      secondInstallmentAmount: 1000,
      secondInstallmentDueDate: new Date("2026-08-18T09:00:00.000Z"),
      amountPaid: 1000,
      amountRemaining: 1000,
      stripeCustomerId: null,
    },
    create: {
      bookingReference: "BK-DEMO-2026-001",
      offeringId: offering.id,
      roomId: room.id,
      customerUserId: customerUser.id,
      status: BookingStatus.partially_paid,
      paymentMode: PaymentMode.split_2x,
      currency: "EUR",
      roomBasePrice: 1450,
      hasCompanion: true,
      companionType: CompanionType.with_yoga,
      companionSurcharge: 550,
      totalAmount: 2000,
      firstInstallmentAmount: 1000,
      secondInstallmentAmount: 1000,
      secondInstallmentDueDate: new Date("2026-08-18T09:00:00.000Z"),
      amountPaid: 1000,
      amountRemaining: 1000,
      stripeCustomerId: null,
    },
  });

  await prisma.mainTraveler.upsert({
    where: {
      bookingId: booking.id,
    },
    update: {
      firstName: "David",
      lastName: "Devillers",
      email: customerUser.email,
      phone: "+33600000000",
      addressLine1: "12 Rue des Oliviers",
      addressLine2: "Bâtiment A",
      postalCode: "75011",
      city: "Paris",
      country: "France",
    },
    create: {
      bookingId: booking.id,
      firstName: "David",
      lastName: "Devillers",
      email: customerUser.email,
      phone: "+33600000000",
      addressLine1: "12 Rue des Oliviers",
      addressLine2: "Bâtiment A",
      postalCode: "75011",
      city: "Paris",
      country: "France",
    },
  });

  await prisma.companionTraveler.upsert({
    where: {
      bookingId: booking.id,
    },
    update: {
      firstName: "Emma",
      lastName: "Martin",
      email: "emma.martin@example.com",
      phone: "+33611111111",
      participatesInYoga: true,
    },
    create: {
      bookingId: booking.id,
      firstName: "Emma",
      lastName: "Martin",
      email: "emma.martin@example.com",
      phone: "+33611111111",
      participatesInYoga: true,
    },
  });

  await prisma.healthQuestionnaire.upsert({
    where: {
      bookingId: booking.id,
    },
    update: {},
    create: {
      bookingId: booking.id,
    },
  });

  await prisma.satisfactionSurvey.upsert({
    where: {
      bookingId: booking.id,
    },
    update: {},
    create: {
      bookingId: booking.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

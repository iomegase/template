import { BookingStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import type { PublicOfferingDetail, PublicRoomOption } from "@/features/offerings/types";
import { prisma } from "@/lib/prisma";

const publicOfferingSelect = {
  id: true,
  projectId: true,
  slug: true,
  title: true,
  description: true,
  offeringType: true,
  startDate: true,
  endDate: true,
  location: true,
  status: true,
  isBookable: true,
  createdAt: true,
  updatedAt: true,
  project: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  roomOptions: {
    where: {
      isActive: true,
    },
    orderBy: {
      basePrice: "asc",
    },
    select: {
      id: true,
      offeringId: true,
      name: true,
      slug: true,
      description: true,
      capacity: true,
      basePrice: true,
      currency: true,
      includedMainGuest: true,
      companionYogaSurcharge: true,
      companionNoYogaSurcharge: true,
      inventory: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.OfferingSelect;

type RawPublicOffering = Prisma.OfferingGetPayload<{
  select: typeof publicOfferingSelect;
}>;

const activeBookingStatuses = [
  BookingStatus.pending,
  BookingStatus.payment_pending,
  BookingStatus.partially_paid,
  BookingStatus.paid,
  BookingStatus.health_form_pending,
  BookingStatus.ready,
  BookingStatus.completed,
] as const;

function decimalToNumber(value: Prisma.Decimal | number | string) {
  return Number(value);
}

function toPublicRoomOption(
  room: RawPublicOffering["roomOptions"][number],
  reservedSpots: number,
): PublicRoomOption {
  const remainingInventory = Math.max(room.inventory - reservedSpots, 0);

  return {
    id: room.id,
    offeringId: room.offeringId,
    name: room.name,
    slug: room.slug,
    description: room.description,
    capacity: room.capacity,
    basePrice: decimalToNumber(room.basePrice),
    currency: room.currency,
    includedMainGuest: room.includedMainGuest,
    companionYogaSurcharge: decimalToNumber(room.companionYogaSurcharge),
    companionNoYogaSurcharge: decimalToNumber(room.companionNoYogaSurcharge),
    inventory: room.inventory,
    isActive: room.isActive,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    reservedSpots,
    remainingInventory,
    isSoldOut: remainingInventory === 0,
  };
}

function getOfferingAvailabilityLabel(rooms: PublicRoomOption[], isBookable: boolean) {
  if (!isBookable) {
    return "Closed";
  }

  if (rooms.length === 0) {
    return "No rooms";
  }

  if (rooms.every((room) => room.isSoldOut)) {
    return "Sold out";
  }

  const totalRemaining = rooms.reduce(
    (count, room) => count + room.remainingInventory,
    0,
  );

  return `${totalRemaining} room${totalRemaining === 1 ? "" : "s"} left`;
}

export async function getPublicOfferingBySlug(
  slug: string,
): Promise<PublicOfferingDetail | null> {
  const offering = await prisma.offering.findFirst({
    where: {
      slug,
    },
    select: publicOfferingSelect,
  });

  if (!offering) {
    return null;
  }

  const roomIds = offering.roomOptions.map((room) => room.id);
  const bookingCounts = roomIds.length
    ? await prisma.booking.groupBy({
        by: ["roomId"],
        where: {
          roomId: {
            in: roomIds,
          },
          status: {
            in: [...activeBookingStatuses],
          },
        },
        _count: {
          _all: true,
        },
      })
    : [];

  const countMap = new Map(
    bookingCounts.map((row) => [row.roomId, row._count._all]),
  );

  const rooms = offering.roomOptions.map((room) =>
    toPublicRoomOption(room, countMap.get(room.id) ?? 0),
  );

  return {
    id: offering.id,
    projectId: offering.projectId,
    slug: offering.slug,
    title: offering.title,
    description: offering.description,
    offeringType: offering.offeringType,
    startDate: offering.startDate,
    endDate: offering.endDate,
    location: offering.location,
    status: offering.status,
    isBookable: offering.isBookable,
    createdAt: offering.createdAt,
    updatedAt: offering.updatedAt,
    project: offering.project,
    rooms,
    availabilityLabel: getOfferingAvailabilityLabel(rooms, offering.isBookable),
  };
}

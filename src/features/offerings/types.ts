import type {
  OfferingStatus,
  OfferingType,
} from "@/generated/prisma/enums";

export type OfferingListItem = {
  id: string;
  projectId: string;
  slug: string;
  title: string;
  description: string | null;
  offeringType: OfferingType;
  startDate: Date;
  endDate: Date;
  location: string;
  status: OfferingStatus;
  isBookable: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicRoomOption = RoomOptionRecord & {
  reservedSpots: number;
  remainingInventory: number;
  isSoldOut: boolean;
};

export type PublicOfferingDetail = OfferingListItem & {
  availabilityLabel: string;
  project: {
    id: string;
    name: string;
    slug: string;
  };
  rooms: PublicRoomOption[];
};

export type OfferingFormValues = {
  slug: string;
  title: string;
  description?: string;
  offeringType: OfferingType;
  startDate: Date;
  endDate: Date;
  location: string;
  status: OfferingStatus;
  isBookable: boolean;
};

export type OfferingCreateInput = OfferingFormValues & {
  projectId: string;
};

export type OfferingUpdateInput = OfferingFormValues;

export type RoomOptionRecord = {
  id: string;
  offeringId: string;
  name: string;
  slug: string;
  description: string | null;
  capacity: number;
  basePrice: number;
  currency: string;
  includedMainGuest: boolean;
  companionYogaSurcharge: number;
  companionNoYogaSurcharge: number;
  inventory: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type RoomOptionFormValues = {
  name: string;
  slug: string;
  description?: string;
  capacity: number;
  basePrice: number;
  currency: string;
  includedMainGuest: boolean;
  companionYogaSurcharge: number;
  companionNoYogaSurcharge: number;
  inventory: number;
  isActive: boolean;
};

export type RoomOptionCreateInput = RoomOptionFormValues & {
  offeringId: string;
};

export type RoomOptionUpdateInput = RoomOptionFormValues;

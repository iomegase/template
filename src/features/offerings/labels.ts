import {
  OfferingStatus,
  OfferingType,
} from "@/generated/prisma/enums";

const offeringTypeLabels: Record<OfferingType, string> = {
  stay: "Stay",
  product: "Product",
  service: "Service",
  event: "Event",
};

const offeringDisplayLabels: Record<OfferingType, string> = {
  stay: "Séjour",
  product: "Product",
  service: "Service",
  event: "Event",
};

const offeringStatusLabels: Record<OfferingStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
  archived: "Archived",
};

export function getOfferingTypeLabel(type: OfferingType) {
  return offeringTypeLabels[type];
}

export function getOfferingDisplayLabel(type: OfferingType) {
  return offeringDisplayLabels[type];
}

export function getOfferingStatusLabel(status: OfferingStatus) {
  return offeringStatusLabels[status];
}

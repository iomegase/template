import { ProjectStatus } from "@/generated/prisma/enums";

export function getProjectStatusLabel(status: ProjectStatus) {
  switch (status) {
    case ProjectStatus.draft:
      return "Draft";
    case ProjectStatus.active:
      return "Active";
    case ProjectStatus.billing_enabled:
      return "Billing-enabled";
    case ProjectStatus.archived:
      return "Archived";
    default:
      return "Draft";
  }
}

export function isProjectOperationalStatus(status: ProjectStatus) {
  return (
    status === ProjectStatus.active ||
    status === ProjectStatus.billing_enabled
  );
}

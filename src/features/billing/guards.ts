import { getCustomerProjectAccessState, requireProjectAdmin } from "@/features/auth/guards";
import { getProjectBillingSummary } from "@/features/billing/service";

export async function getAdminBillingAccessState() {
  const admin = await requireProjectAdmin();
  const summary = await getProjectBillingSummary(admin.projectId);

  if (!summary) {
    throw new Error("Billing summary not found for this project.");
  }

  return {
    admin,
    summary,
  };
}

export async function getCustomerBillingAccessState() {
  const accessState = await getCustomerProjectAccessState();
  const summary = accessState.project
    ? await getProjectBillingSummary(accessState.project.id)
    : null;

  return {
    ...accessState,
    summary,
    billingVisible: Boolean(
      accessState.isPortalEnabled && summary?.billingEnabled,
    ),
  };
}

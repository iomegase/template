export type ProjectModuleKey = "billing" | "customer_portal";

export const projectModuleDefinitions: Record<
  ProjectModuleKey,
  {
    title: string;
    description: string;
    enabledLabel: string;
    disabledLabel: string;
  }
> = {
  billing: {
    title: "Billing module",
    description:
      "Controls the optional Stripe extension for checkout, billing portal and webhook-backed subscription state.",
    enabledLabel: "Billing is enabled for this project.",
    disabledLabel: "Billing stays isolated and disabled for this project.",
  },
  customer_portal: {
    title: "Customer portal",
    description:
      "Controls whether end users can access the dedicated customer dashboard space for this project.",
    enabledLabel: "Customer dashboard access is available.",
    disabledLabel: "Customer access remains disabled for this project.",
  },
};

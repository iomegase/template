import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard-shell";
import { buildDashboardShellProps } from "@/features/navigation/sidebar-config";
import { requireSuperAdmin } from "@/features/super-admin/guards";

export default async function SuperAdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await requireSuperAdmin();
  const shell = await buildDashboardShellProps(user);

  return <DashboardShell {...shell}>{children}</DashboardShell>;
}

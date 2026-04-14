import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/features/auth/guards";
import { buildDashboardShellProps } from "@/features/navigation/sidebar-config";

export default async function CustomerLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await requireRole("customer");
  const shell = await buildDashboardShellProps(user);

  return <DashboardShell {...shell}>{children}</DashboardShell>;
}

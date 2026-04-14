import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard-shell";
import { requireProjectAdmin } from "@/features/auth/guards";
import { buildDashboardShellProps } from "@/features/navigation/sidebar-config";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await requireProjectAdmin();
  const shell = await buildDashboardShellProps(user);

  return <DashboardShell {...shell}>{children}</DashboardShell>;
}

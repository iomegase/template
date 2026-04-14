import { redirect } from "next/navigation";

import { requireSessionUser } from "@/features/auth/guards";
import { getRoleHomeRoute } from "@/features/auth/routes";

export default async function DashboardPage() {
  const user = await requireSessionUser();

  redirect(getRoleHomeRoute(user.role));
}

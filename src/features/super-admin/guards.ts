import { requireRole } from "@/features/auth/guards";

export async function requireSuperAdmin() {
  return requireRole("super_admin");
}

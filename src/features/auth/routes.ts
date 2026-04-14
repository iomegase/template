import type { AppUserRole } from "@/features/auth/roles";
import { superAdminBaseRoute } from "@/features/super-admin/routes";

export const publicHomeRoute = "/";
export const loginRoute = "/login";
export const dashboardRoute = "/dashboard";

export const roleHomeRoutes: Record<AppUserRole, string> = {
  super_admin: superAdminBaseRoute,
  admin: "/admin",
  customer: "/customer",
};

const protectedRoutePrefixes = [
  dashboardRoute,
  roleHomeRoutes.super_admin,
  roleHomeRoutes.admin,
  roleHomeRoutes.customer,
];

export function getRoleHomeRoute(role: AppUserRole) {
  return roleHomeRoutes[role];
}

export function isProtectedRoute(pathname: string) {
  return protectedRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

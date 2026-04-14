export const appUserRoles = ["super_admin", "admin", "customer"] as const;

export type AppUserRole = (typeof appUserRoles)[number];

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: AppUserRole;
  projectId: string | null;
  projectSlug: string | null;
};

export const roleLabels: Record<AppUserRole, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  customer: "Customer",
};

export function isAppUserRole(value: unknown): value is AppUserRole {
  return (
    typeof value === "string" &&
    appUserRoles.includes(value as AppUserRole)
  );
}

export const superAdminBaseRoute = "/super-admin" as const;
export const superAdminProjectsRoute = `${superAdminBaseRoute}/projects` as const;
export const superAdminAdminsRoute = `${superAdminBaseRoute}/admins` as const;
export const superAdminSettingsRoute = `${superAdminBaseRoute}/settings` as const;
export const superAdminNewAdminRoute = `${superAdminAdminsRoute}/new` as const;

export function getSuperAdminProjectRoute(projectId: string) {
  return `${superAdminProjectsRoute}/${projectId}`;
}

export function getSuperAdminAdminEditRoute(userId: string) {
  return `${superAdminAdminsRoute}/${userId}/edit`;
}

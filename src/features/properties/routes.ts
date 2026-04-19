export const propertyRoutes = {
  list: "/admin/properties",
  new: "/admin/properties/new",
  edit: (id: string) => `/admin/properties/${id}/edit`,
} as const

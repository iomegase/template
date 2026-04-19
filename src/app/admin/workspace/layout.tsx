import { requireRole } from "@/features/auth/guards"

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole("admin")
  return <>{children}</>
}

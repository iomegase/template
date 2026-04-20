import { requireWorkspace } from "@/features/workspaces/guards"

export default async function PropertiesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireWorkspace()
  return <>{children}</>
}

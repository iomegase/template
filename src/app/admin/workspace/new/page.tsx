import { requireNoWorkspace } from "@/features/workspaces/guards"
import { WorkspaceCreateForm } from "@/features/workspaces/components/workspace-create-form"

export default async function NewWorkspacePage() {
  await requireNoWorkspace()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <WorkspaceCreateForm />
    </div>
  )
}

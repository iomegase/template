import { notFound } from "next/navigation"
import { getWorkspaceBySlug } from "@/features/workspaces/service"

type Props = {
  params: Promise<{ slug: string }>
}

export default async function PublicSitePage({ params }: Props) {
  const { slug } = await params
  const workspace = await getWorkspaceBySlug(slug)

  if (!workspace) notFound()

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">
          {workspace.settings?.siteName ?? workspace.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Bienvenue sur notre espace de réservation
        </p>
      </div>
    </main>
  )
}

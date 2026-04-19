import { requireWorkspace } from "@/features/workspaces/guards"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function WorkspaceDashboardPage() {
  const workspace = await requireWorkspace()
  const rootDomain = process.env.ROOT_DOMAIN ?? "taplateforme.com"
  const siteUrl = `https://${workspace.slug}.${rootDomain}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{workspace.name}</h1>
        <p className="text-muted-foreground">Tableau de bord de votre espace</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Votre site public</CardTitle>
            <CardDescription>
              URL de votre espace de réservation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-primary hover:underline"
            >
              {siteUrl}
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statut</CardTitle>
            <CardDescription>État de votre espace</CardDescription>
          </CardHeader>
          <CardContent>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                workspace.status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {workspace.status === "active" ? "Actif" : "Suspendu"}
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import Link from "next/link"
import { PlusIcon } from "lucide-react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getWorkspaceByOwnerId } from "@/features/workspaces/service"
import { getPropertiesByWorkspaceId } from "@/features/properties/service"
import { propertyRoutes } from "@/features/properties/routes"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: "Appartement",
  house: "Maison",
  villa: "Villa",
  chalet: "Chalet",
  studio: "Studio",
  loft: "Loft",
  other: "Autre",
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-gray-100 text-gray-700" },
  active: { label: "Actif", className: "bg-green-100 text-green-800" },
  archived: { label: "Archivé", className: "bg-red-100 text-red-700" },
}

export default async function PropertiesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const workspace = await getWorkspaceByOwnerId(session.user.id)
  if (!workspace) redirect("/admin/workspace/new")

  const properties = await getPropertiesByWorkspaceId(workspace.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mes logements</h1>
          <p className="text-muted-foreground">
            {properties.length} logement{properties.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button render={<Link href={propertyRoutes.new} />}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Ajouter un logement
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Aucun logement</CardTitle>
            <CardDescription>
              Ajoutez votre premier logement pour commencer à recevoir des
              réservations directes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href={propertyRoutes.new} />}>
              Créer un logement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => {
            const status = STATUS_LABELS[property.status] ?? STATUS_LABELS.draft
            return (
              <Card key={property.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{property.name}</CardTitle>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <CardDescription>
                    {PROPERTY_TYPE_LABELS[property.type] ?? property.type} ·{" "}
                    {property.city}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    {Number(property.pricePerNight).toLocaleString("fr-FR", {
                      style: "currency",
                      currency: property.currency,
                    })}{" "}
                    / nuit ·{" "}
                    {"_count" in property
                      ? (property as { _count: { photos: number } })._count.photos
                      : 0}{" "}
                    photo(s)
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={propertyRoutes.edit(property.id)} />}
                  >
                    Modifier
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

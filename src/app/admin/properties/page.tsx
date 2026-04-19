import Link from "next/link"
import { PlusIcon } from "lucide-react"
import { requireWorkspace } from "@/features/workspaces/guards"
import { getPropertiesByWorkspaceId } from "@/features/properties/service"
import { propertyRoutes } from "@/features/properties/routes"
import { Badge } from "@/components/ui/badge"
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

const STATUS_BADGE_VARIANT: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Brouillon", variant: "outline" },
  active: { label: "Actif", variant: "default" },
  archived: { label: "Archivé", variant: "destructive" },
}

export default async function PropertiesPage() {
  const workspace = await requireWorkspace()
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
            const statusConfig =
              STATUS_BADGE_VARIANT[property.status] ?? STATUS_BADGE_VARIANT.draft
            return (
              <Card key={property.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{property.name}</CardTitle>
                    <Badge variant={statusConfig.variant}>
                      {statusConfig.label}
                    </Badge>
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
                    / nuit · {property._count.photos} photo(s)
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

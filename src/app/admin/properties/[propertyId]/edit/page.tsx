import { Separator } from "@/components/ui/separator"
import { requireOwnedProperty } from "@/features/properties/guards"
import { PropertyForm } from "@/features/properties/components/property-form"
import { PhotoUploader } from "@/features/properties/components/photo-uploader"
import { AmenitySelector } from "@/features/properties/components/amenity-selector"
import type { PropertyPhoto, PropertyAmenity } from "@/features/properties/types"

type Props = {
  params: Promise<{ propertyId: string }>
}

export default async function EditPropertyPage({ params }: Props) {
  const { propertyId } = await params
  const property = await requireOwnedProperty(propertyId)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{property.name}</h1>
        <p className="text-muted-foreground">Modifier le logement</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Informations générales</h2>
        <PropertyForm property={property} />
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Photos</h2>
        <PhotoUploader
          propertyId={property.id}
          photos={property.photos as PropertyPhoto[]}
        />
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Équipements</h2>
        <AmenitySelector
          propertyId={property.id}
          amenities={property.amenities as PropertyAmenity[]}
        />
      </section>
    </div>
  )
}

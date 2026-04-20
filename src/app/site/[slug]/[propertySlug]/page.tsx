import { notFound } from "next/navigation"
import { BedDoubleIcon, BathIcon, UsersIcon, StarIcon } from "lucide-react"
import { getWorkspaceBySlug } from "@/features/workspaces/service"
import { getPropertyBySlug } from "@/features/properties/service"
import {
  AMENITY_KEYS,
  AMENITY_LABELS,
  type AmenityKey,
} from "@/features/properties/amenities"
import type { PropertyPhoto } from "@/features/properties/types"

type Props = {
  params: Promise<{ slug: string; propertySlug: string }>
}

export default async function PublicPropertyPage({ params }: Props) {
  const { slug, propertySlug } = await params

  const workspace = await getWorkspaceBySlug(slug)
  if (!workspace) notFound()

  const property = await getPropertyBySlug(workspace.id, propertySlug)
  if (!property || property.status !== "active") notFound()

  const description = property.description as { fr?: string; en?: string }
  const amenityKeys = property.amenities.map((a) => a.key)
  const photos = property.photos as PropertyPhoto[]

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      {/* Photo gallery */}
      {photos.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {photos.slice(0, 5).map((photo, i) => (
            <div
              key={photo.id}
              className={`overflow-hidden rounded-lg ${i === 0 ? "sm:col-span-2" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.caption ?? property.name}
                className="h-64 w-full object-cover sm:h-80"
              />
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{property.name}</h1>
        <p className="text-muted-foreground">
          {property.city}, {property.country}
        </p>
      </div>

      {/* Key stats */}
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="flex items-center gap-1">
          <UsersIcon className="h-4 w-4" />
          {property.maxGuests} voyageurs
        </span>
        <span className="flex items-center gap-1">
          <BedDoubleIcon className="h-4 w-4" />
          {property.bedrooms} chambre{property.bedrooms !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <BathIcon className="h-4 w-4" />
          {property.bathrooms} salle{property.bathrooms !== 1 ? "s" : ""} de bain
        </span>
      </div>

      {/* Description */}
      {description.fr && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">À propos</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {description.fr}
          </p>
        </div>
      )}

      {/* Pricing */}
      <div className="rounded-xl border p-6 space-y-3">
        <div className="text-2xl font-bold">
          {Number(property.pricePerNight).toLocaleString("fr-FR", {
            style: "currency",
            currency: property.currency,
          })}
          <span className="text-base font-normal text-muted-foreground">
            {" "}
            / nuit
          </span>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          {Number(property.cleaningFee) > 0 && (
            <p>
              Frais de ménage :{" "}
              {Number(property.cleaningFee).toLocaleString("fr-FR", {
                style: "currency",
                currency: property.currency,
              })}
            </p>
          )}
          {Number(property.depositAmount) > 0 && (
            <p>
              Caution :{" "}
              {Number(property.depositAmount).toLocaleString("fr-FR", {
                style: "currency",
                currency: property.currency,
              })}
            </p>
          )}
          <p>Séjour minimum : {property.minNights} nuit{property.minNights !== 1 ? "s" : ""}</p>
        </div>
        {/* Booking CTA — Phase D */}
        <div className="pt-2">
          <button
            disabled
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground opacity-60 cursor-not-allowed"
          >
            Réserver (bientôt disponible)
          </button>
        </div>
      </div>

      {/* Amenities */}
      {amenityKeys.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Équipements</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {amenityKeys
              .filter((k) => AMENITY_KEYS.includes(k as AmenityKey))
              .map((key) => (
                <span key={key} className="flex items-center gap-2 text-sm">
                  <StarIcon className="h-3 w-3 text-muted-foreground" />
                  {AMENITY_LABELS[key as AmenityKey]}
                </span>
              ))}
          </div>
        </div>
      )}
    </main>
  )
}

"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createPropertyAction, updatePropertyAction } from "@/features/properties/actions"
import { propertyTypeValues } from "@/features/properties/schema"
import type { PropertyDetail } from "@/features/properties/types"

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: "Appartement",
  house: "Maison",
  villa: "Villa",
  chalet: "Chalet",
  studio: "Studio",
  loft: "Loft",
  other: "Autre",
}

type ActionState = { error?: string; success?: boolean } | undefined

type Props = {
  property?: PropertyDetail
}

export function PropertyForm({ property }: Props) {
  const isEdit = Boolean(property)

  const action = isEdit
    ? updatePropertyAction.bind(null, property!.id)
    : createPropertyAction

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    action,
    undefined
  )

  const description = property?.description as
    | { fr?: string; en?: string }
    | undefined

  return (
    <form action={formAction} className="space-y-6">
      {/* Basic info */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nom du logement *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={property?.name}
            placeholder="Villa Les Pins"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug URL *</Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={property?.slug}
            placeholder="villa-les-pins"
            pattern="[a-z0-9-]+"
            required
          />
        </div>
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label htmlFor="type">Type de logement *</Label>
        <Select name="type" defaultValue={property?.type ?? "apartment"}>
          <SelectTrigger id="type">
            <SelectValue placeholder="Choisir un type" />
          </SelectTrigger>
          <SelectContent>
            {propertyTypeValues.map((t) => (
              <SelectItem key={t} value={t}>
                {PROPERTY_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Descriptions */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="descriptionFr">Description (Français) *</Label>
          <Textarea
            id="descriptionFr"
            name="descriptionFr"
            defaultValue={description?.fr}
            placeholder="Décrivez votre logement en français…"
            rows={6}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="descriptionEn">Description (English)</Label>
          <Textarea
            id="descriptionEn"
            name="descriptionEn"
            defaultValue={description?.en}
            placeholder="Describe your property in English…"
            rows={6}
          />
        </div>
      </div>

      {/* Location */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Adresse *</Label>
          <Input
            id="address"
            name="address"
            defaultValue={property?.address}
            placeholder="12 Rue des Pins"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Pays *</Label>
          <Input
            id="country"
            name="country"
            defaultValue={property?.country ?? "FR"}
            maxLength={2}
            placeholder="FR"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">Ville *</Label>
        <Input
          id="city"
          name="city"
          defaultValue={property?.city}
          placeholder="Nice"
          required
        />
      </div>

      {/* Capacity */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="maxGuests">Voyageurs max *</Label>
          <Input
            id="maxGuests"
            name="maxGuests"
            type="number"
            min={1}
            max={50}
            defaultValue={property?.maxGuests ?? 2}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bedrooms">Chambres *</Label>
          <Input
            id="bedrooms"
            name="bedrooms"
            type="number"
            min={0}
            max={20}
            defaultValue={property?.bedrooms ?? 1}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bathrooms">Salles de bain *</Label>
          <Input
            id="bathrooms"
            name="bathrooms"
            type="number"
            min={1}
            max={20}
            defaultValue={property?.bathrooms ?? 1}
            required
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="pricePerNight">Prix / nuit (€) *</Label>
          <Input
            id="pricePerNight"
            name="pricePerNight"
            type="number"
            min={1}
            step="0.01"
            defaultValue={property ? Number(property.pricePerNight) : ""}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Devise</Label>
          <Select name="currency" defaultValue={property?.currency ?? "EUR"}>
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR €</SelectItem>
              <SelectItem value="GBP">GBP £</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cleaningFee">Frais ménage (€)</Label>
          <Input
            id="cleaningFee"
            name="cleaningFee"
            type="number"
            min={0}
            step="0.01"
            defaultValue={property ? Number(property.cleaningFee) : 0}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="depositAmount">Caution (€)</Label>
          <Input
            id="depositAmount"
            name="depositAmount"
            type="number"
            min={0}
            step="0.01"
            defaultValue={property ? Number(property.depositAmount) : 0}
          />
        </div>
      </div>

      <div className="space-y-2 max-w-xs">
        <Label htmlFor="minNights">Séjour minimum (nuits)</Label>
        <Input
          id="minNights"
          name="minNights"
          type="number"
          min={1}
          max={365}
          defaultValue={property?.minNights ?? 1}
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600">Modifications enregistrées.</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending
          ? isEdit
            ? "Enregistrement…"
            : "Création…"
          : isEdit
            ? "Enregistrer"
            : "Créer le logement"}
      </Button>
    </form>
  )
}

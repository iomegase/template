"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { updateAmenitiesAction } from "@/features/properties/actions"
import {
  AMENITY_KEYS,
  AMENITY_LABELS,
  type AmenityKey,
} from "@/features/properties/amenities"
import type { PropertyAmenity } from "@/features/properties/types"

type Props = {
  propertyId: string
  amenities: PropertyAmenity[]
}

export function AmenitySelector({ propertyId, amenities }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(amenities.map((a) => a.key))
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    setMessage(null)
  }

  async function handleSave() {
    setSaving(true)
    const result = await updateAmenitiesAction(propertyId, Array.from(selected))
    setSaving(false)
    setMessage("error" in result ? (result.error ?? "Erreur") : "Équipements sauvegardés")
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {AMENITY_KEYS.map((key) => {
          const isOn = selected.has(key)
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                isOn
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {AMENITY_LABELS[key as AmenityKey]}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={saving} size="sm">
          {saving ? "Sauvegarde…" : "Sauvegarder les équipements"}
        </Button>
        {message && (
          <span className="text-sm text-muted-foreground">{message}</span>
        )}
      </div>
    </div>
  )
}

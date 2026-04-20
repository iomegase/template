"use client"

import { useRef, useState } from "react"
import { TrashIcon, UploadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getPhotoUploadUrlAction,
  savePhotoAction,
  deletePhotoAction,
} from "@/features/properties/photo-actions"
import type { PropertyPhoto } from "@/features/properties/types"

type Props = {
  propertyId: string
  photos: PropertyPhoto[]
  maxPhotos?: number
}

export function PhotoUploader({ propertyId, photos, maxPhotos = 20 }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setError(null)
    setUploading(true)

    for (const file of files) {
      if (photos.length >= maxPhotos) {
        setError(`Maximum ${maxPhotos} photos atteint`)
        break
      }
      // 1. Get presigned URL
      const urlResult = await getPhotoUploadUrlAction(
        propertyId,
        file.name,
        file.type as "image/jpeg" | "image/png" | "image/webp" | "image/avif"
      )
      if ("error" in urlResult) {
        setError(urlResult.error ?? "Erreur lors de l'upload")
        break
      }

      // 2. Upload directly to R2
      const uploadResp = await fetch(urlResult.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      })
      if (!uploadResp.ok) {
        setError("Échec de l'upload vers le stockage")
        break
      }

      // 3. Save URL to DB
      const saveResult = await savePhotoAction(propertyId, urlResult.publicUrl)
      if ("error" in saveResult) {
        setError(saveResult.error ?? "Erreur lors de la sauvegarde")
        break
      }
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
    // Reload to show new photos (server component re-fetch)
    window.location.reload()
  }

  async function handleDelete(photoId: string) {
    const result = await deletePhotoAction(photoId, propertyId)
    if ("error" in result) {
      setError(result.error ?? "Erreur lors de la suppression")
      return
    }
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      {/* Existing photos */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo) => (
          <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={photo.caption ?? "Photo du logement"}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleDelete(photo.id)}
              className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Supprimer la photo"
            >
              <TrashIcon className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Upload button */}
      {photos.length < maxPhotos && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon className="mr-2 h-4 w-4" />
            {uploading ? "Upload en cours…" : "Ajouter des photos"}
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">
            {photos.length}/{maxPhotos} photos · JPEG, PNG, WebP, AVIF
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

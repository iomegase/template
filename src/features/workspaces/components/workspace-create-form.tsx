"use client"

import { useActionState } from "react"
import { createWorkspaceAction } from "@/features/workspaces/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type ActionState = { error?: string; success?: boolean } | undefined

export function WorkspaceCreateForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    createWorkspaceAction,
    undefined
  )

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Créez votre espace</CardTitle>
        <CardDescription>
          Choisissez un nom d&apos;URL pour votre site de réservation. Il sera
          accessible sur{" "}
          <strong>votre-nom.taplateforme.com</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de votre espace</Label>
            <Input
              id="name"
              name="name"
              placeholder="Villa Les Pins"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Adresse de votre site</Label>
            <div className="flex items-center gap-2">
              <Input
                id="slug"
                name="slug"
                placeholder="villa-les-pins"
                pattern="[a-z0-9-]+"
                required
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                .taplateforme.com
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Lettres minuscules, chiffres et tirets uniquement
            </p>
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Création..." : "Créer mon espace"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

import { PropertyForm } from "@/features/properties/components/property-form"

export default function NewPropertyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouveau logement</h1>
        <p className="text-muted-foreground">
          Renseignez les informations de votre logement
        </p>
      </div>
      <PropertyForm />
    </div>
  )
}

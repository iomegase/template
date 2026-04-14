import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// 1. Gestion des variantes avec CVA (plus propre que les sélecteurs data-size)
const cardVariants = cva(
  "group/card flex flex-col overflow-hidden rounded-xl bg-card text-card-foreground border transition-all duration-200",
  {
    variants: {
      variant: {
        default: "shadow-sm border-border hover:shadow-md hover:border-ring/30",
        glass: "bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border-white/20 shadow-xl",
        flat: "bg-muted/30 border-transparent",
      },
      size: {
        default: "gap-4 py-4 text-sm",
        sm: "gap-3 py-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface CardProps 
  extends React.ComponentProps<"div">, 
    VariantProps<typeof cardVariants> {}

function Card({ className, variant, size, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, size }), className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-col gap-1.5 px-6 group-data-[size=sm]/card:px-4",
        "relative", // Pour positionner CardAction si besoin
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-semibold leading-none tracking-tight text-base group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm group-data-[size=sm]/card:text-xs", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 group-data-[size=sm]/card:px-4", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center p-6 pt-0 group-data-[size=sm]/card:p-4 group-data-[size=sm]/card:pt-0",
        className
      )}
      {...props}
    />
  )
}

// Optionnel: Un composant d'action pour le coin supérieur droit
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("absolute right-6 top-6", className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardAction }
import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { getOptionalSessionUser } from "@/features/auth/guards";
import { dashboardRoute, loginRoute } from "@/features/auth/routes";
import { cn } from "@/lib/utils";

const roleCards = [
  {
    index: "01",
    title: "Super-admin",
    description:
      "Pilotage global de la plateforme, activation des modules et supervision de chaque espace projet.",
  },
  {
    index: "02",
    title: "Admin",
    description:
      "Gestion complète de son espace : paramètres, contenus, membres et suivi de l'activité.",
  },
  {
    index: "03",
    title: "Membre",
    description:
      "Espace personnel dédié, clairement séparé de l'administration. Simple, centré, sans friction.",
  },
];

export default async function HomePage() {
  const user = await getOptionalSessionUser();

  if (user) {
    redirect(dashboardRoute);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">

      {/* ── Halos atmosphériques ── */}
      <div className="pointer-events-none absolute inset-0 -z-10 select-none">
        <div className="absolute -left-40 -top-20 h-[560px] w-[560px] rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute -bottom-20 right-0 h-[420px] w-[420px] rounded-full bg-accent/10 blur-[100px]" />
      </div>

      {/* ── Navigation bar ── */}
      <nav className="animate-fade-in mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-8">
        <span className="font-serif text-lg font-light tracking-tight text-foreground">
          starter<span className="text-primary">.</span>
        </span>
        <Link
          href={loginRoute}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground",
          )}
        >
          Se connecter
        </Link>
      </nav>

      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col justify-center gap-20 px-6 pb-20 lg:px-8">

        {/* ── Eyebrow ── */}
        <div className="flex items-center gap-3 animate-fade-up">
          <div className="h-px w-10 bg-primary/60" />
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-primary/80">
            starter-core · v1.0
          </span>
        </div>

        {/* ── Headline + CTA ── */}
        <div className="grid gap-12 lg:grid-cols-2 lg:items-end">

          {/* Titre */}
          <div className="space-y-8 animate-fade-up [animation-delay:80ms]">
            <h1 className="font-serif text-5xl font-light leading-[1.1] tracking-tight text-foreground sm:text-6xl lg:text-[4.75rem]">
              Construis ce qui compte,{" "}
              <em className="italic text-primary">
                sans repartir de zéro.
              </em>
            </h1>
          </div>

          {/* Texte + CTAs — colonne droite */}
          <div className="space-y-8 animate-fade-up [animation-delay:160ms]">
            <p className="text-base leading-[1.8] text-muted-foreground sm:text-lg">
              Un starter Next.js pensé pour les projets qui ont du sens —
              architecture solide, rôles clairs, facturation optionnelle.
              Fork, personnalise, lance.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={loginRoute}
                className={cn(buttonVariants({ size: "lg" }))}
              >
                Commencer
              </Link>
              <Link
                href={loginRoute}
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                Accès démo
              </Link>
              <Link
                href="/sejour/provence-autumn-retreat-2026"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "gap-1.5 text-muted-foreground",
                )}
              >
                Aperçu réservation
                <span className="opacity-50">↗</span>
              </Link>
            </div>
          </div>

        </div>

        {/* ── Grille de rôles — séparateurs 1px ── */}
        <div className="animate-fade-up [animation-delay:260ms] overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-sm">
          <div className="grid lg:grid-cols-3">
            {roleCards.map((card) => (
              <div
                key={card.title}
                className="group relative p-8 transition-colors duration-300 hover:bg-primary/[0.03] [&:not(:last-child)]:border-b [&:not(:last-child)]:border-border lg:[&:not(:last-child)]:border-b-0 lg:[&:not(:last-child)]:border-r"
              >
                <p className="mb-5 font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-primary/60">
                  {card.index}
                </p>
                <h3 className="mb-3 font-serif text-xl font-light text-foreground">
                  {card.title}
                </h3>
                <p className="text-sm leading-[1.7] text-muted-foreground">
                  {card.description}
                </p>
                {/* Ligne orange glissante au survol */}
                <div className="absolute bottom-0 left-0 h-px w-0 bg-primary/60 transition-all duration-500 ease-out group-hover:w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer discret ── */}
        <p className="animate-fade-up [animation-delay:360ms] font-mono text-[10px] tracking-widest text-muted-foreground/35 uppercase">
          Next.js · Prisma · Auth.js · shadcn/ui · Tailwind CSS v4
        </p>

      </section>
    </main>
  );
}

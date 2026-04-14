import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { getOptionalSessionUser } from "@/features/auth/guards";
import { dashboardRoute, loginRoute } from "@/features/auth/routes";
import { cn } from "@/lib/utils";

const roleCards = [
  {
    title: "Super-admin",
    description: "Platform registry, module activation and project readiness.",
  },
  {
    title: "Admin",
    description: "Project-local operations, settings and future CRUD flows.",
  },
  {
    title: "Customer",
    description: "Personal dashboard area intentionally separated from admin space.",
  },
];

export default async function HomePage() {
  const user = await getOptionalSessionUser();

  if (user) {
    redirect(dashboardRoute);
  }

  return (
    <main className="relative min-h-screen ">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
      </div>
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-12 px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-6">
          <Badge variant="outline" className="bg-card/80">
            starter-core foundation
          </Badge>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-thin tracking-wide uppercase text-foreground sm:text-5xl">
              Reusable Next.js dashboard starter built for admin, super-admin and customer workspaces.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-lg">
              This repository starts from the official shadcn/ui dashboard block
              and refactors it into a reusable product base with Prisma, role
              boundaries, protected routes and optional billing later.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={loginRoute}
              className={cn(buttonVariants({ variant: "default", size: "lg" }))}
            >
              Open sign in
            </Link>
            <Link
              href={loginRoute}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Use demo access
            </Link>
            <Link
              href="/sejour/provence-autumn-retreat-2026"
              className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
            >
              Preview booking funnel
            </Link>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {roleCards.map((card) => (
            <Card  key={card.title} className="border-border/70  shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Shared shell, explicit authorization and starter-friendly naming
                keep these areas adaptable without collapsing them into one route
                space.
              </CardContent>
              <CardAction/>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}

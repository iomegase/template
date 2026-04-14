import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { OfferingBookingFunnel } from "@/features/bookings/components/offering-booking-funnel";
import { getOfferingDisplayLabel, getOfferingStatusLabel } from "@/features/offerings/labels";
import { getPublicOfferingBySlug } from "@/features/offerings/service";
import { cn } from "@/lib/utils";
import { CalendarDaysIcon, MapPinIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";

type BookingEntryPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    checkout?: string;
    booking?: string;
  }>;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(value);
}

export default async function BookingEntryPage({
  params,
  searchParams,
}: BookingEntryPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const offering = await getPublicOfferingBySlug(slug);

  if (!offering) {
    notFound();
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-8rem] top-[-8rem] size-80 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-6rem] size-96 rounded-full bg-chart-2/10 blur-3xl" />
      </div>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {resolvedSearchParams?.checkout ? (
          <div
            className={cn(
              "mb-6 rounded-[1.6rem] border p-4 text-sm shadow-[0_18px_50px_rgba(0,0,0,0.2)]",
              resolvedSearchParams.checkout === "success"
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                : "border-amber-400/20 bg-amber-400/10 text-amber-100",
            )}
          >
            {resolvedSearchParams.checkout === "success"
              ? `Stripe returned successfully for booking ${resolvedSearchParams.booking ?? "in progress"}. Webhook confirmation is now the payment source of truth.`
              : `Checkout was canceled for booking ${resolvedSearchParams.booking ?? "in progress"}. The funnel remains editable until payment is confirmed.`}
          </div>
        ) : null}
        <div className="grid gap-6 rounded-[2rem] border border-white/8 bg-card/90 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur xl:grid-cols-[1.1fr_0.9fr] xl:p-8">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="bg-white/6">
                {getOfferingDisplayLabel(offering.offeringType)}
              </Badge>
              <Badge variant="outline">{getOfferingStatusLabel(offering.status)}</Badge>
              <Badge
                variant="outline"
                className={offering.isBookable ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : undefined}
              >
                {offering.isBookable ? offering.availabilityLabel : "Currently closed"}
              </Badge>
            </div>
            <div className="space-y-3">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Premium booking funnel centered on the offering, without pricing ambiguity.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-muted-foreground">
                Phase 6 starts here: a public booking entry built on the new
                canonical <span className="text-foreground">offering</span> model while
                still displaying séjour-specific language when the subtype is a stay.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.4rem] border border-white/8 bg-black/14 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDaysIcon className="size-4" />
                  <span>Dates</span>
                </div>
                <p className="mt-3 text-base font-medium text-foreground">
                  {formatDate(offering.startDate)} to {formatDate(offering.endDate)}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-white/8 bg-black/14 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPinIcon className="size-4" />
                  <span>Location</span>
                </div>
                <p className="mt-3 text-base font-medium text-foreground">{offering.location}</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/8 bg-black/14 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheckIcon className="size-4" />
                  <span>Trust layer</span>
                </div>
                <p className="mt-3 text-base font-medium text-foreground">
                  Server-driven pricing review
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-white/8 bg-black/14 p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border border-white/8 bg-white/6 p-3 text-foreground">
                <SparklesIcon className="size-5" />
              </div>
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                  Offer preview
                </p>
                <h2 className="text-2xl font-semibold text-foreground">{offering.title}</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {offering.description ?? "This public route previews the Phase 6 funnel on top of the seeded offering."}
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-3 rounded-[1.4rem] border border-white/8 bg-white/4 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Project</span>
                <span className="font-medium text-foreground">{offering.project.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Room options</span>
                <span className="font-medium text-foreground">{offering.rooms.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Public route</span>
                <span className="font-medium text-foreground">/sejour/{offering.slug}</span>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "flex-1")}
              >
                Open admin space
              </Link>
              <a
                href="#booking-funnel"
                className={cn(buttonVariants({ variant: "default", size: "lg" }), "flex-1")}
              >
                Start booking
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="booking-funnel" className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <OfferingBookingFunnel offering={offering} />
      </section>
    </main>
  );
}

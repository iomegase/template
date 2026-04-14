import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getPaymentModeLabel } from "@/features/bookings/workflow";
import { getBookingConfirmationByReference } from "@/features/bookings/service";
import { issueHealthQuestionnaireAccessToken } from "@/features/health-forms/access";
import { getHealthQuestionnaireRoute } from "@/features/health-forms/routes";
import {
  buildBookingConfirmationEmail,
  buildHealthQuestionnaireReminderEmail,
} from "@/features/notifications/booking-emails";
import { getOfferingDisplayLabel } from "@/features/offerings/labels";
import { formatCurrency } from "@/features/pricing/service";
import { cn } from "@/lib/utils";
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  HeartPulseIcon,
  MailIcon,
  MapPinIcon,
  UserRoundCheckIcon,
  UserRoundPlusIcon,
} from "lucide-react";

type BookingConfirmationPageProps = {
  params: Promise<{
    slug: string;
    bookingReference: string;
  }>;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(value);
}

export default async function BookingConfirmationPage({
  params,
}: BookingConfirmationPageProps) {
  const { slug, bookingReference } = await params;
  const booking = await getBookingConfirmationByReference({
    offeringSlug: slug,
    bookingReference,
  });

  if (!booking) {
    notFound();
  }

  const { token, accessExpiresAt } = await issueHealthQuestionnaireAccessToken(
    booking.id,
  );
  const healthQuestionnairePath = getHealthQuestionnaireRoute(token);
  const healthQuestionnaireUrl = new URL(
    healthQuestionnairePath,
    process.env.APP_URL ?? "http://localhost:3000",
  ).toString();
  const nextStep =
    "Complete the health questionnaire to unlock the next onboarding instructions.";

  const mainGuestName = `${booking.mainTraveler.firstName} ${booking.mainTraveler.lastName}`;
  const companionSummary = booking.companionTraveler
    ? `${booking.companionTraveler.firstName} ${booking.companionTraveler.lastName} • ${
        booking.companionTraveler.participatesInYoga
          ? "participates in yoga"
          : "does not participate in yoga"
      }`
    : null;

  const confirmationEmail = buildBookingConfirmationEmail({
    bookingReference: booking.bookingReference,
    offeringTitle: booking.offering.title,
    offeringType: booking.offering.offeringType,
    roomName: booking.room.name,
    mainGuestName,
    mainGuestEmail: booking.mainTraveler.email,
    companionSummary,
    paymentMode: booking.paymentMode,
    totalAmount: booking.totalAmount,
    amountPaid: booking.amountPaid,
    amountRemaining: booking.amountRemaining,
    currency: booking.currency,
    healthQuestionnaireUrl,
    nextStep,
  });

  const reminderEmail = buildHealthQuestionnaireReminderEmail({
    bookingReference: booking.bookingReference,
    offeringTitle: booking.offering.title,
    offeringType: booking.offering.offeringType,
    roomName: booking.room.name,
    mainGuestName,
    mainGuestEmail: booking.mainTraveler.email,
    companionSummary,
    paymentMode: booking.paymentMode,
    totalAmount: booking.totalAmount,
    amountPaid: booking.amountPaid,
    amountRemaining: booking.amountRemaining,
    currency: booking.currency,
    healthQuestionnaireUrl,
    nextStep,
  });

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-8rem] top-[-8rem] size-96 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-8rem] size-[28rem] rounded-full bg-chart-2/10 blur-3xl" />
      </div>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/8 bg-card/95 shadow-[0_28px_100px_rgba(0,0,0,0.32)]">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-emerald-400/25 bg-emerald-400/10 text-emerald-200" variant="outline">
                  Payment received
                </Badge>
                <Badge variant="outline">{booking.bookingReference}</Badge>
                <Badge variant="outline">{getOfferingDisplayLabel(booking.offering.offeringType)}</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-3 text-emerald-200">
                    <CheckCircle2Icon className="size-6" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl">Booking confirmed</CardTitle>
                    <CardDescription className="mt-2 max-w-2xl text-sm leading-7">
                      Payment success now starts onboarding. Your next required step is the
                      health questionnaire, which unlocks the pre-stay flow.
                    </CardDescription>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-[1.4rem] border border-white/8 bg-black/14 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDaysIcon className="size-4" />
                      <span>Dates</span>
                    </div>
                    <p className="mt-3 text-base font-medium text-foreground">
                      {formatDate(booking.offering.startDate)} to {formatDate(booking.offering.endDate)}
                    </p>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/8 bg-black/14 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPinIcon className="size-4" />
                      <span>Location</span>
                    </div>
                    <p className="mt-3 text-base font-medium text-foreground">
                      {booking.offering.location}
                    </p>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/8 bg-black/14 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CreditCardIcon className="size-4" />
                      <span>Payment mode</span>
                    </div>
                    <p className="mt-3 text-base font-medium text-foreground">
                      {getPaymentModeLabel(booking.paymentMode)}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/8 bg-black/14 p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    Selected offering
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-foreground">
                    {booking.offering.title}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Room: {booking.room.name}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-primary/20 bg-primary/10 p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-primary-foreground/70">
                    Next required step
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-foreground">
                    Complete health questionnaire
                  </p>
                  <p className="mt-2 text-sm text-primary-foreground/70">
                    Access link valid until {formatDate(accessExpiresAt)}.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/8 bg-black/14 p-5">
                  <div className="flex items-start gap-3">
                    <UserRoundCheckIcon className="mt-1 size-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{mainGuestName}</p>
                      <p className="text-sm text-muted-foreground">{booking.mainTraveler.email}</p>
                      <p className="text-sm text-muted-foreground">{booking.mainTraveler.phone}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-white/8 bg-black/14 p-5">
                  <div className="flex items-start gap-3">
                    <UserRoundPlusIcon className="mt-1 size-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">
                        {companionSummary ?? "No companion on this booking"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.companionTraveler
                          ? booking.companionTraveler.email
                          : "Solo stay"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/8 bg-black/14 p-5">
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total amount</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(booking.totalAmount, booking.currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Amount paid</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(booking.amountPaid, booking.currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Outstanding amount</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(booking.amountRemaining, booking.currency)}
                    </span>
                  </div>
                  {booking.secondInstallmentDueDate ? (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Next due date</span>
                      <span className="font-medium text-foreground">
                        {formatDate(booking.secondInstallmentDueDate)}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={healthQuestionnairePath}
                  className={cn(buttonVariants({ variant: "default", size: "lg" }), "flex-1")}
                >
                  <HeartPulseIcon className="size-4" />
                  Complete health questionnaire
                </Link>
                <Link
                  href={`/sejour/${booking.offering.slug}`}
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), "flex-1")}
                >
                  Back to booking overview
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-white/8 bg-card/95 shadow-[0_28px_100px_rgba(0,0,0,0.32)]">
              <CardHeader>
                <CardTitle>Transactional emails</CardTitle>
                <CardDescription>
                  Server-side templates prepared for the booking confirmation and the health questionnaire reminder.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    title: "Booking confirmation",
                    email: confirmationEmail,
                  },
                  {
                    title: "Health questionnaire reminder",
                    email: reminderEmail,
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-[1.4rem] border border-white/8 bg-black/14 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl border border-white/8 bg-white/6 p-2">
                        <MailIcon className="size-4 text-foreground" />
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium text-foreground">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.email.subject}</p>
                        <p className="text-sm text-muted-foreground">{item.email.preview}</p>
                      </div>
                    </div>
                    <Separator className="my-4 bg-white/8" />
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {item.email.lines.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}

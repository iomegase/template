import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getHealthQuestionnaireByAccessToken } from "@/features/health-forms/access";
import { cn } from "@/lib/utils";

type HealthQuestionnaireAccessPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function HealthQuestionnaireAccessPage({
  params,
}: HealthQuestionnaireAccessPageProps) {
  const { token } = await params;
  const questionnaire = await getHealthQuestionnaireByAccessToken(token);

  if (!questionnaire) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full border-white/8 bg-card/95 shadow-[0_28px_100px_rgba(0,0,0,0.32)]">
        <CardHeader>
          <CardTitle>Health questionnaire access is ready</CardTitle>
          <CardDescription>
            This secure entry point is now tied to booking {questionnaire.booking.bookingReference}.
            The full questionnaire form lands in M58.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Booking: <span className="text-foreground">{questionnaire.booking.offering.title}</span>
          </p>
          <p>
            Main guest:{" "}
            <span className="text-foreground">
              {questionnaire.booking.mainTraveler?.firstName}{" "}
              {questionnaire.booking.mainTraveler?.lastName}
            </span>
          </p>
          <p>
            The next milestone will replace this placeholder with the real secure form,
            submission workflow, and status update to `ready`.
          </p>
          <Link
            href={`/sejour/${questionnaire.booking.offering.slug}/confirmation/${questionnaire.booking.bookingReference}`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Back to confirmation
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

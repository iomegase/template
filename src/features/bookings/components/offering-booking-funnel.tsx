"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CompanionType, PaymentMode } from "@/generated/prisma/enums";
import { bookingFunnelFormSchema } from "@/features/bookings/schema";
import { getCompanionTypeLabel, getPaymentModeLabel } from "@/features/bookings/workflow";
import { getOfferingDisplayLabel, getOfferingStatusLabel } from "@/features/offerings/labels";
import type { PublicOfferingDetail } from "@/features/offerings/types";
import { createBookingCheckoutAction } from "@/features/payments/actions";
import {
  formatCurrency,
  getBookingInstallmentPlan,
  getBookingPricingSnapshot,
} from "@/features/pricing/service";
import { cn } from "@/lib/utils";
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  HeartPulseIcon,
  HomeIcon,
  MapPinIcon,
  MoonStarIcon,
  UserRoundPlusIcon,
  UsersIcon,
} from "lucide-react";

type BookingFunnelFormValues = z.infer<typeof bookingFunnelFormSchema>;

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(value);
}

function StepCard({
  index,
  title,
  description,
  children,
  className,
}: {
  index: string;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-white/8 bg-card/95 shadow-[0_24px_80px_rgba(0,0,0,0.28)]", className)}>
      <CardHeader className="space-y-3">
        <div className="flex items-start gap-4">
          <div className="flex size-10 items-center justify-center rounded-2xl border border-white/8 bg-white/6 text-sm font-semibold text-foreground">
            {index}
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription className="text-sm leading-6">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function OfferingBookingFunnel({
  offering,
}: {
  offering: PublicOfferingDetail;
}) {
  const availableRooms = offering.rooms.filter((room) => !room.isSoldOut);
  const [submitNote, setSubmitNote] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<BookingFunnelFormValues>({
    resolver: zodResolver(bookingFunnelFormSchema),
    mode: "onChange",
    defaultValues: {
      roomId: availableRooms[0]?.id ?? offering.rooms[0]?.id ?? "",
      hasCompanion: false,
      paymentMode: PaymentMode.full,
      mainTraveler: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        postalCode: "",
        city: "",
        country: "France",
      },
      companionTraveler: undefined,
      termsAccepted: false,
      privacyAccepted: false,
    },
  });

  const roomId = useWatch({
    control: form.control,
    name: "roomId",
  });
  const hasCompanion = useWatch({
    control: form.control,
    name: "hasCompanion",
  });
  const companionType = useWatch({
    control: form.control,
    name: "companionType",
  });
  const paymentMode = useWatch({
    control: form.control,
    name: "paymentMode",
  });
  const mainTraveler = useWatch({
    control: form.control,
    name: "mainTraveler",
  });
  const companionTraveler = useWatch({
    control: form.control,
    name: "companionTraveler",
  });
  const termsAccepted = useWatch({
    control: form.control,
    name: "termsAccepted",
  });
  const privacyAccepted = useWatch({
    control: form.control,
    name: "privacyAccepted",
  });

  useEffect(() => {
    if (!hasCompanion) {
      form.setValue("companionType", undefined, { shouldValidate: true });
      form.setValue("companionTraveler", undefined, { shouldValidate: true });
      return;
    }

    if (!form.getValues("companionTraveler")) {
      form.setValue(
        "companionTraveler",
        {
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          participatesInYoga: true,
        },
        { shouldValidate: false },
      );
    }
  }, [form, hasCompanion]);

  useEffect(() => {
    if (!hasCompanion || !companionType || !form.getValues("companionTraveler")) {
      return;
    }

    form.setValue(
      "companionTraveler.participatesInYoga",
      companionType === CompanionType.with_yoga,
      { shouldValidate: false },
    );
  }, [companionType, form, hasCompanion]);

  const selectedRoom = useMemo(
    () => offering.rooms.find((room) => room.id === roomId) ?? availableRooms[0] ?? offering.rooms[0] ?? null,
    [availableRooms, offering.rooms, roomId],
  );

  const pricing = useMemo(() => {
    if (!selectedRoom) {
      return null;
    }

    const snapshot = getBookingPricingSnapshot({
      roomBasePrice: selectedRoom.basePrice,
      companionYogaSurcharge: selectedRoom.companionYogaSurcharge,
      companionNoYogaSurcharge: selectedRoom.companionNoYogaSurcharge,
      currency: selectedRoom.currency,
      paymentMode,
      hasCompanion,
      companionType,
      offeringStartDate: offering.startDate,
    });

    const installmentPlan = getBookingInstallmentPlan({
      paymentMode,
      totalAmount: snapshot.totalAmount,
      firstInstallmentAmount: snapshot.firstInstallmentAmount,
      secondInstallmentAmount: snapshot.secondInstallmentAmount,
      offeringStartDate: offering.startDate,
    });

    return {
      snapshot,
      installmentPlan,
    };
  }, [companionType, hasCompanion, offering.startDate, paymentMode, selectedRoom]);

  function onSubmit(values: BookingFunnelFormValues) {
    setSubmitNote(null);

    startTransition(async () => {
      const result = await createBookingCheckoutAction({
        offeringSlug: offering.slug,
        values,
      });

      if (!result.ok) {
        setSubmitNote(result.error);
        return;
      }

      window.location.assign(result.checkoutUrl);
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]"
    >
      <div className="space-y-6">
        <StepCard
          index="01"
          title="Selected offering"
          description="The funnel is centered on the offering. For a stay, the UX can still display séjour while the domain stays normalized around offering."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/8 bg-black/14 p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MoonStarIcon className="size-4" />
                <span>{getOfferingDisplayLabel(offering.offeringType)}</span>
              </div>
              <h3 className="mt-4 text-3xl font-semibold text-foreground">{offering.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {offering.description ?? "No description added yet for this offering."}
              </p>
            </div>
            <div className="grid gap-3">
              <div className="rounded-[1.5rem] border border-white/8 bg-black/14 p-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDaysIcon className="size-4" />
                  <span>Dates</span>
                </div>
                <p className="mt-3 text-lg font-medium text-foreground">
                  {formatDate(offering.startDate)} to {formatDate(offering.endDate)}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/8 bg-black/14 p-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPinIcon className="size-4" />
                  <span>Location</span>
                </div>
                <p className="mt-3 text-lg font-medium text-foreground">{offering.location}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{getOfferingStatusLabel(offering.status)}</Badge>
                  <Badge variant="outline">{offering.availabilityLabel}</Badge>
                  <Badge
                    variant="outline"
                    className={offering.isBookable ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : undefined}
                  >
                    {offering.isBookable ? "Bookable" : "Closed"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </StepCard>

        <StepCard
          index="02"
          title="Choose your room"
          description="Base price always includes the main guest. Companion surcharges remain explicit and are added only when needed."
        >
          <div className="grid gap-4">
            {offering.rooms.map((room) => {
              const selected = selectedRoom?.id === room.id;

              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => form.setValue("roomId", room.id, { shouldValidate: true })}
                  className={cn(
                    "rounded-[1.5rem] border p-5 text-left transition-all",
                    selected
                      ? "border-primary bg-primary/10 shadow-[0_20px_40px_rgba(201,0,105,0.18)]"
                      : "border-white/8 bg-black/14 hover:border-white/16 hover:bg-white/4",
                    room.isSoldOut && "opacity-60",
                  )}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold text-foreground">{room.name}</h3>
                        {room.isSoldOut ? (
                          <Badge variant="outline">Sold out</Badge>
                        ) : selected ? (
                          <Badge variant="outline" className="border-primary/30 bg-primary/15 text-primary-foreground">
                            Selected
                          </Badge>
                        ) : null}
                      </div>
                      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                        {room.description ?? "No room description yet."}
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-sm text-muted-foreground">From</p>
                      <p className="text-3xl font-semibold text-foreground">
                        {formatCurrency(room.basePrice, room.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">Main guest included</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 text-sm text-muted-foreground md:grid-cols-4">
                    <div className="rounded-2xl border border-white/6 bg-white/4 p-3">
                      <p className="text-xs uppercase tracking-[0.2em]">Capacity</p>
                      <p className="mt-2 text-base font-medium text-foreground">{room.capacity} guests</p>
                    </div>
                    <div className="rounded-2xl border border-white/6 bg-white/4 p-3">
                      <p className="text-xs uppercase tracking-[0.2em]">Inventory</p>
                      <p className="mt-2 text-base font-medium text-foreground">{room.remainingInventory} left</p>
                    </div>
                    <div className="rounded-2xl border border-white/6 bg-white/4 p-3">
                      <p className="text-xs uppercase tracking-[0.2em]">With yoga</p>
                      <p className="mt-2 text-base font-medium text-foreground">
                        +{formatCurrency(room.companionYogaSurcharge, room.currency)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/6 bg-white/4 p-3">
                      <p className="text-xs uppercase tracking-[0.2em]">Without yoga</p>
                      <p className="mt-2 text-base font-medium text-foreground">
                        +{formatCurrency(room.companionNoYogaSurcharge, room.currency)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
            <p className="text-sm text-destructive">{form.formState.errors.roomId?.message}</p>
          </div>
        </StepCard>

        <StepCard
          index="03"
          title="Traveler composition"
          description="Define whether the main guest is travelling alone or sharing the selected room with a companion."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Is the main guest traveling alone?</p>
              <div className="grid gap-3">
                {[
                  { label: "Yes, solo stay", value: false, detail: "One traveler in the selected room." },
                  { label: "No, a second person stays too", value: true, detail: "Add companion details and surcharge." },
                ].map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => form.setValue("hasCompanion", option.value, { shouldValidate: true })}
                    className={cn(
                      "rounded-[1.35rem] border p-4 text-left transition-all",
                      hasCompanion === option.value
                        ? "border-primary bg-primary/10"
                        : "border-white/8 bg-black/14 hover:bg-white/4",
                    )}
                  >
                    <p className="font-medium text-foreground">{option.label}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{option.detail}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">If a second person joins, how do they participate?</p>
              <div className="grid gap-3">
                {[
                  CompanionType.with_yoga,
                  CompanionType.without_yoga,
                ].map((value) => (
                  <button
                    key={value}
                    type="button"
                    disabled={!hasCompanion}
                    onClick={() => form.setValue("companionType", value, { shouldValidate: true })}
                    className={cn(
                      "rounded-[1.35rem] border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50",
                      companionType === value && hasCompanion
                        ? "border-primary bg-primary/10"
                        : "border-white/8 bg-black/14 hover:bg-white/4",
                    )}
                  >
                    <p className="font-medium text-foreground">{getCompanionTypeLabel(value)}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {value === CompanionType.with_yoga
                        ? "Companion attends the retreat program and pays the yoga participation surcharge."
                        : "Companion shares the room without joining the yoga program."}
                    </p>
                  </button>
                ))}
              </div>
              <p className="text-sm text-destructive">{form.formState.errors.companionType?.message}</p>
            </div>
          </div>
        </StepCard>

        <StepCard
          index="04"
          title="Main guest details"
          description="These identity and address fields are the required baseline for the booking and payment flow."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="main-firstName">First name</Label>
              <Input id="main-firstName" {...form.register("mainTraveler.firstName")} />
              <p className="text-sm text-destructive">{form.formState.errors.mainTraveler?.firstName?.message}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="main-lastName">Last name</Label>
              <Input id="main-lastName" {...form.register("mainTraveler.lastName")} />
              <p className="text-sm text-destructive">{form.formState.errors.mainTraveler?.lastName?.message}</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="main-address1">Address line 1</Label>
              <Input id="main-address1" {...form.register("mainTraveler.addressLine1")} />
              <p className="text-sm text-destructive">{form.formState.errors.mainTraveler?.addressLine1?.message}</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="main-address2">Address line 2</Label>
              <Input id="main-address2" {...form.register("mainTraveler.addressLine2")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="main-postalCode">Postal code</Label>
              <Input id="main-postalCode" {...form.register("mainTraveler.postalCode")} />
              <p className="text-sm text-destructive">{form.formState.errors.mainTraveler?.postalCode?.message}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="main-city">City</Label>
              <Input id="main-city" {...form.register("mainTraveler.city")} />
              <p className="text-sm text-destructive">{form.formState.errors.mainTraveler?.city?.message}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="main-country">Country</Label>
              <Input id="main-country" {...form.register("mainTraveler.country")} />
              <p className="text-sm text-destructive">{form.formState.errors.mainTraveler?.country?.message}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="main-phone">Phone</Label>
              <Input id="main-phone" {...form.register("mainTraveler.phone")} />
              <p className="text-sm text-destructive">{form.formState.errors.mainTraveler?.phone?.message}</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="main-email">Email</Label>
              <Input id="main-email" type="email" autoComplete="email" {...form.register("mainTraveler.email")} />
              <p className="text-sm text-destructive">{form.formState.errors.mainTraveler?.email?.message}</p>
            </div>
          </div>
        </StepCard>

        {hasCompanion ? (
          <StepCard
            index="05"
            title="Companion details"
            description="When the room is shared, the companion identity is captured separately and the yoga participation flag remains explicit."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companion-firstName">First name</Label>
                <Input id="companion-firstName" {...form.register("companionTraveler.firstName")} />
                <p className="text-sm text-destructive">{form.formState.errors.companionTraveler?.firstName?.message}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companion-lastName">Last name</Label>
                <Input id="companion-lastName" {...form.register("companionTraveler.lastName")} />
                <p className="text-sm text-destructive">{form.formState.errors.companionTraveler?.lastName?.message}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companion-phone">Phone</Label>
                <Input id="companion-phone" {...form.register("companionTraveler.phone")} />
                <p className="text-sm text-destructive">{form.formState.errors.companionTraveler?.phone?.message}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companion-email">Email</Label>
                <Input id="companion-email" type="email" {...form.register("companionTraveler.email")} />
                <p className="text-sm text-destructive">{form.formState.errors.companionTraveler?.email?.message}</p>
              </div>
              <div className="rounded-[1.35rem] border border-white/8 bg-black/14 p-4 md:col-span-2">
                <Controller
                  control={form.control}
                  name="companionTraveler.participatesInYoga"
                  render={({ field }) => (
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={Boolean(field.value)}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          form.setValue(
                            "companionType",
                            checked
                              ? CompanionType.with_yoga
                              : CompanionType.without_yoga,
                            { shouldValidate: true },
                          );
                        }}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-foreground">Companion participates in yoga</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Keep this flag aligned with the selected companion type and pricing breakdown.
                        </p>
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>
          </StepCard>
        ) : null}

        <StepCard
          index="06"
          title="Dynamic pricing breakdown"
          description="Pricing stays explicit: room base, companion surcharge if any, and total amount before payment selection."
        >
          {pricing && selectedRoom ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/8 bg-black/14 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Room base price</p>
                <p className="mt-3 text-3xl font-semibold text-foreground">
                  {formatCurrency(pricing.snapshot.roomBasePrice, pricing.snapshot.currency)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedRoom.name} including the main guest.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/8 bg-black/14 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Companion surcharge</p>
                <p className="mt-3 text-3xl font-semibold text-foreground">
                  {pricing.snapshot.companionSurcharge > 0
                    ? `+${formatCurrency(pricing.snapshot.companionSurcharge, pricing.snapshot.currency)}`
                    : formatCurrency(0, pricing.snapshot.currency)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {hasCompanion
                    ? getCompanionTypeLabel(companionType ?? CompanionType.without_yoga)
                    : "No companion added"}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-primary/25 bg-primary/10 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/70">Total amount</p>
                <p className="mt-3 text-4xl font-semibold text-foreground">
                  {formatCurrency(pricing.snapshot.totalAmount, pricing.snapshot.currency)}
                </p>
                <p className="mt-2 text-sm text-primary-foreground/70">
                  Transparent server-driven basis for checkout in the next milestone.
                </p>
              </div>
            </div>
          ) : null}
        </StepCard>

        <StepCard
          index="07"
          title="Payment mode"
          description="Choose between full payment and 2x installment payment with no extra fees."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {[PaymentMode.full, PaymentMode.split_2x].map((mode) => {
              const selected = paymentMode === mode;

              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => form.setValue("paymentMode", mode, { shouldValidate: true })}
                  className={cn(
                    "rounded-[1.5rem] border p-5 text-left transition-all",
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-white/8 bg-black/14 hover:bg-white/4",
                  )}
                >
                  <p className="text-lg font-semibold text-foreground">{getPaymentModeLabel(mode)}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {mode === PaymentMode.full
                      ? "Pay 100% now and confirm the booking immediately after verified payment."
                      : "Pay 50% now, 50% later with no extra fees and a clear due date."}
                  </p>
                  {pricing ? (
                    <div className="mt-5 space-y-2 rounded-[1.2rem] border border-white/6 bg-white/4 p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Due now</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(
                            mode === PaymentMode.full
                              ? pricing.snapshot.totalAmount
                              : pricing.snapshot.firstInstallmentAmount,
                            pricing.snapshot.currency,
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Due later</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(
                            mode === PaymentMode.full ? 0 : pricing.snapshot.secondInstallmentAmount,
                            pricing.snapshot.currency,
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Due rule</span>
                        <span className="font-medium text-foreground">
                          {mode === PaymentMode.full
                            ? "No second payment"
                            : `${formatDate(pricing.installmentPlan.secondInstallmentDueDate ?? offering.startDate)}`}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </StepCard>

        <StepCard
          index="08"
          title="Final review and consent"
          description="Review the selected offering, room, traveler details, pricing and payment schedule before continuing to secure payment."
        >
          <div className="space-y-5">
            <div className="grid gap-3 rounded-[1.5rem] border border-white/8 bg-black/14 p-5 text-sm md:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Selected room</p>
                <p className="mt-1 font-medium text-foreground">{selectedRoom?.name ?? "Not selected"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Payment mode</p>
                <p className="mt-1 font-medium text-foreground">{getPaymentModeLabel(paymentMode)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Main guest</p>
                <p className="mt-1 font-medium text-foreground">
                  {mainTraveler.firstName || mainTraveler.lastName
                    ? `${mainTraveler.firstName} ${mainTraveler.lastName}`.trim()
                    : "Not completed yet"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Email used</p>
                <p className="mt-1 font-medium text-foreground">{mainTraveler.email || "Not completed yet"}</p>
              </div>
            </div>
            <div className="space-y-4 rounded-[1.5rem] border border-white/8 bg-black/14 p-5">
              <Controller
                control={form.control}
                name="termsAccepted"
                render={({ field }) => (
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-1" />
                      <div>
                        <p className="font-medium text-foreground">I accept the booking terms</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          The booking summary, payment schedule and accommodation rules have been reviewed.
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-destructive">{form.formState.errors.termsAccepted?.message}</p>
                  </div>
                )}
              />
              <Controller
                control={form.control}
                name="privacyAccepted"
                render={({ field }) => (
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-1" />
                      <div>
                        <p className="font-medium text-foreground">I accept the privacy handling of my personal data</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Traveler identity and future health data will be handled in the secure onboarding flow.
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-destructive">{form.formState.errors.privacyAccepted?.message}</p>
                  </div>
                )}
              />
            </div>
          </div>
        </StepCard>
      </div>

      <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <Card className="border-white/8 bg-card shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl">Booking review</CardTitle>
                <CardDescription>
                  Live summary of the funnel before payment creation.
                </CardDescription>
              </div>
              <Badge variant="outline">{offering.availabilityLabel}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-[1.5rem] border border-white/8 bg-black/14 p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <HomeIcon className="size-4" />
                <span>{getOfferingDisplayLabel(offering.offeringType)}</span>
              </div>
              <p className="mt-3 text-2xl font-semibold text-foreground">{offering.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatDate(offering.startDate)} to {formatDate(offering.endDate)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{offering.location}</p>
            </div>

            <div className="space-y-3 rounded-[1.5rem] border border-white/8 bg-black/14 p-5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Room</span>
                <span className="font-medium text-foreground">{selectedRoom?.name ?? "Not selected"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Travelers</span>
                <span className="font-medium text-foreground">
                  {hasCompanion ? "2 guests" : "1 guest"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Companion mode</span>
                <span className="font-medium text-foreground">
                  {hasCompanion && companionType ? getCompanionTypeLabel(companionType) : "Solo stay"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment mode</span>
                <span className="font-medium text-foreground">{getPaymentModeLabel(paymentMode)}</span>
              </div>
            </div>

            {pricing ? (
              <div className="space-y-3 rounded-[1.5rem] border border-primary/20 bg-primary/8 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary-foreground/70">Room base</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(pricing.snapshot.roomBasePrice, pricing.snapshot.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary-foreground/70">Companion surcharge</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(pricing.snapshot.companionSurcharge, pricing.snapshot.currency)}
                  </span>
                </div>
                <Separator className="bg-white/10" />
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-foreground">Total</span>
                  <span className="text-2xl font-semibold text-foreground">
                    {formatCurrency(pricing.snapshot.totalAmount, pricing.snapshot.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary-foreground/70">Due now</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(pricing.installmentPlan.dueNow, pricing.snapshot.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary-foreground/70">Due later</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(pricing.installmentPlan.dueLater, pricing.snapshot.currency)}
                  </span>
                </div>
                {pricing.installmentPlan.secondInstallmentDueDate ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary-foreground/70">Second due date</span>
                    <span className="font-medium text-foreground">
                      {formatDate(pricing.installmentPlan.secondInstallmentDueDate)}
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-3 rounded-[1.5rem] border border-white/8 bg-black/14 p-5 text-sm">
              <div className="flex items-start gap-3">
                <UsersIcon className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">
                    {mainTraveler.firstName || mainTraveler.lastName
                      ? `${mainTraveler.firstName} ${mainTraveler.lastName}`.trim()
                      : "Main guest details pending"}
                  </p>
                  <p className="text-muted-foreground">{mainTraveler.email || "Email pending"}</p>
                </div>
              </div>
              {hasCompanion ? (
                <div className="flex items-start gap-3">
                  <UserRoundPlusIcon className="mt-0.5 size-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">
                      {companionTraveler?.firstName || companionTraveler?.lastName
                        ? `${companionTraveler?.firstName ?? ""} ${companionTraveler?.lastName ?? ""}`.trim()
                        : "Companion details pending"}
                    </p>
                    <p className="text-muted-foreground">
                      {companionTraveler?.email || "Companion email pending"}
                    </p>
                  </div>
                </div>
              ) : null}
              <div className="flex items-start gap-3">
                <HeartPulseIcon className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Health questionnaire stays post-payment</p>
                  <p className="text-muted-foreground">
                    The sensitive health form unlocks only after a verified payment event in M58.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CreditCardIcon className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Terms status</p>
                  <p className="text-muted-foreground">
                    {termsAccepted && privacyAccepted
                      ? "Both consent checkpoints are currently satisfied."
                      : "Terms and privacy consent still need confirmation."}
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="h-12 w-full rounded-full text-base font-semibold"
            >
              {isPending ? "Opening secure checkout..." : "Continue to secure payment"}
            </Button>

            {submitNote ? (
              <div className="rounded-[1.35rem] border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                <div className="flex items-start gap-3">
                  <CheckCircle2Icon className="mt-0.5 size-4" />
                  <p>{submitNote}</p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

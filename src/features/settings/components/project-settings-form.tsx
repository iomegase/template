"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  adminProjectSettingsFormSchema,
  platformProjectSettingsFormSchema,
} from "@/features/settings/schema";
import { getProjectStatusLabel } from "@/features/projects/status";
import type { ProjectSettingsFormValues } from "@/features/settings/types";
import { ProjectStatus } from "@/generated/prisma/enums";

type ProjectSettingsFormProps = {
  mode: "admin" | "platform";
  defaultValues: ProjectSettingsFormValues;
  submitLabel: string;
  action: (
    values: ProjectSettingsFormValues,
  ) => Promise<{ error?: string } | void>;
};

const schemaByMode = {
  admin: adminProjectSettingsFormSchema,
  platform: platformProjectSettingsFormSchema,
} as const;

export function ProjectSettingsForm({
  mode,
  defaultValues,
  submitLabel,
  action,
}: ProjectSettingsFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<ProjectSettingsFormValues>({
    resolver: zodResolver(schemaByMode[mode]),
    defaultValues,
  });

  const submit = form.handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await action(values);

      if (result?.error) {
        setServerError(result.error);
      }
    });
  });

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="projectName">Project name</Label>
          <Input id="projectName" {...form.register("projectName")} />
          <p className="text-sm text-destructive">
            {form.formState.errors.projectName?.message}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="siteName">Site name</Label>
          <Input id="siteName" {...form.register("siteName")} />
          <p className="text-sm text-destructive">
            {form.formState.errors.siteName?.message}
          </p>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...form.register("description")} />
          <p className="text-sm text-destructive">
            {form.formState.errors.description?.message}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="siteUrl">Site URL</Label>
          <Input id="siteUrl" placeholder="https://example.com" {...form.register("siteUrl")} />
          <p className="text-sm text-destructive">
            {form.formState.errors.siteUrl?.message}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="brandingPrimaryColor">Brand color</Label>
          <Input id="brandingPrimaryColor" placeholder="#111827" {...form.register("brandingPrimaryColor")} />
          <p className="text-sm text-destructive">
            {form.formState.errors.brandingPrimaryColor?.message}
          </p>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="brandingLogoUrl">Brand logo URL</Label>
          <Input
            id="brandingLogoUrl"
            placeholder="https://cdn.example.com/logo.svg"
            {...form.register("brandingLogoUrl")}
          />
          <p className="text-sm text-destructive">
            {form.formState.errors.brandingLogoUrl?.message}
          </p>
        </div>
      </div>
      <div className="grid gap-4 rounded-xl border p-4 md:grid-cols-2">
        <Controller
          control={form.control}
          name="customerPortalEnabled"
          render={({ field }) => (
            <label className="flex items-start gap-3 rounded-lg border p-3">
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              <span className="space-y-1">
                <span className="block text-sm font-medium text-foreground">
                  Customer portal
                </span>
                <span className="block text-sm text-muted-foreground">
                  Keep end-user access explicit and separate from admin workflows.
                </span>
              </span>
            </label>
          )}
        />
        <Controller
          control={form.control}
          name="billingEnabled"
          render={({ field }) => (
            <label className="flex items-start gap-3 rounded-lg border p-3">
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              <span className="space-y-1">
                <span className="block text-sm font-medium text-foreground">
                  Billing module
                </span>
                <span className="block text-sm text-muted-foreground">
                  Stripe-related UI remains optional and should activate cleanly later.
                </span>
              </span>
            </label>
          )}
        />
        {mode === "platform" ? (
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <div className="space-y-2 rounded-lg border p-3 md:col-span-2">
                <Label htmlFor="status">Project lifecycle</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select a lifecycle state" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ProjectStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {getProjectStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Super-admin lifecycle state for this starter instance.
                </p>
              </div>
            )}
          />
        ) : null}
      </div>
      <p className="min-h-5 text-sm text-destructive">{serverError}</p>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

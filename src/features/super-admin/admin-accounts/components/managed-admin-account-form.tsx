"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  managedAdminAccountCreateFormSchema,
  managedAdminAccountUpdateFormSchema,
} from "@/features/super-admin/admin-accounts/schema";
import type {
  ManagedAdminAccountFormValues,
  ProjectOption,
} from "@/features/super-admin/admin-accounts/types";

type ManagedAdminAccountFormProps = {
  mode: "create" | "edit";
  projects: ProjectOption[];
  defaultValues?: Partial<ManagedAdminAccountFormValues>;
  submitLabel: string;
  action: (
    values: ManagedAdminAccountFormValues,
  ) => Promise<{ error?: string } | void>;
};

const schemaByMode = {
  create: managedAdminAccountCreateFormSchema,
  edit: managedAdminAccountUpdateFormSchema,
} as const;

export function ManagedAdminAccountForm({
  mode,
  projects,
  defaultValues,
  submitLabel,
  action,
}: ManagedAdminAccountFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<ManagedAdminAccountFormValues>({
    resolver: zodResolver(schemaByMode[mode]),
    defaultValues: {
      name: defaultValues?.name ?? "",
      email: defaultValues?.email ?? "",
      password: "",
      projectId: defaultValues?.projectId ?? "",
    },
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
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...form.register("name")} />
          <p className="text-sm text-destructive">{form.formState.errors.name?.message}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...form.register("email")} />
          <p className="text-sm text-destructive">{form.formState.errors.email?.message}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">
            {mode === "create" ? "Password" : "Password reset"}
          </Label>
          <Input
            id="password"
            type="password"
            placeholder={mode === "edit" ? "Leave blank to keep current password" : ""}
            {...form.register("password")}
          />
          <p className="text-sm text-destructive">
            {form.formState.errors.password?.message}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectId">Assigned project</Label>
          <Controller
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="projectId" className="w-full">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} ({project.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <p className="text-sm text-destructive">
            {form.formState.errors.projectId?.message}
          </p>
        </div>
      </div>
      <p className="min-h-5 text-sm text-destructive">{serverError}</p>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

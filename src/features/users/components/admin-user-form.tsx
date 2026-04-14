"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminUserCreateFormSchema,
  adminUserUpdateFormSchema,
} from "@/features/users/schema";
import type { AdminUserFormValues } from "@/features/users/types";

type AdminUserFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<AdminUserFormValues>;
  submitLabel: string;
  action: (values: AdminUserFormValues) => Promise<{ error?: string } | void>;
};

const schemaByMode = {
  create: adminUserCreateFormSchema,
  edit: adminUserUpdateFormSchema,
} as const;

export function AdminUserForm({
  mode,
  defaultValues,
  submitLabel,
  action,
}: AdminUserFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<AdminUserFormValues>({
    resolver: zodResolver(schemaByMode[mode]),
    defaultValues: {
      name: defaultValues?.name ?? "",
      email: defaultValues?.email ?? "",
      password: "",
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
      <p className="min-h-5 text-sm text-destructive">{serverError}</p>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

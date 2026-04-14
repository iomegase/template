"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";

import { authenticate } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="admin@example.com"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Admin123!"
          minLength={8}
          required
        />
      </div>
      <input type="hidden" name="redirectTo" value={callbackUrl} />
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
      <p className="min-h-5 text-sm text-destructive" aria-live="polite">
        {errorMessage}
      </p>
    </form>
  );
}

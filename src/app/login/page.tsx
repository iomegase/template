import { redirect } from "next/navigation";
import { KeyRound, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/login-form";
import { getOptionalSessionUser } from "@/features/auth/guards";
import { dashboardRoute } from "@/features/auth/routes";

const demoAccounts = [
  {
    role: "super_admin",
    email: "superadmin@example.com",
    password: "Admin123!",
  },
  {
    role: "admin",
    email: "admin@example.com",
    password: "Admin123!",
  },
  {
    role: "customer",
    email: "customer@example.com",
    password: "Admin123!",
  },
];

function formatRoleLabel(role: string) {
  return role.replace("_", " ");
}

export default async function LoginPage() {
  const user = await getOptionalSessionUser();

  if (user) {
    redirect(dashboardRoute);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[-10%] top-[-10%] h-[32rem] w-[32rem] rounded-full bg-primary/14 blur-[140px]" />
        <div className="absolute bottom-[-12%] right-[-10%] h-[30rem] w-[30rem] rounded-full bg-accent/12 blur-[140px]" />
        <div className="absolute left-1/3 top-1/4 h-[24rem] w-[24rem] rounded-full bg-chart-2/12 blur-[120px]" />
      </div>

      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-border/60 bg-card/70 shadow-2xl backdrop-blur-xl lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex lg:p-12">
          <Sparkles className="absolute right-10 top-10 h-28 w-28 text-primary-foreground/12" />

          <div className="relative z-10">
            <Badge className="mb-8 border-0 bg-primary-foreground px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-primary hover:bg-primary-foreground/90">
              Auth Foundation
            </Badge>
            <h1 className="text-5xl font-black uppercase tracking-[-0.06em] text-balance">
              Pure
              <br />
              <span className="text-chart-4">Control.</span>
            </h1>
            <p className="mt-6 max-w-sm text-sm leading-6 text-primary-foreground/75">
              Access the starter workspace with explicit role boundaries for
              super-admin, admin and customer areas.
            </p>
          </div>

          <div className="relative z-10">
            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.32em] text-chart-4">
              Demo Access
            </p>
            <div className="grid gap-3">
              {demoAccounts.map((account) => (
                <div
                  key={account.role}
                  className="rounded-2xl border border-primary-foreground/12 bg-primary-foreground/8 p-4 backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/10 text-chart-4">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold uppercase tracking-[0.18em]">
                          {formatRoleLabel(account.role)}
                        </p>
                        <p className="text-xs text-primary-foreground/70">{account.email}</p>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/10 bg-background/12 px-3 py-1 text-[11px] font-medium text-chart-4">
                      <KeyRound className="h-3 w-3" />
                      {account.password}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Card className="rounded-none border-0 bg-card/82">
          <CardHeader className="px-8 pb-0 pt-10 sm:px-10 lg:px-12 lg:pt-14">
            <Badge
              variant="outline"
              className="mb-6 w-fit border-primary/15 bg-card/80 text-primary"
            >
              Secure sign-in
            </Badge>
            <CardTitle className="text-4xl font-black uppercase tracking-[-0.06em] text-foreground">
              Welcome back
            </CardTitle>
            <CardDescription className="max-w-md pt-2 text-sm leading-6 text-muted-foreground">
              Enter your credentials to access your assigned workspace. The
              dashboard will redirect automatically according to your role.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 py-10 sm:px-10 lg:px-12 lg:py-12">
            <div className="rounded-[2rem] border border-border/70 bg-background/80 p-6 shadow-sm">
              <LoginForm />
            </div>

            <div className="mt-8 border-t border-border/70 pt-6 lg:hidden">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground">
                Demo accounts
              </p>
              <div className="grid gap-2">
                {demoAccounts.map((account) => (
                  <div
                    key={account.role}
                    className="rounded-xl border border-border/70 bg-background/75 p-3 text-xs text-foreground"
                  >
                    <p className="font-bold uppercase tracking-[0.18em]">
                      {formatRoleLabel(account.role)}
                    </p>
                    <p className="mt-1">{account.email}</p>
                    <p className="font-medium text-primary">{account.password}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-8 text-[10px] font-black uppercase tracking-[0.32em] text-muted-foreground">
              Starter Foundation
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

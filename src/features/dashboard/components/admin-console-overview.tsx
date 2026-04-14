import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRightIcon,
  CircleDollarSignIcon,
  PlusIcon,
  SparklesIcon,
  UsersIcon,
  WalletCardsIcon,
} from "lucide-react";

type AdminConsoleOverviewProps = {
  projectName: string;
  projectSlug: string;
  adminCount: number;
  customerCount: number;
  billingEnabled: boolean;
  customerPortalEnabled: boolean;
  isActive: boolean;
  projectStatusLabel: string;
};

const contributionBars = [
  { label: "Dec", value: 46 },
  { label: "Jan", value: 64 },
  { label: "Feb", value: 52 },
  { label: "Mar", value: 76 },
  { label: "Apr", value: 44 },
  { label: "May", value: 82 },
];

function ProgressRail({
  value,
  tone = "primary",
}: {
  value: number;
  tone?: "primary" | "secondary";
}) {
  return (
    <div className="h-3 rounded-full bg-white/6">
      <div
        className={
          tone === "primary"
            ? "h-3 rounded-full bg-primary"
            : "h-3 rounded-full bg-chart-2"
        }
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function AdminConsoleOverview({
  projectName,
  projectSlug,
  adminCount,
  customerCount,
  billingEnabled,
  customerPortalEnabled,
  isActive,
  projectStatusLabel,
}: AdminConsoleOverviewProps) {
  const readinessScore = [
    isActive,
    billingEnabled,
    customerPortalEnabled,
    adminCount > 0,
    customerCount > 0,
  ].filter(Boolean).length;
  const readinessPct = Math.round((readinessScore / 5) * 100);

  return (
    <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr_1fr]">
      <Card className="border-white/8 bg-card shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
        <CardHeader className="gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.8rem] uppercase tracking-[0.22em] text-muted-foreground">
                Contribution history
              </p>
              <CardTitle className="mt-2 text-[1.75rem] font-semibold">
                {projectName}
              </CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Last 6 milestones of starter activation for{" "}
                <span className="text-foreground">{projectSlug}</span>.
              </p>
            </div>
            <Badge className="border-white/8 bg-white/6 text-foreground" variant="outline">
              +12% vs last month
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid h-72 grid-cols-6 items-end gap-4 rounded-[1.6rem] border border-white/6 bg-black/14 px-3 pb-4 pt-8">
            {contributionBars.map((bar) => (
              <div key={bar.label} className="flex h-full flex-col items-center justify-end gap-3">
                <div
                  className="w-full rounded-2xl bg-primary shadow-[0_10px_30px_rgba(201,0,105,0.28)]"
                  style={{ height: `${bar.value}%` }}
                />
                <span className="text-xs text-muted-foreground">{bar.label}</span>
              </div>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[1.4rem] border border-white/6 bg-black/14 p-4">
              <p className="text-[0.75rem] uppercase tracking-[0.2em] text-muted-foreground">
                Upcoming
              </p>
              <p className="mt-3 text-3xl font-semibold">May 25, 2024</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Settings checkpoint and portal review scheduled.
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-white/6 bg-black/14 p-4">
              <p className="text-[0.75rem] uppercase tracking-[0.2em] text-muted-foreground">
                Auto-scale plan
              </p>
              <p className="mt-3 text-3xl font-semibold">Accelerated</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Reusable admin flows shipping weekly.
              </p>
            </div>
          </div>
          <Button className="h-11 w-full rounded-full text-base font-semibold">
            View full report
          </Button>
        </CardContent>
      </Card>

      <Card className="border-white/8 bg-card shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
        <CardHeader className="gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.8rem] uppercase tracking-[0.22em] text-muted-foreground">
                Control threshold
              </p>
              <CardTitle className="mt-2 text-[1.75rem] font-semibold">
                Starter operations
              </CardTitle>
            </div>
            <div className="rounded-full border border-white/8 bg-white/6 p-2 text-muted-foreground">
              <SparklesIcon className="size-4" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Set the minimum operational baseline before project rollout is considered ready.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Preferred workspace</p>
            <div className="rounded-full border border-white/10 bg-black/10 px-4 py-3 text-base text-foreground/90">
              {billingEnabled ? "Billing-ready admin console" : "Core-only admin console"}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-foreground">Minimum rollout score</p>
              <p className="text-3xl font-semibold">${readinessPct}.00</p>
            </div>
            <ProgressRail value={readinessPct} />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>$50 min</span>
              <span>$100 max</span>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Notes</p>
            <div className="min-h-32 rounded-[1.4rem] border border-white/10 bg-black/10 p-4 text-sm leading-6 text-muted-foreground">
              {customerPortalEnabled
                ? "Customer portal is enabled and ready to be exposed once the project state is confirmed."
                : "Customer portal remains disabled. Keep the rollout private until project settings are complete."}
            </div>
          </div>
          <Button className="h-11 w-full rounded-full text-base font-semibold">
            Save threshold
          </Button>
        </CardContent>
      </Card>

      <Card className="border-white/8 bg-card shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
        <CardHeader className="gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.8rem] uppercase tracking-[0.22em] text-muted-foreground">
                Savings targets
              </p>
              <CardTitle className="mt-2 text-[1.75rem] font-semibold">
                Activation progress
              </CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Active milestones for this project starter.
              </p>
            </div>
            <Button
              variant="outline"
              className="h-10 rounded-full border-white/10 bg-white/6 px-4 text-sm hover:bg-white/10"
            >
              <PlusIcon />
              New goal
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-3xl border border-white/6 bg-black/14 p-5">
            <p className="text-[0.8rem] uppercase tracking-[0.22em] text-muted-foreground">
              Core foundation
            </p>
            <p className="mt-4 text-5xl font-semibold">$420,000</p>
            <div className="mt-5 space-y-3">
              <ProgressRail value={65} />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>65% achieved</span>
                <span>$273,000</span>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-white/6 bg-black/14 p-5">
            <p className="text-[0.8rem] uppercase tracking-[0.22em] text-muted-foreground">
              Module adoption
            </p>
            <p className="mt-4 text-5xl font-semibold">$85,000</p>
            <div className="mt-5 space-y-3">
              <ProgressRail value={32} tone="secondary" />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>32% achieved</span>
                <span>$27,200</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Keep the operational baseline clean before enabling more modules or inviting more customers.
          </p>
        </CardContent>
      </Card>

      <Card className="border-white/8 bg-card shadow-[0_20px_80px_rgba(0,0,0,0.28)] xl:col-span-1">
        <CardContent className="flex min-h-72 flex-col items-center justify-center gap-5 p-8 text-center">
          <div className="rounded-[1.1rem] border border-white/8 bg-white/6 p-4 text-foreground">
            <PlusIcon className="size-7" />
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl font-semibold">Distribute track</h3>
            <p className="mx-auto max-w-md text-base leading-7 text-muted-foreground">
              Publish your next reusable slice and keep admin, customer and billing flows aligned.
            </p>
          </div>
          <Button className="h-11 rounded-full px-8 text-base font-semibold">
            Create release
          </Button>
        </CardContent>
      </Card>

      <Card className="border-white/8 bg-card shadow-[0_20px_80px_rgba(0,0,0,0.28)] xl:col-span-1">
        <CardHeader className="gap-2">
          <p className="text-[0.8rem] uppercase tracking-[0.22em] text-muted-foreground">
            Claimable balance
          </p>
          <CardTitle className="text-6xl font-semibold">$0.00</CardTitle>
          <Badge className="w-fit border-amber-400/25 bg-amber-400/10 text-amber-200" variant="outline">
            Pending setup
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="rounded-3xl border border-white/6 bg-black/14 p-5">
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Net royalties</span>
                <span className="font-medium text-foreground">$0.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Processing fee</span>
                <span className="font-medium text-foreground">-$0.00</span>
              </div>
              <div className="h-px bg-white/8" />
              <div className="flex items-center justify-between text-base">
                <span className="text-muted-foreground">Total ready to claim</span>
                <span className="font-semibold text-foreground">$0.00 USD</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/8 bg-card shadow-[0_20px_80px_rgba(0,0,0,0.28)] xl:col-span-1">
        <CardHeader className="gap-3">
          <p className="text-[0.8rem] uppercase tracking-[0.22em] text-muted-foreground">
            Recent transactions
          </p>
          <CardTitle className="text-[1.75rem] font-semibold">
            Latest account activity
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Real operational markers from your current starter instance.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            {
              icon: WalletCardsIcon,
              title: "Starter billing",
              subtitle: billingEnabled ? "Billing enabled" : "Billing disabled",
              date: "Today, 10:24 AM",
            },
            {
              icon: UsersIcon,
              title: "Admin accounts",
              subtitle: `${adminCount} operator${adminCount === 1 ? "" : "s"}`,
              date: "Yesterday",
            },
            {
              icon: CircleDollarSignIcon,
              title: "Customer portal",
              subtitle: customerPortalEnabled ? "Portal enabled" : "Portal off",
              date: "Oct 12",
            },
            {
              icon: ArrowRightIcon,
              title: "Project status",
              subtitle: projectStatusLabel,
              date: "Oct 11",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-4 rounded-[1.2rem] border border-transparent px-2 py-3 transition-colors hover:border-white/6 hover:bg-black/10"
            >
              <div className="rounded-2xl border border-white/8 bg-white/6 p-3 text-foreground">
                <item.icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-medium text-foreground">{item.title}</p>
                <p className="truncate text-sm text-muted-foreground">{item.subtitle}</p>
              </div>
              <div className="text-sm text-muted-foreground">{item.date}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

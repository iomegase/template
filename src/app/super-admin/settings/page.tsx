import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCloneReadinessAudit } from "@/features/super-admin/clone-readiness";
import { requireSuperAdmin } from "@/features/super-admin/guards";

export default async function SuperAdminSettingsPage() {
  await requireSuperAdmin();
  const audit = await getCloneReadinessAudit();
  const groupedChecks = {
    docs: audit.checks.filter((check) => check.category === "docs"),
    runtime: audit.checks.filter((check) => check.category === "runtime"),
    starter: audit.checks.filter((check) => check.category === "starter"),
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Clone-readiness audit</CardTitle>
          <CardDescription>
            Validate that this starter can be duplicated for a new client project without hidden setup debt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 text-sm text-muted-foreground">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="font-medium text-foreground">Audit ratio</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{audit.ratio}</p>
              <p className="mt-2">Checks currently passing across docs, runtime and starter structure.</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium text-foreground">Ready checks</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{audit.readyCount}</p>
              <p className="mt-2">Items that should not require extra onboarding work after cloning.</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium text-foreground">Attention</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">
                {audit.totalCount - audit.readyCount}
              </p>
              <p className="mt-2">Checks still failing and likely to slow down the next client duplication.</p>
            </div>
          </div>

          {[
            {
              title: "Documentation",
              checks: groupedChecks.docs,
            },
            {
              title: "Runtime bootstrap",
              checks: groupedChecks.runtime,
            },
            {
              title: "Starter architecture",
              checks: groupedChecks.starter,
            },
          ].map((group) => (
            <div key={group.title} className="rounded-lg border p-4">
              <p className="font-medium text-foreground">{group.title}</p>
              <div className="mt-4 space-y-3">
                {group.checks.map((check) => (
                  <div
                    key={check.id}
                    className="flex items-start justify-between gap-4 rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{check.label}</p>
                      <p>{check.detail}</p>
                    </div>
                    <Badge variant="outline">{check.ready ? "Ready" : "Attention"}</Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Readiness checklist</CardTitle>
          <CardDescription>Operator summary for future client duplication.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span>Public README aligned</span>
            <Badge variant="outline">
              {groupedChecks.docs.every((check) => check.ready) ? "Ready" : "Attention"}
            </Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span>Runtime bootstrap</span>
            <Badge variant="outline">
              {groupedChecks.runtime.every((check) => check.ready) ? "Ready" : "Attention"}
            </Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span>Starter architecture</span>
            <Badge variant="outline">
              {groupedChecks.starter.every((check) => check.ready) ? "Ready" : "Attention"}
            </Badge>
          </div>
          <div className="rounded-lg border p-4 text-muted-foreground">
            This audit is intentionally lean. It validates whether a fresh clone has enough
            docs, scripts, route spaces and module boundaries to start a new client project
            without structural rework.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

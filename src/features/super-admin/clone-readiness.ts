import { access, readFile } from "node:fs/promises";
import path from "node:path";

export type CloneReadinessCheck = {
  id: string;
  label: string;
  ready: boolean;
  detail: string;
  category: "docs" | "runtime" | "starter";
};

export type CloneReadinessAudit = {
  readyCount: number;
  totalCount: number;
  ratio: string;
  checks: CloneReadinessCheck[];
};

async function fileExists(rootDir: string, relativePath: string) {
  try {
    await access(path.join(rootDir, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function readText(rootDir: string, relativePath: string) {
  try {
    return await readFile(path.join(rootDir, relativePath), "utf8");
  } catch {
    return null;
  }
}

export async function getCloneReadinessAudit(): Promise<CloneReadinessAudit> {
  const rootDir = process.cwd();
  const [readme, envExample, packageJsonRaw, nvmrc, seedFile] = await Promise.all([
    readText(rootDir, "README.md"),
    readText(rootDir, ".env.example"),
    readText(rootDir, "package.json"),
    readText(rootDir, ".nvmrc"),
    readText(rootDir, "prisma/seed.ts"),
  ]);

  const packageJson = packageJsonRaw ? JSON.parse(packageJsonRaw) as {
    engines?: {
      node?: string;
    };
    scripts?: Record<string, string>;
  } : null;

  const checks: CloneReadinessCheck[] = [
    {
      id: "public-readme",
      category: "docs",
      label: "Public README documents local setup",
      ready: Boolean(
        readme &&
          readme.includes("npm run db:generate") &&
          readme.includes("npm run db:push") &&
          readme.includes("/super-admin"),
      ),
      detail:
        "The public README should explain install, database prep and the main route spaces without relying on internal planning docs.",
    },
    {
      id: "governance-docs",
      category: "docs",
      label: "Internal guardrails are present",
      ready: await Promise.all([
        fileExists(rootDir, "AGENTS.md"),
        fileExists(rootDir, "README-Codex-Pack.md"),
        fileExists(rootDir, "Plan.md"),
        fileExists(rootDir, "Plan-Phase-5.md"),
      ]).then((items) => items.every(Boolean)),
      detail:
        "Repo-level instructions and phase plans should remain available so clone work keeps the same product direction.",
    },
    {
      id: "env-template-core",
      category: "runtime",
      label: ".env.example covers required core runtime vars",
      ready: Boolean(
        envExample &&
          envExample.includes("DATABASE_URL") &&
          envExample.includes("AUTH_SECRET") &&
          envExample.includes("APP_URL"),
      ),
      detail:
        "A clone should be able to bootstrap the core starter without reverse-engineering missing environment variables.",
    },
    {
      id: "env-template-billing",
      category: "runtime",
      label: ".env.example documents optional billing vars",
      ready: Boolean(
        envExample &&
          envExample.includes("STRIPE_SECRET_KEY") &&
          envExample.includes("STRIPE_WEBHOOK_SECRET") &&
          envExample.includes("STRIPE_PRICE_ID"),
      ),
      detail:
        "Billing remains optional, but its variables must already be documented so activation does not require repo surgery.",
    },
    {
      id: "node-version",
      category: "runtime",
      label: "Node version is pinned",
      ready: Boolean(packageJson?.engines?.node && nvmrc?.trim()),
      detail:
        "The starter should pin the runtime via both package engines and .nvmrc to reduce onboarding drift.",
    },
    {
      id: "db-scripts",
      category: "runtime",
      label: "Database bootstrap scripts are available",
      ready: Boolean(
        packageJson?.scripts?.["db:generate"] &&
          packageJson?.scripts?.["db:push"] &&
          packageJson?.scripts?.["db:seed"],
      ),
      detail:
        "A new clone should be able to generate Prisma, sync schema and seed demo access with first-party npm scripts.",
    },
    {
      id: "route-spaces",
      category: "starter",
      label: "Role route spaces exist",
      ready: await Promise.all([
        fileExists(rootDir, "src/app/super-admin"),
        fileExists(rootDir, "src/app/admin"),
        fileExists(rootDir, "src/app/customer"),
        fileExists(rootDir, "src/app/login/page.tsx"),
      ]).then((items) => items.every(Boolean)),
      detail:
        "The reusable starter must already expose explicit role areas instead of requiring structural rewrites after cloning.",
    },
    {
      id: "super-admin-domain",
      category: "starter",
      label: "Super-admin productization layer is isolated",
      ready: await Promise.all([
        fileExists(rootDir, "src/features/projects/service.ts"),
        fileExists(rootDir, "src/features/super-admin/routes.ts"),
        fileExists(rootDir, "src/features/super-admin/guards.ts"),
      ]).then((items) => items.every(Boolean)),
      detail:
        "Project registry and super-admin controls should live in dedicated feature layers rather than inside page-only logic.",
    },
    {
      id: "billing-isolation",
      category: "starter",
      label: "Billing stays isolated as an optional module",
      ready: await Promise.all([
        fileExists(rootDir, "src/features/billing/service.ts"),
        fileExists(rootDir, "src/features/billing/routes.ts"),
        fileExists(rootDir, "src/app/admin/billing/page.tsx"),
      ]).then((items) => items.every(Boolean)),
      detail:
        "The starter should remain operational without billing while keeping Stripe integration ready to activate later.",
    },
    {
      id: "seed-baseline",
      category: "starter",
      label: "Seed baseline creates reusable demo access",
      ready: Boolean(
        seedFile &&
          seedFile.includes("superadmin@example.com") &&
          seedFile.includes("admin@example.com") &&
          seedFile.includes("customer@example.com") &&
          seedFile.includes("demo-project"),
      ),
      detail:
        "A clone should ship with a known demo project and the three reference roles for immediate local validation.",
    },
  ];

  const readyCount = checks.filter((check) => check.ready).length;

  return {
    readyCount,
    totalCount: checks.length,
    ratio: `${readyCount}/${checks.length}`,
    checks,
  };
}

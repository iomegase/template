# Starter Dashboard

Reusable `Next.js` starter built from the official `shadcn/ui` dashboard block and refactored for a multi-area product foundation.

Current foundation:

- public landing page and credentials sign-in
- Auth.js credentials flow
- explicit role routing for `super_admin`, `admin`, `customer`
- protected route spaces: `/super-admin`, `/admin`, `/customer`
- Prisma + PostgreSQL data layer
- starter-ready settings and dashboard placeholders
- optional Stripe billing module with guarded admin/customer routes

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma + PostgreSQL
- Auth.js / NextAuth-compatible auth flow
- Zod

## Roles

- `super_admin`: platform owner
- `admin`: project/site owner
- `customer`: end user

## Local setup

Use Node `22.15.0+`.

```bash
nvm use 22.15.0
npm install
```

Create your local env from [.env.example](/Users/daviddevillers/sites/starter-dashboard/.env.example:1) and set:

- `DATABASE_URL`
- `AUTH_SECRET`

Optional billing module env:

- `APP_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`

If you use local Prisma Postgres:

```bash
npm run db:dev -- --detach
npm run db:ls
```

Then update `DATABASE_URL` with the `prisma+postgres://...` value if needed.

Prepare the database:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

Start the app:

```bash
npm run dev
```

When `DATABASE_URL` points to a local `prisma+postgres://localhost/...` instance, `npm run dev`
will start the Prisma local Postgres service automatically before booting Next.js.
If you use a direct PostgreSQL URL instead, it skips that step.

Open:

- `/`
- `/login`
- `/dashboard`

## Demo credentials

The seed creates three local users:

- `superadmin@example.com` / `Admin123!`
- `admin@example.com` / `Admin123!`
- `customer@example.com` / `Admin123!`

## Route spaces

- `/super-admin`
- `/admin`
- `/customer`
- `/dashboard` redirects according to role

Optional billing routes:

- `/admin/billing`
- `/customer/billing`
- `/api/webhooks/stripe`

The billing module remains optional:

- if `billingEnabled` is false in project settings, billing routes stay non-operational and explain why
- if Stripe env is incomplete, the admin billing page shows the missing setup explicitly
- customer billing remains hidden until portal access and billing activation are both ready

## Notes

- Local Prisma Postgres works reliably in this repo with `db push`.
- `prisma migrate dev` may still be unreliable against the local `prisma dev` instance; use a direct Postgres instance if you want migration-first local development.
- Stripe setup is intentionally isolated inside `src/features/billing` so the starter core keeps working without billing.
- Product direction, implementation phases and internal guardrails are documented in [README-Codex-Pack.md](/Users/daviddevillers/sites/starter-dashboard/README-Codex-Pack.md:1), [Plan.md](/Users/daviddevillers/sites/starter-dashboard/Plan.md:1) and [AGENTS.md](/Users/daviddevillers/sites/starter-dashboard/AGENTS.md:1).

# AGENTS.md

## Mission

Build a reusable **Next.js starter template** in **TypeScript** using the following implementation sequence:

1. create the project with `create-next-app`
2. initialize `shadcn/ui`
3. import the official `dashboard-01` block
4. refactor this dashboard base into a reusable starter architecture
5. extend it with auth, roles, settings, CRUD foundations, optional billing, and super-admin controls

This repository is not a one-off application. It is a **starter system** meant to be reused across multiple client projects.

---

## Product intent

The starter must support two modular layers:

### 1. starter-core
Contains:
- dashboard shell
- auth foundation
- role-based access
- reusable CRUD structure
- settings and configuration
- customer portal foundation

### 2. starter-billing
Contains:
- Stripe integration
- checkout flow
- billing portal
- webhook handling
- billing-related admin UI
- activation guards

Billing must remain optional and activable later.

---

## Mandatory stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- shadcn/ui dashboard starter block as visual foundation
- React Hook Form + Zod
- Prisma + PostgreSQL for the structured application layer
- Auth.js / NextAuth-compatible auth flow
- Stripe as an optional module

---

## Roles

The business roles are fixed as:

- `super_admin`: platform owner, full control across projects
- `admin`: site owner / paying client, access only to their own back-office
- `customer`: end user with access only to their own personal dashboard space

Do not introduce extra roles unless a validated business need requires it.

---

## Core architecture rules

- Start from the official dashboard starter, then refactor cleanly.
- Do not rebuild the dashboard shell from scratch unless necessary.
- Prefer **feature-based architecture** for business logic.
- Keep UI components reusable and presentation-oriented.
- Keep business logic inside feature services.
- Keep auth and permissions centralized.
- Keep Stripe isolated from the CRUD core.
- Avoid unnecessary abstraction.
- Avoid premature enterprise complexity.
- Avoid duplicated CRUD logic when a simple reusable pattern is enough.
- Prefer incremental improvement over heavy rewrites.

---

## Dashboard rules

- Use shadcn/ui primitives and blocks as the visual baseline.
- Preserve a production-ready dashboard feel.
- Keep layout consistency across admin, super-admin, and customer areas.
- Reuse sidebar, headers, tables, cards, dialogs, and forms whenever possible.
- The starter must remain easy to clone and adapt.

---

## Auth and permissions rules

- Access must be explicit and understandable.
- Route-level protection must be enforced.
- Role logic must be centralized.
- Never scatter permission checks randomly across the codebase.
- Admin and customer areas must remain clearly separated.

---

## CRUD rules

- Build reusable CRUD conventions from real use cases.
- Each feature should generally own:
  - types
  - schema
  - model
  - service
  - page flow
  - form components
- Extract shared layers only after repeated concrete usage.
- Prefer clarity over generic engines.

---

## Settings and module activation rules

A settings layer must eventually support:
- general project information
- branding basics
- module activation
- billing enabled state
- future runtime configuration entry points
- customer dashboard options

Settings must be designed for actual admin use, not only developer convenience.

---

## Billing rules

- Stripe must be implemented as an optional module.
- Billing activation must not require rewriting the project.
- The app must remain clean and functional when billing is disabled.
- Route access must respect both role and module state.
- Do not tightly couple Stripe logic to unrelated business CRUD features.

---

## Super-admin rules

The platform owner must eventually be able to:
- view and manage projects
- manage client admin accounts
- activate or deactivate modules
- inspect configuration completeness
- prepare onboarding or duplication workflows

Keep the first super-admin version lean and operational.

---

## Implementation style

When working on any task:

1. audit the current structure first
2. preserve the starter direction
3. propose minimal architecture changes
4. implement incrementally
5. avoid overengineering
6. keep the result reusable
7. keep TypeScript types coherent
8. prefer stable naming over clever naming

---

## Definition of done

A task is complete only if:

- types are coherent
- role access is respected
- UI and logic are separated cleanly
- the result fits the starter architecture
- billing remains optional when relevant
- no needless duplication was introduced
- the change improves future client reuse

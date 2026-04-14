# README-Codex-Pack.md

## Purpose

This Codex pack defines the implementation framework for a reusable **Next.js + TypeScript starter template** built from the official shadcn/ui dashboard starter.

The repository is meant to evolve into a modular product base with:

- reusable dashboard shell
- role-based access
- CRUD foundations
- settings and module activation
- optional Stripe billing
- super-admin platform controls

---

## Core implementation sequence

1. create the project with `create-next-app`
2. initialize `shadcn/ui`
3. import the official `dashboard-01` block
4. refactor the imported dashboard into a reusable starter architecture
5. build phases incrementally

---

## Included files

- `AGENTS.md`
- `Plan.md`
- `Plan-Phase-2.md`
- `Plan-Phase-3.md`
- `Plan-Phase-4.md`
- `Plan-Phase-5.md`
- `Milestones.md`
- `skills/starter-architecture/SKILL.md`
- `skills/dashboard-shadcn/SKILL.md`
- `skills/auth-and-roles/SKILL.md`
- `skills/crud-foundations/SKILL.md`
- `skills/settings-and-config/SKILL.md`
- `skills/stripe-billing/SKILL.md`
- `skills/super-admin-platform/SKILL.md`

---

## Recommended reading order for Codex

1. `AGENTS.md`
2. `Plan.md`
3. `Milestones.md`
4. `Plan-Phase-2.md`
5. `Plan-Phase-3.md`
6. `Plan-Phase-4.md`
7. `Plan-Phase-5.md`
8. the relevant `skills/*/SKILL.md` file(s)

---

## Role model

The project currently uses:

- `super_admin`
- `admin`
- `customer`

This model must remain stable unless a validated business need requires change.

---

## Product layers

### starter-core
- dashboard shell
- auth foundation
- role guards
- settings
- reusable CRUD
- customer portal foundation

### starter-billing
- Stripe integration
- checkout
- portal
- webhooks
- billing UI
- activation rules

---

## Important implementation posture

- do not rebuild the dashboard baseline unnecessarily
- prefer incremental refactoring of the imported starter
- keep TypeScript coherent
- keep the architecture reusable
- keep billing optional
- keep super-admin lean and practical
- avoid overengineering

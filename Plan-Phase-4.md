# Plan-Phase-4.md

## Phase 4 — Stripe billing module

### Goal

Build Stripe as an optional billing module that can be enabled later for a project already using the core starter.

The billing module must extend the starter cleanly without becoming a hard dependency of the dashboard or CRUD foundation.

---

## Business intent

A project owner must be able to start with:

- dashboard
- roles
- settings
- CRUD features

and later activate:

- checkout
- billing portal
- webhooks
- billing-related admin UI

without rearchitecting the project.

---

## Phase 4 deliverables

1. Create the billing feature module structure
2. Implement the Stripe server integration layer
3. Add checkout session flow
4. Add portal session flow
5. Add webhook ingestion
6. Add billing dashboard pages
7. Connect billing behavior to module activation
8. Preserve graceful failure when billing is disabled

---

## Stripe scope

Recommended first scope:

- checkout session flow
- customer billing portal flow
- webhook endpoint
- billing overview page
- billing state in settings
- admin/super-admin visibility rules

---

## Rules

- billing must remain optional
- billing pages must fail gracefully if disabled
- role and module state must both gate access
- Stripe assumptions must not spread across unrelated CRUD features
- keep naming explicit and maintainable

---

## Success criteria

- billing can be turned on without architectural rewrite
- billing can remain off without breaking the app
- admin and super-admin flows are understandable
- Stripe code is isolated and reusable
- the starter now supports real modular monetization

---

## Milestones

### M33 — Billing module scaffold
Create the billing feature folder structure and typed billing state.

### M34 — Stripe service layer
Implement the Stripe helper/service integration layer.

### M35 — Checkout route flow
Implement the starter checkout session flow.

### M36 — Portal route flow
Implement the customer billing portal session flow.

### M37 — Webhook ingestion layer
Implement webhook handling and internal billing event mapping.

### M38 — Billing dashboard UI
Create the billing overview and status UI for enabled projects.

### M39 — Billing activation guard
Ensure billing routes and navigation respect the enabled state.

### M40 — Billing role access audit
Validate `super_admin`, `admin`, and `customer` access boundaries for billing.

### M41 — Billing UX hardening
Handle disabled state, incomplete setup, and admin-facing guidance cleanly.

### M42 — Phase 4 stabilization
Stabilize the billing module as a reusable optional extension.

# Plan-Phase-2.md

## Phase 2 — Reusable CRUD core on top of the dashboard foundation

### Goal

Build the reusable CRUD backbone of the starter template on top of the dashboard base established in phase 1.

This phase must produce patterns that are reusable across many entities without becoming a bloated generic CRUD engine.

---

## Functional intent

The starter must make it easy to add future entities such as:

- users
- customers
- projects
- posts
- products
- bookings
- invoices
- any client-specific business resource

---

## Phase 2 deliverables

1. Define the canonical CRUD feature pattern
2. Create the first real reusable entity flows
3. Add list views, data table conventions, and empty states
4. Add create and edit form conventions
5. Add delete flow conventions
6. Add search, filters, and pagination
7. Make permissions explicit per feature

---

## First reference entities

The recommended reference entities for the starter are:

- `users`
- `customers`

These two entities are enough to validate the CRUD architecture before extending further.

---

## Architecture rules

- reuse patterns, not speculative frameworks
- each feature owns its own:
  - types
  - validation schema
  - model
  - service
  - route/page flow
  - form components
- shared layers are extracted only after repeated concrete usage
- avoid magic CRUD engines
- keep naming explicit

---

## UI expectations

- coherent admin list pages
- stable data table behavior
- consistent create/edit forms
- empty states
- confirmation dialogs
- row actions
- status badges
- reusable feedback patterns

---

## Success criteria

- at least two features use the same CRUD architecture
- CRUD pages are typed and maintainable
- permissions are enforced
- the starter feels reusable and deliberate
- there is no needless duplication

---

## Milestones

### M13 — CRUD architecture design
Define the canonical feature-level CRUD pattern for this starter.

### M14 — Shared table conventions
Implement the reusable table conventions for list pages.

### M15 — Shared form conventions
Implement the reusable form conventions with React Hook Form + Zod.

### M16 — Users feature model
Create the `users` types, schema, model, service, and route foundations.

### M17 — Users CRUD flow
Implement the list, create, edit, read, and delete flow for users.

### M18 — Customers feature model
Create the `customers` types, schema, model, service, and route foundations.

### M19 — Customers CRUD flow
Implement the list, create, edit, read, and delete flow for customers.

### M20 — List behavior hardening
Add search, filters, pagination, and robust empty/loading/error states.

### M21 — CRUD permissions audit
Validate role access and restrictions across admin-facing CRUD features.

### M22 — Phase 2 stabilization
Extract justified reusable patterns, remove duplication, and stabilize the CRUD backbone.

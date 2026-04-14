# Plan.md

## Phase 1 — Foundation from the official shadcn dashboard starter

### Goal

Create the reusable foundation of the starter by using the official dashboard-based UI entry point, then progressively restructuring it into a modular TypeScript project.

This phase is intentionally not a full rebuild from scratch.
It starts from a real dashboard shell and turns it into a reusable starter base.

---

## Implementation baseline

The phase starts from this sequence:

1. create the project with `create-next-app`
2. initialize `shadcn/ui`
3. import the official `dashboard-01` block
4. reorganize and harden the codebase into a reusable architecture

---

## Business target

The starter must support this model:

- `super_admin` manages the platform
- `admin` manages one site/project back-office
- `customer` accesses only a personal dashboard space

---

## Phase 1 deliverables

1. Create the Next.js TypeScript baseline
2. Initialize the shadcn/ui ecosystem
3. Import the official dashboard starter block
4. Audit the imported structure
5. Separate public, admin, super-admin, and customer route spaces
6. Create a reusable dashboard shell strategy
7. Prepare auth foundation
8. Model roles and route protection
9. Add the first settings skeleton
10. Prepare the structured data foundation for Prisma/PostgreSQL later phases

---

## Constraints

- do not rebuild the dashboard UI unnecessarily
- do not add Stripe in this phase
- do not overbuild CRUD abstractions yet
- keep architecture clone-friendly
- keep TypeScript first
- favor real implementation over speculative structure

---

## Success criteria

- a working dashboard starter exists
- the imported dashboard is understood and refactored cleanly
- route groups are separated
- role model exists
- protected areas are planned coherently
- settings entry point exists
- the codebase is ready for reusable CRUD work

---

## Milestones

### M1 — Repository foundation
Create the repository with the correct TypeScript, Tailwind, App Router, `src/`, and alias baseline.

### M2 — shadcn/ui initialization
Initialize shadcn/ui and validate that the project is correctly prepared for component and block imports.

### M3 — Dashboard starter import
Import the official dashboard starter block and verify that the baseline dashboard works.

### M4 — Dashboard audit
Audit the imported dashboard structure, identify reusable parts, and isolate starter-worthy patterns.

### M5 — Layout refactor foundation
Refactor the imported shell into reusable layout primitives without breaking the starter baseline.

### M6 — Route group architecture
Create and separate the route spaces for public, admin, super-admin, and customer areas.

### M7 — Auth foundation
Prepare the authentication architecture and session retrieval foundation.

### M8 — Role model
Model `super_admin`, `admin`, and `customer` in TypeScript and define the access strategy.

### M9 — Protected navigation
Protect route spaces and navigation visibility according to role boundaries.

### M10 — Settings skeleton
Create the first settings area and the typed settings direction for future configuration work.

### M11 — Data layer preparation
Prepare the application for Prisma + PostgreSQL integration in later phases without overcoupling phase 1.

### M12 — Phase 1 stabilization
Clean the starter foundation, naming, route structure, and dashboard shell before CRUD work begins.

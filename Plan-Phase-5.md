# Plan-Phase-5.md

## Phase 5 — Super-admin platform layer and productization

### Goal

Turn the starter into a true reusable platform base by adding the super-admin layer and the minimum productization controls required for real reuse across client projects.

This phase is not about unnecessary multi-tenant complexity.
It is about giving the platform owner the controls that are actually useful.

---

## Business intent

The `super_admin` must be able to:

- view and manage projects
- manage client admin accounts
- activate or deactivate modules
- inspect project setup completeness
- inspect billing activation state
- prepare starter duplication and onboarding patterns

---

## Phase 5 deliverables

1. Create the protected super-admin route area
2. Create the project/site registry concept
3. Build project list and detail pages
4. Add admin account management capabilities
5. Add module activation controls per project
6. Add project status and lifecycle states
7. Add completeness and readiness indicators
8. Validate clone-readiness of the starter

---

## Recommended super-admin capabilities

- view all managed projects
- inspect a specific project
- activate billing for a project
- deactivate modules
- manage project-level admins
- inspect configuration status
- inspect whether a project is clone-ready or still incomplete

---

## Constraints

- do not overbuild tenant complexity if not required
- keep the first version operational and understandable
- focus on controls that the platform owner will actually use
- preserve starter simplicity

---

## Success criteria

- super-admin flows exist
- project-level module control exists
- project-level visibility is coherent
- the starter is closer to a productized platform
- the codebase is easier to reuse for future clients

---

## Milestones

### M43 — Super-admin route architecture
Create the dedicated protected route space for `super_admin`.

### M44 — Project registry model
Create the typed model and service for managed projects/sites.

### M45 — Project list page
Implement the first super-admin project overview page.

### M46 — Project detail page
Implement the project detail and inspection page.

### M47 — Admin account management
Add super-admin controls related to client admin accounts.

### M48 — Module activation controls
Allow super-admin to enable or disable modules such as billing per project.

### M49 — Project status model
Track lifecycle states such as draft, active, billing-enabled, archived.

### M50 — Setup completeness checks
Add visibility into missing configuration and incomplete setup.

### M51 — Clone-readiness audit
Validate that the starter can be reused cleanly for a new client project.

### M52 — Phase 5 final stabilization
Finalize naming, guardrails, architecture, and productization readiness.

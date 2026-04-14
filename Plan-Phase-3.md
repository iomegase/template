# Plan-Phase-3.md

## Phase 3 — Settings, configuration, and module activation

### Goal

Turn the starter into a configurable product base by introducing a proper settings layer, module toggles, and billing activation state.

This phase is what transforms the dashboard + CRUD foundation into a reusable product for multiple client projects.

---

## Business intent

The platform must support:

- configurable project settings
- project-level module visibility
- future billing activation
- dashboard-driven configuration flows
- a clean bridge between technical setup and admin UX

---

## Phase 3 deliverables

1. Create the settings domain model
2. Create settings persistence and validation
3. Build the first admin settings UI
4. Introduce feature toggles / module flags
5. Condition navigation and access by enabled modules
6. Add a billing activation state
7. Prepare the super-admin control surface for later phases
8. Add early customer portal related settings

---

## Important constraint

Configuration must be designed for real admin use.
Even when secure backend handling is required, the overall setup flow must still make sense from the dashboard.

---

## Recommended settings areas

- general project information
- branding basics
- module toggles
- billing enabled state
- customer portal options
- administrative preferences
- setup completeness indicators

---

## Success criteria

- settings are typed and persisted
- module visibility is controlled cleanly
- billing has a clear activation state
- the starter begins behaving like a configurable platform
- super-admin controls can build on this phase later

---

## Milestones

### M23 — Settings domain design
Define the typed settings structure and persistence strategy.

### M24 — Settings service layer
Create read/update services and validation flows for settings.

### M25 — Admin settings UI
Build the project settings interface for the `admin` role.

### M26 — Module toggle system
Introduce explicit module activation and feature flag logic.

### M27 — Navigation conditioning
Show or hide dashboard sections according to role and enabled modules.

### M28 — Billing activation state
Add the billing enabled/disabled state to the settings model and UI.

### M29 — Configuration UX audit
Improve understandability of the admin configuration experience.

### M30 — Super-admin settings hooks
Prepare the settings layer so it can later be supervised by `super_admin`.

### M31 — Customer portal settings
Add the first settings that affect the customer dashboard experience.

### M32 — Phase 3 stabilization
Stabilize settings naming, types, activation logic, and UX behavior.

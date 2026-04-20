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

## Public cible

Ce starter est destiné à un **public féminin et féministe**.

### Principes éditoriaux

- Le ton est **direct, chaleureux et affirmé** — ni condescendant, ni corporate froid.
- Éviter les clichés visuels "féminins" (rose pastel, fleurs, formes molles). L'esthétique est **moderne, élégante et éditoriale**.
- Interface en **français** par défaut.

---

## Design system

### Aesthetic direction — "Coastal Warmth"

A warm editorial dark theme. Precise, intentional, and memorable — not generic AI-generated aesthetics.

### Official color palette

| Hex       | OKLch                    | Role                            |
|-----------|--------------------------|----------------------------------|
| `#FA6900` | oklch(0.67 0.20 46)      | **Primary** — vivid orange       |
| `#F38630` | oklch(0.71 0.155 52)     | Primary alt / chart-5            |
| `#E0E4CC` | oklch(0.91 0.038 113)    | Foreground / cream text          |
| `#A7DBD8` | oklch(0.84 0.053 193)    | Muted foreground / teal soft     |
| `#69D2E7` | oklch(0.80 0.092 207)    | **Accent** — sky blue            |

Background (dark): near-black warm `oklch(0.12 0.006 50)`

### Typography

| Role            | Font            | Notes                                  |
|-----------------|-----------------|----------------------------------------|
| Display/heading | **Fraunces**    | Variable serif (axes: SOFT, WONK). Expressive, editorial. |
| Body/UI         | **DM Sans**     | Clean, slightly geometric. More character than Inter. |
| Mono/data       | **JetBrains Mono** | Labels, badges, code, technical data. |

### Design rules

- **Light mode par défaut** — fond crème `#E0E4CC` (oklch(0.94 0.032 113)). Le dark mode reste disponible via la classe `.dark` mais n'est pas forcé.
- Fonts are loaded via `next/font/google` with CSS variable injection.
- All color tokens use the **OKLch color space** for perceptual uniformity.
- Border radius is `0.5rem` — precise, not rounded-toy.
- Entrance animations use `cubic-bezier(0.16, 1, 0.3, 1)` — elastic ease-out.
- Never use Inter, Roboto, Arial, Space Grotesk, or generic system fonts.
- Never use purple-on-white gradients or generic shadcn default blue.
- Primary accent (#FA6900 orange) is used for key CTAs, active states, decorative lines.
- Sky blue (#69D2E7) is used for secondary accents and atmospheric halos.
- Mono labels follow `text-[11px] font-medium uppercase tracking-[0.22em]` for eyebrows.

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

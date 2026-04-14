# Phase 6 — M53 Booking And Payment Footprint Audit

## Scope

Audit completed against the current starter runtime before introducing the Phase 6 booking funnel.

Reviewed sources:

- `Plan.md`
- `Plan-Phase-2.md`
- `Plan-Phase-4.md`
- `Plan-Phase-5.md`
- `Plan-Phase-6.md`
- `prisma/schema.prisma`
- `src/app/**`
- `src/features/**`
- `package.json`

## Executive Summary

The current repository does **not** contain a booking funnel yet.

There is no public booking entry point such as `/sejour/[slug]`, no offering model, no room model, no booking model, no traveler capture, no post-payment questionnaire flow, no satisfaction workflow, and no email automation layer.

The only payment footprint currently implemented is the optional **project billing** module:

- project-level billing enablement
- admin-triggered Stripe checkout
- Stripe billing portal
- Stripe webhook sync for `ProjectBilling`

This is useful infrastructure, but it is **not** the Phase 6 booking/payment domain.

The practical conclusion for Phase 6 is:

- booking should be treated as a new domain
- current billing must remain isolated as `starter-billing`
- only selected low-level patterns should be reused
- vocabulary normalization is mostly a forward-looking task, not a legacy cleanup in runtime code

## Current Footprint

### Public booking entry points

Current state:

- no `/sejour/[slug]`
- no `/offering/[slug]`
- no public booking routes
- no public room-selection route
- no checkout initiation route for end customers

Relevant app routes currently present:

- `/`
- `/login`
- `/dashboard`
- `/admin/*`
- `/customer/*`
- `/super-admin/*`
- `/api/auth/[...nextauth]`
- `/api/webhooks/stripe`

Conclusion:

- the Phase 6 funnel starts from a clean slate at the routing layer

### Payment footprint

Existing payment implementation is scoped to project billing:

- `src/features/billing/service.ts`
- `src/features/billing/actions.ts`
- `src/features/billing/routes.ts`
- `src/features/billing/types.ts`
- `src/app/admin/billing/page.tsx`
- `src/app/customer/billing/page.tsx`
- `src/app/api/webhooks/stripe/route.ts`

What it does today:

- reads Stripe env state
- creates a Stripe checkout session for a project
- creates a Stripe billing portal session for a project
- syncs `ProjectBilling` from Stripe webhook events
- exposes admin/customer UI around billing readiness

What it does **not** do:

- no booking checkout
- no offering price validation
- no room-based pricing
- no traveler pricing logic
- no installment schedule for bookings
- no booking confirmation flow
- no booking payment metadata model

Conclusion:

- the current Stripe integration is reusable only as an architectural reference
- it should not become the root Phase 6 domain service as-is

### Prisma / structured data footprint

Current schema covers:

- auth users/accounts/sessions
- project registry
- project settings
- project billing

Current schema does **not** cover:

- offering
- offering type
- offering status
- room option
- booking
- booking traveler(s)
- payment schedule / installment data
- health questionnaire
- satisfaction survey
- notification / email log
- audit log for booking state transitions

Conclusion:

- `M54` requires substantial schema work

### Traveler and identity capture footprint

Current reusable identity primitives exist only through:

- `User`
- admin/customer CRUD schemas
- basic email/name/password patterns

There is no booking-specific data capture for:

- main guest address
- postal code / city / country
- phone
- companion traveler details
- emergency / health data

Conclusion:

- traveler capture is mostly greenfield
- form conventions can be reused, not the domain model

### Customer onboarding footprint

Current customer area exists:

- `src/app/customer/page.tsx`
- `src/app/customer/account/page.tsx`
- `src/app/customer/settings/page.tsx`
- `src/app/customer/billing/page.tsx`

Current customer area purpose:

- generic customer portal shell
- account summary
- optional billing self-service

What is missing for Phase 6:

- booking summary
- selected offering / room view
- outstanding balance state
- health questionnaire entry point
- practical trip information
- satisfaction follow-up

Conclusion:

- the customer portal is reusable as a shell
- Phase 6 onboarding content does not exist yet

### Admin operational visibility footprint

Current admin area includes:

- users CRUD
- customers CRUD
- project settings
- billing page
- admin dashboard shell

Missing for Phase 6:

- offering management
- room inventory / pricing management
- booking operations dashboard
- questionnaire status monitoring
- satisfaction monitoring
- resend flows

Conclusion:

- admin architecture is reusable
- booking operations UI is new work

### Email / automation footprint

Current repo state:

- no email provider dependency
- no outbound email service
- no email templates
- no background job / scheduler layer
- no reminder flow

Conclusion:

- confirmation emails, health reminders, and satisfaction follow-up all need a new notification layer

## Vocabulary Normalization Audit

### Canonical decision

Phase 6 canonical root entity must be `offering`.

### Term-by-term classification

| Term | Current runtime state | Decision |
| --- | --- | --- |
| `cession` | No runtime occurrence found | Forbidden. Do not introduce. |
| `session` | Present only in Auth.js session/auth technical contexts and Stripe checkout session contexts | Keep only for auth/Stripe technical meaning. Never use as sellable business entity. |
| `stay` | No current runtime business model. Appears only in plan/prose | Valid only as display label or `offeringType` subtype later. |
| `product` | No current runtime business model. Appears only in plans/prose | Valid only as subtype later, not as root entity. |
| `offering` | No runtime domain implementation yet | Canonical new business root for Phase 6. |
| `booking` | Mentioned in plans only, not implemented | Canonical transaction domain to introduce under `offering`. |

### Ambiguous names requiring protection

The main naming risk is not legacy code; it is future inconsistency during implementation.

Rules to enforce from `M54` onward:

- use `offering` in models, services, schemas, route params, metadata and analytics
- allow `stay` only for subtype-specific UX labels
- never use `session` for the sellable unit
- keep `product` only for subtype specialization
- do not let Stripe metadata or admin labels mix `offering`, `stay`, `product`, and `session` for the same entity

## Audit By Domain Concern

### Availability logic

Current state:

- none

Impact:

- room inventory and booking availability must be created from scratch

### Room logic

Current state:

- none

Impact:

- `RoomOption` is a new Phase 6 domain model

### Pricing logic

Current state:

- pricing exists only as project billing readiness around one Stripe price ID
- no room pricing
- no guest surcharge logic
- no server-side booking total calculator

Impact:

- introduce a dedicated booking pricing service
- do not overload `src/features/billing/service.ts`

### Traveler data capture

Current state:

- no traveler capture
- only generic admin/customer account CRUD

Impact:

- create dedicated booking guest/traveler schemas and secure persistence

### Stripe integration

Current state:

- implemented for project billing only
- webhook route exists and proves the integration pattern

Reusable pieces:

- env handling pattern
- Stripe client initialization pattern
- webhook signature verification pattern
- route wiring pattern

Required refactor:

- extract or duplicate only low-level Stripe helpers into a booking-safe layer
- do not couple booking payment state to `ProjectBilling`

### Confirmation flow

Current state:

- admin billing page supports `?checkout=success|canceled`
- no booking confirmation route or state machine

Impact:

- booking confirmation and post-payment handoff remain new work

### Client onboarding

Current state:

- generic customer dashboard exists
- no booking lifecycle state

Impact:

- Phase 6 onboarding can reuse customer route space and shell
- actual onboarding domain remains to be built

## Reuse Vs Refactor Map

### Reusable as-is or nearly as-is

- dashboard shell and route separation
- Auth.js session and guards
- role-based route protection
- Prisma foundation
- server actions pattern
- React Hook Form + Zod conventions
- admin/customer dashboard shells
- customer portal shell
- billing webhook integration pattern

### Reusable with extraction or adaptation

- Stripe client/bootstrap logic currently embedded in `src/features/billing/service.ts`
- billing route/query-state patterns for success/error handling
- customer portal guards
- project-level settings conventions for later offering module toggles

### Must remain isolated from Phase 6 booking domain

- `ProjectBilling`
- project billing status model
- admin billing page logic
- customer billing self-service page
- billing module activation flags

### Mostly greenfield

- offering domain
- room domain
- booking domain
- traveler domain
- booking pricing engine
- booking payment orchestration
- installment scheduling
- health questionnaire
- satisfaction survey
- email automation
- admin booking operations

## Impacted File Map

### Existing files likely to change

Schema and data layer:

- `prisma/schema.prisma`
- `prisma/seed.ts`

Shared runtime:

- `src/lib/prisma.ts`
- `src/lib/auth.ts`
- `src/features/auth/guards.ts`
- `src/features/navigation/sidebar-config.ts`

Customer shell extension points:

- `src/app/customer/page.tsx`
- `src/app/customer/account/page.tsx`
- `src/app/customer/layout.tsx`

Admin extension points:

- `src/app/admin/page.tsx`
- `src/app/admin/layout.tsx`

Payment integration touchpoints:

- `src/app/api/webhooks/stripe/route.ts`
- `src/features/billing/service.ts`
- `src/features/billing/routes.ts`
- `src/features/billing/types.ts`

### New route spaces expected

Public funnel:

- `src/app/sejour/[slug]/page.tsx`
- `src/app/sejour/[slug]/confirmation/page.tsx`

Customer onboarding:

- `src/app/customer/bookings/[bookingId]/page.tsx`
- `src/app/customer/bookings/[bookingId]/health/page.tsx`
- `src/app/customer/bookings/[bookingId]/survey/page.tsx`

Admin operations:

- `src/app/admin/offerings/*`
- `src/app/admin/bookings/*`

### New feature folders expected

- `src/features/offerings/*`
- `src/features/rooms/*`
- `src/features/bookings/*`
- `src/features/pricing/*`
- `src/features/payments/*`
- `src/features/health-forms/*`
- `src/features/satisfaction/*`
- `src/features/notifications/*`

## Minimal Refactor Strategy

### Strategy principle

Keep `starter-billing` isolated and add the booking funnel as a new domain layer on top of `starter-core`.

### Recommended sequence

1. Introduce canonical Phase 6 schema using `offering` as root.
2. Add room, booking, traveler, payment, and post-payment workflow models.
3. Create a dedicated booking pricing service with server-side total validation.
4. Create a dedicated booking payment service that may reuse low-level Stripe helpers, but not `ProjectBilling`.
5. Add the public `/sejour/[slug]` entry point while keeping `stay` as a display label for `offeringType === "stay"`.
6. Add booking confirmation, then health questionnaire, then onboarding, then satisfaction.
7. Add admin operational visibility only after the booking lifecycle is typed and stable.

### Duplication avoidance rule

Avoid a second generic billing module.

Instead:

- keep project billing for starter subscription/productization concerns
- create a separate booking payment layer for customer purchases
- extract only shared Stripe primitives if repeated use becomes concrete

## Decision For M54

`M54` should be treated as the true start of implementation.

The audit confirms:

- no hidden booking legacy needs migration
- no `/sejour/[slug]` runtime exists yet
- naming cleanup in code is limited
- the main challenge is introducing the right Phase 6 domain boundaries without contaminating the existing billing module

That makes the safest next move:

- schema-first introduction of `offering`, `room`, `booking`, `traveler`, and payment workflow models
- deliberate isolation between booking payments and project billing

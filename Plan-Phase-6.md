# Plan-Phase-6.md

## Phase 6 — Booking funnel, payment, post-payment onboarding, health questionnaire, and post-stay satisfaction

Read `AGENTS.md`, `Plan.md`, `Plan-Phase-2.md`, `Plan-Phase-3.md`, `Plan-Phase-4.md`, and `Plan-Phase-5.md` before making changes.

## Phase objective

Industrialize the full conversion and post-purchase lifecycle around the booking flow.

This phase must cover:

- booking funnel
- room-based pricing
- traveler identity capture
- payment
- payment in full or 2 installments
- payment confirmation
- post-payment health questionnaire
- pre-stay client onboarding
- post-stay satisfaction survey
- admin monitoring
- automation, validation, analytics, and QA

Build this in **TypeScript**, reuse existing architecture whenever possible, and avoid unnecessary duplication.

---

## Global implementation rules

### 1) Canonical vocabulary normalization is mandatory
Clean up all legacy naming in UI, schemas, routes, services, admin, analytics, and payment metadata.

Use a single canonical vocabulary and remove ambiguous or incorrect terms.

#### Canonical mapping
- `cession` → `offering`
- `session` → `offering` at the domain/model layer when it refers to the sellable unit
- `stay` remains allowed only as a **display label** or subtype when the specific offering is a retreat/stay
- `product` remains allowed only as a **subtype** or commerce-specific label, not as the root canonical entity
- `edition`, `bookingSession`, and other ambiguous aliases must be normalized

#### Canonical domain rule
The root sellable business entity must now be:

- `offering`
- `offeringId`
- `offeringSlug`
- `offeringType`
- `offeringStatus`

#### Offering types
At minimum, the model must support a typed specialization pattern such as:

- `stay`
- `product`
- `service`
- `event`

#### Important rule
- root model term = **offering**
- retreat/yoga booking UI may still display **séjour / stay** when the offering type is `stay`
- do not keep `cession` anywhere
- do not use `product` as the universal root term anymore
- do not mix `offering`, `stay`, `product`, `session`, and `edition` for the same concept without a clear boundary

### 2) Booking is centered on the selected offering
The funnel must be modeled around the selected **offering**.

If the selected offering type is `stay`, the user-facing labels may display **séjour**.

Target journey:

`/sejour/[slug]`
→ select offering
→ select room
→ define travelers
→ collect customer identity and address
→ compute pricing
→ choose payment mode
→ pay
→ show confirmation
→ complete health questionnaire
→ access onboarding area
→ complete the experience
→ receive satisfaction survey

### 3) Required customer identity fields
The **main guest** must provide:

- first name
- last name
- address line 1
- postal code
- city
- country
- phone
- email

Optional:
- address line 2

If a companion is added, collect at minimum:

- first name
- last name
- phone
- email

### 4) Pricing is configured per room
The room base price includes the **main guest**.

If a second person stays in the room, apply one of two surcharges:

- companion participates in the yoga retreat → `companionYogaSurcharge`
- companion does not participate in the yoga retreat → `companionNoYogaSurcharge`

Always show a transparent breakdown:

- room base price
- companion surcharge if applicable
- total amount

### 5) Payment modes
Support:

- full payment
- 2x installment payment with no extra fees

For 2x payment:

- first payment = 50% immediately
- second payment = 50% later
- no extra fees
- show:
  - total amount
  - amount due now
  - amount due later
  - due date or due rule

### 6) Payment architecture rule
Themes must remain presentation-only.

Do **not** connect themes directly to Stripe.

Use:

- shared checkout service
- shared pricing service
- shared Stripe integration
- shared webhook handler
- shared booking state update logic

### 7) Health questionnaire rule
A health questionnaire must be completed **after payment confirmation**.

It must be tied to the booking and accessible only through:

- authenticated client access, or
- secure signed link

Treat this as sensitive personal data.

### 8) Satisfaction survey rule
A satisfaction survey must be sent **after the offering ends**.

It must:

- be linked to the booking
- be sent by email automation
- use secure access
- save structured feedback in the database

### 9) Core implementation principles
- use TypeScript everywhere in this phase
- never trust client-side totals
- keep pricing validation on the server
- use Stripe webhook confirmation as payment source of truth
- prevent duplicate bookings and duplicate webhook processing
- reuse existing components and services when possible
- keep the UX premium, simple, and trustworthy
- avoid overengineering

---

## M53 — Audit the complete booking and payment footprint

### Goal
Map the current funnel and define the exact implementation scope.

### Tasks
- audit `/sejour/[slug]` booking entry points
- identify all existing booking/payment components, routes, actions, services, schemas, and emails
- detect every occurrence of:
  - `cession`
  - `session`
  - `stay`
  - `product`
  - `offering`
  - other ambiguous terms
- classify which names must become `offering`, which remain valid as subtypes, and which are display-only labels
- audit current:
  - availability logic
  - room logic
  - pricing logic
  - traveler data capture
  - Stripe integration
  - confirmation flow
  - client onboarding
- produce a file impact map
- define what can be reused vs refactored

### Deliverables
- complete footprint audit
- vocabulary normalization map
- impacted file list
- refactor strategy with minimal duplication

---

## M54 — Stabilize offering, booking, pricing, traveler, and workflow data models

### Goal
Create the stable business foundation for the funnel using `offering` as the canonical root entity.

### Required domain structures

#### Offering
At minimum:
- `id`
- `slug`
- `title`
- `offeringType`
- `startDate`
- `endDate`
- `location`
- `status`
- `isBookable`

#### RoomOption
At minimum:
- `id`
- `offeringId`
- `name`
- `slug`
- `description`
- `capacity`
- `basePrice`
- `currency`
- `includedMainGuest`
- `companionYogaSurcharge`
- `companionNoYogaSurcharge`
- `inventory`
- `isActive`

#### Booking
At minimum:
- `id`
- `bookingReference`
- `offeringId`
- `roomId`
- `status`
  - `pending`
  - `payment_pending`
  - `partially_paid`
  - `paid`
  - `health_form_pending`
  - `ready`
  - `completed`
  - `cancelled`
  - `payment_failed`
  - `refunded`
- `paymentMode`
  - `full`
  - `split_2x`
- `currency`
- `roomBasePrice`
- `hasCompanion`
- `companionType`
  - `with_yoga`
  - `without_yoga`
- `companionSurcharge`
- `totalAmount`
- `firstInstallmentAmount`
- `secondInstallmentAmount`
- `secondInstallmentDueDate`
- `amountPaid`
- `amountRemaining`
- `stripeCheckoutSessionId`
- `stripePaymentIntentId`
- `stripeCustomerId`

#### MainTraveler
- `firstName`
- `lastName`
- `email`
- `phone`
- `addressLine1`
- `addressLine2`
- `postalCode`
- `city`
- `country`

#### CompanionTraveler
- `firstName`
- `lastName`
- `email`
- `phone`
- `participatesInYoga`

#### HealthQuestionnaire
- `id`
- `bookingId`
- `status`
  - `not_started`
  - `in_progress`
  - `submitted`
- `submittedAt`
- `consentAccepted`
- required business questionnaire fields
- audit metadata
- access control metadata

#### SatisfactionSurvey
- `id`
- `bookingId`
- `status`
  - `pending`
  - `sent`
  - `submitted`
- `sentAt`
- `submittedAt`
- `rating`
- `comment`
- `wouldRecommend`
- `testimonialConsent`

### Tasks
- define or refactor TS types around `offering`
- align database schema
- define shared enums
- build shared validation rules
- ensure support for 2x installment fields
- ensure status model supports the full lifecycle
- preserve subtype-aware labels for `stay`, `product`, `service`, and `event`

### Deliverables
- stable schema layer
- stable TS domain types
- shared validation contracts
- normalized workflow states

---

## M55 — Rebuild the booking funnel UX around the offering

### Goal
Create a premium, clear, and reusable booking flow centered on the **offering**.

### Funnel steps

#### Step 1 — Offering selection
Display:
- offering title
- offering type
- dates if applicable
- location if applicable
- status
- availability

If `offeringType === "stay"`, the user-facing label may display **séjour**.

#### Step 2 — Room selection
For each room show:
- room name
- short description
- capacity
- base price
- clear note that the base price includes the main guest

#### Step 3 — Traveler composition
Ask:
- is the main guest traveling alone?
- is a second person staying in the room?

If yes, require:
- companion participates in yoga
- companion does not participate in yoga

#### Step 4 — Main guest details
Required:
- first name
- last name
- address line 1
- postal code
- city
- country
- phone
- email

Optional:
- address line 2

#### Step 5 — Companion details
If a companion exists:
- first name
- last name
- phone
- email
- yoga participation flag

#### Step 6 — Dynamic pricing breakdown
Always show:
- room base price
- companion surcharge if applicable
- total amount

Example:
- Room: 1800 €
- Companion with yoga: +450 €
- Total: 2250 €

#### Step 7 — Payment mode selection
Offer:
- full payment
- 2x installment payment with no extra fees

If 2x is selected, show:
- amount due now
- amount due later
- due date or due rule

#### Step 8 — Final review
Show:
- selected offering
- selected room
- main guest
- companion if applicable
- full pricing breakdown
- payment mode
- amount paid now
- amount due later
- email used
- terms and consent fields

### UX requirements
- premium desktop and mobile layout
- clear validation and error handling
- no ambiguity around pricing, room, or travelers
- reusable funnel state structure
- use `offering` as root concept while preserving subtype-specific display labels

### Deliverables
- full funnel UI
- stable funnel state handling
- server-backed pricing summary
- normalized wording

---

## M56 — Implement centralized Stripe payment flow

### Goal
Implement a reliable payment architecture for full payment and 2x payment, using `offering` as the canonical sellable entity.

### Required architecture
- shared checkout creation endpoint/service
- shared server-side pricing service
- shared Stripe adapter
- secure webhook handler
- shared booking update logic

### Full payment mode
- create checkout for 100% of the total
- mark booking as paid only after verified webhook confirmation

### 2x installment mode
Recommended V1:
- charge 50% immediately
- store 50% as outstanding amount
- compute and store due date / due rule
- support a secure follow-up payment flow for the second installment

### Stripe metadata
Include at minimum:
- booking id
- booking reference
- offering id
- offering slug
- offering type
- room id
- payment mode
- total amount
- amount due now
- amount due later
- main guest email
- main guest first name
- main guest last name

### Security rules
- verify webhook signatures
- enforce idempotency
- prevent duplicate bookings
- prevent duplicate webhook processing
- verify price server-side before checkout creation
- verify received amount before changing booking status

### Deliverables
- centralized Stripe flow
- stable checkout generation
- webhook processing
- booking state updates tied to real payment events

---

## M57 — Build payment confirmation and post-payment onboarding trigger

### Goal
Turn payment success into the start of onboarding.

### Confirmation page must show
- booking success message
- booking reference
- selected offering
- offering subtype label when useful
- selected room
- main guest summary
- companion summary if applicable
- amount paid
- outstanding amount if 2x payment
- next due date if applicable
- next required step

### Main CTA after payment
Primary CTA must point to:
- complete the health questionnaire

### Transactional emails

#### Email 1 — Booking confirmation
Include:
- booking reference
- offering
- room
- main guest
- companion summary if applicable
- payment mode
- total amount
- paid amount
- outstanding amount if applicable
- health questionnaire link
- next steps

#### Email 2 — Health questionnaire reminder
Send if the questionnaire is still incomplete after a defined delay.

### Deliverables
- premium confirmation page
- confirmation email
- health questionnaire reminder email
- clean transition from payment to onboarding

---

## M58 — Implement the post-payment health questionnaire module

### Goal
Create a secure health questionnaire flow available only after successful payment.

### Workflow rules
- questionnaire becomes accessible only after payment confirmation
- booking moves to `health_form_pending` after successful payment
- booking moves to `ready` once the questionnaire is completed and no blockers remain

### Access modes
Support one or both:
- authenticated client area
- secure signed link

### Requirements
- explicit consent
- strict validation
- submission state
- auditable timestamp
- role-based access control
- minimal admin exposure

### Sensitive data rules
- treat the questionnaire as sensitive personal data
- do not expose it broadly in admin
- restrict access by role
- avoid unnecessary duplication
- define retention expectations

### Deliverables
- questionnaire UI
- secure access flow
- booking status integration
- protected persistence
- limited admin visibility

---

## M59 — Build the pre-offering client onboarding area

### Goal
Give the client a useful space between payment and the beginning of the booked offering.

### Client area should allow users to
- view the booking
- view the selected offering
- view the selected room
- see payment status
- see outstanding balance if applicable
- complete the health questionnaire
- see pending actions
- read practical information related to the offering
- access useful documents and messages

### Suggested statuses
- booking confirmed
- health questionnaire pending
- balance pending
- ready
- completed

### Deliverables
- client dashboard / onboarding area
- action checklist block
- status timeline before start

---

## M60 — Implement the post-offering satisfaction workflow

### Goal
Send a satisfaction survey after the offering and save structured feedback.

### Trigger
When the offering end date has passed:
- detect eligible bookings
- send the satisfaction email
- update survey status

### Satisfaction form fields
Recommended minimum:
- global rating
- written review
- what was appreciated
- improvement suggestions
- would recommend yes/no
- testimonial reuse consent

### Satisfaction email
Must include:
- offering reminder
- direct secure link
- short and clear copy

### Survey states
- `pending`
- `sent`
- `submitted`

### Deliverables
- end-of-offering detection logic
- satisfaction email automation
- satisfaction form
- stored feedback linked to booking

---

## M61 — Build admin operational visibility for bookings, health forms, and satisfaction

### Goal
Provide a clear admin view across the whole lifecycle.

### Admin must be able to see
- pending bookings
- paid bookings
- 2x bookings with outstanding balance
- health questionnaire submitted / missing
- completed offerings
- satisfaction survey sent / submitted / missing

### Useful filters
- by offering
- by offering type
- by date
- by payment status
- by health questionnaire status
- by satisfaction survey status

### Useful actions
- resend booking confirmation email
- resend health questionnaire email
- resend satisfaction survey email
- open booking details
- export allowed non-sensitive operational data

### Constraint
Do not broadly expose sensitive health data.

### Deliverables
- admin table views
- booking detail view
- operational filters
- quick actions

---

## M62 — Finish automations, validation, analytics, security, and QA

### Goal
Make the full workflow production-ready and reusable, with `offering` as the canonical business root for future multi-store support.

### Automations
- send booking confirmation email after payment
- unlock or send health questionnaire after payment
- send health questionnaire reminders if incomplete
- send satisfaction survey after offering end
- send satisfaction reminder if needed

### Validation
Validate on client and server:
- first name
- last name
- address
- phone
- email
- room selection
- companion choice
- payment mode
- pricing integrity
- offering identity and subtype consistency

### Analytics
Track at minimum:
- offering CTA click
- funnel start
- room selected
- companion selected
- payment mode selected
- checkout started
- payment succeeded
- health questionnaire submitted
- satisfaction survey submitted

### Security
- protected routes
- signed links where relevant
- input sanitation
- audit logs for important booking/payment transitions
- webhook verification
- role-based admin access

### QA scenarios
Must test at minimum:
- solo booking with full payment
- solo booking with 2x payment
- booking with yoga companion
- booking with non-yoga companion
- successful payment
- failed payment
- health questionnaire sent and submitted
- satisfaction survey sent after the offering
- correct admin status updates
- duplicate webhook protection
- pricing consistency in all supported cases
- vocabulary normalization consistency between `offering` root model and subtype-specific UI labels

### Deliverables
- QA checklist
- end-to-end scenarios
- operational documentation
- reusable booking foundation for future offerings

---

## Expected outcome of Phase 6

By the end of Phase 6, the project must have:

- a booking funnel centered on the **offering**
- normalized legacy vocabulary
- room-based pricing
- companion surcharge logic
- required customer identity capture:
  - first name
  - last name
  - address
  - phone
  - email
- payment options:
  - full payment
  - 2x installment payment with no extra fees
- centralized and secure Stripe integration
- a post-payment health questionnaire
- a pre-start client onboarding area
- a post-offering satisfaction survey
- admin operational visibility
- automation, analytics, validation, security, and QA coverage
- a canonical `offering` model ready for Phase 7 multi-store / multi-theme evolution

---

## Execution instructions for Codex

When implementing this phase:

1. audit first
2. normalize vocabulary before adding more features
3. replace `cession` everywhere with `offering`
4. replace legacy booking `session` naming with `offering` at the domain/model layer
5. keep subtype-specific labels such as `stay` only where they are semantically correct
6. stabilize types and schemas before pushing UI refactors
7. keep payment logic centralized and server-driven
8. never trust client-side totals
9. implement milestone by milestone
10. reuse the design system and architecture from earlier phases
11. avoid overengineering
12. document any still-configurable business rules cleanly

Build a robust, typed, maintainable V1.
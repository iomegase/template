# Skill: Stripe billing module

## Purpose

Use this skill when implementing or refactoring billing features based on Stripe.

---

## Objective

Keep Stripe as an optional module that can be enabled later without forcing billing complexity into the starter core.

---

## Scope

- checkout
- portal
- webhook
- billing state
- settings integration
- admin visibility
- route and navigation guards

---

## Rules

- isolate Stripe logic
- guard billing routes behind role and module checks
- handle disabled state gracefully
- avoid leaking billing assumptions into unrelated CRUD features
- keep the app functional when billing is disabled
- keep billing activation explicit and traceable

---

## Expected outcomes

- optional billing module
- clean activation path
- maintainable Stripe integration
- reusable billing extension for future client projects

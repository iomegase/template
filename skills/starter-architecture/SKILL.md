# Skill: Starter architecture

## Purpose

Use this skill when working on the repository structure, dashboard foundation, route organization, or shared architecture patterns of the starter template.

---

## Core objective

Preserve a modular architecture with a clean separation between:

- dashboard shell
- public area
- admin area
- super-admin area
- customer area
- auth and permissions
- CRUD features
- settings/configuration
- optional billing
- project/productization layer

---

## Baseline assumption

The project starts from an imported shadcn/ui dashboard block.
This skill should help transform that imported base into a reusable long-term architecture.

---

## Rules

- think TypeScript first
- preserve working starter code whenever possible
- refactor incrementally
- prefer feature folders for domain logic
- keep business logic out of purely visual components
- keep route layouts explicit
- keep role boundaries readable
- isolate optional billing
- avoid speculative abstractions
- avoid heavy enterprise structure too early

---

## Expected outcomes

- predictable folder structure
- low coupling
- reusable dashboard foundation
- stable extension points
- easier future cloning for client projects

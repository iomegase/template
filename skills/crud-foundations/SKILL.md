# Skill: Reusable CRUD foundations

## Purpose

Use this skill when creating or refactoring CRUD entities inside the starter template.

---

## Objective

Build reusable CRUD conventions without creating an overengineered generic CRUD framework.

The starter must make it easy to add new entities while keeping code understandable and maintainable.

---

## Recommended feature pattern

Each domain feature should usually own:

- types
- validation schema
- model
- service
- route/page flow
- form component(s)

---

## Rules

- start from real entities, not generic abstractions
- extract shared layers only after repeated usage
- standardize list/create/edit/delete flows
- use Zod for validation
- keep permissions explicit per feature
- keep table conventions stable
- keep forms predictable and reusable
- prefer clarity over cleverness

---

## Expected outcomes

- fast creation of new business entities
- maintainable CRUD code
- stable admin UX patterns
- reusable starter conventions

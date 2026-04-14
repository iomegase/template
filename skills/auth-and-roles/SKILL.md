# Skill: Auth and roles

## Purpose

Use this skill when implementing authentication, sessions, guards, route protection, or permission logic.

---

## Role model

The role model is fixed as:

- `super_admin`
- `admin`
- `customer`

### Meaning
- `super_admin`: platform owner
- `admin`: site owner / paying client with access to their own back-office
- `customer`: end user with access only to their own personal dashboard area

---

## Rules

- centralize role checks
- centralize auth/session access patterns
- keep route space restrictions explicit
- do not duplicate permission logic across features
- do not blur admin and customer access
- keep access rules understandable
- avoid hidden privilege escalation paths

---

## Expected outcomes

- predictable access control
- clean route protection
- stable role-based navigation
- maintainable permission model

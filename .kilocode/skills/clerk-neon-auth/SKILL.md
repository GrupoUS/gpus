---
name: clerk-neon-auth
description: Definitive implementation skill for Clerk + Neon + Stripe multi-tenant RBAC with canonical role dictionary, permission/transition matrices, Neon isolation, Clerk↔Neon sync guarantees, and Stripe lifecycle provisioning.
---

# Clerk + Neon Auth Skill (Phase 2 Canonical)

Implement identity in Clerk, authorization/runtime state in Neon, and billing lifecycle in Stripe.

## Trigger

Use this skill when changing auth, RBAC, multitenancy, subusers, billing entitlements, or webhook provisioning.

## Mandatory References (Read in Order)

1. `references/role-architecture.md`
2. `references/clerk-rbac-patterns.md`
3. `references/neon-data-isolation.md`
4. `references/db-schema-blueprints.md`
5. `references/clerk-neon-sync-contract.md`
6. `references/stripe-webhook-lifecycle.md`
7. `references/stripe-billing.md`
8. `references/cli-vs-mcp-standards.md`

## Canonical Role Dictionary

- `admin`
- `mentorado`
- `clinica_owner`
- `clinica_staff`
- `pending`

No alternate aliases or duplicate role systems are allowed in this skill.

## Canonical Access Targets

- `admin`: full admin panel + Clerk Backend API user CRUD mirrored in frontend + global permission management.
- `mentorado`: full clinic access (CRM/Agenda/Pacientes/Financeiro/Marketing) **plus** mentoria; receives 12-month free billing period and conversion path to `clinica_owner`.
- `clinica_owner`: CRM/Agenda/Pacientes/Financeiro/Marketing; **no** mentorship access.
- `clinica_staff`: subuser linked to owner; agenda/pacientes allowed; financeiro blocked.

## Authority + Precedence Contract

- Clerk is authority for identity and authentication lifecycle.
- Neon is authority for effective app authorization and entitlements.
- Stripe is authority for subscription/payment events.
- Effective state is computed in Neon and then mirrored to Clerk `publicMetadata` for UI readability.
- On conflicts, latest version/timestamp wins; stale updates are ignored and audited.

## Required Deliverables in Implementations

- Canonical role dictionary + permission matrix + transition matrix.
- Robust tenant isolation in Neon.
- Idempotent webhook and sync handling with out-of-order/replay safety.
- Stripe event-to-entitlement provisioning matrix.
- SQL + Prisma schema blueprints with constraints/indexes/subuser links.
- Explicit standards for CLI vs MCP and direct DB vs API usage.

## Anti-Patterns (Forbidden)

- Treating Clerk metadata as sole runtime entitlement source.
- Allowing mentorship access for `clinica_owner` or `clinica_staff`.
- Allowing `clinica_staff` financeiro permission.
- Processing webhooks without deduplication storage.
- Mixing ad-hoc SQL mutations with API writes for same state transition.

## Validation Checklist

- [ ] All 9 docs exist and cross-reference each other.
- [ ] No contradictions across role, billing, isolation, and sync docs.
- [ ] Permission matrix and transition matrix are explicit and consistent.
- [ ] Webhook docs define idempotency + replay + ordering strategy.
- [ ] Schema docs provide SQL and Prisma blueprints with indexes/constraints.


# CLI vs MCP Standards (Canonical)

Defines when to use MCP tools, CLI, direct DB SQL, and provider APIs.

Related docs:
- `../SKILL.md`
- `./db-schema-blueprints.md`
- `./clerk-neon-sync-contract.md`
- `./stripe-webhook-lifecycle.md`

## 1) Decision Table

| Task Type | Preferred Interface | Why |
|---|---|---|
| Clerk user metadata/role ops | Clerk Backend API | authoritative identity API, auditability |
| Stripe customer/subscription ops | Stripe API/webhooks | authoritative billing source |
| Neon schema migration | migration tooling + reviewed SQL | deterministic, versioned |
| Neon operational data inspection | MCP Neon tools | safe introspection and branch workflows |
| Bulk local refactors/docs/scripts | CLI | speed and repeatability |

## 2) Direct DB vs API

### Use API first when
- Identity fields (`email`, Clerk lifecycle, auth data).
- Billing lifecycle changes (subscription status, invoices).
- External source-of-truth data must stay canonical.

### Use direct DB writes when
- Internal projections/materializations.
- Derived entitlements or denormalized query fields.
- Event processing checkpoints/idempotency tables.

## 3) Safe Mutation Order

1. Receive authoritative event/intent from source API.
2. Validate signature/auth.
3. Apply transactional changes in Neon.
4. Update projection metadata back to Clerk (if needed).
5. Record audit + processed event.

## 4) MCP Usage Standards

- Prefer MCP for Neon branch-safe migration workflows and schema diffing.
- Use one migration workflow at a time.
- Validate temp branch effects before apply.
- Never bypass idempotency checks during event replay tests.

## 5) CLI Usage Standards

- Use CLI for formatting, tests, lint, and doc validation scripts.
- Avoid ad-hoc SQL from shell for critical role/billing transitions.
- If emergency SQL is required, include transaction + rollback notes + audit record.

## 6) Anti-Patterns

- Updating Clerk metadata and DB separately without reconciliation key.
- Using CLI SQL as primary path for recurring business transitions.
- Triggering entitlement updates directly from frontend client state.

## 7) Validation Checklist

- [ ] Each state mutation path has one authoritative source.
- [ ] DB writes are transactional and auditable.
- [ ] Projection updates are deterministic and retry-safe.

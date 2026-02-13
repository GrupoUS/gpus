---
name: backend-design
description: Use when implementing, migrating, debugging, or hardening backend features in Bun + Hono + tRPC + Drizzle + Neon + Clerk, including Express-to-Hono phase migrations, webhook reliability, auth/context consistency, and rollback-safe operations.
---

# Backend Design Skill

Provide a single source of truth for backend architecture, operations, and incident response in this stack.

## Purpose

Standardize backend decisions across API design, authentication flow, context composition, database access, external integrations, observability, and rollback safety.

Keep `SKILL.md` procedural. Store deep reference material under [`references/`](references/).

## When to Use

| Trigger | Action |
|---|---|
| Backend feature or refactor | Apply canonical architecture and lifecycle maps |
| Express to Hono migration work | Execute Hono Migration Protocol (Phase 1) |
| Auth, context, role, impersonation issues | Follow auth/context drift runbook |
| Cache inconsistency or stale sessions | Follow cache consistency runbook |
| Webhook reliability, retries, dedup, signatures | Follow webhook loss/retry runbook |
| Database latency or migration regressions | Follow DB runbooks and validation checklist |
| External API instability, timeout, rate limit | Apply external integration resilience patterns |

---

## Content Map

| Reference | Purpose |
|---|---|
| [API Patterns](references/api-patterns.md) | Procedure hierarchy, boundary contracts, Hono-first API standards |
| [Request Lifecycle Maps](references/request-lifecycle.md) | Hono request flow and Express legacy comparison |
| [Database Design](references/database-design.md) | Schema strategy, Drizzle patterns, Neon operational behavior |
| [Infrastructure](references/infrastructure.md) | Session cache, queueing, scheduler constraints, observability |
| [Operational Guardrails](references/operational-guardrails.md) | Resilience, security, rollback, SLO-minded controls |
| [Runbooks](references/runbooks.md) | Incident playbooks for critical backend failures |
| [Debugging Strategy Matrix](references/debugging-matrix.md) | Symptom to cause to diagnostics to fix to prevention |
| [Code Principles](references/code-principles.md) | LEVER, Three-Pass, Do/Don’t, anti-pattern catalog |
| [TypeScript Patterns](references/typescript-patterns.md) | Type-depth fixes and maintainability patterns |
| [Hono Migration Guide](references/hono-migration.md) | Phase 1 migration playbook, patterns, and risk controls |

---

## Canonical Architecture Patterns

Apply this sequence for every backend change:

1. Choose procedure boundary by trust level: `public` → `protected` → `mentorado` → `admin`.
2. Enforce input contract with Zod before business logic.
3. Build context once per request with deterministic auth resolution and request-scoped logger.
4. Route orchestration to service layer for non-trivial logic.
5. Use Drizzle as only SQL access path for application code.
6. Isolate external APIs behind adapters with retries, backoff, and circuit behavior.
7. Emit structured logs and metrics at every trust boundary and failure domain.
8. Validate rollback path before merge for schema and integration changes.

Use detailed maps in [`references/request-lifecycle.md`](references/request-lifecycle.md).

## Hono Migration Protocol (Phase 1)

Use this protocol for Express-to-Hono runtime migration in this repository.

1. Baseline first: run `bun run check` and `bun test server`; record known failures outside backend scope.
2. Migrate skill/runbook references before server implementation changes.
3. Introduce Hono runtime and middleware order: `logger` → `cors` → `secureHeaders` → `clerkMiddleware` → route middleware.
4. Keep endpoint contracts stable: `/api/trpc`, webhook URLs, health checks, OAuth callbacks, SSE path.
5. Migrate context/auth boundaries before migrating webhook and SSE internals.
6. Migrate signature-sensitive webhooks with raw body verification first (Stripe/Clerk/Meta).
7. Keep fast ACK behavior for webhooks and async processing for heavy side effects.
8. Validate SSE connection lifecycle (`open`, `event push`, `close cleanup`) before removing Express dependencies.
9. Remove Express-only dependencies and type imports only after Hono runtime compiles.
10. Validate non-regression with smoke checks and rollback instructions.

### Phase 1 Validation Gates

- `bun run check` passes.
- `bun test server` passes.
- `/health/live` and `/health/ready` return expected status.
- tRPC client still calls `/api/trpc` successfully.
- Stripe/Clerk signature invalid requests return 400.
- SSE client cleanup removes disconnected clients.

### Phase 1 Rollback Rule

- Keep changes in atomic commits per subsystem.
- If gate fails, revert only the last subsystem commit, not the entire migration.
- Preserve data and webhook idempotency behavior during rollback.

## Framework Selection Strategy

| Scenario | Framework | Rationale |
|---|---|---|
| New API endpoints | Hono | Lightweight, Web Standards, better performance |
| New webhooks | Hono | Native Web Request/Response, simpler middleware |
| Existing routes during migration | Hono target | Keep contracts, move runtime incrementally |
| tRPC integration | Hono + @hono/trpc-server | Stable endpoint contract with modern runtime |
| Complex middleware chains | Hono | Prefer built-in middleware and explicit order |

For this project, Hono is the default runtime target.

## Workflow Alignment

Align architecture work with planning workflow in [`/.agent/workflows/plan.md`](../../workflows/plan.md):

- Run research cascade before major design choices: local codebase → docs → synthesis.
- Keep tasks atomic with explicit validation and rollback criteria.
- Gate high-risk changes with incident readiness runbook updates.

## Required Operational Standards

Always include these concerns in backend design and review:

- Session cache dual-write correctness and invalidation reliability.
- In-memory webhook queue failure mode containment.
- Scheduler limits, idempotency, and catch-up semantics.
- Tight Clerk auth and context coupling safeguards.
- Schema sprawl control under LEVER extension-first policy.
- External API rate limiting, timeout budgets, and degraded-mode behavior.

Use runbooks in [`references/runbooks.md`](references/runbooks.md) and matrix in [`references/debugging-matrix.md`](references/debugging-matrix.md).

## Backend Do/Don’t Baseline

Do:

- Prefer extension-first schema evolution and explicit indexing.
- Prefer idempotent writes for webhook and scheduler paths.
- Prefer structured logs with request and actor correlation.
- Prefer bounded retries with jitter and failure classification.

Don’t:

- Don’t add new tables for 1:1 extensions without hard justification.
- Don’t couple router handlers to raw external clients.
- Don’t rely on in-memory-only queues for critical delivery guarantees.
- Don’t merge without failure diagnostics and rollback instructions.

Use full catalog in [`references/code-principles.md`](references/code-principles.md).

## PR Readiness and Hardening

Before approving backend changes, validate:

1. Architecture fit and lifecycle integrity.
2. Failure-mode handling for cache, webhook, DB, and external APIs.
3. Observability coverage: logs, metrics, and actionable alerts.
4. Security controls: auth, authorization, input boundaries, secrets handling.
5. Rollback and data safety for migrations and incident response.

Use full checklist in [`references/operational-guardrails.md`](references/operational-guardrails.md).

## Execution Commands

```bash
bun run check
bun run lint:check
bun test server
bun run db:push
```

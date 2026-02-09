---
name: backend-design
description: Operational backend architecture skill for Bun + Hono + tRPC + Drizzle + Neon + Clerk. Use to design, implement, debug, and harden backend systems with lifecycle maps, runbooks, guardrails, and production-readiness validation.
allowed-tools:
  - run_command
  - mcp_mcp-server-neon_run_sql
  - mcp_mcp-server-neon_list_slow_queries
  - mcp_sequential-thinking_sequentialthinking
---

# Backend Design Skill

Single source of truth for backend architecture, operations, and incident response.

## Overview

Standardize backend decisions across API design, authentication flow, context composition, database access, external integrations, observability, and rollback safety.

Keep `SKILL.md` procedural. Store deep reference material under [`references/`](references/).

## When to Use

| Trigger | Action |
|---|---|
| New backend feature | Apply canonical architecture and lifecycle maps |
| Auth, context, or role issues | Follow auth/context drift runbook |
| Cache inconsistency or stale sessions | Follow cache consistency runbook |
| Webhook reliability concerns | Follow webhook loss/retry runbook |
| Database latency or migration regressions | Follow DB runbooks and validation checklist |
| External API instability or rate limits | Apply external integration resilience patterns |

## Content Map

| Reference | Purpose |
|---|---|
| [API Patterns](references/api-patterns.md) | Procedure hierarchy, boundary contracts, Hono + tRPC standards |
| [Request Lifecycle Maps](references/request-lifecycle.md) | API → auth → context → DB/services → response flow maps |
| [Database Design](references/database-design.md) | Schema strategy, Drizzle patterns, Neon operational behavior |
| [Infrastructure](references/infrastructure.md) | Session cache, queueing, scheduler constraints, observability |
| [Operational Guardrails](references/operational-guardrails.md) | Resilience, security, rollback, SLO-minded controls |
| [Runbooks](references/runbooks.md) | Incident playbooks for critical backend failures |
| [Debugging Strategy Matrix](references/debugging-matrix.md) | Symptom → cause → diagnostics → fix → prevention |
| [Code Principles](references/code-principles.md) | LEVER, Three-Pass, Do/Don't, anti-pattern catalog |
| [TypeScript Patterns](references/typescript-patterns.md) | Type-depth fixes and maintainability patterns |

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

## Stack Architecture

```
┌─────────────────────────────────────────┐
│  Client (React 19 + TanStack Router)    │
│  └─ tRPC Client (~/lib/trpc)           │
└──────────────┬──────────────────────────┘
               │ HTTP /api/trpc/*
┌──────────────▼──────────────────────────┐
│  Hono Server (server/_core/index.ts)    │
│  ├─ Clerk Auth Middleware               │
│  ├─ tRPC Adapter (fetch)                │
│  ├─ Webhook Routes (/asaas, /clerk)     │
│  └─ Scheduler (cron jobs)               │
├─────────────────────────────────────────┤
│  tRPC Router (server/routers.ts)        │
│  ├─ leads, students, users, financial   │
│  ├─ conversations, activities, tasks    │
│  ├─ settings, notifications, tags       │
│  ├─ marketing, enrollments, lgpd        │
│  └─ whatsapp, metrics, customFields     │
├─────────────────────────────────────────┤
│  Drizzle ORM (server/db.ts)             │
│  └─ Neon PostgreSQL (serverless)        │
└─────────────────────────────────────────┘
```

## Quick Reference

| Path | Purpose |
|---|---|
| `server/_core/index.ts` | Hono app entry, middleware, tRPC mount |
| `server/_core/trpc.ts` | tRPC init, procedures, context creation |
| `server/_core/scheduler.ts` | Bun cron jobs |
| `server/routers.ts` | AppRouter aggregation (18 sub-routers) |
| `server/routers/*.ts` | Individual domain routers |
| `server/services/` | Service layer for complex business logic |
| `server/webhooks/` | Webhook handlers (Asaas, Clerk) |
| `server/db.ts` | Drizzle + Neon singleton |
| `server/lib/` | Shared validators and utilities |

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

## Do / Don't

**Do:**
- Prefer extension-first schema evolution and explicit indexing.
- Prefer idempotent writes for webhook and scheduler paths.
- Prefer structured logs with request and actor correlation.
- Prefer bounded retries with jitter and failure classification.

**Don't:**
- Don't add new tables for 1:1 extensions without hard justification.
- Don't couple router handlers to raw external clients.
- Don't rely on in-memory-only queues for critical delivery guarantees.
- Don't merge without failure diagnostics and rollback instructions.

Use full catalog in [`references/code-principles.md`](references/code-principles.md).

## PR Readiness

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
bun run test
bun run db:push
```

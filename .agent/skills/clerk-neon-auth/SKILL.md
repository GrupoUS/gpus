---
name: clerk-neon-auth
description: Use when implementing auth, RBAC, multitenancy, database schema design, Drizzle ORM queries, Neon PostgreSQL operations, billing entitlements, webhook provisioning, schema migrations, or debugging database/auth sync issues. Use ESPECIALLY when adding new tables, modifying schema, writing complex queries, or troubleshooting Clerk↔Neon sync failures.
---

# Clerk + Neon + Drizzle Database Expert

Definitive implementation skill for the full data layer: Clerk identity, Neon PostgreSQL, Drizzle ORM, and Stripe billing.

## When to Use

| Trigger | Action |
|---------|--------|
| New table or column | Follow schema conventions + extension-first scoring |
| Auth/RBAC change | Apply role architecture + permission matrix |
| Drizzle query pattern | Follow query standards + tenant isolation |
| Neon driver/connection issue | Apply driver selection + connection patterns |
| Schema migration | Follow migration safety model |
| Webhook sync failure | Follow sync contract + idempotency rules |
| Billing entitlement change | Follow Stripe lifecycle provisioning |

## Content Map

| Reference | Purpose |
|-----------|---------|
| [Drizzle + Neon Patterns](references/drizzle-neon-patterns.md) | Driver setup, connection, schema, queries, migrations |
| [Schema Conventions](references/schema-conventions.md) | Project-specific naming, patterns, table inventory |
| [DB Schema Blueprints](references/db-schema-blueprints.md) | SQL + Drizzle ORM blueprints for auth/billing tables |
| [Role Architecture](references/role-architecture.md) | Canonical role dictionary + permission matrix |
| [Clerk RBAC Patterns](references/clerk-rbac-patterns.md) | Clerk middleware, metadata, token patterns |
| [Neon Data Isolation](references/neon-data-isolation.md) | Tenant filtering, staff guardrails, Drizzle examples |
| [Clerk↔Neon Sync Contract](references/clerk-neon-sync-contract.md) | Ownership, precedence, consistency guarantees |
| [Stripe Webhook Lifecycle](references/stripe-webhook-lifecycle.md) | Event processing, idempotency, provisioning |
| [Stripe Billing](references/stripe-billing.md) | Plans, subscription lifecycle, entitlements |
| [CLI vs MCP Standards](references/cli-vs-mcp-standards.md) | When to use CLI vs MCP for DB operations |

## Canonical Role Dictionary

| Role | Access | Tenant |
|------|--------|--------|
| `admin` | Full admin panel + user CRUD + global permissions | Cross-tenant |
| `mentor` | Admin routes + mentorado impersonation | Cross-tenant |
| `mentorado` | Full clinic (CRM/Agenda/Pacientes/Financeiro/Marketing) + mentoria | Own data |
| `clinica_owner` | CRM/Agenda/Pacientes/Financeiro/Marketing, no mentorship | Own tenant |
| `clinica_staff` | Agenda/Pacientes only, no financeiro | Owner's tenant |
| `pending` | Onboarding only | None |

No alternate aliases or duplicate role systems allowed.

## Authority + Precedence Contract

- **Clerk** → Identity + authentication lifecycle
- **Neon** → Effective app authorization + entitlements (source of truth)
- **Stripe** → Subscription/payment events
- Effective state computed in Neon, projected to Clerk `publicMetadata` for UI
- On conflicts: latest revision/timestamp wins; stale updates ignored + audited

## Drizzle ORM Quick Reference

```typescript
// ── Connection (neon-http, stateless) ──
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema: { ...schema, ...relations } });

// ── Table definition ──
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: varchar("clerk_id", { length: 64 }).notNull().unique(),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("users_clerk_id_idx").on(table.clerkId),
]);

// ── Type exports (ALWAYS) ──
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Conflict-aware upsert ──
await db.insert(users).values(data)
  .onConflictDoUpdate({ target: users.clerkId, set: { ...updates } });

// ── Select specific columns ──
const result = await db.select({ id: users.id, name: users.name })
  .from(users).where(eq(users.clerkId, clerkId));
```

> Full patterns: [`references/drizzle-neon-patterns.md`](references/drizzle-neon-patterns.md)

## Schema Strategy

### Extension-First Scoring

| Factor | Points |
|--------|--------|
| Reuses existing table indexes/queries | +3 |
| Reuses existing data structure | +3 |
| Reuses > 70% of existing code | +5 |
| Would create circular dependencies | -5 |
| Distinct domain entity | -3 |

**Score > 5 → Extend existing table. Score ≤ 5 → New table justified.**

### Mandatory Rules

- Every FK MUST have a corresponding index
- Every table MUST export `Type` + `InsertType`
- Every tenant table MUST carry `mentoradoId` for data isolation
- Enums: `camelCase` export, `snake_case` DB name
- Timestamps: `createdAt`/`updatedAt` with `.defaultNow().notNull()`
- Soft deletes: `ativo` enum column, never physical deletes

> Full conventions: [`references/schema-conventions.md`](references/schema-conventions.md)

## Do / Don't

| ✅ Do | ❌ Don't |
|-------|---------|
| Use `neon-http` driver for stateless queries | Use `neon-serverless` without WS for transactions |
| Specify exact columns in selects | Use `db.select().from(table)` (SELECT *) |
| Add FK index on every foreign key | Create FK without index |
| Use `onConflictDoUpdate` for webhook sync | Assume exactly-once delivery |
| Export `Type` + `InsertType` for every table | Skip type exports |
| Keep relations in `relations.ts` | Mix relations into `schema.ts` |
| `Promise.all` for batch inserts | Sequential inserts in loops |
| Use `bun run db:push` in dev | Write manual SQL migrations |

## Anti-Patterns (Forbidden)

- Treating Clerk metadata as sole runtime entitlement source
- Processing webhooks without deduplication storage
- Creating 1:1 satellite tables without extension-first score justification
- Mixing ad-hoc SQL mutations with API writes for same state transition
- Omitting tenant filter in non-admin endpoints
- Using `z.any()` or untyped database inputs

## Validation Checklist

- [ ] All references exist and cross-reference correctly
- [ ] No Prisma references remain (project uses Drizzle ORM)
- [ ] Permission/transition matrices are explicit and consistent
- [ ] Webhook docs define idempotency + replay + ordering strategy
- [ ] Schema blueprints use Drizzle ORM with proper indexes
- [ ] Every new table follows extension-first scoring
- [ ] Driver selection matches use case (HTTP vs WebSocket)

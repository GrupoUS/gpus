# Drizzle ORM + Neon PostgreSQL Patterns

Operational patterns for Drizzle ORM with Neon serverless PostgreSQL.

Related docs:
- `../SKILL.md`
- `./schema-conventions.md`
- `./db-schema-blueprints.md`

## 1) Driver Selection

| Driver | Import | Use Case | Transactions |
|--------|--------|----------|-------------|
| `neon-http` | `drizzle-orm/neon-http` | Stateless single queries, API handlers | ❌ No interactive |
| `neon-serverless` | `drizzle-orm/neon-serverless` | Interactive transactions, complex ops | ✅ With WebSocket |

### This Project: `neon-http`

The project uses `neon-http` — optimized for serverless, stateless request-response cycles:

```typescript
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../drizzle/schema";
import * as relations from "../drizzle/relations";

// Enable connection caching for performance
neonConfig.fetchConnectionCache = true;

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, {
  schema: { ...schema, ...relations },
  logger: process.env.NODE_ENV === "development",
});
```

### Operational Implications

- No persistent connections — each query is an independent HTTP request
- No interactive transactions — use single-statement transactions or batch
- Connection caching via `fetchConnectionCache` reduces latency
- Ideal for serverless/edge deployments
- Prefer idempotent writes and conflict-aware upserts

### When to Switch to `neon-serverless`

Only if you need interactive multi-statement transactions with BEGIN/COMMIT:

```typescript
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

const db = drizzle({
  connection: process.env.DATABASE_URL!,
  ws: ws, // Required in Node.js
});

// Now supports interactive transactions
await db.transaction(async (tx) => {
  await tx.insert(users).values(userData);
  await tx.insert(mentorados).values(mentoradoData);
});
```

## 2) Schema Definition Patterns

### Table with Indexes

```typescript
import { pgTable, serial, varchar, integer, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";

export const leads = pgTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    nome: text("nome").notNull(),
    status: statusLeadEnum("status").notNull().default("novo"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("leads_mentorado_idx").on(table.mentoradoId),
    index("leads_status_idx").on(table.status),
    index("leads_mentorado_status_idx").on(table.mentoradoId, table.status),
  ]
);

// ALWAYS export types
export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
```

### Enum Definition

```typescript
export const statusLeadEnum = pgEnum("status_lead", [
  "novo", "primeiro_contato", "qualificado",
  "proposta", "negociacao", "fechado", "perdido",
]);
```

### Relations (Separate File)

```typescript
// drizzle/relations.ts
import { relations } from "drizzle-orm";
import { leads, mentorados, interacoes } from "./schema";

export const leadsRelations = relations(leads, ({ one, many }) => ({
  mentorado: one(mentorados, {
    fields: [leads.mentoradoId],
    references: [mentorados.id],
  }),
  interacoes: many(interacoes),
}));
```

## 3) Query Patterns

### Select Specific Columns (ALWAYS)

```typescript
// ✅ Correct — specify columns
const result = await db.select({
  id: users.id,
  name: users.name,
  email: users.email,
}).from(users).where(eq(users.clerkId, clerkId));

// ❌ Wrong — SELECT *
const result = await db.select().from(users);
```

### Conflict-Aware Upsert (Clerk/Webhook Sync)

```typescript
await db.insert(users)
  .values({
    clerkId: clerkUserId,
    email,
    name,
    role: "user",
    lastSignedIn: new Date(),
  })
  .onConflictDoUpdate({
    target: users.clerkId,
    set: {
      email,
      name,
      lastSignedIn: new Date(),
    },
  });
```

### Batch Operations

```typescript
// ✅ Parallel writes
await Promise.all([
  db.insert(metricas).values(metricasData),
  db.insert(feedbacks).values(feedbackData),
]);

// ❌ Sequential in loop
for (const item of items) {
  await db.insert(table).values(item); // N+1 HTTP requests!
}
```

### Filtering with Operators

```typescript
import { eq, and, or, gte, desc, sql } from "drizzle-orm";

// Composite filter
const result = await db.select()
  .from(metricasMensais)
  .where(and(
    eq(metricasMensais.mentoradoId, mentoradoId),
    eq(metricasMensais.ano, 2025),
    gte(metricasMensais.mes, 1),
  ))
  .orderBy(desc(metricasMensais.mes));
```

### Aggregate Queries

```typescript
import { count, sum, avg } from "drizzle-orm";

const stats = await db.select({
  total: count(),
  totalRevenue: sum(metricasMensais.faturamento),
  avgLeads: avg(metricasMensais.leads),
}).from(metricasMensais)
  .where(eq(metricasMensais.mentoradoId, mentoradoId));
```

## 4) Index Patterns

### Standard FK Index

```typescript
// Every FK MUST have an index
(table) => [
  index("metricas_mentorado_idx").on(table.mentoradoId),
]
```

### Composite Unique (Period-Based)

```typescript
// Unique per mentorado per month
(table) => [
  uniqueIndex("metricas_mentorado_periodo_idx")
    .on(table.mentoradoId, table.ano, table.mes),
]
```

### Multi-Column for Query Optimization

```typescript
// Composite for common query patterns
(table) => [
  index("ranking_turma_periodo_idx")
    .on(table.turma, table.ano, table.mes),
  index("ranking_posicao_idx")
    .on(table.turma, table.ano, table.mes, table.posicao),
]
```

## 5) Migration Workflow

### Development

```bash
# Push schema directly (no migration files)
bun run db:push
```

### Production

```bash
# Generate SQL migration files
bunx drizzle-kit generate

# Apply migrations programmatically
import { migrate } from "drizzle-orm/neon-http/migrator";
await migrate(db, { migrationsFolder: "drizzle" });
```

### Configuration

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: ["./drizzle/schema.ts", "./drizzle/schema-marketing.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
  verbose: true,
  strict: true,
});
```

## 6) Common Mistakes

| Mistake | Impact | Fix |
|---------|--------|-----|
| `db.select().from(table)` | Fetches all columns, wastes bandwidth | Specify columns |
| FK without index | Slow joins and cascading deletes | Always add `index()` |
| Sequential inserts in loop | N HTTP requests instead of 1 | Use `Promise.all` |
| Using `neon-serverless` without WS | Silent failures on transactions | Install `ws` package |
| Forgetting type exports | No type safety downstream | Always export `Type` + `InsertType` |
| Relations in schema.ts | File grows unmanageable | Keep in `relations.ts` |
| Manual SQL in dev | Drift from Drizzle schema | Use `bun run db:push` |
| Missing `defaultNow()` on timestamps | NULL timestamps | Always add `.defaultNow().notNull()` |

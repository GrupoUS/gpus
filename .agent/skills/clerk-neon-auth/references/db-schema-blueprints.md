# Database Schema Blueprints

Canonical SQL + Drizzle ORM blueprints for auth, billing, and tenant tables.

Related docs:
- `../SKILL.md`
- `./drizzle-neon-patterns.md`
- `./schema-conventions.md`

---

## 1) Core User Table (Clerk-Backed)

### SQL

```sql
CREATE TYPE role AS ENUM ('user', 'admin', 'mentor');
CREATE TYPE billing_plan AS ENUM ('none', 'basic_193', 'pro_433', 'mentorado_neon');
CREATE TYPE billing_status AS ENUM ('none', 'trialing', 'active', 'past_due', 'unpaid', 'canceled', 'incomplete');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  clerk_id VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  image_url TEXT,
  login_method VARCHAR(64),
  role role NOT NULL DEFAULT 'user',

  -- Billing (Stripe)
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  billing_plan billing_plan NOT NULL DEFAULT 'none',
  billing_status billing_status NOT NULL DEFAULT 'none',
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_signed_in TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_clerk_id_idx ON users (clerk_id);
CREATE INDEX users_email_idx ON users (email);
CREATE INDEX users_stripe_customer_id_idx ON users (stripe_customer_id);
```

### Drizzle ORM

```typescript
export const roleEnum = pgEnum("role", ["user", "admin", "mentor"]);
export const billingPlanEnum = pgEnum("billing_plan", ["none", "basic_193", "pro_433", "mentorado_neon"]);
export const billingStatusEnum = pgEnum("billing_status", ["none", "trialing", "active", "past_due", "unpaid", "canceled", "incomplete"]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    clerkId: varchar("clerk_id", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    imageUrl: text("image_url"),
    loginMethod: varchar("login_method", { length: 64 }),
    role: roleEnum("role").default("user").notNull(),

    // Billing (Stripe)
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
    billingPlan: billingPlanEnum("billing_plan").default("none").notNull(),
    billingStatus: billingStatusEnum("billing_status").default("none").notNull(),
    trialEndsAt: timestamp("trial_ends_at"),
    currentPeriodEnd: timestamp("current_period_end"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_clerk_id_idx").on(table.clerkId),
    index("users_email_idx").on(table.email),
    index("users_stripe_customer_id_idx").on(table.stripeCustomerId),
  ]
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
```

---

## 2) Tenant Profile Table (Mentorado)

### SQL

```sql
CREATE TYPE turma AS ENUM ('neon');
CREATE TYPE ativo AS ENUM ('sim', 'nao');
CREATE TYPE sim_nao AS ENUM ('sim', 'nao');

CREATE TABLE mentorados (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  nome_completo VARCHAR(255) NOT NULL,
  email VARCHAR(320),
  foto_url VARCHAR(500),
  turma turma NOT NULL,
  meta_faturamento INTEGER NOT NULL DEFAULT 16000,
  ativo ativo NOT NULL DEFAULT 'sim',
  onboarding_completed sim_nao NOT NULL DEFAULT 'nao',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX mentorados_user_id_idx ON mentorados (user_id);
CREATE UNIQUE INDEX mentorados_user_id_unique_idx ON mentorados (user_id);
CREATE INDEX mentorados_email_idx ON mentorados (email);
CREATE INDEX mentorados_turma_ativo_idx ON mentorados (turma, ativo);
```

### Drizzle ORM

```typescript
export const mentorados = pgTable(
  "mentorados",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    nomeCompleto: varchar("nome_completo", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }),
    fotoUrl: varchar("foto_url", { length: 500 }),
    turma: turmaEnum("turma").notNull(),
    metaFaturamento: integer("meta_faturamento").notNull().default(16000),
    ativo: ativoEnum("ativo").default("sim").notNull(),
    onboardingCompleted: simNaoEnum("onboarding_completed").default("nao").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("mentorados_user_id_idx").on(table.userId),
    uniqueIndex("mentorados_user_id_unique_idx").on(table.userId),
    index("mentorados_email_idx").on(table.email),
    index("mentorados_turma_ativo_idx").on(table.turma, table.ativo),
  ]
);

export type Mentorado = typeof mentorados.$inferSelect;
export type InsertMentorado = typeof mentorados.$inferInsert;
```

---

## 3) Period-Based Data (Monthly Metrics)

### SQL

```sql
CREATE TABLE metricas_mensais (
  id SERIAL PRIMARY KEY,
  mentorado_id INTEGER NOT NULL REFERENCES mentorados(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  faturamento INTEGER NOT NULL DEFAULT 0,
  lucro INTEGER NOT NULL DEFAULT 0,
  posts_feed INTEGER NOT NULL DEFAULT 0,
  stories INTEGER NOT NULL DEFAULT 0,
  leads INTEGER NOT NULL DEFAULT 0,
  procedimentos INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX metricas_mentorado_idx ON metricas_mensais (mentorado_id);
CREATE UNIQUE INDEX metricas_mentorado_periodo_idx ON metricas_mensais (mentorado_id, ano, mes);
CREATE INDEX metricas_periodo_idx ON metricas_mensais (ano, mes);
```

### Drizzle ORM

```typescript
export const metricasMensais = pgTable(
  "metricas_mensais",
  {
    id: serial("id").primaryKey(),
    mentoradoId: integer("mentorado_id")
      .notNull()
      .references(() => mentorados.id, { onDelete: "cascade" }),
    ano: integer("ano").notNull(),
    mes: integer("mes").notNull(),
    faturamento: integer("faturamento").notNull().default(0),
    lucro: integer("lucro").notNull().default(0),
    postsFeed: integer("posts_feed").notNull().default(0),
    stories: integer("stories").notNull().default(0),
    leads: integer("leads").notNull().default(0),
    procedimentos: integer("procedimentos").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("metricas_mentorado_idx").on(table.mentoradoId),
    uniqueIndex("metricas_mentorado_periodo_idx")
      .on(table.mentoradoId, table.ano, table.mes),
    index("metricas_periodo_idx").on(table.ano, table.mes),
  ]
);

export type MetricaMensal = typeof metricasMensais.$inferSelect;
export type InsertMetricaMensal = typeof metricasMensais.$inferInsert;
```

---

## 4) Webhook Idempotency Table

### SQL

```sql
CREATE TABLE webhook_events (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(128) NOT NULL UNIQUE,
  source VARCHAR(32) NOT NULL,  -- 'clerk', 'stripe', 'asaas'
  event_type VARCHAR(128) NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB
);

CREATE UNIQUE INDEX webhook_events_event_id_idx ON webhook_events (event_id);
CREATE INDEX webhook_events_source_idx ON webhook_events (source);
```

### Drizzle ORM

```typescript
export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: serial("id").primaryKey(),
    eventId: varchar("event_id", { length: 128 }).notNull().unique(),
    source: varchar("source", { length: 32 }).notNull(),
    eventType: varchar("event_type", { length: 128 }).notNull(),
    processedAt: timestamp("processed_at").defaultNow().notNull(),
    payload: jsonb("payload"),
  },
  (table) => [
    uniqueIndex("webhook_events_event_id_idx").on(table.eventId),
    index("webhook_events_source_idx").on(table.source),
  ]
);
```

### Usage: Deduplication Guard

```typescript
async function processWebhook(eventId: string, source: string, type: string, handler: () => Promise<void>) {
  // Check if already processed
  const existing = await db.select({ id: webhookEvents.id })
    .from(webhookEvents)
    .where(eq(webhookEvents.eventId, eventId))
    .limit(1);

  if (existing.length > 0) return; // Already processed

  await handler();

  // Mark as processed
  await db.insert(webhookEvents).values({
    eventId, source, eventType: type,
  }).onConflictDoNothing();
}
```

---

## 5) Relations

```typescript
// drizzle/relations.ts
import { relations } from "drizzle-orm";

export const usersRelations = relations(users, ({ one }) => ({
  mentorado: one(mentorados, {
    fields: [users.id],
    references: [mentorados.userId],
  }),
}));

export const mentoradosRelations = relations(mentorados, ({ one, many }) => ({
  user: one(users, {
    fields: [mentorados.userId],
    references: [users.id],
  }),
  metricas: many(metricasMensais),
  feedbacks: many(feedbacks),
  leads: many(leads),
}));
```

---

## Upsert Pattern (Clerk → Neon Sync)

```typescript
export async function upsertUserFromClerk(clerkUserId: string, clerkUser?: ClerkUserData) {
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null;
  const name = clerkUser?.fullName ?? clerkUser?.firstName ?? null;

  const values: InsertUser = {
    clerkId: clerkUserId,
    email,
    name,
    role: "user",
    lastSignedIn: new Date(),
  };

  await db.insert(users).values(values)
    .onConflictDoUpdate({
      target: users.clerkId,
      set: {
        email: values.email,
        name: values.name,
        lastSignedIn: values.lastSignedIn,
      },
    });

  return await getUserByClerkId(clerkUserId);
}
```

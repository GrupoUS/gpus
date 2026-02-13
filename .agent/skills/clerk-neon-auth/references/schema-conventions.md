# Project Schema Conventions

Project-specific patterns extracted from `drizzle/schema.ts` (~2087 lines, 35+ tables).

Related docs:
- `../SKILL.md`
- `./drizzle-neon-patterns.md`
- `./db-schema-blueprints.md`

## 1) File Organization

| File | Purpose |
|------|---------|
| `drizzle/schema.ts` | Primary schema (enums + tables + type exports) |
| `drizzle/schema-marketing.ts` | Marketing domain tables |
| `drizzle/relations.ts` | Drizzle relation definitions |
| `drizzle.config.ts` | Drizzle Kit configuration |
| `server/db.ts` | Database singleton + shared queries |

## 2) Naming Conventions

### Tables

| Convention | Example |
|-----------|---------|
| DB name: `snake_case` | `"metricas_mensais"` |
| TS export: `camelCase` | `metricasMensais` |
| Type export: `PascalCase` | `MetricaMensal` |
| Insert type: `Insert` + PascalCase | `InsertMetricaMensal` |

### Enums

| Convention | Example |
|-----------|---------|
| DB name: `snake_case` | `pgEnum("status_lead", [...])` |
| TS export: `camelCase` + `Enum` suffix | `statusLeadEnum` |
| Values: `snake_case` | `"primeiro_contato"` |

### Columns

| Convention | Example |
|-----------|---------|
| DB name: `snake_case` | `"mentorado_id"` |
| TS name: `camelCase` | `mentoradoId` |
| FK convention: `[entity]Id` → `"[entity]_id"` | `userId` → `"user_id"` |

### Indexes

| Convention | Example |
|-----------|---------|
| Pattern: `[table]_[columns]_idx` | `"leads_mentorado_status_idx"` |
| Unique: `[table]_[columns]_unique_idx` | `"metricas_mentorado_periodo_idx"` |
| FK index: `[table]_[fk_column]_idx` | `"leads_mentorado_idx"` |

## 3) Standard Column Templates

### Timestamps (Required on every table)

```typescript
createdAt: timestamp("created_at").defaultNow().notNull(),
updatedAt: timestamp("updated_at").defaultNow().notNull(),
```

### Foreign Key with Cascade

```typescript
mentoradoId: integer("mentorado_id")
  .notNull()
  .references(() => mentorados.id, { onDelete: "cascade" }),
```

### Foreign Key with Set Null (Optional Link)

```typescript
userId: integer("user_id")
  .references(() => users.id, { onDelete: "set null" }),
```

### Soft Delete

```typescript
ativo: ativoEnum("ativo").default("sim").notNull(),
// or
ativo: simNaoEnum("ativo").default("sim").notNull(),
```

### Boolean-like via Enum

The project uses `simNaoEnum("sim_nao", ["sim", "nao"])` instead of `boolean` for many toggles:

```typescript
lida: simNaoEnum("lida").default("nao").notNull(),
instagramConnected: simNaoEnum("instagram_connected").default("nao"),
```

### Text Array

```typescript
tags: text("tags").array(),
```

### JSON Storage

```typescript
config: jsonb("config"), // Prefer jsonb over json
```

## 4) Extension-First Scoring Matrix

Before creating a new table:

| Factor | Points |
|--------|--------|
| Reuses existing table's indexes/queries | +3 |
| Reuses existing data structure | +3 |
| Reuses > 70% of existing code paths | +5 |
| Would create circular dependencies | -5 |
| Distinct domain entity with own lifecycle | -3 |

**Score > 5 → Add columns to existing table.**
**Score ≤ 5 → New table justified.**

### Decision Examples

| Need | Score | Decision |
|------|-------|----------|
| Add Instagram fields to mentorado | +3+3+5 = 11 | ✅ Extend `mentorados` |
| Patient medical history | -3-5 = -5 | ✅ New table `pacientes_info_medica` |
| User billing fields | +3+3+5 = 11 | ✅ Extend `users` table |
| WhatsApp message log | -3 = -3 | ✅ New table `whatsapp_messages` |

## 5) Table Inventory by Domain

### Core Identity & Billing

| Table | FK | Purpose |
|-------|-----|---------|
| `users` | — | Clerk-backed auth + Stripe billing |
| `mentorados` | → users | Extended mentee profiles |

### Performance & Gamification

| Table | FK | Purpose |
|-------|-----|---------|
| `metricas_mensais` | → mentorados | Monthly performance data |
| `feedbacks` | → mentorados | Mentor feedback per month |
| `badges` | — | Achievement definitions |
| `mentorado_badges` | → mentorados, → badges | Earned badges |
| `ranking_mensal` | → mentorados | Monthly rankings |
| `metas_progressivas` | → mentorados | Progressive goals |

### CRM

| Table | FK | Purpose |
|-------|-----|---------|
| `leads` | → mentorados | CRM lead management |
| `interacoes` | → leads, → mentorados | Lead interactions |
| `crm_column_config` | → mentorados | Custom Kanban columns |
| `tasks` | → mentorados | Task checklists |

### Patient Management

| Table | FK | Purpose |
|-------|-----|---------|
| `pacientes` | → mentorados | Patient records |
| `pacientes_info_medica` | → pacientes | Medical info |
| `pacientes_procedimentos` | → pacientes | Treatment records |
| `pacientes_fotos` | → pacientes | Photo gallery |
| `pacientes_documentos` | → pacientes | Document mgmt |
| `pacientes_chat_ia` | → pacientes | AI chat per patient |
| `planos_tratamento` | → pacientes | Treatment plans |
| `pacientes_consentimentos` | → pacientes | Consent tracking |

### Financial

| Table | FK | Purpose |
|-------|-----|---------|
| `categorias_financeiras` | → mentorados | Expense/income categories |
| `formas_pagamento` | → mentorados | Payment methods |
| `transacoes` | → mentorados | Financial transactions |
| `insumos` | → mentorados | Supplies/materials |
| `procedimentos` | → mentorados | Service catalog |

### Integrations

| Table | FK | Purpose |
|-------|-----|---------|
| `whatsapp_messages` | → mentorados | WhatsApp message history |
| `whatsapp_contacts` | → mentorados | WhatsApp contacts |
| `instagram_tokens` | → mentorados | Instagram OAuth |
| `instagram_sync_log` | → mentorados | Sync audit trail |
| `facebook_ads_*` | → mentorados | Facebook Ads data |
| `google_tokens` | → users | Google Calendar OAuth |

## 6) Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|------|
| Create 1:1 table for 2-3 fields | Extend existing table |
| Use `boolean` for toggles | Use `simNaoEnum` (project convention) |
| Skip FK index | Always add corresponding `index()` |
| Skip type exports | Always export `Type` + `InsertType` |
| Use inconsistent timestamp names | Always `createdAt`/`updatedAt` |
| Edit `relations.ts` without `schema.ts` | Keep both in sync |
| Use `varchar` without length | Always `{ length: N }` |
| Mix camelCase in DB names | DB names always `snake_case` |

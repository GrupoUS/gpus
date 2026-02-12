# Neon Data Isolation (Canonical)

Defines robust multitenancy isolation in Neon for owners and subusers.

Related docs:
- `../SKILL.md`
- `./role-architecture.md`
- `./db-schema-blueprints.md`
- `./drizzle-neon-patterns.md`

## 1) Isolation Model

Use **single database, tenant-key isolation** with strict ownership fields:
- `tenant_owner_user_id` identifies clinic boundary.
- Every tenant-bound table carries `tenant_owner_user_id`.
- `clinica_staff` always executes within owner tenant.

`admin` can query cross-tenant only in dedicated admin procedures.

## 2) Context Resolution Contract

For every authenticated request resolve:
- `requestUserId`
- `requestRole`
- `tenantOwnerUserId`

Resolution:
- `clinica_owner` => `tenantOwnerUserId = requestUserId`
- `clinica_staff` => `tenantOwnerUserId = users.tenant_owner_user_id`
- `mentorado` => no clinic tenant access
- `admin` => explicit override only in admin endpoints

## 3) Query Rules

- Read/write tenant entities with `WHERE tenant_owner_user_id = ctx.tenantOwnerUserId`.
- For per-user entities also include `AND created_by_user_id = ctx.requestUserId` when needed.
- Never omit tenant filter in non-admin endpoints.

### Drizzle ORM Examples

**Mentorado-scoped query (tenant isolation):**

```typescript
// ✅ Correct — always filter by mentoradoId
const result = await db.select({
  id: leads.id,
  nome: leads.nome,
  status: leads.status,
}).from(leads)
  .where(eq(leads.mentoradoId, ctx.mentoradoId));

// ❌ Wrong — no tenant filter
const result = await db.select().from(leads);
```

**Admin cross-tenant query (explicit override):**

```typescript
// Only in adminProcedure — never in mentoradoProcedure
const allLeads = await db.select({
  id: leads.id,
  nome: leads.nome,
  mentoradoId: leads.mentoradoId,
}).from(leads)
  .orderBy(desc(leads.createdAt));
```

**Staff query with owner's tenant:**

```typescript
// Staff sees owner's data only
const pacientes = await db.select({
  id: pacientes.id,
  nome: pacientes.nome,
}).from(pacientes)
  .where(eq(pacientes.mentoradoId, ctx.tenantOwnerMentoradoId));
```

## 4) Recommended Enforcement Layers

Primary enforcement:
1. tRPC middleware for role and module permission checks.
2. repository/service helpers that inject tenant predicates by default.
3. optional database constraints/indexes to keep tenant-scoped uniqueness.

Optional hardening (future): PostgreSQL RLS when compliance needs rise.

## 5) Staff-Specific Guardrails

- Staff can never mutate owner role, billing, or permission records.
- Staff can only access module subset (`agenda`, `pacientes`, optional `crm`).
- Staff rows must always contain valid `tenant_owner_user_id` reference.

## 6) Indexing Strategy

For each tenant table:
- composite index: `(tenant_owner_user_id, created_at desc)`
- business unique constraints scoped by tenant, e.g. `(tenant_owner_user_id, external_id)`

## 7) Anti-Patterns

- Global queries without tenant filter.
- Using only `user_id` and inferring tenant implicitly.
- Granting direct SQL write access to app clients bypassing backend checks.

## 8) Validation Checklist

- [ ] Every tenant table has `tenant_owner_user_id`.
- [ ] Every repository method injects tenant predicate.
- [ ] Admin-only cross-tenant paths are isolated.
- [ ] Staff cannot read/write financeiro entities.

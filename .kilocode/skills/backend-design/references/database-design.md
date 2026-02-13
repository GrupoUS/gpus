# Database Design — Drizzle + Neon Operational Patterns

Design schema and query behavior for correctness under scale, evolution, and failure.

## Driver and Runtime Reality

Use Neon HTTP driver with explicit awareness of stateless request behavior.

Operational implications:

- Avoid transaction-heavy assumptions in request flow.
- Prefer idempotent writes and conflict-aware mutation semantics.
- Keep query shapes explicit for predictable performance.

## Canonical Schema Strategy

### Extension-First Policy

Before creating a new table:

1. Evaluate whether entity is true new domain.
2. Prefer optional column extension for 1:1 shape growth.
3. Add relation only when cardinality and lifecycle differ materially.
4. Require index and access-pattern justification for all new tables.

### Anti-Sprawl Rules

- Ban 1:1 satellite tables without hard constraints justification.
- Ban duplicate denormalized fields without read model rationale.
- Require ownership and deletion semantics for each relation.

## Query Pattern Standards

- Keep projection explicit, never broad select by default.
- Prefer indexed predicates first.
- Return only required fields for API contracts.
- Use conflict-aware upserts for identity and webhook sync paths.
- Keep writes idempotent for retries and replay.

## Migration Safety Model

Treat migrations as operational events.

Required controls:

1. Pre-check production-like data impact and lock risk.
2. Prefer additive forward-compatible migrations.
3. Separate deploy-time and backfill-time operations when needed.
4. Include explicit rollback instructions.
5. Verify post-migration query plans on critical paths.

## Performance and Latency

For latency regressions:

- Check index coverage for high-cardinality filters.
- Check sort and pagination alignment with index order.
- Check N+1 patterns introduced in service composition.
- Check external call coupling inside DB-critical paths.

Use diagnostics process from [`runbooks.md`](runbooks.md) and [`debugging-matrix.md`](debugging-matrix.md).

## Data Consistency with External Systems

When syncing Clerk or provider state:

- Keep identity keys immutable and unique.
- Use upsert semantics with deterministic winner rules.
- Store sync metadata for reconciliation and auditing.
- Include replay-safe processing for delayed events.

## Do / Don’t

Do:

- Prefer schema changes that preserve backward compatibility.
- Prefer explicit relation indexes and query contracts.
- Prefer write paths that can be safely retried.

Don’t:

- Don’t couple migration safety to best-case traffic assumptions.
- Don’t add schema surface without lifecycle ownership.
- Don’t rely on manual hotfix SQL as primary rollout path.

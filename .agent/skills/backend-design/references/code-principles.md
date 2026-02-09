# Code Principles — LEVER + Three-Pass + Backend Do/Don’t

## LEVER Philosophy

> **L**everage patterns | **E**xtend first | **V**erify reactivity | **E**liminate duplication | **R**educe complexity

### Scoring: Extend vs Create

| Factor | Points |
|---|---|
| Reuse data structure | +3 |
| Reuse indexes/queries | +3 |
| Reuse >70% code | +5 |
| Circular dependencies | -5 |
| Distinct domain | -3 |

**Score > 5**: Extend existing code.

---

## Three-Pass Implementation

| Pass | Activity | Code |
|---|---|---|
| 1. Discovery | `grep_search` for related code, document patterns | None |
| 2. Design | Write interfaces, plan data flow | Minimal |
| 3. Implementation | Execute with max reuse | Essential only |

---

## Backend Do/Don’t Standards

### Architecture

Do:

- Keep router handlers thin and service logic cohesive.
- Keep trust boundaries explicit at procedure middleware.
- Keep external provider logic behind adapters.

Don’t:

- Don’t place domain orchestration in Express route glue.
- Don’t bypass context-level authorization assumptions.
- Don’t mix transport, domain, and persistence concerns in one function.

### Reliability

Do:

- Design every mutation path for retry safety.
- Persist critical integration state before non-replayable side effects.
- Emit failure classification logs for all integration boundaries.

Don’t:

- Don’t treat in-memory queues as durable guarantees.
- Don’t swallow provider timeout and 429 failure signals.
- Don’t acknowledge irreversible operations before persistence guard.

### Security

Do:

- Validate inputs at boundary with Zod.
- Enforce role checks near trust boundary.
- Use typed env access and startup validation.

Don’t:

- Don’t trust client-provided role or ownership fields.
- Don’t expose raw provider error payloads to clients.
- Don’t read secrets ad hoc from `process.env` inside business logic.

---

## Service Layer Patterns

### Service Factory

```typescript
// server/services/featureService.ts
export function createFeatureService(db: NeonHttpDatabase, logger: Logger) {
  return {
    async getByUser(userId: number) {
      return measureAsync(logger, "get_features", () =>
        db.select().from(features).where(eq(features.userId, userId))
      );
    },

    async create(data: InsertFeature) {
      const [result] = await db.insert(features).values(data).returning();
      logger.info("feature_created", { id: result.id });
      return result;
    },
  };
}
```

### AI Service Pattern

```typescript
// Common pattern for 5+ AI services (assistant, marketing, SDR, patient, agent)
export async function generateAIResponse(params: {
  systemPrompt: string;
  messages: CoreMessage[];
  tools?: Record<string, CoreTool>;
}) {
  const result = await streamText({
    model: google("gemini-3-flash-preview"),
    system: params.systemPrompt,
    messages: params.messages,
    tools: params.tools,
    maxSteps: 5,
  });
  return result;
}
```

---

## Anti-Patterns (Project-Specific)

| Pattern | Why Bad | Fix |
|---|---|---|
| New pgTable for 1:1 data | Join complexity, migration burden | Extend existing table |
| Duplicate query in router | Logic drift | Extract to service |
| `ctx.db` in 10+ lines | Hard to test | Service layer |
| `process.env.X` in router | No validation, no typing | Use `ENV.x` |
| No logger in service | Silent failures | `createLogger({ service })` |
| Sequential awaits | Slow | `Promise.all()` |
| Missing `.returning()` | Extra SELECT needed | Always chain `.returning()` |
| `console.log` | Unstructured | `logger.info()` |
| Swallowed catch blocks | Hidden bugs | Log + rethrow |
| In-memory-only webhook processing | Loss on restart | Durable ingress + replay path |
| Cache dual-write without divergence signal | Silent auth drift | Emit divergence metric + reconcile |
| Scheduler without idempotency key | Duplicate side effects | Deterministic keys + lease/lock |
| Migration without rollback path | Recovery risk | Roll-forward + rollback procedure |

---

## Review Checklist

### Architecture

- [ ] Extended existing tables/queries?
- [ ] Followed Three-Pass approach?
- [ ] New code < 50% of fresh implementation?
- [ ] Service extracted for reusable logic?
- [ ] Request lifecycle mapped from auth to persistence?

### API

- [ ] Correct procedure type (public/protected/mentorado/admin)?
- [ ] Input validated with Zod?
- [ ] Error uses correct TRPCError code?
- [ ] Logger used for important operations?
- [ ] External adapters enforce timeout/retry/rate-limit behavior?

### Database

- [ ] Indexes on FK columns?
- [ ] `.returning()` on inserts?
- [ ] `onConflictDoUpdate` for upserts?
- [ ] No `SELECT *` (explicit fields)?
- [ ] Migration contains rollback and post-deploy verification?

### TypeScript

- [ ] No `any` (use `unknown`)?
- [ ] Inferred types from schema (`$inferSelect`)?
- [ ] Const assertions where applicable?

### Operations

- [ ] Cache consistency behavior validated under failure?
- [ ] Webhook replay strategy documented?
- [ ] Scheduler job idempotency and overlap controls validated?
- [ ] Alerts and dashboards updated for new failure domain?

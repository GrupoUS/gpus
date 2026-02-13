# Pre-Mortem Analysis Protocol

> Risk assessment for L6+ tasks. "Imagine the plan failed — what went wrong?"

## When to Use

**Required:** L6+ complexity tasks (architecture, integrations, migrations).

**Skip:** L1-L5 tasks unless they involve breaking changes or security implications.

---

## The Protocol

### Step 1: Assume Failure

> "It's 2 days after implementation. The feature is broken, reverted, or causing incidents. What happened?"

Brainstorm failure modes — aim for 5-10 across these categories:

### Step 2: Categorize Failure Modes

| Category | What Can Fail | Examples |
|----------|---------------|----------|
| **Technical** | Code logic, type errors, edge cases | Missing null check, race condition, wrong query |
| **Integration** | API contracts, auth flows, third-party | Clerk webhook fails, tRPC type mismatch, Stripe event missed |
| **Data** | Schema changes, migrations, data loss | Column rename breaks queries, FK constraint violation, missing index |
| **Performance** | Slow queries, memory, N+1 problems | Full table scan, unbounded list fetch, missing pagination |
| **Human** | Misunderstood requirements, wrong assumptions | Built wrong feature, missed edge case user mentioned |

### Step 3: Rank Risks

Score each failure mode:

```
Risk Score = Probability (1-3) × Impact (1-3)
```

| Score | Action |
|-------|--------|
| 7-9 | **BLOCK** — Must mitigate before implementing |
| 4-6 | **MITIGATE** — Add safeguard in plan |
| 1-3 | **ACCEPT** — Note and monitor |

### Step 4: Add Mitigations to Plan

For each risk scored ≥ 4, add to the plan:

```markdown
### Risk: [Description]
- **Category:** Technical / Integration / Data / Performance / Human
- **Score:** [P] × [I] = [Total]
- **Mitigation:** [Specific action in the plan]
- **Rollback:** [How to undo if this risk materializes]
```

### Step 5: Embed in Plan File

Add the **top 3 risks** as a summary table in the plan:

```markdown
## Risk Assessment

| # | Risk | Category | Score | Mitigation |
|---|------|----------|-------|------------|
| 1 | FK constraint on delete cascade | Data | 6 | Add soft-delete flag instead |
| 2 | Clerk webhook race condition | Integration | 6 | Idempotent handler with dedup key |
| 3 | N+1 on mentorados query | Performance | 4 | Use `.with()` eager loading |
```

---

## Stack-Specific Failure Modes

Common failures in this project's stack:

| Stack Layer | Common Failure | Prevention |
|-------------|---------------|------------|
| **Drizzle** | Missing index on FK | Always add index when creating FK |
| **tRPC** | Zod schema drift from DB | Derive Zod from Drizzle schema types |
| **Clerk** | Webhook signature mismatch | Verify `CLERK_WEBHOOK_SECRET` in env |
| **Neon** | Cold start on first query | Use connection pooling, add retry |
| **Stripe** | Missed webhook events | Implement idempotent handlers |
| **Hono/Express** | Middleware ordering | Auth middleware before route handlers |

---

## Quick Checklist

Before finalizing any L6+ plan:

- [ ] "What if this fails?" brainstormed (5+ failure modes)
- [ ] Risks ranked by probability × impact
- [ ] Top 3 risks have mitigations in the plan
- [ ] Catastrophic risks (score ≥ 7) have rollback steps
- [ ] Stack-specific failure modes checked against the table above

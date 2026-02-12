# Lightweight Architecture Decision Records

> Document WHY decisions were made, not just WHAT. For L6+ tasks with multi-approach choices.

## When to Create an ADR

**Required when:**

- Choosing between 2+ valid approaches (libraries, patterns, architectures)
- Making a trade-off that future readers need to understand
- Deviating from established project patterns

**Skip when:**

- Only one reasonable approach exists
- The decision follows an established project convention
- L1-L5 tasks (unless trade-off is significant)

---

## Format

Keep each ADR to **≤ 15 lines**. Embed directly in the plan file — no separate ADR files.

```markdown
### ADR: [Short Decision Title]

**Context:** [1-2 sentences on what problem this solves and why a decision is needed]

**Options:**
1. **[Option A]** — [Pro] / [Con]
2. **[Option B]** — [Pro] / [Con]

**Decision:** Option [X] because [1-sentence rationale].

**Consequences:**
- [Key positive consequence]
- [Key trade-off or risk accepted]
```

---

## Examples

### ADR: Router Framework for New Endpoints

**Context:** Adding 8 new API endpoints. Project uses Express but is migrating to Hono.

**Options:**
1. **Express** — Familiar, consistent with existing code / No new patterns to learn
2. **Hono** — Better perf, aligns with migration plan / Team must learn new patterns

**Decision:** Hono because the migration plan prioritizes new features on Hono first.

**Consequences:**
- New endpoints get Hono benefits (faster, typed middleware)
- Team needs to reference `.agent/skills/backend-design/references/hono-migration.md`

---

### ADR: Soft Delete vs Hard Delete for Pacientes

**Context:** Pacientes table needs delete functionality. Regulatory compliance requires data retention.

**Options:**
1. **Hard delete** — Simple, clean DB / Loses audit trail
2. **Soft delete (is_deleted flag)** — Keeps history / Adds query complexity

**Decision:** Soft delete because compliance requires 5-year data retention.

**Consequences:**
- All pacientes queries must include `WHERE is_deleted = false`
- Need migration to add `is_deleted` column with default `false`

---

## Integration with Plan

Place ADRs in the plan file after the Research Summary and before the Task Structure:

```
## Research Summary
...

## Architecture Decisions
### ADR: [Title 1]
...
### ADR: [Title 2]
...

## Tasks
...
```

This ensures implementation tasks reference the decisions they depend on.

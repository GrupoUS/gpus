# Plan File Template

> Reference for creating implementation-ready plan files.

## File Location & Naming

| Request                           | Plan File                     |
| --------------------------------- | ----------------------------- |
| `/plan e-commerce site with cart` | `docs/PLAN-ecommerce-cart.md` |
| `/plan mobile app for fitness`    | `docs/PLAN-fitness-app.md`    |
| `/plan add dark mode feature`     | `docs/PLAN-dark-mode.md`      |

**Rules:**

1. Extract 2-3 key words from request
2. Lowercase, hyphen-separated, max 30 characters
3. Location: `docs/PLAN-{slug}.md`

---

## Document Header

Every plan MUST start with:

```markdown
# [Feature Name] Implementation Plan

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries involved]

**Complexity:** L[1-10] — [Justification]

---
```

---

## Research Section

```markdown
## Research Summary

### Findings Table

| # | Finding | Confidence (1-5) | Source | Impact |
|---|---------|-------------------|--------|--------|
| 1 | ... | 4 | codebase | high |

### Knowledge Gaps
- [What remains unknown]

### Assumptions to Validate
- [Explicit assumptions needing confirmation]

### Edge Cases
- [At least 5 for L4+ complexity]
```

---

## Architecture Decisions (L6+)

When multiple valid approaches exist, document the decision:

```markdown
## Architecture Decisions

### ADR: [Short Decision Title]

**Context:** [Problem and why a decision is needed]

**Options:**
1. **[Option A]** — [Pro] / [Con]
2. **[Option B]** — [Pro] / [Con]

**Decision:** Option [X] because [rationale].

**Consequences:**
- [Positive consequence]
- [Trade-off accepted]
```

> See `references/architecture-decisions.md` for full guide and examples.

---

## Risk Assessment (L6+)

Pre-mortem summary — top 3 risks from the analysis:

```markdown
## Risk Assessment

| # | Risk | Category | Score (P×I) | Mitigation |
|---|------|----------|-------------|------------|
| 1 | [Risk description] | Technical | 6 | [Specific action] |
| 2 | [Risk description] | Integration | 4 | [Specific action] |
| 3 | [Risk description] | Data | 4 | [Specific action] |
```

> See `references/pre-mortem-analysis.md` for the full protocol.

---

## Task Structure (Bite-Sized)

Each task is a small, focused unit. Each **step** within a task is **one action** (2-5 minutes).

For L5+ tasks, identify tasks that can run concurrently:

```markdown
### [PARALLEL] Tasks 3-4: Independent Components

> These tasks have no mutual dependencies and can execute concurrently.
```

```markdown
### Task 1: [Component Name]

**Files:**
- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts:123-145`
- Test: `exact/path/to/test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { createUser } from "../server/users";

describe("createUser", () => {
  it("creates a user with valid input", async () => {
    const result = await createUser({ name: "Test", email: "test@example.com" });
    expect(result.id).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/tests/users.test.ts`
Expected: FAIL — "createUser is not defined"

**Step 3: Write minimal implementation**

```typescript
// server/users.ts
export async function createUser(input: { name: string; email: string }) {
  return await db.insert(users).values(input).returning();
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/tests/users.test.ts`
Expected: PASS

**Step 5: Quality gates**

Run: `bun run check && bun run lint:check`
Expected: No errors

**Step 6: Commit**

```bash
git add src/tests/users.test.ts server/users.ts
git commit -m "feat: add createUser function with test"
```
```

---

## Relevant Files Section

```markdown
## Relevant Files

### Must Read (before implementation)
- `path/to/file.ts` — [why this file matters]

### May Reference (during implementation)
- `path/to/file.ts` — [when you'd need this]
```

---

## Existing Patterns Section

```markdown
## Existing Patterns

| Pattern | Convention | Example |
|---------|-----------|---------|
| Naming | camelCase for functions, PascalCase for components | `createUser`, `UserCard` |
| File structure | Feature-based colocation | `server/users.ts`, `client/src/pages/UsersPage.tsx` |
| Error handling | tRPC TRPCError with code | `throw new TRPCError({ code: "NOT_FOUND" })` |
| State | tRPC + TanStack Query | `trpc.users.list.useQuery()` |
```

---

## Constraints Section

```markdown
## Constraints

**Non-negotiable:**
- [Hard requirements that cannot be changed]

**Preferences:**
- [Soft preferences, can be adjusted if needed]
```

---

## Execution Handoff

Every plan MUST end with:

```markdown
---

## Next Steps

Plan saved to `docs/PLAN-{slug}.md`.

**Execution options:**
1. **Implement now** — Start executing tasks sequentially with validation gates
2. **Review first** — Review and adjust before implementation
3. **Modify plan** — Change scope, ordering, or approach
```

---

## Pre-Submission Checklist

Before delivering a plan, verify:

**Research:**
- [ ] Codebase searched for existing patterns?
- [ ] Docs consulted (Context7)?
- [ ] Web research done (Tavily) if needed?
- [ ] Edge cases considered (min 5 for L4+)?
- [ ] All findings tagged with confidence score (1-5)?

**Tasks:**
- [ ] Each step is one atomic action (2-5 min)?
- [ ] Exact file paths with line ranges?
- [ ] Complete code provided (not vague instructions)?
- [ ] Validation command for each task?
- [ ] Dependencies mapped, parallel-safe marked?
- [ ] Parallel tasks grouped with `[PARALLEL]` tag? (L5+)
- [ ] Rollback defined?

**Risk & Decisions (L6+):**
- [ ] Pre-mortem analysis run (5+ failure modes)?
- [ ] Top 3 risks documented with mitigations?
- [ ] Architecture decisions recorded as ADRs?

**Self-Review:**
- [ ] Completeness — every requirement has a task?
- [ ] Atomicity — every step is one action?
- [ ] Risk coverage — top risks mitigated?
- [ ] Dependency order — tasks can execute sequentially?
- [ ] Rollback feasibility — each task reversible?

**Format:**
- [ ] Header with goal, architecture, tech stack?
- [ ] Research summary included?
- [ ] Execution handoff at end?

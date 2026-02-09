# Debug Methodology

> 4-Phase systematic debugging: Investigate → Analyze Patterns → Hypothesize → Implement. Complete each phase before proceeding.

## Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

### 1. Read Error Messages Carefully

- Don't skip past errors or warnings
- Read stack traces **completely**
- Note line numbers, file paths, error codes
- They often contain the exact solution

### 2. Reproduce Consistently

- Can you trigger it reliably?
- What are the exact steps?
- Does it happen every time?
- **If not reproducible → gather more data, don't guess**

```markdown
## Reproduction Notes

**Expected**: [What should happen]
**Actual**: [What actually happens]
**Steps**:

1. [Step 1]
2. [Step 2]
3. [Error occurs]
```

### 3. Check Recent Changes

- `git diff HEAD~5`
- `git log --oneline -10`
- New dependencies, config changes?
- Environmental differences?

### 4. Gather Evidence in Multi-Component Systems

**WHEN system has multiple components (client → tRPC → Drizzle → Neon):**

```
For EACH component boundary:
  - Log what data enters component
  - Log what data exits component
  - Verify environment/config propagation
  - Check state at each layer

Run once to gather evidence showing WHERE it breaks
THEN analyze evidence to identify failing component
THEN investigate that specific component
```

**Example:**

```typescript
// Layer 1: tRPC procedure
console.error("=== tRPC input ===", { input, userId: ctx.userId });

// Layer 2: Service function
console.error("=== Service args ===", { mentoradoId, filters });

// Layer 3: Drizzle query
console.error("=== Query params ===", { where: conditions, limit });

// Layer 4: Response
console.error("=== Result ===", { count: result.length, first: result[0] });
```

### 5. Trace Data Flow

See `root-cause-tracing.md` for the complete backward tracing technique.

**Quick version:**

```
User Input → Component State → tRPC Call → Drizzle Query → Neon DB → Response → UI
     ↓            ↓              ↓            ↓              ↓          ↓
   Check        Check          Check        Check          Check      Check
```

---

## Phase 2: Pattern Analysis

**Find the pattern before fixing.**

1. **Find Working Examples** — Locate similar working code in the same codebase
2. **Compare Against References** — Read reference implementation COMPLETELY, don't skim
3. **Identify Differences** — List every difference, however small. Don't assume "that can't matter"
4. **Understand Dependencies** — What settings, config, environment does this need?

---

## Phase 3: Hypothesis & Testing

**Scientific method — one variable at a time.**

1. **Form Single Hypothesis** — "I think X is the root cause because Y." Write it down.
2. **Test Minimally** — Make the SMALLEST possible change to test hypothesis
3. **Verify Before Continuing:**
   - Worked? → Phase 4
   - Didn't work? → Form NEW hypothesis. DON'T add more fixes on top.
4. **When You Don't Know** — Say "I don't understand X." Don't pretend.

---

## Phase 4: Implementation & Verification

### 1. Create Failing Test Case

```typescript
it("should reject empty mentoradoId", () => {
  // Simplest possible reproduction
  expect(() => service.create({ mentoradoId: "" })).toThrow();
});
```

### 2. Implement Single Fix

- Address the root cause identified
- ONE change at a time
- No "while I'm here" improvements

### 3. Verify Fix

| Step          | Command         | Check     |
| ------------- | --------------- | --------- |
| 1. Fix code   | Edit files      | Logical   |
| 2. Type check | `bun run check` | No errors |
| 3. Test       | `bun test`      | All pass  |
| 4. Visual     | `agent-browser` | UI works  |

### 4. 3-Fix Escalation Rule

- **< 3 fixes failed** → Return to Phase 1, re-analyze with new information
- **≥ 3 fixes failed** → **STOP.** Question the architecture:
  - Is this pattern fundamentally sound?
  - Are we sticking with it through sheer inertia?
  - Should we refactor architecture vs. continue fixing symptoms?
  - **Discuss with user before attempting more fixes**

---

## 5 Whys Template

```markdown
**Problem**: [Describe error]

1. Why? → [First cause]
2. Why? → [Deeper cause]
3. Why? → [Underlying issue]
4. Why? → [Systemic reason]
5. Why? → [Root cause]

**Root Cause**: [Final determination]
**Fix**: [Solution implemented]
```

---

## Debug Report Template

```markdown
## Debug Report

**Issue**: [Description]
**Root Cause**: [5 Whys result]
**Fix**: [What was changed]
**Verification**:

- [ ] `bun run check` ✅
- [ ] `bun test` ✅
- [ ] Browser verified ✅

**Files Changed**: [list]
```

---

## Commit Message Template

```
fix(scope): brief description

Root cause: [5 Whys result]
Fix: [What was changed]

Tested: bun run check ✅, bun test ✅
```

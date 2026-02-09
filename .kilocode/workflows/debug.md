---
description: Canonical debugging workflow. Orchestration-only with reproducible root-cause loop.
---

# /debug - Debug Orchestration

$ARGUMENTS

## Required Inputs

- Error message, stack trace, or symptom description
- Affected layer (frontend, backend, database, or unknown)

## Orchestration Rules

1. Load `.agent/skills/debug/SKILL.md` — **read the Iron Law first**
2. Load `.agent/skills/backend-design/SKILL.md` when backend/domain logic is involved
3. **NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST**
4. Complete each phase before proceeding to the next
5. If ≥ 3 fixes fail → STOP, question architecture, discuss with user

## Execution Sequence

### Phase 1: Root Cause Investigation

1. Read error messages and stack traces **completely** — don't skip
2. Reproduce issue and document expected vs actual behavior
3. Identify affected layer (frontend / backend / database / integration)
4. For multi-component issues: add boundary logging at each layer
5. Use `sequentialthinking` for complex multi-step diagnosis
6. Trace data flow backward to find original trigger (see `references/root-cause-tracing.md`)

### Phase 2: Pattern Analysis

7. Find working examples of similar code in the codebase
8. Compare working vs broken — list every difference
9. Pull official docs (`context7`) when library behavior is uncertain

### Phase 3: Hypothesis & Testing

10. Form a **single hypothesis**: "X is the root cause because Y"
11. Make the **smallest possible change** to test it
12. If hypothesis fails → form NEW hypothesis, don't stack fixes

### Phase 4: Implementation & Verification

13. Create failing test case (when applicable)
14. Implement single focused fix addressing root cause
15. Run validation gates (see below)
16. Add defense-in-depth validation at each layer the data passes through (see `references/defense-in-depth.md`)
17. Document fix in commit message with root cause

## Red Flag Check

**STOP and return to Phase 1 if you catch yourself:**

- Proposing fixes before completing investigation
- Adding multiple changes at once
- Thinking "just try this and see"
- Skipping reproduction steps
- Not reading error messages completely

## MCP Routing

| Tool                   | When to Use                         |
| ---------------------- | ----------------------------------- |
| `sequentialthinking`   | Multi-step diagnosis, complex logic |
| `neon`                 | SQL diagnostics, query plans        |
| `context7`             | Official library behavior reference |
| `tavily`               | External fallback research          |

## Mandatory Validation Gates

// turbo-all

```bash
bun run check
bun run lint:check
bun run test
```

## References

- `.agent/skills/debug/SKILL.md` (Iron Law, Red Flags, Rationalizations)
- `.agent/skills/debug/references/debug-methodology.md` (4-phase detailed process)
- `.agent/skills/debug/references/root-cause-tracing.md` (backward trace technique)
- `.agent/skills/debug/references/defense-in-depth.md` (4-layer validation)
- `.agent/skills/debug/references/condition-based-waiting.md` (flaky test fixes)
- `.agent/skills/backend-design/SKILL.md` (backend domain authority)

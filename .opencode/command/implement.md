---
description: Execute approved plan from /research via @apex-dev in 5 phases
agent: apex-dev
---

# /implement | /implementar

Execute the approved implementation plan from TodoWrite.

## Trigger

- User approves research plan: "aprovar plano", "approve", "proceed"
- Direct command: `/implement`

## Execution Flow

```
1. READ TodoWrite tasks (from /research)
2. EXECUTE by phase (1→5)
3. VALIDATE at each checkpoint
4. ROLLBACK on failure
5. REPORT completion
```

## 5 Phases

| Phase | Type | Checkpoint |
|-------|------|------------|
| 1 | setup | `bun install && bun run build` |
| 2 | test | `bun run test --run` |
| 3 | core | `bun run build && bun run lint:check && bun run test` |
| 4 | integration | `bun run build && bun run lint:check && bun run test` |
| 5 | polish | `bun run build && bun run lint:check && bun run test:coverage` |

## Task Execution

For each task:
1. Mark `in_progress` in TodoWrite
2. Check dependencies resolved
3. Delegate to subagent if needed:
   - `@database-specialist`: convex/ files
   - `@apex-ui-ux-designer`: components/ files
   - `@code-reviewer`: security validation
4. Implement changes
5. Validate acceptance criteria
6. Mark `completed` or execute rollback

## Rollback

On failure:
- Execute task's `rollback_strategy`
- Mark task `failed`
- Halt phase
- Report to user

## Completion

Generate summary:
- Tasks completed
- Validation results (build/lint/test)
- Next steps

---
description: Canonical implementation workflow. Orchestration-only with strict gates.
---

# /implement - Implementation Orchestration

$ARGUMENTS

## Orchestration Rules

1. Require approved `docs/PLAN-{slug}.md`
2. Route each task to the correct skill before coding
3. Execute one atomic task at a time
4. Validate after each atomic task
5. Escalate failures to `/debug` flow

## Skill Routing (minimum)

- backend/database -> `.agent/skills/backend-design/SKILL.md`
- frontend/ui -> `.agent/skills/frontend-design/SKILL.md`
- debug/failure recovery -> `.agent/skills/debug/SKILL.md`

## MCP Routing Canon

- `context7` for framework/library docs
- `mcp-server-neon` for DB operations
- `tavily` for external fallback research
- `sequential-thinking` for complex trade-offs/root-cause synthesis

## Execution Sequence

1. Load plan and pending atomic task
2. Start evolution-core session:
// turbo
```bash
python3 .agent/skills/evolution-core/scripts/memory_manager.py session start -t "$ARGUMENTS"
```
3. Identify domain and load corresponding skill
4. Execute task changes
5. Run task-level checks
6. Mark task done/fail and continue
7. Run final validation gates
8. End evolution-core session:
// turbo
```bash
python3 .agent/skills/evolution-core/scripts/memory_manager.py session end -s "Completed: $ARGUMENTS"
```

## Mandatory Validation Gates

- `bun run check`
- `bun run lint:check`
- `bun run test`

## Failure Handling

1. Pause immediately
2. Run `/debug` workflow sequence
3. Apply minimal corrective change
4. Re-run full gates before proceeding

## References

- `.agent/rules/GEMINI.md`
- `.agent/workflows/plan.md`
- `.agent/workflows/debug.md`

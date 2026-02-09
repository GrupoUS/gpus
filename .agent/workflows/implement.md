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
- `neon` for DB operations
- `tavily` for external fallback research
- `sequentialthinking` for complex trade-offs/root-cause synthesis

## Execution Sequence

1. Load plan and pending atomic task
2. Identify domain and load corresponding skill
3. Execute task changes
4. Run task-level checks
5. Mark task done/fail and continue
6. Run final validation gates

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

---
description: Canonical planning workflow. Orchestration-only; deep policy belongs to skills.
---

# /plan - Planning Orchestration

$ARGUMENTS

> **This workflow tells you WHEN and WHAT. The skill tells you HOW.**
> Canonical authority: `.agent/skills/planning/SKILL.md`

## 1. Load Skills

Load `.agent/skills/planning/SKILL.md` — read it fully before proceeding.

Route additional skills by domain:

| Domain | Also Load |
|--------|-----------|
| Backend / Database | `.agent/skills/backend-design/SKILL.md` |
| Frontend / UI | `.agent/skills/frontend-design/SKILL.md` |
| Debug / Failure | `.agent/skills/debug/SKILL.md` |

## 2. Load Historical Context

// turbo
```bash
python3 .agent/skills/evolution-core/scripts/memory_manager.py load_context --project "$PWD" --task "$ARGUMENTS"
```

## 3. Execute D.R.P.I.V

Follow the phases from the planning skill **in order**:

1. **DISCOVER** — Clarify requirements (skip for L1-L2 / well-scoped tasks)
2. **RESEARCH** — Eliminate unknowns using MCP cascade (codebase → `context7` → `tavily` → `sequential-thinking`)
3. **PLAN** — Create `docs/PLAN-{slug}.md` with atomic tasks, exact code, and rollback steps
4. **IMPLEMENT** — Only if user explicitly requests it → hand off to `/implement`
5. **VALIDATE** — Quality gates

> The detailed rules for each phase live in `SKILL.md`. Do not duplicate them here.

## 3.5. Plan Self-Review (Evaluator-Optimizer)

Before presenting the plan, self-evaluate against 5 criteria from `SKILL.md` Phase 2.5:
Completeness, Atomicity, Risk Coverage, Dependency Order, Rollback Feasibility.

**If any criterion fails:** Iterate on the plan silently before presenting to user.

## 4. Plan Output Checklist

Before presenting the plan, verify:

- [ ] Research findings + assumptions documented
- [ ] All findings confidence-scored (1-5)
- [ ] Bite-sized tasks (each = one action, 2-5 min)
- [ ] Exact file paths with line ranges
- [ ] Complete code in steps (never vague)
- [ ] Parallel tasks identified with `[PARALLEL]` tag (L5+)
- [ ] Rollback strategy included
- [ ] Pre-mortem analysis completed (L6+)
- [ ] Architecture decisions documented as ADRs (L6+)
- [ ] Self-review passed (5 criteria from Phase 2.5)
- [ ] Verification commands reference repo gates:
  - `bun run check`
  - `bun run lint:check`
  - `bun test`

## 5. Execution Handoff

Present to user:

1. **Implement now** → `/implement`
2. **Review first** → open plan for review
3. **Modify plan** → adjust before implementation

## Constraints

- **No runtime code** during `/plan` — output is only the plan file
- **No implementation** unless user explicitly requests it
- **CONSERVATIVE mode** by default — discover + research + plan only

## References

- `.agent/skills/planning/SKILL.md` — D.R.P.I.V phases, complexity levels, anti-patterns
- `.agent/skills/planning/references/brainstorming-protocol.md` — Discovery protocol
- `.agent/skills/planning/references/plan-template.md` — Plan file template
- `.agent/skills/planning/references/complexity-guide.md` — L1-L10 classification
- `.agent/skills/planning/references/mcp-usage.md` — MCP tool guidance
- `.agent/skills/planning/references/pre-mortem-analysis.md` — Risk assessment (L6+)
- `.agent/skills/planning/references/architecture-decisions.md` — ADR template (L6+)
- `.agent/workflows/implement.md` — Implementation handoff

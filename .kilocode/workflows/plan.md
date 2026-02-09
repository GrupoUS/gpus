---
description: Canonical planning workflow. Orchestration-only; deep policy belongs to skills.
---

# /plan - Planning Orchestration

$ARGUMENTS

## Required Inputs

- Task/request scope
- Relevant constraints (if any)

## Orchestration Rules

1. Load `.agent/skills/planning/SKILL.md` — this is the canonical authority for planning
2. Follow D.R.P.I.V phases strictly: Discover → Research → Plan → (Implement → Validate)
3. Create only `docs/PLAN-{slug}.md` — no runtime code during `/plan`
4. Do not implement unless user explicitly requests it

---

## Execution Sequence

### Phase 0: Discovery (conditional)

> Skip for bug fixes, well-scoped tasks, or L1-L2 complexity.

1. Check current project state (files, patterns, constraints)
2. Clarify ambiguity: **one question at a time, multiple choice preferred**
3. Propose 2-3 approaches with trade-offs, lead with recommendation
4. Validate design incrementally before proceeding to research
5. Protocol details: `references/brainstorming-protocol.md`

### Phase 1: Research (always)

1. Gather codebase evidence (grep_search, view_file, list_dir)
2. Pull official docs (`context7`) when library behavior matters
3. Use web research (`tavily`) only when local + official docs are insufficient
4. Synthesize trade-offs (`sequentialthinking`) for L4+ complexity

### Phase 2: Plan

1. Classify complexity (L1-L10)
2. Create structured plan file with:
   - Research findings + assumptions
   - Bite-sized tasks (each step = one action, 2-5 min)
   - Exact file paths with line ranges
   - Complete code in plan steps (never vague instructions)
   - Validation commands with expected output
   - Dependencies mapped, parallel-safe marked
   - Rollback steps
3. Save to `docs/PLAN-{slug}.md`

### Phase 3: Execution Handoff

Present options to user:
1. **Implement now** → proceed to `/implement`
2. **Review first** → open plan for review
3. **Modify plan** → adjust before implementation

---

## Standard Validation Gates (for plan output)

- Plan contains research findings + assumptions
- Plan contains bite-sized tasks with exact code
- Plan includes rollback strategy
- Verification section references repo gates:
  - `bun run check`
  - `bun run lint:check`
  - `bun test`

## References

- `.agent/skills/planning/SKILL.md` — Canonical planning skill (D.R.P.I.V)
- `.agent/skills/planning/references/brainstorming-protocol.md` — Discovery protocol
- `.agent/skills/planning/references/plan-template.md` — Plan file template
- `.agent/rules/GEMINI.md`
- `.agent/skills/backend-design/references/hono-migration.md`
- `.agent/workflows/implement.md`

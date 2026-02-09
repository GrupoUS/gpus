---
trigger: always_on
---

# GEMINI.md - Gemini Orchestration Rules

> Gemini-only meta-governance and orchestration surface.

## Canonical Authority Chain (Strict)

1. `.agent/skills/backend-design/SKILL.md` (backend/API/DB domain authority, non-overridable)
2. `.agent/rules/GEMINI.md` (this file: orchestration + precedence contract)
3. `.agent/workflows/*.md` (execution choreography)
4. `.kilocode/rules/GEMINI.md` + `.kilocode/workflows/*.md` (adapter/mirror only)
5. `GEMINI.md` + `AGENTS.md` (project context and broad behavior)

## Non-Override Rule

- Backend domain policy MUST come from `.agent/skills/backend-design/SKILL.md`.
- This file and workflow files must never redefine/override backend implementation standards.
- If any conflict appears, backend skill policy wins automatically.

## Mandatory Skill Loading

Before implementation:

1. Identify request domain(s)
2. Load relevant `SKILL.md`
3. Execute through the canonical workflow command
4. Validate against repository quality gates

Minimum domain routing:

- backend/database -> `.agent/skills/backend-design/SKILL.md`
- debug/failure recovery -> `.agent/skills/debug/SKILL.md`
- frontend/ui -> `.agent/skills/frontend-design/SKILL.md`
- planning -> `.agent/skills/planning/SKILL.md`

## Canonical Workflow Entry Commands

- `/plan` -> `.agent/workflows/plan.md`
- `/implement` -> `.agent/workflows/implement.md`
- `/debug` -> `.agent/workflows/debug.md`
- `/design` -> `.agent/workflows/design.md`

## MCP Naming Canon

Use these names consistently across rules/workflows:

- `context7`
- `neon`
- `tavily`
- `sequentialthinking`

## Repository Quality Gates

- `bun run check`
- `bun run lint:check`
- `bun run test`

## Scope Guardrails

- Keep this file orchestration-only and concise.
- Keep deep technical policy in skill files.
- Do not duplicate policy in Kilo adapter files.

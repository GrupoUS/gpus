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
- `mcp-server-neon`
- `tavily`
- `sequential-thinking`

## Repository Quality Gates

- `bun run check`
- `bun run lint:check`
- `bun run test`

## Terminal Command Execution Protocol

Prevent commands from hanging. These rules apply to ALL `run_command` and `command_status` calls.

### WaitMsBeforeAsync Strategy

| Command Type | WaitMs | Examples |
|---|---|---|
| Quick ops | 5000 | git add/rm/status, echo, cat, ls, mkdir, cp |
| Medium ops | 8000 | git commit -m, git push, gh secret set, bun install |
| Build/check | 1000 | bun run check, bun run build, bun run lint:check |
| Dev servers | 3000 | bun dev, bunx convex dev |
| Chained cmds | 8000 | cmd1 && cmd2 && cmd3 |

### command_status Monitoring (CRITICAL)

When a command returns a `CommandId`:

1. First check: `WaitDurationSeconds=5`, `OutputCharacterCount=3000`
2. If still running: `WaitDurationSeconds=10`
3. If still running after 20s total: the command is likely stuck → recover
4. **NEVER** use `WaitDurationSeconds > 30` for quick/medium commands
5. Reserve `WaitDurationSeconds=60` ONLY for builds (`bun run build`)

### Non-Interactive Commands (Mandatory)

- `git commit` → ALWAYS `-m "message"` (never open editor)
- `git log` → ALWAYS `-n N` limit
- `git diff` → use `--stat` or pipe `| head -n 50`
- `gh` → use `--yes` where available
- Prefix `GIT_TERMINAL_PROMPT=0` when git auth might prompt

### Stuck Command Recovery

If command runs > 3× expected duration:

1. `command_status` with `WaitDurationSeconds=0` → read output
2. If prompt `$` visible in output → command is done, proceed
3. If waiting for input → `send_command_input(Terminate=true)`
4. Re-run with corrected non-interactive flags

## Scope Guardrails

- Keep this file orchestration-only and concise.
- Keep deep technical policy in skill files.
- Do not duplicate policy in Kilo adapter files.

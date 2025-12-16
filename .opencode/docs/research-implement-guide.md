# Research → Implement Pipeline Guide

## Overview

This guide explains the complete flow from research (planning) to implementation (execution) in the Portal Grupo US project. The pipeline follows a structured approach with constitution validation, phased execution, and rollback support.

---

## Quick Start

### 1. Start Research (Plan Mode)

```markdown
/research [topic]
```

Example:
```markdown
/research como implementar sistema de notificações push para alertar SDRs sobre novos leads
```

### 2. Review the Plan

The Plan Agent will:
1. Invoke `@apex-researcher` for multi-source research
2. Generate atomic tasks with subtasks (for L5+ complexity)
3. Validate against project constitution
4. Present a formatted plan for approval

### 3. Approve and Implement

```markdown
aprovar plano
```

or

```markdown
/implement
```

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PLAN MODE (Research)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Step 1: Plan Agent invokes @apex-researcher                                 │
│      ↓                                                                       │
│  Step 2: Receive Research Report + Atomic Tasks                              │
│      ↓                                                                       │
│  Step 2.5: Generate Executable Specification                                 │
│      ├── Constitution Validation                                             │
│      ├── Enhance Task Fields (type, phase, parallel_group, etc.)             │
│      └── Generate Spec Artifacts (for L7+)                                   │
│      ↓                                                                       │
│  Step 3: Create TodoWrite with atomic tasks                                  │
│      ↓                                                                       │
│  Step 4: Present plan for user approval                                      │
│      ↓                                                                       │
│  Step 5: User approves → Handoff to Act Mode                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ACT MODE (Implementation)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Phase 1: Setup                                                              │
│      ├── Create directories                                                  │
│      ├── Add dependencies                                                    │
│      └── Configure schema                                                    │
│      [Checkpoint: bun install && bun run build]                              │
│      ↓                                                                       │
│  Phase 2: Tests                                                              │
│      ├── Write unit tests                                                    │
│      ├── Write integration tests                                             │
│      └── Create fixtures                                                     │
│      [Checkpoint: bun run test --run]                                        │
│      ↓                                                                       │
│  Phase 3: Core                                                               │
│      ├── Implement queries/mutations                                         │
│      ├── Create components                                                   │
│      └── Add hooks                                                           │
│      [Checkpoint: bun run build && bun run lint:check && bun run test]       │
│      ↓                                                                       │
│  Phase 4: Integration                                                        │
│      ├── Wire routes                                                         │
│      ├── Add auth guards                                                     │
│      └── Connect frontend to backend                                         │
│      [Checkpoint: bun run build && bun run lint:check && bun run test]       │
│      ↓                                                                       │
│  Phase 5: Polish                                                             │
│      ├── Optimize performance                                                │
│      ├── Cleanup code                                                        │
│      └── Update documentation                                                │
│      [Checkpoint: Full validation + coverage]                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Complexity Levels

| Level | Description | Atomic Tasks | Subtasks | Spec Artifacts |
|-------|-------------|--------------|----------|----------------|
| L1-L4 | Simple, single concept | 1-3 | None | None |
| L5-L7 | Moderate, multi-file | 3-6 | 2-4 each | Optional |
| L8-L10 | Complex, system-wide | 6-10 | 3-5 each | Recommended |

---

## Constitution Validation

All tasks are validated against 10 principles from `.opencode/memory/constitution.md`:

| # | Principle | Validation |
|---|-----------|------------|
| 1 | Bun-first | No npm/yarn/pnpm commands |
| 2 | TypeScript strict | No `any` types |
| 3 | LGPD compliance | Encryption for personal data |
| 4 | Biome standards | Passes lint:check |
| 5 | Convex patterns | Uses withIndex, auth checks |
| 6 | Test coverage | ≥80% for new code |
| 7 | Accessibility | WCAG 2.1 AA for UI |
| 8 | Portuguese UI | User-facing text in Portuguese |
| 9 | Performance | Bundle size and lazy loading |
| 10 | Functional components | No class components |

---

## Task Fields

Each atomic task includes execution metadata:

```yaml
- id: "AT-001"
  title: "Add notifications table to schema"
  description: "Add notifications table with fields for recipient, content, read status"
  type: "setup"           # setup | test | core | integration | polish
  phase: 1                # 1-5
  parallel_group: null    # A | B | C | null
  priority: "high"        # high | medium | low
  estimated_effort: "small"  # small (<1h) | medium (1-4h) | large (4h+)
  files_affected:
    - "convex/schema.ts"
  dependencies: []
  acceptance_criteria:
    - "Schema includes notifications table"
    - "Index by_recipient exists"
  test_strategy: "unit"   # unit | integration | e2e | none
  rollback_strategy: "git checkout convex/schema.ts"
  subtasks: []            # For L5+ complexity
```

---

## Subagent Delegation

During implementation, apex-dev delegates to specialized subagents:

| Subagent | Triggers | Purpose |
|----------|----------|---------|
| `@database-specialist` | Files in `convex/`, schema/query/mutation tasks | Convex expertise |
| `@apex-ui-ux-designer` | Files in `src/components/`, UI/accessibility tasks | shadcn/ui + a11y |
| `@code-reviewer` | End of phase, security/LGPD tasks | Security validation |

---

## Rollback Support

Each task has a rollback strategy for failure recovery:

| Scenario | Rollback Strategy |
|----------|-------------------|
| File created | `rm [path/to/file]` |
| File modified | `git checkout [path/to/file]` |
| Dependency added | `bun remove [package]` |
| Schema migration | `git checkout convex/schema.ts && bunx convex deploy` |
| Multiple files | `git checkout [file1] [file2] && rm [new_file]` |

---

## Validation Checkpoints

Each phase ends with a validation checkpoint:

| Phase | Checkpoint Commands |
|-------|---------------------|
| 1 (Setup) | `bun install && bun run build` |
| 2 (Tests) | `bun run test --run` (may fail - OK) |
| 3 (Core) | `bun run build && bun run lint:check && bun run test` |
| 4 (Integration) | `bun run build && bun run lint:check && bun run test` |
| 5 (Polish) | `bun run build && bun run lint:check && bun run test:coverage` |

---

## Brazilian Compliance

LGPD compliance is automatically activated for keywords:

- **Personal Data**: aluno, estudante, matrícula, CPF
- **Consent**: consentimento, proteção de dados, LGPD
- **Health**: saúde estética, ANVISA, procedimento
- **Financial**: PIX, BCB, pagamento, fatura

When triggered:
1. `@code-reviewer` validates security patterns
2. Tasks include encryption/audit requirements
3. Validation includes security review

---

## Commands Reference

| Command | Mode | Description |
|---------|------|-------------|
| `/research [topic]` | Plan | Multi-source research with atomic tasks |
| `/implement` | Act | Execute approved plan by phases |
| `/qa [scope]` | Both | Quality control pipeline |
| `/clean [scope]` | Act | Dead code detection and cleanup |

---

## Files Structure

```
.opencode/
├── agent/
│   ├── apex-dev.md           # Full-stack implementation
│   ├── apex-researcher.md    # Research & planning
│   ├── apex-ui-ux-designer.md
│   ├── code-reviewer.md
│   ├── database-specialist.md
│   └── product-architect.md
├── command/
│   ├── implement.md          # /implement command
│   ├── research.md           # /research command
│   ├── qa.md                 # /qa command
│   └── clean.md              # /clean command
├── memory/
│   └── constitution.md       # 10 project principles
├── docs/
│   ├── research-implement-guide.md    # This file
│   └── research-implement-examples.md # Usage examples
└── specs/                    # Generated specs for L7+ features
    └── [feature-id]/
        ├── data-model.md
        ├── contracts.md
        └── quickstart.md
```

---

## Next Steps

After completing implementation:

1. **Run validation**: `bun run build && bun run lint:check && bun run test`
2. **Review changes**: `git diff`
3. **Commit**: Follow Conventional Commits (feat:, fix:, docs:)
4. **Deploy**: Convex first (`bunx convex deploy`), then Railway

---

*Last updated: 2024*

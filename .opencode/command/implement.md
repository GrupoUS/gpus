---
description: Execute approved plan from /research via @apex-dev in 5 phases
agent: apex-dev
---

# /implement | /implementar

## Ultra-Think Protocol (UTP)

Use this protocol to reduce risk and avoid unnecessary code/changes:

1. **Re-read the task** and its acceptance criteria.
2. **Search for existing patterns** before creating anything new.
3. **Prefer extension over creation** (KISS/YAGNI).
4. **Define invariants** (what must not change) and **postconditions** (what must be true after).
5. **Validate early** (lint/build/tests) and rollback on failure.

UTP is mandatory at:
- **Step 3** (ordering/grouping decisions)
- **Step 4** (per-task execution decisions)

---

Execute the approved implementation plan from TodoWrite.

## Trigger

- User approves research plan: "aprovar plano", "approve", "proceed"
- Direct command: `/implement`

---

## Input Contract

Required inputs for a correct `/implement` run:

1. **TodoWrite state** created by `/research` (tasks `AT-*` and validations `VT-*`).
2. **Constitution** at `.opencode/memory/constitution.md`.
3. **Spec artifacts** (optional but recommended) under `.opencode/specs/[feature-id]/`.
4. **Repository context**: Bun runtime, TypeScript strict, Biome config, and test runner available.

### Expected TodoWrite format (from `/research`)

TodoWrite items are expected to follow this shape (IDs are examples):

```js
// Base tasks
{ id: 'AT-001', content: '[AT-001] Create directory structure | Phase: 1 | Files: src/x.ts', status: 'pending', priority: 'high' }

// Subtasks: immediately after parent
{ id: 'AT-001-A', content: '  ↳ [AT-001-A] Subtask description', status: 'pending', priority: 'high' }

// Validation tasks: placed at the end
{ id: 'VT-001', content: '[VT-001] Build validation: bun run build', status: 'pending', priority: 'high' }
```

If any required input is missing, `/implement` MUST stop and request remediation.

---

## Optimized Architecture

```mermaid
flowchart LR
  A[Plan Mode: /research] --> B[TodoWrite: AT-* + VT-*]
  B --> C[Act Mode: /implement]

  C --> D[@apex-dev: task runner]
  D --> E{Delegation?}
  E -->|convex/*| F[@database-specialist]
  E -->|src/components/*| G[@apex-ui-ux-designer]
  E -->|security/compliance| H[@code-reviewer]
  E -->|default| D

  D --> I[Phase checkpoints\n(lint/build/test)]
  I --> J[Completion report]
```

---

## Step 1: Load TodoWrite Tasks

Parse TodoWrite tasks created by `/research`:

### 1.2 Execution Mode

Mode: `one_shot_proactive`

> This mode is optimized for approved, deterministic execution. If required inputs or constitution checks fail, stop early and request remediation.

```yaml
todowrite_parsing:
  source: "TodoWrite state from /research"

  extract_fields:
    - id: "AT-XXX or VT-XXX"
    - content: "Task description with metadata"
    - status: "pending | in_progress | completed | failed"
    - priority: "high | medium | low"

  parse_metadata:
    # Expected format (created by /research via apex-researcher):
    # "[AT-001] Title | Phase: 3 | Files: src/x.ts" + optional fields
    # Subtasks are written as: "  ↳ [AT-001-A] Subtask description"
    from_content: "[ID] Title | Phase: N | Files: paths"
    extract:
      - phase: "[1-5] from Phase: N"
      - parallel_group: "[A|B|C|null] when present"
      - files_affected: "Array of file paths (from Files: ...)"
      - dependencies: "Array of task IDs this depends on (when present)"
      - test_strategy: "unit | integration | e2e | none (when present)"
      - rollback_strategy: "How to undo (when present)"
```

### 1.3 Validate Preconditions

Before doing ANY work (including task ordering), validate preconditions.

**Preconditions**:
- Bun is available and is the package manager used for this run.
- Repo is present and readable.
- TodoWrite contains at least one `pending` task.
- `.opencode/memory/constitution.md` exists.
- If the plan references spec artifacts, they exist under `.opencode/specs/[feature-id]/`.

```mermaid
flowchart TD
  S([Start /implement]) --> P{Bun available?}
  P -->|No| X1[Stop: install/configure Bun]
  P -->|Yes| T{TodoWrite has pending tasks?}
  T -->|No| X2[Stop: run /research or update TodoWrite]
  T -->|Yes| C{Constitution exists?}
  C -->|No| X3[Stop: create/restore constitution.md]
  C -->|Yes| O{Spec required by plan?}
  O -->|Yes| S2{Spec artifacts exist?}
  S2 -->|No| X4[Stop: create/restore spec artifacts]
  S2 -->|Yes| OK([Proceed])
  O -->|No| OK
```

---

## Step 2: Load Context

### 2.1 Load Constitution (Active Validation)

Load and validate the execution against `.opencode/memory/constitution.md`.

Rules are not informational — they are **active gates**:

- If a task violates the constitution, `/implement` MUST block that task.
- If a violation is fixable, add or request a remediation task.
- If compliance is triggered (LGPD/security/auth), ensure `@code-reviewer` review is executed before completion.

```yaml
constitution_context:
  path: ".opencode/memory/constitution.md"

  validate_tasks_against:
    - principle_1_bun_first: "No npm/yarn/pnpm commands"
    - principle_2_typescript_strict: "No 'any' types"
    - principle_3_lgpd_compliance: "Encryption/audit for PII"
    - principle_4_biome_standards: "Pass lint:check"
    - principle_5_convex_patterns: "Auth checks, indexes"
    - principle_6_test_coverage: "Include tests"
    - principle_7_accessibility: "WCAG 2.1 AA"
    - principle_8_portuguese_ui: "PT-BR user text"
    - principle_9_performance: "Bundle/lazy loading"
    - principle_10_functional: "No class components"
```

### 2.2 Load Spec (If Available)

```yaml
spec_context:
  path: ".opencode/specs/[feature-id]/spec.md"

  optional_artifacts:
    - data_model: ".opencode/specs/[feature-id]/data-model.md"
    - contracts: ".opencode/specs/[feature-id]/contracts.md"
    - quickstart: ".opencode/specs/[feature-id]/quickstart.md"

  use_for:
    - "Implementation guidance"
    - "Data model reference"
    - "API contract validation"
```

---

## Step 3: Order and Group Tasks

Apply **Ultra-Think Protocol (UTP)** here to avoid unnecessary work and to ensure safe ordering.

### 3.1 Phase-Based Ordering

Group tasks by phase (1→5) and resolve dependencies:

```yaml
phase_ordering:
  algorithm:
    1. Group tasks by phase: [1, 2, 3, 4, 5]
    2. Within phase, topological sort by dependencies
    3. Tasks with no dependencies can start immediately
    4. Tasks with dependencies wait for dependency completion

  phases:
    phase_1_setup:
      checkpoint: "bun install && bun run build"
      activities: ["directories", "dependencies", "config", "schema"]

    phase_2_test:
      checkpoint: "bun run test --run"
      activities: ["unit tests", "fixtures", "mocks"]

    phase_3_core:
      checkpoint: "bun run build && bun run lint:check && bun run test"
      activities: ["queries", "mutations", "hooks", "components"]

    phase_4_integration:
      checkpoint: "bun run build && bun run lint:check && bun run test"
      activities: ["routes", "auth guards", "middleware"]

    phase_5_polish:
      checkpoint: "bun run build && bun run lint:check && bun run test:coverage"
      activities: ["optimization", "cleanup", "docs", "accessibility"]
```

### 3.2 Parallel Group Batching (`parallel_tool_calling`) + Decision Table

Safe parallelization is optional and MUST follow UTP + constitution constraints.

**Strategy**: `parallel_tool_calling`
- Only parallelize tasks that are *provably independent*.
- Default to sequential if there is any uncertainty.

**Hard limits** (to reduce risk):
- Max parallel tasks per batch: **2**
- Never parallelize if *any* task in the batch touches:
  - auth/security/LGPD surfaces
  - schema/config files (e.g., `convex/schema.ts`, `vite.config.ts`)
  - generated files

**Rules**:
- Tasks with the same `parallel_group` MAY run concurrently.
- Tasks in the same parallel group MUST NOT modify the same files.
- `parallel_group = null` is always sequential.
- Dependencies always override parallelization.
- If compliance/security is triggered, force sequential + require `@code-reviewer` before completion.

**Decision table**:

| Condition | Example | Can run in parallel? | Notes |
|---|---|---:|---|
| Same `parallel_group` AND no shared files AND no unmet dependencies | AT-003 + AT-004 both group A, distinct files | Yes | Preferred case |
| Same `parallel_group` BUT shared files | both touch `convex/schema.ts` | No | Force sequential |
| Different `parallel_group` | group A vs B | Only if phases/deps allow | Default: keep sequential |
| Any unmet dependency | AT-005 depends on AT-004 | No | Wait for dependency |
| Any constitution gate uncertain (security/auth/LGPD) | auth changes | No | Run sequential + require review |

```yaml
parallel_batching:
  strategy: "parallel_tool_calling"
  max_parallel: 2

  example:
    batch_A:  # Concurrent execution
      - AT-002: "Write notification mutation tests"
      - AT-003: "Write notification UI tests"

    sequential:  # One at a time
      - AT-004: "Implement sendNotification mutation"
```

---

## Step 4: Invoke @apex-dev with Delegation

Apply **Ultra-Think Protocol (UTP)** before delegating and before implementing each task.

### 4.1 Delegation Rules

```yaml
delegation:
  by_file_pattern:
    "convex/*":
      agent: "@database-specialist"
      skills: ["convex_schema", "convex_queries", "convex_mutations"]

    "src/components/*":
      agent: "@apex-ui-ux-designer"
      skills: ["react_components", "tailwind", "accessibility"]

    "**/security/**":
      agent: "@code-reviewer"
      skills: ["owasp", "lgpd", "auth"]

    "default":
      agent: "@apex-dev"
      skills: ["typescript", "testing", "integration"]
```

### 4.2 Dynamic Skills Loading

```yaml
skills_by_task_type:
  setup:
    - "package_management"
    - "environment_config"
    - "directory_structure"

  test:
    - "vitest"
    - "testing_library"
    - "mock_patterns"

  core:
    - "typescript_strict"
    - "convex_patterns"
    - "react_hooks"

  integration:
    - "tanstack_router"
    - "clerk_auth"
    - "api_wiring"

  polish:
    - "code_splitting"
    - "bundle_optimization"
    - "documentation"
```

### 4.3 Task Execution Flow

For each task:

```yaml
task_execution:
  1_mark_in_progress:
    action: "Update TodoWrite status to 'in_progress'"

  2_check_dependencies:
    action: "Verify all dependency tasks are 'completed'"
    on_blocked: "Wait for dependencies"

  3_delegate_or_execute:
    action: "Route to appropriate agent based on files_affected"
    pass_context:
      - "constitution.md"
      - "spec.md (if available)"
      - "Task details and acceptance criteria"

  4_implement:
    action: "Execute task implementation"
    guidelines:
      - "Follow constitution principles"
      - "Match spec contracts (if available)"
      - "Meet acceptance criteria"

  5_validate:
    action: "Run acceptance criteria checks"
    on_pass: "Mark 'completed'"
    on_fail: "Execute rollback, mark 'failed'"
```

### 4.4 Postconditions (Validation + Commands + Sequence Diagram)

Each task MUST end in a validated postcondition.

**Validation commands (task-level)**:
- `bun run lint:check` (Biome)
- `bun run build` (TypeScript + build)
- `bun run test` (Vitest)

> Note: you may scope validations (e.g., tests only) during development for speed, but **a phase checkpoint MUST run the full required commands**.

**Postconditions**:
- Task status is one of: `completed` or `failed` (never left `in_progress`).
- If completed: acceptance criteria satisfied AND constitution gates still pass.
- If failed: rollback executed AND failure reason recorded.
- Phase checkpoint is executed at phase boundary.

```mermaid
sequenceDiagram
  autonumber
  participant R as /implement runner
  participant TD as TodoWrite
  participant AD as @apex-dev
  participant DS as @database-specialist
  participant UX as @apex-ui-ux-designer
  participant CR as @code-reviewer
  participant V as Validation (lint/build/test)

  R->>TD: Read pending tasks
  R->>AD: Start next task (UTP applied)
  AD->>TD: Mark in_progress

  alt Delegation needed
    AD->>DS: Implement Convex task
    DS-->>AD: Changes ready
  else UI task
    AD->>UX: Implement UI task
    UX-->>AD: Changes ready
  else Security/compliance validation
    AD->>CR: Review (read-only)
    CR-->>AD: Findings / approval
  end

  AD->>V: Run validations (phase/task scoped)
  alt Validation PASS
    AD->>TD: Mark completed
  else Validation FAIL
    AD->>AD: Execute rollback strategy
    AD->>TD: Mark failed + log reason
  end
```

---

## Step 5: Per-Phase Validation Checkpoints

Execute validation at each phase boundary:

```yaml
phase_checkpoints:
  after_phase_1:
    commands:
      - "bun install"
      - "bun run build"
    on_failure:
      - "Rollback all phase 1 tasks"
      - "Report setup errors"
      - "Halt execution"

  after_phase_2:
    commands:
      - "bun run test --run"
    on_failure:
      - "Rollback phase 2 tasks"
      - "Report test setup errors"
      - "Halt execution"

  after_phase_3:
    commands:
      - "bun run build"
      - "bun run lint:check"
      - "bun run test"
    on_failure:
      - "Rollback phase 3 tasks"
      - "Report core implementation errors"
      - "Halt execution"

  after_phase_4:
    commands:
      - "bun run build"
      - "bun run lint:check"
      - "bun run test"
    on_failure:
      - "Rollback phase 4 tasks"
      - "Report integration errors"
      - "Halt execution"

  after_phase_5:
    commands:
      - "bun run build"
      - "bun run lint:check"
      - "bun run test:coverage"
    on_failure:
      - "Rollback phase 5 tasks"
      - "Report polish errors"
      - "Continue with warnings"
```

---

## Step 6: Rollback on Failure

When a task fails, execute its rollback strategy:

```yaml
rollback_execution:
  strategies:
    file_created:
      action: "rm [path/to/file]"
      example: "rm src/components/notifications/NotificationBell.tsx"

    file_modified:
      action: "git checkout [path/to/file]"
      example: "git checkout convex/schema.ts"

    dependency_added:
      action: "bun remove [package]"
      example: "bun remove @tanstack/react-query"

    schema_migration:
      action: "git checkout convex/schema.ts && bunx convex deploy"
      example: "Revert schema changes and redeploy"

    multiple_files:
      action: "git checkout [files] && rm [new_files]"
      example: "git checkout src/lib/utils.ts && rm src/hooks/useNotifications.ts"

  on_rollback:
    - "Mark task as 'failed'"
    - "Log failure reason"
    - "Halt current phase"
    - "Report to user with details"
```

---

## Step 7: Completion Report (Simplified)

After all phases complete (or on halt), output a concise summary:

```md
---
## /implement concluído: [Feature Name]

### Resultado
- Build: PASS/FAIL
- Lint: PASS/FAIL
- Tests: PASS/FAIL (coverage: opcional)

### Execução
- Tasks: total X | completed Y | failed Z | skipped W

### Mudanças
- Arquivos alterados: [lista]
- Rollbacks executados: [lista ou "nenhum"]

### Próximos passos
- [1-3 bullets]
---
```

---

## Quick Reference

| Phase | Type | Checkpoint | Rollback Scope |
|-------|------|------------|----------------|
| 1 | setup | `bun install && bun run build` | Config only |
| 2 | test | `bun run test --run` | Test files only |
| 3 | core | `bun run build && lint && test` | Core files |
| 4 | integration | `bun run build && lint && test` | Integration files |
| 5 | polish | `bun run build && lint && test:coverage` | Polish files |

---

## Example Execution

```
/implement

Loading TodoWrite [10 tasks]...
Loading context [constitution.md, spec.md]...

Phase 1 (Setup): 2 tasks
  - AT-001: Create directory structure
  - AT-002: Add dependencies
  - Checkpoint: bun install && bun run build → PASS

Phase 2 (Tests): 3 tasks
  - AT-003: Write mutation tests (parallel A)
  - AT-004: Write UI tests (parallel A)
  - AT-005: Create test fixtures
  - Checkpoint: bun run test --run → PASS

Phase 3 (Core): 3 tasks
  - AT-006: Implement mutation [@database-specialist]
  - AT-007: Create component [@apex-ui-ux-designer]
  - AT-008: Add hook [@apex-dev]
  - Checkpoint: bun run build && bun run lint:check && bun run test → PASS

Phase 4 (Integration): 1 task
  - AT-009: Wire to route [@apex-dev]
  - Checkpoint: bun run build && bun run lint:check && bun run test → PASS

Phase 5 (Polish): 1 task
  - AT-010: Add documentation [@apex-dev]
  - Checkpoint: bun run build && bun run lint:check && bun run test:coverage → PASS

Validation Tasks:
  - VT-001: Build validation
  - VT-002: Lint check
  - VT-003: Test suite

Implementation Complete: 10/10 tasks successful
```

---
description: Execute approved plan from /research via @apex-dev in 5 phases
agent: apex-dev
---

# /implement | /implementar

Execute the approved implementation plan from TodoWrite.

## Trigger

- User approves research plan: "aprovar plano", "approve", "proceed"
- Direct command: `/implement`

---

## Step 1: Load TodoWrite Tasks

Parse TodoWrite tasks created by `/research`:

```yaml
todowrite_parsing:
  source: "TodoWrite state from /research"

  extract_fields:
    - id: "AT-XXX or VT-XXX"
    - content: "Task description with metadata"
    - status: "pending | in_progress | completed | failed"
    - priority: "high | medium | low"

  parse_metadata:
    from_content: "[ID] Title | Phase: N | Files: paths"
    extract:
      - phase: "[1-5] from Phase: N"
      - parallel_group: "[A|B|C|null] from parallel group marker"
      - files_affected: "Array of file paths"
      - dependencies: "Array of task IDs this depends on"
      - test_strategy: "unit | integration | e2e | none"
      - rollback_strategy: "Command to undo changes"
```

---

## Step 2: Load Context

### 2.1 Load Constitution

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

### 3.2 Parallel Group Batching

Identify tasks that can run concurrently:

```yaml
parallel_batching:
  rules:
    - "Tasks with same parallel_group can run in parallel"
    - "Tasks in same group MUST NOT modify same files"
    - "null parallel_group = sequential execution"

  example:
    batch_A:  # Concurrent execution
      - AT-002: "Write notification mutation tests"
      - AT-003: "Write notification UI tests"

    sequential:  # One at a time
      - AT-004: "Implement sendNotification mutation"
```

---

## Step 4: Invoke @apex-dev with Delegation

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

## Step 7: Generate Completion Report

After all phases complete (or on halt), generate summary:

```yaml
completion_report:
  format: |
    ---
    ## ✅ Implementation Complete: [Feature Name]

    ### Task Summary
    | Phase | Total | Completed | Failed | Skipped |
    |-------|-------|-----------|--------|---------|
    | 1 Setup | X | Y | Z | W |
    | 2 Tests | X | Y | Z | W |
    | 3 Core | X | Y | Z | W |
    | 4 Integration | X | Y | Z | W |
    | 5 Polish | X | Y | Z | W |

    ### Validation Results
    | Check | Status | Details |
    |-------|--------|---------|
    | Build | ✅/❌ | [output] |
    | Lint | ✅/❌ | [output] |
    | Tests | ✅/❌ | [coverage]% |

    ### Files Changed
    - [list of modified files]

    ### Rollbacks Executed
    - [list of rollbacks if any]

    ### Next Steps
    - [recommendations based on outcome]
    ---

  include:
    - "Task completion counts by phase"
    - "Validation command outputs"
    - "Files created/modified"
    - "Rollbacks executed (if any)"
    - "Recommendations for next steps"
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
  ✓ AT-001: Create directory structure
  ✓ AT-002: Add dependencies
  ✓ Checkpoint: bun install && bun run build → PASS

Phase 2 (Tests): 3 tasks
  ✓ AT-003: Write mutation tests (parallel A)
  ✓ AT-004: Write UI tests (parallel A)
  ✓ AT-005: Create test fixtures
  ✓ Checkpoint: bun run test --run → PASS

Phase 3 (Core): 3 tasks
  ✓ AT-006: Implement mutation [@database-specialist]
  ✓ AT-007: Create component [@apex-ui-ux-designer]
  ✓ AT-008: Add hook [@apex-dev]
  ✓ Checkpoint: bun run build && lint && test → PASS

Phase 4 (Integration): 1 task
  ✓ AT-009: Wire to route [@apex-dev]
  ✓ Checkpoint: bun run build && lint && test → PASS

Phase 5 (Polish): 1 task
  ✓ AT-010: Add documentation [@apex-dev]
  ✓ Checkpoint: bun run build && lint && test:coverage → PASS

Validation Tasks:
  ✓ VT-001: Build validation
  ✓ VT-002: Lint check
  ✓ VT-003: Test suite

✅ Implementation Complete: 10/10 tasks successful
```

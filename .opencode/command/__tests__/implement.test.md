---
description: Test scenarios for /implement command execution
test_runner: ai-agent
---

# Implement Command Tests

Test scenarios for validating the `/implement` command behavior.

---

## Test Suite: TodoWrite Parsing

### TEST-I001: Parse Task with All Metadata

**Given**: TodoWrite task with full metadata
**When**: /implement parses tasks
**Then**:
- `id` extracted correctly
- `phase` parsed from content
- `files_affected` extracted
- `dependencies` resolved
- `parallel_group` identified

**Example Input**:
```javascript
{
  id: "AT-001",
  content: "[AT-001] Create schema | Phase: 1 | Files: convex/schema.ts",
  status: "pending"
}
```

**Expected Parse Result**:
```yaml
id: "AT-001"
title: "Create schema"
phase: 1
files_affected: ["convex/schema.ts"]
status: "pending"
```

---

### TEST-I002: Parse Subtask Hierarchy

**Given**: TodoWrite with parent and subtasks
**When**: /implement parses tasks
**Then**:
- Parent task identified
- Subtasks linked to parent
- Subtask hierarchy preserved

**Example Input**:
```javascript
[
  { id: "AT-001", content: "[AT-001] Main Task" },
  { id: "AT-001-A", content: "  ↳ [AT-001-A] Subtask A" },
  { id: "AT-001-B", content: "  ↳ [AT-001-B] Subtask B" }
]
```

**Expected**: Subtasks linked to AT-001

---

## Test Suite: Phase Ordering

### TEST-I010: Order Tasks by Phase

**Given**: Tasks with phases [3, 1, 2, 5, 4]
**When**: /implement orders tasks
**Then**: Execution order is [1, 2, 3, 4, 5]

**Example**:
```yaml
input_order:
  - AT-003 (phase: 3)
  - AT-001 (phase: 1)
  - AT-002 (phase: 2)

expected_order:
  - AT-001 (phase: 1)
  - AT-002 (phase: 2)
  - AT-003 (phase: 3)
```

---

### TEST-I011: Respect Dependencies Within Phase

**Given**: Two phase-3 tasks where AT-004 depends on AT-003
**When**: /implement orders tasks
**Then**: AT-003 executes before AT-004

---

### TEST-I012: All Phase 1 Before Phase 2

**Given**: Mixed phase 1 and 2 tasks
**When**: /implement executes
**Then**: All phase 1 tasks complete before any phase 2 starts

---

## Test Suite: Parallel Grouping

### TEST-I020: Batch Parallel Group Tasks

**Given**: Tasks with parallel_group "A"
**When**: /implement identifies batches
**Then**: Tasks with same group batched together

**Example**:
```yaml
tasks:
  - id: AT-002, parallel_group: "A"
  - id: AT-003, parallel_group: "A"
  - id: AT-004, parallel_group: null

expected_batches:
  - batch_1: [AT-002, AT-003]  # Parallel
  - batch_2: [AT-004]          # Sequential
```

---

### TEST-I021: No File Conflicts in Parallel Group

**Given**: Two tasks modifying same file
**When**: Assigned to same parallel group
**Then**: Validation FAILS - tasks must be sequential

---

### TEST-I022: Sequential When Dependencies Exist

**Given**: Task with dependencies
**When**: Assigned parallel_group
**Then**: Dependencies still respected (waits for deps)

---

## Test Suite: Delegation

### TEST-I030: Delegate Convex Files to Database Specialist

**Given**: Task affecting `convex/schema.ts`
**When**: /implement routes task
**Then**: Delegated to `@database-specialist`

---

### TEST-I031: Delegate Components to UI Designer

**Given**: Task affecting `src/components/Button.tsx`
**When**: /implement routes task
**Then**: Delegated to `@apex-ui-ux-designer`

---

### TEST-I032: Delegate Security Tasks to Code Reviewer

**Given**: Task with security validation
**When**: /implement routes task
**Then**: Delegated to `@code-reviewer`

---

### TEST-I033: Default to apex-dev

**Given**: Task affecting `src/lib/utils.ts`
**When**: /implement routes task
**Then**: Handled by `@apex-dev` (no delegation)

---

## Test Suite: Rollback

### TEST-I040: Rollback New File

**Given**: Task that created `src/components/New.tsx`
**When**: Task fails
**Then**: Execute `rm src/components/New.tsx`

---

### TEST-I041: Rollback Modified File

**Given**: Task that modified `convex/schema.ts`
**When**: Task fails
**Then**: Execute `git checkout convex/schema.ts`

---

### TEST-I042: Rollback Added Dependency

**Given**: Task that added `@tanstack/react-query`
**When**: Task fails
**Then**: Execute `bun remove @tanstack/react-query`

---

### TEST-I043: Mark Task as Failed After Rollback

**Given**: Rollback executed successfully
**When**: TodoWrite updated
**Then**: Task status is "failed"

---

## Test Suite: Validation Checkpoints

### TEST-I050: Phase 1 Checkpoint

**Given**: Phase 1 tasks complete
**When**: Checkpoint runs
**Then**: Execute `bun install && bun run build`

---

### TEST-I051: Checkpoint Failure Halts Phase

**Given**: `bun run build` fails in phase 3 checkpoint
**When**: Failure detected
**Then**:
- Rollback all phase 3 tasks
- Do not proceed to phase 4
- Report error to user

---

### TEST-I052: Continue After Phase 5 Warning

**Given**: `bun run test:coverage` below threshold in phase 5
**When**: Warning detected
**Then**:
- Log warning
- Continue with report (non-blocking)

---

### TEST-I053: All Validation Tasks Run at End

**Given**: Implementation complete
**When**: Validation phase
**Then**: VT-001, VT-002, VT-003 executed in order

---

## Test Suite: Completion Report

### TEST-I060: Report Task Summary

**Given**: 10 tasks (8 completed, 1 failed, 1 skipped)
**When**: Report generated
**Then**: Summary shows counts per phase

---

### TEST-I061: Report Validation Results

**Given**: build PASS, lint FAIL
**When**: Report generated
**Then**: Validation table shows status + output

---

### TEST-I062: Report Rollbacks Executed

**Given**: 2 rollbacks executed
**When**: Report generated
**Then**: Rollback section lists both actions

---

### TEST-I063: Report Next Steps

**Given**: Some tasks failed
**When**: Report generated
**Then**: Next steps include "Review failed tasks" recommendation

---

## Test Runner Instructions

These tests are validated by AI agents during command execution:

1. **Before Implement**: Verify TodoWrite loaded correctly
2. **During Execution**: Track phase transitions and delegations
3. **On Failure**: Validate rollback executed correctly
4. **After Completion**: Verify report matches expected format

```yaml
validation_checklist:
  parsing:
    - [ ] All tasks have valid IDs
    - [ ] Phases are 1-5
    - [ ] Dependencies reference existing tasks

  ordering:
    - [ ] Phase 1 before 2 before 3...
    - [ ] Dependencies respected
    - [ ] Parallel groups batched

  delegation:
    - [ ] Correct agent for file patterns
    - [ ] Context passed to delegates

  rollback:
    - [ ] Strategy executed on failure
    - [ ] Task marked failed
    - [ ] Phase halted

  report:
    - [ ] Counts accurate
    - [ ] Validation results included
    - [ ] Rollbacks listed
```

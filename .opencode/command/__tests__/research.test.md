---
description: Test scenarios for /research command validation
test_runner: ai-agent
---

# Research Command Tests

Test scenarios for validating the `/research` command behavior.

---

## Test Suite: YAML Validation

### TEST-R001: Valid Research Report Structure

**Given**: A properly formatted research report YAML
**When**: Plan Agent processes the report
**Then**:
- `research_report.summary` is a non-empty string
- `research_report.complexity` matches pattern `L[1-10]`
- `research_report.key_findings` is a non-empty array
- `atomic_tasks_proposal` contains at least one task
- `validation_tasks` includes VT-001, VT-002, VT-003

**Example Valid Input**:
```yaml
research_report:
  summary: "Add button variant to shadcn/ui"
  complexity: "L3"
  key_findings:
    - finding: "Button uses cva() for variants"
      confidence: "high"
      source: "serena"
atomic_tasks_proposal:
  - id: "AT-001"
    title: "Add variant to button.tsx"
validation_tasks:
  - id: "VT-001"
    command: "bun run build"
```

**Expected**: Validation PASSES

---

### TEST-R002: Invalid Complexity Level

**Given**: Research report with invalid complexity
**When**: Plan Agent validates structure
**Then**: Validation FAILS with error "Invalid complexity level"

**Example Invalid Input**:
```yaml
research_report:
  complexity: "L15"  # Invalid: must be L1-L10
```

**Expected**: Validation FAILS

---

### TEST-R003: Missing Key Findings

**Given**: Research report without key_findings
**When**: Plan Agent validates structure
**Then**: Validation FAILS with error "Missing key_findings"

**Example Invalid Input**:
```yaml
research_report:
  summary: "Test"
  complexity: "L3"
  key_findings: []  # Invalid: must not be empty
```

**Expected**: Validation FAILS

---

## Test Suite: Spec Generation

### TEST-R010: Spec Persistence for L3 Complexity

**Given**: Research report with complexity L3
**When**: Plan Agent persists spec
**Then**:
- Spec file created at `.opencode/specs/[feature-id]/spec.md`
- Spec contains Summary, Scope, Key Findings, Atomic Tasks
- No additional artifacts (data-model, contracts, quickstart)

---

### TEST-R011: Spec Persistence for L7+ Complexity

**Given**: Research report with complexity L7
**When**: Plan Agent persists spec
**Then**:
- Main spec at `.opencode/specs/[feature-id]/spec.md`
- Additional artifacts created:
  - `.opencode/specs/[feature-id]/data-model.md`
  - `.opencode/specs/[feature-id]/contracts.md`
  - `.opencode/specs/[feature-id]/quickstart.md`

---

### TEST-R012: Feature ID Slugification

**Given**: Research topic "Lead Scoring System (v2)"
**When**: Feature ID generated
**Then**: Feature ID is "lead-scoring-system-v2" (lowercase, hyphens, no special chars)

---

## Test Suite: Constitution Compliance

### TEST-R020: Pass All Principles

**Given**: Atomic tasks that comply with all 10 principles
**When**: Constitution validation runs
**Then**:
- `constitution_compliance.validated` is true
- `constitution_compliance.violations` is empty array
- All `principles_checked` show status "pass"

---

### TEST-R021: LGPD Violation Detection

**Given**: Task that accesses CPF without encryption
**When**: Constitution validation runs
**Then**:
- `constitution_compliance.validated` is false
- Violation recorded for principle `lgpd_compliance`
- Remediation task added to `remediation_tasks`

**Example**:
```yaml
atomic_tasks_proposal:
  - id: "AT-003"
    title: "Store student CPF"
    files_affected: ["convex/students.ts"]
    # Missing encryption = LGPD violation
```

---

### TEST-R022: TypeScript Strict Violation

**Given**: Task description mentioning "any" type
**When**: Constitution validation runs
**Then**:
- Violation recorded for principle `typescript_strict`
- Task flagged with ⚠️ marker

---

## Test Suite: TodoWrite Creation

### TEST-R030: Simple Task TodoWrite (L1-L4)

**Given**: Complexity L3 with 2 atomic tasks
**When**: TodoWrite created
**Then**:
- Tasks ordered by phase
- No subtasks created
- Validation tasks at end

**Expected TodoWrite**:
```javascript
todowrite([
  { id: "AT-001", content: "[AT-001] Task 1 | Phase: 1", status: "pending" },
  { id: "AT-002", content: "[AT-002] Task 2 | Phase: 3", status: "pending" },
  { id: "VT-001", content: "[VT-001] Build validation", status: "pending" }
])
```

---

### TEST-R031: Complex Task TodoWrite (L5+)

**Given**: Complexity L6 with subtasks
**When**: TodoWrite created
**Then**:
- Main tasks with subtasks
- Subtasks prefixed with "  ↳"
- Subtasks immediately follow parent

**Expected TodoWrite**:
```javascript
todowrite([
  { id: "AT-001", content: "[AT-001] Main Task", status: "pending" },
  { id: "AT-001-A", content: "  ↳ [AT-001-A] Subtask A", status: "pending" },
  { id: "AT-001-B", content: "  ↳ [AT-001-B] Subtask B", status: "pending" }
])
```

---

## Test Runner Instructions

These tests are validated by AI agents during command execution:

1. **Before Research**: Load test expectations
2. **During Research**: Validate YAML structure progressively
3. **After Research**: Verify spec persistence and TodoWrite format
4. **On Failure**: Report which test case failed with details

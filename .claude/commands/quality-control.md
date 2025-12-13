---
title: "NeonPro Code Quality Control - Advanced Standards"
last_updated: 2025-11-23
form: reference
tags: [quality, healthcare, bun, oxlint, lgpd, compliance, research-driven, planning-first, biome, vitest]
related:
  - ../architecture/tech-stack.md
  - ../architecture/frontend-architecture.md
  - frontend-testing.md
  - research.md
  - ../agents/apex-researcher.md
---

# 🔍 NeonPro Code Quality Control - Advanced Standards

**Strict, research-driven quality control with comprehensive planning, atomic task decomposition, and healthcare compliance**

## 🎯 Core Philosophy

**Mantra**: _"Detect → Research → Plan → Decompose → Implement → Validate"_

**Mission**: Research-first quality control that prioritizes authoritative solutions over quick fixes, ensuring all code improvements are based on official documentation, best practices, and healthcare compliance standards.

**Quality Standard**: ≥9.5/10 rating with ≥95% cross-validation accuracy for all quality improvements.

## 🚀 Advanced Toolchain & Standards

We use a state-of-the-art toolchain optimized for speed and strictness.

### 1. Toolchain Components
- **Package Manager**: **Bun** (3-5x faster than npm/pnpm)
- **Linting & Formatting**: **Biome** (Primary)
  - Handles formatting, linting, and import sorting.
  - **OXLint**: Secondary, used for ultra-fast pre-check scans.
- **Testing**: **Vitest** with Typechecking enabled.
  - **Coverage**: 90%+ Strict enforcement.
- **Documentation**: **Context7 MCP** + **Serena MCP** for semantic understanding.

### 2. Configuration Standards

#### Biome (Strict Mode)
Our `biome.json` is configured for production-grade quality:
- **Organize Imports**: Enabled. Imports are automatically sorted and grouped.
- **Strict Rules**:
  - `noExplicitAny`: **WARN** (Transitioning to ERROR). Use strict types.
  - `noUnusedVariables`: **ERROR**. Dead code is not allowed.
  - `useExhaustiveDependencies`: **ERROR**. React hooks must be correct.
  - `noDangerouslySetInnerHtml`: **ERROR**. Security violation.
  - `noAccumulatingSpread`: **ERROR**. Performance optimization.
  - `useConst`: **ERROR**. Prefer const over let.

#### Vitest (Enhanced)
Our `vitest.config.ts` ensures reliability and coverage:
- **Type Checking**: Enabled (`typecheck: { enabled: true }`). Tests fail if types are invalid.
- **Coverage**: 90% threshold for branches, functions, lines, and statements.
- **Reporters**: Verbose and JUnit for CI visibility.
- **Isolation**: Full test isolation enabled.

---

## 📋 4-Phase Planning-First Workflow

### 🧭 Phase 0: Workflow Discovery & Evidence Gathering

**Purpose**: Mirror real user workflows before validating fixes so diagnostics and validation commands stay aligned with production behavior.

- **Source mapping**: Read README, AGENTS/CLAUDE rules, docs/, and onboarding guides.
- **Pattern scan**: Identify architecture, naming, testing patterns.
- **Workflow catalog**: Convert documented journeys into E2E scenarios.

---

### 🔍 Phase 1: Error Detection & Analysis

**Objective**: Comprehensive identification and cataloging of all code quality issues using automated tools and semantic analysis.

#### 1.1 Detection Workflow
```bash
# Step 1: Strict Linting & Formatting
bun check .          # Biome strict check
bun type-check       # TypeScript strict validation

# Step 2: Semantic Analysis (Serena)
# Find all instances of a specific error pattern
serena_mcp.search_for_pattern(pattern="error_pattern", context_lines=5)
```

#### 1.2 Error Categories & Severity
| Category | Severity | Examples |
| :--- | :--- | :--- |
| **Type Safety** | **Critical** | `any` types, missing definitions, unsafe assertions |
| **Security** | **Critical** | SQL injection, XSS risks (`dangerouslySetInnerHtml`), LGPD violations |
| **Performance** | **High** | Accumulating spread, missing memoization, large bundles |
| **Correctness** | **High** | Unused variables, hook dependency errors |

#### 1.3 Error Catalog Template
```yaml
ERROR_CATALOG_ENTRY:
  error_id: "QC-001"
  type: "TypeScript | Security | Performance"
  severity: "Critical | High"
  location: "src/components/User.tsx:45"
  message: "Detailed error message"
  impact: "Does it break functionality or security?"
```

---

### 🔬 Phase 2: Research-Driven Solution Planning

**Objective**: Leverage authoritative sources to develop research-backed solutions.

#### 2.1 Research Workflow
1.  **Context Analysis**: Understand the error scope.
2.  **Source Discovery**: Use **Context7 MCP** to find official docs.
    -   *Query Example*: "Context7.get_library_docs('react', 'useEffect dependency best practices')"
3.  **Constitutional Review**: Check LGPD compliance for data-related fixes.

#### 2.2 Research Intelligence Report Template
```markdown
# Research Report: QC-XXX
## Analysis
- **Error**: [Details]
- **Root Cause**: [Explanation]

## Research Findings (Context7/Official Docs)
- **Source**: [URL/Doc Reference]
- **Best Practice**: [Summary of official guidance]

## Solution Recommendation
- **Approach**: [Detailed plan]
- **Confidence**: [95%+]
```

---

### 🎯 Phase 3: Atomic Task Decomposition

**Objective**: Break down fixes into atomic, testable tasks (approx. 20 mins each).

#### 3.1 Atomic Task Template
```yaml
ATOMIC_TASK:
  task_id: "QC-XXX-T1"
  name: "Specific, actionable task name"
  action: "Exact code change or command"
  validation: "Command to verify this specific task (e.g., bun test file)"
  rollback: "How to revert this specific change"
```

#### 3.2 Decomposition Strategy
-   **Granularity**: Tasks should take 15-25 minutes.
-   **Independence**: Tasks should be testable in isolation where possible.
-   **Sequencing**: Type definitions -> Implementation -> Tests.

---

### ⚡ Phase 4: Systematic Execution & Validation

**Objective**: Implement fixes with continuous validation using specific agent workflows.

#### 4.1 Execution Workflow
1.  **Pre-check**: Ensure `bun check` represents the baseline.
2.  **Implementation**: Execute atomic tasks one by one.
3.  **Validation**: Run `bun check` and `bun test` after EACH task.
4.  **Integration**: Commit changes only when all gates pass.

#### 4.2 Agent Workflows (Implementation Guides)

**Use these templates to drive the agents:**

**@code-reviewer: Refactoring & Standards**
```bash
@code-reviewer "Refactor [file/component] to meet strict Biome standards."
# Agent Actions:
# 1. Run `bun check [file]`
# 2. Fix imports (organizeImports)
# 3. Replace `any` with strict types
# 4. Fix hook dependencies
# 5. Verify with `bun check` and `bun type-check`
```

**@test-auditor: Coverage & Reliability**
```bash
@test-auditor "Audit [file/component] for 90% coverage."
# Agent Actions:
# 1. Run `bun test [file] --coverage`
# 2. Identify uncovered branches
# 3. Generate missing test cases
# 4. Verify 90% threshold
```

---

## 📊 Quality Gates

| Gate | Tool | Threshold | Blocking? | Command |
| :--- | :--- | :--- | :--- | :--- |
| **Syntax/Style** | Biome | Zero Errors | YES | `bun check` |
| **Type Safety** | TypeScript | Zero Errors | YES | `bun type-check` |
| **Testing** | Vitest | 100% Pass | YES | `bun test` |
| **Coverage** | Vitest | 90% Coverage | YES | `bun test:coverage` |
| **Security** | OXLint | Zero High Severity | YES | `bun lint:security` |
| **Compliance** | LGPD | 100% Compliance | YES | `bun validate:lgpd` |

---

## 📚 Comprehensive Example: TypeScript & LGPD Fix

**Scenario**: Missing type definitions for sensitive patient data.

**Phase 1: Detection**
-   **Error**: `Property 'cpf' does not exist on type 'Patient'`
-   **Severity**: Critical (Type Safety + LGPD Risk)

**Phase 2: Research**
-   **Context7**: Search TypeScript docs for "Interface extension" and LGPD docs for "PII handling".
-   **Finding**: Sensitive fields like CPF must be typed and documented as PII.

**Phase 3: Planning (Atomic Tasks)**
-   **T1**: Update `Patient` interface in `types/patient.ts` with `cpf` and JSDoc `@lgpd`.
-   **T2**: Update `PatientForm` to handle `cpf` validation.
-   **T3**: Add unit test for CPF validation.

**Phase 4: Execution**
1.  **Run T1**: Edit file. Run `bun type-check`. (Pass)
2.  **Run T2**: Edit file. Run `bun check`. (Pass)
3.  **Run T3**: Create test. Run `bun test`. (Pass)
4.  **Final**: Run `bun quality`. (All Pass)

---

## 🛠️ Tool Reference Guide

### MCP Tools
-   **Serena MCP**: Semantic search (`search_for_pattern`, `find_symbol`).
-   **Context7 MCP**: Documentation (`get_library_docs`).
-   **Desktop Commander**: File edits (`edit_block`).

### Quick Commands
```bash
# Quality Check (Full)
bun quality

# Linting & Formatting (Biome)
bun check         # Check only
bun check --write # Auto-fix

# Testing
bun test          # Run tests
bun test:coverage # Run coverage
bun type-check    # Check types
```

---
*Version: 3.1 - Advanced Standards & Detailed Methodology*

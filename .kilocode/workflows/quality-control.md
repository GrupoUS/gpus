---
title: "AegisWallet Code Quality Control"
last_updated: 2025-11-25
form: reference
tags: [quality, bun, oxlint, compliance]
---

# 🔍 AegisWallet Code Quality Control

**Research-driven quality control with 4-phase workflow**

## 🎯 Core Philosophy

**Mantra**: _"Detect → Research → Plan → Execute"_

**Mission**: Research-first quality control ensuring all improvements are based on authoritative documentation and best practices.

**Quality Standard**: ≥9.5/10 rating with ≥95% validation accuracy

## 📋 4-Phase Workflow Overview

```yaml
QUALITY_CONTROL_PHASES:
  phase_1_detection:
    name: "Error Detection & Analysis"
    tools: ["OXLint", "Serena MCP", "TypeScript", "Biome"]
    output: "Comprehensive error catalog with severity classification"

  phase_2_research:
    name: "Research-Driven Solution Planning"
    tools: ["Context7 MCP", "Tavily MCP"]
    output: "Research intelligence report with authoritative solutions"

  phase_3_planning:
    name: "Atomic Task Decomposition"
    tools: ["Sequential Thinking"]
    output: "Detailed atomic subtasks with implementation roadmap"

  phase_4_execution:
    name: "Systematic Implementation"
    tools: ["Desktop Commander", "Serena MCP", "Quality Gates"]
    output: "Validated fixes with compliance verification"
```

## 🔍 Phase 1: Error Detection & Analysis

**Objective**: Comprehensive identification and cataloging of all code quality issues.

### Detection Tools & Usage

```yaml
PRIMARY_DETECTION_TOOLS:
  oxlint:
    purpose: "Primary linter with 570+ rules and compliance"
    performance: "50-100x faster than ESLint"
    usage: "bun lint"
    coverage: "90% of quality issues"

  serena_mcp:
    purpose: "Semantic codebase search and pattern analysis"
    usage: "Mandatory for codebase search (NOT native tools)"
    coverage: "Error pattern analysis across codebase"

  typescript:
    purpose: "Type safety and strict mode enforcement"
    usage: "bun type-check"
    coverage: "Type errors and interface violations"

  biome:
    purpose: "Code formatting and style consistency"
    usage: "bun format"
    coverage: "10% formatting issues"
```

### Error Detection Workflow

```bash
# Run comprehensive quality checks
bun quality              # All quality gates
bun lint                 # OXLint 50-100x faster validation
bun type-check          # TypeScript strict mode
bun format:check        # Biome formatting validation

# Use Serena MCP for pattern analysis
# Search for error patterns across codebase
# Example: Find all instances of a specific error pattern
# serena_mcp.search_for_pattern(pattern="error_pattern", context_lines=5)
```

### Error Cataloging Template

```yaml
ERROR_CATALOG_ENTRY:
  error_id: "Unique identifier (e.g., QC-001)"
  timestamp: "Detection timestamp"

  error_details:
    type: "TypeScript | React | Import | Security | Performance"
    severity: "Critical | High | Medium | Low"
    error_code: "Specific error code from tool (e.g., TS2345)"
    message: "Full error message from tool"

  location:
    file_path: "Relative path from project root"
    line_number: "Specific line number"
    code_snippet: "Surrounding code context (5 lines before/after)"

  context:
    component_name: "Affected component/module"
    feature_area: "Feature domain (e.g., financial-management, transactions)"
    dependencies: "Related files or modules affected"

  impact_assessment:
    functionality_impact: "Does it break functionality?"
    security_impact: "Does it introduce security risks?"
    compliance_impact: "Does it violate compliance requirements?"
    performance_impact: "Does it affect performance?"

  classification:
    category: "Code Quality | Security | Compliance | Performance | Testing"
    priority: "P0 (Critical) | P1 (High) | P2 (Medium) | P3 (Low)"
    financial_related: "Boolean - affects financial data or transactions"
```

### Error Categories & Severity

```yaml
ERROR_CATEGORIES:
  code_quality_type_safety:
    severity_critical:
      - "TypeScript strict mode violations with any types"
      - "Missing type definitions for financial data"
      - "Unsafe type assertions in financial contexts"
    severity_high:
      - "Type mismatches in API contracts"
      - "Missing null checks for critical data"
      - "Incorrect generic type usage"

  security_compliance:
    severity_critical:
      - "Financial data exposure without encryption"
      - "Missing consent validation"
      - "SQL injection vulnerabilities"
      - "Authentication bypass possibilities"
    severity_high:
      - "Insecure data handling patterns"
      - "Missing input sanitization"
      - "Weak session management"
      - "Audit logging gaps for financial data"

  performance_bundle_issues:
    severity_critical:
      - "Memory leaks in financial data handling"
      - "Blocking operations in critical paths"
      - "Excessive bundle size (>500KB)"
    severity_high:
      - "Inefficient database queries"
      - "Missing code splitting"
      - "Unoptimized images/assets"

  testing_coverage:
    severity_critical:
      - "Zero test coverage for financial data handling"
      - "Missing security tests for authentication"
      - "No E2E tests for critical workflows"
    severity_high:
      - "Test coverage <90% for critical components"
      - "Missing integration tests for APIs"
      - "Flaky tests in CI/CD pipeline"
```

## 🔬 Phase 2: Research-Driven Solution Planning

**Objective**: Leverage authoritative sources to develop research-backed solutions.

### Research Workflow

```yaml
RESEARCH_WORKFLOW:
  step_1_context_analysis:
    action: "Understand the error context and implications"
    tools: ["Sequential Thinking", "Serena MCP"]
    output: "Comprehensive error context analysis"

  step_2_source_discovery:
    action: "Search authoritative documentation and best practices"
    tools: ["Context7 MCP", "Tavily MCP", "Archon MCP"]
    output: "Relevant documentation and solution patterns"

  step_3_multi_source_validation:
    action: "Cross-reference findings across multiple sources"
    tools: ["Sequential Thinking"]
    output: "Validated solution approaches with confidence levels"

  step_4_compliance_review:
    action: "Ensure compliance with project standards and regulations"
    tools: ["Compliance Validation", "Security Standards"]
    output: "Compliance-validated solution recommendations"
```

### Research Sources by Error Category

```yaml
RESEARCH_SOURCES:
  typescript_type_safety:
    primary_sources:
      - "TypeScript Official Documentation"
      - "TypeScript Deep Dive"
      - "React TypeScript Cheatsheet"
    search_strategy: "Context7 → TypeScript docs → React TypeScript patterns"

  react_patterns:
    primary_sources:
      - "React Official Documentation"
      - "React 19 Release Notes"
      - "TanStack Query v5 Documentation"
      - "TanStack Router v5 Documentation"
    search_strategy: "Context7 → React docs → TanStack ecosystem"

  security_compliance:
    primary_sources:
      - "OWASP Top 10 and Security Guidelines"
      - "Supabase Security Best Practices"
      - "Financial Regulations Documentation"
    search_strategy: "Context7 → Security standards → Financial regulations"

  performance_optimization:
    primary_sources:
      - "Web.dev Performance Guidelines"
      - "Vite Performance Optimization"
      - "React Performance Optimization"
      - "Bun Performance Best Practices"
    search_strategy: "Context7 → Performance docs → Framework-specific optimization"
```

## 🎯 Phase 3: Atomic Task Decomposition

**Objective**: Break down each quality issue into detailed, actionable atomic subtasks.

### Atomic Task Template

```yaml
ATOMIC_TASK_TEMPLATE:
  task_metadata:
    task_id: "QC-XXX-T1 (Quality Control - Error ID - Task Number)"
    parent_error_id: "QC-XXX"
    task_name: "Descriptive task name (max 60 chars)"
    estimated_time: "Time estimate in minutes (20 min = 1 professional unit)"
    priority: "P0 | P1 | P2 | P3"

  error_context:
    error_description: "Clear description of the specific error"
    error_location: "File path, line number, code snippet"
    error_impact: "What breaks or is affected by this error"
    related_errors: "Other errors that must be fixed together"

  research_backed_solution:
    solution_approach: "Detailed solution based on research findings"
    authoritative_sources: "Links to official documentation used"
    best_practices: "Relevant best practices from research"
    code_examples: "Example implementations from documentation"
    confidence_level: "Percentage (must be ≥85% to proceed)"

  implementation_steps:
    step_1:
      action: "Specific action to take"
      command: "Exact command or code change"
      expected_result: "What should happen"
      validation: "How to verify this step worked"

  validation_criteria:
    functional_validation:
      - "Specific functionality to test"
      - "Expected behavior after fix"
      - "Edge cases to verify"

    quality_validation:
      - "OXLint passes with zero errors for this issue"
      - "TypeScript type checking passes"
      - "No new warnings introduced"

    compliance_validation:
      - "Compliance requirements maintained"
      - "Security standards upheld"
      - "Financial regulations followed"

  risk_assessment:
    implementation_risks:
      risk_1:
        description: "Potential risk description"
        likelihood: "High | Medium | Low"
        impact: "Critical | High | Medium | Low"
        mitigation: "How to prevent or minimize this risk"

  rollback_procedure:
    rollback_steps:
      - "Step-by-step rollback instructions"
      - "How to verify rollback success"
```

### Task Decomposition Principles

```yaml
DECOMPOSITION_PRINCIPLES:
  atomic_unit_definition:
    - "Each task represents ~20 minutes of professional developer time"
    - "Task is independently testable and verifiable"
    - "Task has clear success criteria"
    - "Task can be rolled back independently"

  task_granularity_guidelines:
    appropriate:
      - "Task takes 15-25 minutes to complete"
      - "Task has single, clear objective"
      - "Task has specific validation criteria"
      - "Task can be completed in one session"

  task_sequencing:
    parallel_tasks:
      - "Tasks with no dependencies can run in parallel"
      - "Independent error fixes in different files"
      - "Non-conflicting code changes"

    sequential_tasks:
      - "Tasks with dependencies must be ordered"
      - "Foundation changes before dependent changes"
      - "Type definitions before implementations"
```

## ⚡ Phase 4: Systematic Execution

**Objective**: Implement fixes systematically with continuous validation and compliance verification.

### Execution Workflow

**CRITICAL RULE**: Only begin implementation after completing Phases 1-3

```yaml
EXECUTION_WORKFLOW:
  pre_execution_checklist:
    - "✅ All errors cataloged with severity classification"
    - "✅ Research completed with ≥95% confidence"
    - "✅ Atomic tasks created with detailed implementation steps"
    - "✅ Risk assessment completed for all tasks"
    - "✅ Rollback procedures documented"

  execution_phases:
    phase_4a_preparation:
      - "Review all atomic tasks and dependencies"
      - "Identify parallel vs sequential tasks"
      - "Set up task tracking in Archon"
      - "Create feature branch for quality fixes"

    phase_4b_implementation:
      - "Execute tasks in dependency order"
      - "Follow implementation steps exactly as documented"
      - "Validate each step before proceeding"
      - "Update task status continuously"

    phase_4c_validation:
      - "Run validation criteria for each task"
      - "Execute quality gates after each task"
      - "Verify compliance requirements"
      - "Document any deviations or issues"

    phase_4d_integration:
      - "Integrate all fixes into main branch"
      - "Run comprehensive test suite"
      - "Verify no regressions introduced"
      - "Update documentation and knowledge base"
```

### Implementation Commands

```bash
# Pre-Implementation Setup
git checkout -b quality-control/QC-XXX-batch
bun install                    # Ensure dependencies are current

# Step 1: Identify Issues (Already completed in Phase 1)
bun quality                    # Verify current state
bun lint                       # OXLint 50-100x faster validation
bun type-check                 # TypeScript strict mode
bun format:check               # Biome formatting validation

# Step 2: Execute Atomic Tasks (Following Phase 3 plan)
# For each atomic task:
# - Follow implementation steps exactly
# - Validate each step
# - Update task status

# Step 3: Continuous Validation (After each task)
bun quality                    # Re-run quality checks
bun test                       # Run affected tests (3-5x faster)
bun test:coverage              # Verify coverage maintained

# Step 4: Final Validation (After all tasks)
bun quality                    # Full quality check
bun test                       # Complete test suite
bun test:e2e                   # E2E validation
bun type-check                 # Final type check

# Step 5: Integration
git add .
git commit -m "fix(quality): QC-XXX - [descriptive message]"
git push origin quality-control/QC-XXX-batch
```

### Quality Gates Enforcement

```yaml
QUALITY_GATES:
  gate_1_syntax_validation:
    tools: ["TypeScript", "OXLint", "Biome"]
    threshold: "Zero errors"
    command: "bun type-check && bun lint && bun format:check"
    blocking: true

  gate_2_test_validation:
    tools: ["Vitest", "Playwright"]
    threshold: "100% pass rate, ≥90% coverage for critical"
    command: "bun test && bun test:coverage"
    blocking: true

  gate_3_security_validation:
    tools: ["OXLint Security Rules", "Dependency Audit"]
    threshold: "Zero high-severity vulnerabilities"
    command: "bun lint:security && bunx audit"
    blocking: true

  gate_4_compliance_validation:
    tools: ["Compliance Validator"]
    threshold: "Full compliance"
    command: "bun validate:compliance"
    blocking: true

  gate_5_performance_validation:
    tools: ["Bundle Analyzer", "Performance Tests"]
    threshold: "No degradation in Core Web Vitals"
    command: "bun analyze:bundle && bun test:performance"
    blocking: false
```

### Rollback Procedures

```bash
# If validation fails, execute rollback immediately

# Step 1: Assess rollback scope
# - Identify which tasks need to be rolled back
# - Check for dependencies

# Step 2: Execute rollback
git checkout main
git branch -D quality-control/QC-XXX-batch

# Step 3: Verify system state
bun quality                    # Verify original state restored
bun test                       # Verify tests pass
bun test:e2e                   # Verify E2E workflows

# Step 4: Document rollback
# - Update task status in Archon
# - Document reason for rollback
# - Create new research task if needed
```

## 🛠️ Tool Reference Guide

### MCP Tools for Quality Control

```yaml
SERENA_MCP:
  purpose: "Semantic codebase search and analysis"
  mandatory: "MUST use instead of native search tools"
  key_functions:
    search_for_pattern:
      usage: "Find error patterns across codebase"
      example: "serena_mcp.search_for_pattern(pattern='any\\s+type', context_lines=5)"
    find_symbol:
      usage: "Find specific symbols and their usages"
      example: "serena_mcp.find_symbol(name_path='Patient', include_body=true)"
    find_referencing_symbols:
      usage: "Find all references to a symbol"
      example: "serena_mcp.find_referencing_symbols(name_path='Patient', relative_path='types')"

CONTEXT7_MCP:
  purpose: "Technical documentation and API references"
  key_functions:
    resolve_library_id:
      usage: "Find library documentation"
      example: "context7.resolve_library_id(library_name='typescript')"
    get_library_docs:
      usage: "Retrieve official documentation"
      example: "context7.get_library_docs(library_id='typescript', query='interface best practices')"

TAVILY_MCP:
  purpose: "Real-time web search and current trends"
  key_functions:
    tavily_search:
      usage: "Search for current information"
      example: "tavily.search(query='React 19 best practices 2025')"

ARCHON_MCP:
  purpose: "Knowledge management and task tracking"
  key_functions:
    perform_rag_query:
      usage: "Search project knowledge base"
      example: "archon.perform_rag_query(query='compliance patterns')"
    create_document:
      usage: "Create knowledge base articles"
      example: "archon.create_document(title='QC-101 Solution', content='...')"

DESKTOP_COMMANDER:
  purpose: "File operations and terminal commands"
  mandatory: "MUST use for file edits instead of native tools"
  key_functions:
    edit_block:
      usage: "Surgical code edits"
      example: "desktop_commander.edit_block(file_path='...', old_string='...', new_string='...')"
    start_process:
      usage: "Execute terminal commands"
      example: "desktop_commander.start_process(command='bun test', timeout_ms=30000)"
```

### Quality Commands Reference

```bash
# Detection Phase Commands
bun quality              # Run all quality gates
bun lint                 # OXLint 50-100x faster validation
bun lint:security        # Security-specific checks
bun type-check          # TypeScript strict mode
bun format:check        # Biome formatting validation

# Auto-Fix Commands (Use with caution)
bun quality:fix         # Fix auto-correctable issues
bun lint:fix            # Fix OXLint issues
bun format              # Format with Biome

# Testing Commands
bun test                # Run all tests (3-5x faster)
bun test:watch          # Watch mode for development
bun test:coverage       # Generate coverage report
bun test:e2e           # End-to-end tests

# Performance Commands
bun analyze:bundle      # Analyze bundle size
bun test:performance    # Performance benchmarks

# Validation Commands
bun validate:compliance  # Compliance check
bunx audit              # Dependency vulnerability scan
```

## 🏛️ Compliance Requirements

### Data Protection & Security

```yaml
COMPLIANCE_REQUIREMENTS:
  data_handling:
    - "Always encrypt sensitive data at rest and in transit"
    - "Validate consent before data processing"
    - "Log all access to sensitive data for audit trail"
    - "Implement right to erasure for user requests"

  type_safety_requirements:
    - "Use explicit types for all sensitive data fields"
    - "Document sensitive fields with JSDoc"
    - "Enforce encryption requirements at type level"
    - "Validate consent types with TypeScript unions"

  audit_requirements:
    - "Log all quality control changes affecting sensitive data"
    - "Track who made changes and when"
    - "Document rationale for security-related fixes"
    - "Maintain compliance audit trail"
```

## 📋 Quick Reference

### 4-Phase Workflow Summary

```bash
# Phase 1: Detection
bun quality                    # Run all quality checks
bun lint                       # OXLint validation
bun type-check                 # TypeScript strict mode
# Catalog all errors with severity

# Phase 2: Research
context7.resolve_library_id()   # Find official docs
context7.get_library_docs()     # Get documentation
tavily.search()                # Current best practices
# Validate solutions with ≥95% confidence

# Phase 3: Planning
# Create atomic tasks (~20 min each)
# Define implementation steps
# Document validation criteria
# Plan rollback procedures

# Phase 4: Execution
git checkout -b quality-fix     # Create branch
# Execute tasks in dependency order
bun quality                    # Validate after each task
bun test                       # Run tests
git commit -m "fix: description" # Commit changes
```

### Error Priority Matrix

```yaml
PRIORITY_MATRIX:
  P0_Critical:
    - "TypeScript compilation errors"
    - "Security vulnerabilities"
    - "Compliance violations"
    - "Broken functionality"

  P1_High:
    - "Type safety issues"
    - "Missing test coverage (<90%)"
    - "Performance regressions"
    - "Security warnings"

  P2_Medium:
    - "Code style issues"
    - "Documentation gaps"
    - "Non-critical warnings"
    - "Optimization opportunities"

  P3_Low:
    - "Minor style improvements"
    - "Code organization"
    - "Documentation enhancements"
    - "Nice-to-have features"
```

### Common Error Patterns & Solutions

```yaml
COMMON_PATTERNS:
  typescript_any_types:
    detection: "serena_mcp.search_for_pattern(pattern=':\\s*any|as\\s+any')"
    solution: "Add explicit type definitions"
    validation: "bun type-check"

  missing_imports:
    detection: "bun lint shows import errors"
    solution: "Add proper imports using Serena MCP to find symbols"
    validation: "bun lint && bun type-check"

  security_vulnerabilities:
    detection: "bun lint:security"
    solution: "Follow OWASP guidelines, use parameterized queries"
    validation: "bun lint:security && bunx audit"

  compliance_validation:
    detection: "Manual review of sensitive data handling"
    solution: "Add encryption, consent validation, audit logging"
    validation: "bun validate:compliance"
```

### Quality Standards Checklist

```yaml
QUALITY_STANDARDS:
  code_quality:
    - "✅ Zero TypeScript errors in strict mode"
    - "✅ Zero OXLint errors (69 warnings acceptable)"
    - "✅ Consistent code formatting with Biome"
    - "✅ No code duplication (DRY principle)"

  test_coverage:
    - "✅ ≥90% coverage for critical components"
    - "✅ ≥80% coverage for standard components"
    - "✅ 100% pass rate for all tests"
    - "✅ No flaky tests in CI/CD pipeline"

  security_standards:
    - "✅ Zero high-severity vulnerabilities"
    - "✅ All inputs validated and sanitized"
    - "✅ Authentication and authorization enforced"
    - "✅ Security headers properly configured"

  performance_standards:
    - "✅ Core Web Vitals: LCP ≤2.0s, INP ≤150ms, CLS ≤0.05"
    - "✅ API response times ≤200ms"
    - "✅ Database queries ≤100ms"
    - "✅ Bundle size <500KB for critical path"
```

---

**🎯 Mission**: Deliver research-driven, compliant code quality improvements.

**⚡ Key Advantage**: Planning-first approach with research-driven solutions ensures all quality improvements are based on authoritative sources and best practices.

**🏆 Quality Standard**: ≥9.5/10 rating with ≥95% validation accuracy.

---

*Last Updated: 2025-11-25*
*Version: 3.0 - Streamlined*
*Target: 450 lines*

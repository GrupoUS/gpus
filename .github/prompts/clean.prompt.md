# Command: /cleanup | /limpar

## Universal Description

**SAFE CODEBASE CLEANUP ORCHESTRATION SYSTEM** - Multi-phase atomic task generation with dependency analysis, dead code detection, and incremental safe removal. Zero-regression guarantee through verification gates at each step.

## Purpose

Execute comprehensive and safe codebase cleanup through intelligent analysis, atomic task decomposition, and incremental removal with rollback capabilities. Identifies dead code, orphan files, unused imports, obsolete dependencies, and tech stack misalignment while ensuring zero system breakage.

---

## Enhanced Cleanup Orchestration System

### Automatic Project Analysis Engine

```yaml
project_discovery:
  auto_detect:
    - package.json / requirements.txt / go.mod / Cargo.toml
    - Framework configs (vite, next, tsconfig, etc.)
    - Architecture documentation
    - Database schemas and migrations
    - Test configurations

  tech_stack_inference:
    - Parse dependencies and devDependencies
    - Identify framework patterns in codebase
    - Detect ORM/database from schema files
    - Map auth providers from configs
    - Cross-reference with documentation

  documentation_scan:
    locations:
      - docs/
      - .factory/docs/
      - README.md
      - ARCHITECTURE.md
      - *.md in root
    purpose: "Identify intended vs actual tech stack"
```

### Cleanup Categories

```yaml
cleanup_types:
  dead_code:
    description: "Code that is never executed"
    detection:
      - Unreachable code paths
      - Unused functions/methods
      - Dead conditional branches
      - Commented-out code blocks
    risk_level: "LOW-MEDIUM"

  orphan_files:
    description: "Files not imported anywhere"
    detection:
      - No inbound imports
      - Not in entry points
      - Not in configs
      - Not dynamically loaded
    risk_level: "MEDIUM"

  unused_imports:
    description: "Imports that are never used"
    detection:
      - Static analysis
      - Type-only imports check
      - Side-effect imports preservation
    risk_level: "LOW"

  unused_exports:
    description: "Exports never imported elsewhere"
    detection:
      - Cross-file reference analysis
      - Public API preservation
      - Re-export chain tracking
    risk_level: "MEDIUM"

  unused_dependencies:
    description: "Packages in package.json never imported"
    detection:
      - Import scanning across codebase
      - Peer dependency checking
      - Build tool plugin verification
    risk_level: "MEDIUM-HIGH"

  obsolete_tech_stack:
    description: "Dependencies from migrated/abandoned tech"
    detection:
      - Compare docs vs actual usage
      - Identify migration remnants
      - Find deprecated patterns
    risk_level: "HIGH"

  orphan_hooks:
    description: "Custom hooks never used"
    detection:
      - Hook file scanning
      - Import reference counting
      - Test file exclusion option
    risk_level: "LOW-MEDIUM"

  orphan_routes:
    description: "Routes not accessible via navigation"
    detection:
      - Route tree analysis
      - Navigation link tracing
      - Config-based route detection
    risk_level: "MEDIUM"

  orphan_components:
    description: "React/Vue/Svelte components never rendered"
    detection:
      - JSX/template usage scanning
      - Dynamic component detection
      - Storybook/test preservation
    risk_level: "MEDIUM"

  orphan_types:
    description: "TypeScript types/interfaces never used"
    detection:
      - Type reference analysis
      - Generic constraint checking
      - Declaration file handling
    risk_level: "LOW"
```

### Safety Verification Gates

```yaml
verification_gates:
  pre_removal:
    - Full dependency graph generated
    - Dynamic import patterns identified
    - Config references checked
    - Test file references checked
    - Build tool references verified

  during_removal:
    - Incremental removal (1-5 files max)
    - Type check after each batch
    - Lint check after each batch
    - Unit tests after each batch
    - Build verification after each batch

  post_removal:
    - Full test suite execution
    - Production build verification
    - Bundle size comparison
    - No new TypeScript errors
    - No new lint errors

  rollback_triggers:
    - Any type error introduced
    - Any test failure
    - Build failure
    - Lint error in unmodified files
    - Bundle size increase > 5%
```

---

## Automatic Cleanup Routing

```yaml
command_execution:
  triggers:
    - "/cleanup"
    - "/limpar"
    - "/clean"
    - "/limpeza"
    - "clean up the codebase"
    - "remove dead code"
    - "find unused files"

  routing: "Enhanced orchestration with safety-first approach"
  atomic_tasks: "Automatic generation with dependency-aware ordering"
  output_format: "Structured markdown report with actionable items"

input_parsing:
  scope:
    full: "Entire codebase analysis"
    directory: "Specific directory focus"
    category: "Specific cleanup type"

  mode:
    analyze: "Report only, no modifications"
    plan: "Generate removal plan for approval"
    execute: "Execute approved plan with verification"
    auto: "Full autonomous cleanup with safety gates"

  depth:
    surface: "Quick scan, obvious dead code only"
    standard: "Comprehensive analysis"
    deep: "Including edge cases and dynamic patterns"

quality_assurance:
  backup_required: true
  verification_threshold: "100% pass rate"
  rollback_on_failure: true
  documentation_required: true
```

---

## Atomic Task Generation Templates

### Phase 1: Discovery & Inventory

```yaml
phase_1_discovery:
  parallel_execution: true
  estimated_time: "5-15 minutes"

  tasks:
    task_1.1_project_analysis:
      title: "Analyze project structure and tech stack"
      actions:
        - Read package.json / dependency files
        - Scan configuration files
        - Read architecture documentation
        - Identify framework and patterns
      outputs:
        - tech_stack_actual.yaml
        - tech_stack_documented.yaml
        - discrepancy_report.md

    task_1.2_dependency_graph:
      title: "Generate full dependency graph"
      actions:
        - Map all import/export relationships
        - Identify entry points
        - Detect dynamic imports
        - Map config references
      outputs:
        - dependency_graph.json
        - entry_points.list
        - dynamic_imports.list

    task_1.3_dead_code_scan:
      title: "Scan for potential dead code"
      actions:
        - Run static analysis tools
        - Identify unreferenced exports
        - Find orphan files
        - Detect unused imports
      outputs:
        - candidates_for_removal.json
        - confidence_scores.json
```

### Phase 2: Deep Analysis

```yaml
phase_2_analysis:
  parallel_execution: "80%"
  estimated_time: "10-30 minutes"

  tasks:
    task_2.1_verify_candidates:
      title: "Verify each removal candidate"
      actions:
        - Trace all references for each candidate
        - Check dynamic loading patterns
        - Verify config exclusions
        - Check test file usage
      outputs:
        - verified_safe_removals.json
        - requires_investigation.json
        - false_positives.json

    task_2.2_obsolete_tech_detection:
      title: "Identify obsolete technology remnants"
      actions:
        - Compare documented vs actual stack
        - Find migration remnants
        - Identify deprecated patterns
        - Map removal dependencies
      outputs:
        - obsolete_tech_map.json
        - removal_order.json

    task_2.3_impact_assessment:
      title: "Assess removal impact"
      actions:
        - Calculate bundle size impact
        - Identify breaking changes risk
        - Map test coverage gaps
        - Estimate effort per removal
      outputs:
        - impact_assessment.md
        - risk_matrix.json
```

### Phase 3: Planning

```yaml
phase_3_planning:
  parallel_execution: false
  estimated_time: "5-10 minutes"

  tasks:
    task_3.1_prioritize_removals:
      title: "Prioritize removals by safety and impact"
      priority_order:
        1: "Unused imports (lowest risk)"
        2: "Orphan types/interfaces"
        3: "Orphan utility functions"
        4: "Orphan hooks"
        5: "Orphan components"
        6: "Orphan routes"
        7: "Orphan files"
        8: "Unused dependencies"
        9: "Obsolete tech stack (highest risk)"
      outputs:
        - removal_plan.md
        - execution_order.json

    task_3.2_generate_rollback_plan:
      title: "Create rollback strategy"
      actions:
        - Define checkpoint intervals
        - Create restoration commands
        - Document verification steps
      outputs:
        - rollback_plan.md
        - checkpoint_strategy.json
```

### Phase 4: Execution

```yaml
phase_4_execution:
  parallel_execution: false
  mode: "SEQUENTIAL_WITH_VERIFICATION"

  tasks:
    task_4.1_create_backup:
      title: "Create backup branch"
      actions:
        - git checkout -b backup/cleanup-{timestamp}
        - git push origin backup/cleanup-{timestamp}
      gate: "Backup must exist before proceeding"

    task_4.2_execute_removals:
      title: "Execute removals incrementally"
      batch_size: "1-5 files"
      verification_after_each:
        - type_check: "bun/npm run type-check"
        - lint: "bun/npm run lint"
        - test: "bun/npm run test"
        - build: "bun/npm run build"
      on_failure: "Immediate rollback to last checkpoint"

    task_4.3_final_verification:
      title: "Final system verification"
      actions:
        - Full test suite
        - Production build
        - Bundle size comparison
        - Manual smoke test (if applicable)
      outputs:
        - final_verification_report.md
```

### Phase 5: Documentation

```yaml
phase_5_documentation:
  parallel_execution: true

  tasks:
    task_5.1_generate_report:
      title: "Generate cleanup report"
      content:
        - Executive summary
        - Files removed with justifications
        - Dependencies removed
        - Bundle size before/after
        - Test coverage impact
        - Recommendations for prevention
      output: "cleanup-report-{date}.md"

    task_5.2_update_docs:
      title: "Update project documentation"
      actions:
        - Update architecture docs if needed
        - Add cleanup to CHANGELOG
        - Update dependency documentation
```

---

## Cleanup Complexity Assessment

```yaml
complexity_levels:
  L1-L3_simple:
    indicators:
      - Small project (< 100 files)
      - Clear dead code (commented out)
      - Unused imports only
    estimated_time: "15-30 minutes"
    parallel_execution: "High"
    risk: "LOW"

  L4-L6_moderate:
    indicators:
      - Medium project (100-500 files)
      - Multiple cleanup categories
      - Some dynamic imports
    estimated_time: "1-2 hours"
    parallel_execution: "Medium"
    risk: "MEDIUM"

  L7-L8_complex:
    indicators:
      - Large project (500+ files)
      - Tech stack migration remnants
      - Complex dependency graphs
      - Monorepo structure
    estimated_time: "2-4 hours"
    parallel_execution: "Low"
    risk: "HIGH"

  L9-L10_critical:
    indicators:
      - Enterprise codebase
      - Multiple tech stack migrations
      - Shared libraries
      - Production-critical system
    estimated_time: "4-8 hours"
    parallel_execution: "Minimal"
    risk: "CRITICAL"
    recommendation: "Consider phased cleanup over multiple sessions"
```

---

## Command Usage Examples

### Basic Cleanup Analysis
```
/cleanup

→ Triggers full codebase analysis
→ Generates removal plan
→ Awaits approval before execution
```

### Specific Category Cleanup
```
/cleanup --category=unused-imports

→ Focuses only on unused imports
→ Faster execution
→ Lower risk
```

### Directory-Scoped Cleanup
```
/cleanup --scope=src/features/legacy

→ Analyzes only specified directory
→ Reports external dependencies
→ Safer for large codebases
```

### Analysis Only (No Modifications)
```
/cleanup --mode=analyze

→ Full analysis
→ Detailed report
→ No file modifications
```

### Full Autonomous Cleanup
```
/cleanup --mode=auto --depth=deep

→ Full analysis with edge cases
→ Automatic execution with safety gates
→ Automatic rollback on failure
```

### With Tech Stack Validation
```
/cleanup --validate-stack --docs=docs/architecture/

→ Compares documented vs actual stack
→ Identifies obsolete technology
→ Prioritizes migration remnant removal
```

---

## Safety Rules (MANDATORY)

```yaml
NEVER:
  - Remove files without full reference check
  - Remove multiple high-risk items simultaneously
  - Skip verification gates
  - Trust static analysis alone for dynamic codebases
  - Remove base UI library components (shadcn, etc.)
  - Remove database schemas without migration check
  - Force push over backup branches
  - Assume something is dead code without evidence

ALWAYS:
  - Create backup before any modification
  - Verify build and tests after EACH removal batch
  - Document justification for each removal
  - Preserve git history
  - Check for dynamic imports and lazy loading
  - Verify config file references
  - Ask for confirmation on high-risk removals
  - Rollback immediately on any failure
  - Generate comprehensive cleanup report
```

---

## Output Standards

```yaml
report_structure:
  location: ".factory/docs/cleanup-report-{YYYY-MM-DD}.md"

  sections:
    executive_summary:
      - Cleanup scope and duration
      - Total items removed
      - Bundle size impact
      - Risk level handled

    detailed_removals:
      - Category breakdown
      - File-by-file list with justifications
      - Dependency changes

    metrics:
      - Files before/after
      - Lines of code removed
      - Bundle size before/after
      - Dependencies removed

    verification_results:
      - Type check status
      - Lint status
      - Test results
      - Build status

    recommendations:
      - Prevention strategies
      - Remaining technical debt
      - Suggested follow-up actions

git_artifacts:
  backup_branch: "backup/cleanup-{timestamp}"
  commit_message_format: |
    chore(cleanup): remove {category}

    - Removed {count} {type}
    - Verified: type-check ✓, lint ✓, tests ✓, build ✓
    - Justification: {brief_reason}
```

---

## Integration with Development Workflow

```yaml
ci_cd_integration:
  pre_commit:
    - Auto-remove unused imports
    - Flag new orphan exports

  pull_request:
    - Cleanup report as PR comment
    - Block if new dead code introduced

  scheduled:
    - Weekly cleanup analysis
    - Monthly deep cleanup recommendation

ide_integration:
  vscode:
    - Extension recommendations for dead code detection
    - Auto-import cleanup on save

  jetbrains:
    - Inspection profiles for dead code
    - Safe delete refactoring
```

---

## Activation Protocol

```yaml
trigger_detection:
  command_keywords:
    - "/cleanup"
    - "/limpar"
    - "/clean"
    - "/limpeza"
    - "clean up"
    - "remove dead code"
    - "find unused"
    - "codebase cleanup"

  automatic_routing: "Safety-first cleanup orchestration"
  priority: "HIGH - requires careful execution"

default_behavior:
  mode: "plan"  # Always plan first, execute after approval
  backup: "required"
  verification: "all_gates"
  rollback: "automatic_on_failure"

response_format:
  phase_1: "Show discovery results"
  phase_2: "Show analysis and candidates"
  phase_3: "Present removal plan for approval"
  phase_4: "Execute only after explicit approval"
  phase_5: "Generate and present final report"
```

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────────┐
│                    /cleanup COMMAND REFERENCE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  USAGE:                                                          │
│    /cleanup [options]                                            │
│                                                                  │
│  OPTIONS:                                                        │
│    --mode=<analyze|plan|execute|auto>  Execution mode            │
│    --scope=<path>                      Directory to focus        │
│    --category=<type>                   Specific cleanup type     │
│    --depth=<surface|standard|deep>     Analysis depth            │
│    --validate-stack                    Compare docs vs actual    │
│    --docs=<path>                       Architecture docs path    │
│    --dry-run                           Show plan, no execute     │
│                                                                  │
│  CATEGORIES:                                                     │
│    unused-imports      Imports never used                        │
│    unused-exports      Exports never imported                    │
│    orphan-files        Files not referenced                      │
│    orphan-hooks        Custom hooks unused                       │
│    orphan-routes       Routes not navigable                      │
│    orphan-components   Components not rendered                   │
│    orphan-types        Types/interfaces unused                   │
│    unused-deps         Package.json dead deps                    │
│    obsolete-stack      Migrated tech remnants                    │
│    dead-code           Unreachable code paths                    │
│    all                 Full cleanup (default)                    │
│                                                                  │
│  SAFETY:                                                         │
│    ✓ Backup branch created automatically                        │
│    ✓ Verification after each removal batch                      │
│    ✓ Automatic rollback on failure                              │
│    ✓ Approval required before execution                         │
│                                                                  │
│  EXAMPLES:                                                       │
│    /cleanup                          Full analysis + plan        │
│    /cleanup --mode=analyze           Report only                 │
│    /cleanup --category=unused-imports Quick import cleanup       │
│    /cleanup --scope=src/legacy       Focus on legacy dir         │
│    /cleanup --validate-stack         Check tech alignment        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

**Remember**: Safe cleanup prioritizes system stability over aggressive removal. When in doubt, keep the code and flag for manual review.
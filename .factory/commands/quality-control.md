---
title: "AegisWallet Quality Control v2.0 - Enhanced Multi-Domain Testing Infrastructure"
last_updated: 2025-12-01
version: "2.0.0"
form: reference
tags: [quality, brazilian-fintech, bun, biome, vitest, drizzle, tanstack-router, react-19, lgpd, compliance, atomic-tasks, droid-orchestration]
related:
  - ../architecture/tech-stack.md
  - ../architecture/frontend-architecture.md
  - frontend-testing.md
  - research.md
  - ../agents/apex-researcher.md
---

# 🔍 AegisWallet Quality Control v2.0

**Production-ready multi-domain testing infrastructure with atomic task decomposition, parallel droid orchestration, and comprehensive coverage for Brazilian fintech compliance.**

---

## 📋 CHANGELOG v2.0

```yaml
ENHANCEMENTS:
  atomic_tasks: "150+ granular tasks organized by domain and severity"
  route_testing: "TanStack Router v1.139+ type-safe validation suite"
  hook_testing: "React 19 hooks with exhaustive-deps enforcement"
  lint_coverage: "Biome 2.3.7 with all domains (react, a11y, security, performance)"
  database_validation: "Drizzle ORM + Neon type sync and RLS audit"
  parallel_execution: "Optimized droid orchestration with dependency graphs"
  brazilian_compliance: "LGPD, PIX, BCB auto-activated validation"
  mcp_integration: "Context7 + Tavily + Serena for research-driven fixes"
```

---

## 🎯 Core Philosophy

**Mantra**: _"Detect → Research → Decompose → Implement → Validate"_

**Mission**: Research-first quality control with atomic task granularity, ensuring all improvements are based on official documentation and ≥95% cross-validation accuracy.

**Quality Standard**: Zero tolerance for lint errors, type errors, and security vulnerabilities.

---

## 🏗️ DOMAIN ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      QUALITY CONTROL DOMAINS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   ROUTES    │  │    HOOKS    │  │    LINT     │  │  FRONTEND   │        │
│  │             │  │             │  │             │  │             │        │
│  │ TanStack    │  │ React 19    │  │ Biome 2.3   │  │ Components  │        │
│  │ Router      │  │ Rules       │  │ All Domains │  │ A11y        │        │
│  │ Type Safety │  │ Exhaustive  │  │ Security    │  │ Performance │        │
│  │ Lazy Load   │  │ Deps        │  │ Style       │  │ UI/UX       │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │               │
│         └────────────────┴────────────────┴────────────────┘               │
│                                   │                                        │
│                        ┌──────────┴──────────┐                             │
│                        │                     │                             │
│                 ┌──────┴──────┐       ┌──────┴──────┐                      │
│                 │  DATABASE   │       │  BRAZILIAN  │                      │
│                 │             │       │  COMPLIANCE │                      │
│                 │ Drizzle ORM │       │             │                      │
│                 │ Neon/RLS    │       │ LGPD/PIX    │                      │
│                 │ Type Sync   │       │ BCB         │                      │
│                 └─────────────┘       └─────────────┘                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 DROID ORCHESTRATION MATRIX

### Agent Expertise & Responsibilities

```yaml
DROID_ECOSYSTEM:
  apex-researcher:
    role: "Research Coordination & Solution Discovery"
    expertise:
      - Official documentation research (Context7)
      - Web intelligence gathering (Tavily)
      - Codebase pattern analysis (Serena)
      - Cross-validation synthesis
    triggers:
      - New error categories discovered
      - Complex architectural decisions
      - Brazilian compliance requirements
      - Performance optimization research
    mcps: [context7, tavily, serena, sequential-thinking]

  code-reviewer:
    role: "Quality Analysis & Validation"
    expertise:
      - Biome lint analysis (all domains)
      - TypeScript type checking
      - Security vulnerability scanning
      - Code quality metrics
    triggers:
      - Pre-implementation detection
      - Post-implementation validation
      - Security audit requirements
      - Compliance verification
    tools: [biome, tsc, oxlint, knip]

  apex-dev:
    role: "Implementation & Fixing"
    expertise:
      - TypeScript/React implementation
      - Hook refactoring
      - Route type safety fixes
      - Performance optimization
    triggers:
      - Atomic task implementation
      - TDD workflow execution
      - Refactoring complex code
      - Integration fixes
    tools: [bun, vitest, biome]

  database-specialist:
    role: "Database Quality & Compliance"
    expertise:
      - Drizzle ORM schema validation
      - Neon PostgreSQL type sync
      - RLS policy implementation
      - Migration health checks
    triggers:
      - Schema/type mismatches
      - RLS coverage gaps
      - Migration issues
      - LGPD data compliance
    tools: [drizzle-kit, neon-cli]

  apex-ui-ux-designer:
    role: "Frontend Quality & Accessibility"
    expertise:
      - Component accessibility audit
      - UI/UX pattern validation
      - Responsive design testing
      - Brazilian localization
    triggers:
      - A11y lint violations
      - WCAG compliance gaps
      - UI component issues
      - Mobile responsiveness
    tools: [axe-core, playwright]
```

### Parallel Execution Strategy

```yaml
PARALLEL_EXECUTION_MATRIX:
  phase_0_discovery:
    parallel: false
    agents: [apex-researcher]
    purpose: "Map codebase state and patterns"
    estimated_time: "15-30min"

  phase_1_detection:
    parallel: true
    tracks:
      track_1:
        agents: [code-reviewer]
        focus: [routes, hooks, lint, frontend]
      track_2:
        agents: [database-specialist]
        focus: [schema, rls, migrations]
    purpose: "Comprehensive error detection"
    estimated_time: "30-45min"

  phase_2_research:
    parallel: true
    tracks:
      track_1:
        agents: [apex-researcher]
        focus: [typescript, biome, react-hooks]
        mcps: [context7, tavily]
      track_2:
        agents: [apex-researcher]
        focus: [tanstack-router, drizzle]
        mcps: [context7, serena]
    purpose: "Official solution research"
    estimated_time: "20-40min"

  phase_3_decomposition:
    parallel: false
    agents: [apex-researcher, code-reviewer]
    purpose: "Atomic task generation"
    estimated_time: "15-25min"

  phase_4_implementation:
    parallel: true
    dependency_aware: true
    tracks:
      track_1:
        agents: [apex-dev]
        focus: [routes, hooks, lint-core]
      track_2:
        agents: [database-specialist]
        focus: [database, compliance]
      track_3:
        agents: [apex-ui-ux-designer]
        focus: [frontend, a11y]
    purpose: "Fix implementation"
    estimated_time: "2-4 hours"

  phase_5_validation:
    parallel: true
    agents: [code-reviewer, database-specialist]
    purpose: "Quality gate verification"
    estimated_time: "20-30min"
```

---

## 📍 PHASE 0: DISCOVERY & CONTEXT MAPPING

### 🔬 Agent: apex-researcher

**Goal**: Map current codebase state, identify patterns, and establish baseline.

**Complexity**: L5 (Multi-source analysis)

```yaml
DISCOVERY_TASKS:
  D-001:
    name: "Configuration Audit"
    files:
      - biome.json
      - tsconfig.json
      - vitest.config.ts
      - drizzle.config.ts
      - tsr.config.json
      - package.json
    output: "Configuration baseline report"

  D-002:
    name: "Route Structure Mapping"
    scope: "src/routes/**"
    analyze:
      - File-based route patterns
      - Lazy loading configurations
      - Type exports
      - Search/params validation
    output: "Route architecture map"

  D-003:
    name: "Hook Inventory"
    scope: "src/hooks/**"
    analyze:
      - Custom hook patterns
      - Dependency arrays
      - State management patterns
      - Side effect patterns
    output: "Hook catalog with risk assessment"

  D-004:
    name: "Database Schema Analysis"
    scope: "src/db/schema/**"
    analyze:
      - Table definitions
      - Type exports
      - Relation patterns
      - RLS policies
    output: "Database architecture map"

  D-005:
    name: "Test Coverage Baseline"
    command: "bun test:coverage --reporter=json"
    analyze:
      - Current coverage percentages
      - Uncovered critical paths
      - Test patterns used
    output: "Coverage baseline report"
```

---

## 📍 PHASE 1: MULTI-DOMAIN ERROR DETECTION

### 🔍 Track 1: Code-Reviewer (Routes, Hooks, Lint, Frontend)

#### 1.1 ROUTE DETECTION TASKS

```yaml
ROUTE_DETECTION:
  RT-D01:
    name: "Route Type Safety Scan"
    command: "bun type-check src/routes"
    detect:
      - Missing route type exports
      - Invalid createFileRoute usage
      - Search param type mismatches
      - Path param validation errors
    severity: critical

  RT-D02:
    name: "Lazy Loading Validation"
    pattern: "*.lazy.tsx"
    detect:
      - Missing lazy counterpart files
      - Invalid lazy export patterns
      - Suspense boundary gaps
    severity: high

  RT-D03:
    name: "Route Tree Consistency"
    file: "src/routeTree.gen.ts"
    detect:
      - Stale generated routes
      - Missing route registrations
      - Type mismatches
    severity: critical

  RT-D04:
    name: "Navigation Type Safety"
    pattern: "useNavigate|Link|redirect"
    detect:
      - Untyped navigation calls
      - Missing 'from' prop narrowing
      - Invalid route references
    severity: high
```

#### 1.2 HOOK DETECTION TASKS

```yaml
HOOK_DETECTION:
  HK-D01:
    name: "Exhaustive Dependencies Scan"
    rule: "correctness/useExhaustiveDependencies"
    command: "bun check --only=correctness/useExhaustiveDependencies src/hooks"
    detect:
      - Missing dependencies in useEffect
      - Missing dependencies in useMemo
      - Missing dependencies in useCallback
    severity: critical

  HK-D02:
    name: "Rules of Hooks Violations"
    patterns:
      - "Conditional hook calls"
      - "Hooks after early returns"
      - "Hooks in loops"
    severity: critical

  HK-D03:
    name: "Custom Hook Patterns"
    scope: "src/hooks/use*.ts"
    detect:
      - Non-standard return types
      - Missing cleanup functions
      - Memory leak patterns
    severity: high
```

#### 1.3 LINT DETECTION TASKS

```yaml
LINT_DETECTION:
  LT-D01:
    name: "TypeScript Strict Mode Violations"
    command: "bun type-check --strict"
    detect:
      - any types (noExplicitAny)
      - Unused variables (noUnusedLocals)
      - Missing return types
    severity: critical

  LT-D02:
    name: "Security Domain Scan"
    command: "bun check --only=security src"
    rules:
      - noDangerouslySetInnerHtml
      - noGlobalEval
    severity: critical

  LT-D03:
    name: "Suspicious Code Patterns"
    command: "bun check --only=suspicious src"
    rules:
      - noExplicitAny
      - noDoubleEquals
      - noFloatingPromises
    severity: high
```

#### 1.4 FRONTEND DETECTION TASKS

```yaml
FRONTEND_DETECTION:
  FE-D01:
    name: "Accessibility Audit"
    command: "bun check --only=a11y src/components src/routes"
    rules:
      - useAltText
      - useButtonType
      - useKeyWithClickEvents
      - useValidAnchor
    severity: high
```

### 🗄️ Track 2: Database-Specialist (Schema, RLS, Migrations)

```yaml
DATABASE_DETECTION:
  DB-D01:
    name: "Schema Type Sync"
    command: "bun db:generate && diff src/db/schema"
    detect:
      - TypeScript types out of sync
      - Missing $inferInsert/$inferSelect
    severity: critical

  DB-D02:
    name: "RLS Policy Audit"
    scope: "src/db/rls.ts"
    detect:
      - Tables missing RLS policies
      - Overly permissive policies
      - Missing user_id checks
    severity: critical

  DB-D03:
    name: "LGPD Compliance Audit"
    detect:
      - Unencrypted PII fields
      - Missing consent flags
      - Audit trail gaps
    severity: critical
    brazilian_compliance: true
```

---

## 📍 PHASE 2: RESEARCH-DRIVEN SOLUTIONS

### 🔬 Agent: apex-researcher

**MCP Integration Strategy**:

```yaml
MCP_RESEARCH_MATRIX:
  context7_queries:
    tanstack_router:
      library_id: "/tanstack/router"
      topics:
        - "file-based routing type safety"
        - "createFileRoute validation"
        - "search params zod"
        - "lazy loading patterns"

    biome:
      library_id: "/websites/biomejs_dev_guides"
      topics:
        - "useExhaustiveDependencies fix"
        - "noExplicitAny solutions"
        - "import organization"

    drizzle:
      library_id: "/drizzle-team/drizzle-orm-docs"
      topics:
        - "neon postgres type safety"
        - "schema validation"
        - "RLS patterns"

  tavily_queries:
    - "Biome 2.3 migration guide 2025"
    - "TanStack Router v1.139 type safety"
    - "Drizzle ORM Neon best practices"
    - "React 19 hook patterns"
    - "Brazilian LGPD database compliance"
```

---

## 📍 PHASE 3: ATOMIC TASK DECOMPOSITION

### Complete Atomic Task Catalog

#### 3.1 ROUTE TASKS (RT-XXX)

```yaml
ATOMIC_TASKS_ROUTES:
  RT-101:
    id: "RT-101"
    name: "Fix routeTree.gen.ts type errors"
    category: "routes"
    severity: "critical"
    files: ["src/routeTree.gen.ts"]
    action: |
      1. Run: bunx @tanstack/router-cli generate
      2. Verify all routes registered
      3. Check for type mismatches
    validation: "bun type-check src/routeTree.gen.ts"
    estimated_time: "10min"
    assigned_to: "apex-dev"
    dependencies: []

  RT-102:
    id: "RT-102"
    name: "Add type-safe search params to dashboard"
    category: "routes"
    severity: "critical"
    files: ["src/routes/dashboard.tsx"]
    action: |
      1. Define Zod schema for search params
      2. Add validateSearch to route config
      3. Type searchParams in component
    validation: "bun type-check src/routes/dashboard.tsx"
    estimated_time: "20min"
    assigned_to: "apex-dev"
    dependencies: ["RT-101"]

  RT-103:
    id: "RT-103"
    name: "Fix lazy loading in billing routes"
    category: "routes"
    severity: "high"
    files: ["src/routes/billing.lazy.tsx", "src/routes/billing.tsx"]
    action: |
      1. Verify lazy/non-lazy file pairs
      2. Ensure proper code splitting
      3. Add Suspense boundaries
    validation: "bun build:client"
    estimated_time: "25min"
    assigned_to: "apex-dev"
    dependencies: ["RT-101"]

  RT-104:
    id: "RT-104"
    name: "Add 'from' prop narrowing to Links"
    category: "routes"
    severity: "high"
    files: ["src/components/navigation/**/*.tsx"]
    action: |
      1. Identify all Link components
      2. Add from={Route.fullPath}
      3. Improve TypeScript inference
    validation: "bun type-check src/components/navigation"
    estimated_time: "30min"
    assigned_to: "apex-dev"
    dependencies: ["RT-101"]

  RT-105:
    id: "RT-105"
    name: "Validate path params in dynamic routes"
    category: "routes"
    severity: "high"
    files: ["src/routes/**/$*.tsx"]
    action: |
      1. Add Zod validation for path params
      2. Handle invalid params with redirects
    validation: "bun test src/routes/**/*.test.tsx"
    estimated_time: "35min"
    assigned_to: "apex-dev"
    dependencies: ["RT-102"]

  RT-106:
    id: "RT-106"
    name: "Fix beforeLoad error handling"
    category: "routes"
    severity: "high"
    files: ["src/routes/*.tsx"]
    action: |
      1. Add try/catch to beforeLoad
      2. Type context returns
      3. Handle async errors
    validation: "bun type-check src/routes"
    estimated_time: "25min"
    assigned_to: "apex-dev"
    dependencies: ["RT-101"]

  RT-107:
    id: "RT-107"
    name: "Fix configuracoes route type safety"
    category: "routes"
    severity: "high"
    files: ["src/routes/configuracoes.tsx", "src/routes/configuracoes.lazy.tsx"]
    action: |
      1. Add proper route types
      2. Fix search param validation
      3. Verify lazy loading
    validation: "bun type-check src/routes/configuracoes*.tsx"
    estimated_time: "20min"
    assigned_to: "apex-dev"
    dependencies: ["RT-101"]

  RT-108:
    id: "RT-108"
    name: "Fix ai-chat route integration"
    category: "routes"
    severity: "medium"
    files: ["src/routes/ai-chat.tsx", "src/routes/ai-chat.lazy.tsx"]
    action: |
      1. Verify route configuration
      2. Fix any type issues
      3. Ensure proper loading states
    validation: "bun type-check src/routes/ai-chat*.tsx"
    estimated_time: "20min"
    assigned_to: "apex-dev"
    dependencies: ["RT-101"]
```

#### 3.2 HOOK TASKS (HK-XXX)

```yaml
ATOMIC_TASKS_HOOKS:
  HK-101:
    id: "HK-101"
    name: "Fix useFinancialEvents exhaustive deps"
    category: "hooks"
    severity: "critical"
    files: ["src/hooks/useFinancialEvents.ts"]
    action: |
      1. Identify all useEffect/useMemo/useCallback
      2. Add missing dependencies
      3. Use useCallback for function deps
      4. Verify no stale closures
    validation: "bun check src/hooks/useFinancialEvents.ts"
    estimated_time: "25min"
    assigned_to: "apex-dev"
    dependencies: []

  HK-102:
    id: "HK-102"
    name: "Fix useDashboard hook dependencies"
    category: "hooks"
    severity: "critical"
    files: ["src/hooks/useDashboard.ts"]
    action: |
      1. Audit all effect dependencies
      2. Stabilize callbacks with useCallback
      3. Memoize computed values
    validation: "bun check src/hooks/useDashboard.ts"
    estimated_time: "20min"
    assigned_to: "apex-dev"
    dependencies: []

  HK-103:
    id: "HK-103"
    name: "Fix useVoiceRecognition cleanup"
    category: "hooks"
    severity: "high"
    files: ["src/hooks/useVoiceRecognition.ts"]
    action: |
      1. Add proper cleanup in useEffect
      2. Handle browser API permissions
      3. Abort pending ops on unmount
    validation: "bun test src/hooks/useVoiceRecognition.test.ts"
    estimated_time: "30min"
    assigned_to: "apex-dev"
    dependencies: []

  HK-104:
    id: "HK-104"
    name: "Fix useTransactions query patterns"
    category: "hooks"
    severity: "high"
    files: ["src/hooks/use-transactions.ts"]
    action: |
      1. Stabilize query keys
      2. Add proper error handling
      3. Implement cache invalidation
    validation: "bun check src/hooks/use-transactions.ts"
    estimated_time: "25min"
    assigned_to: "apex-dev"
    dependencies: []

  HK-105:
    id: "HK-105"
    name: "Fix useCompliance LGPD hooks"
    category: "hooks"
    severity: "critical"
    files: ["src/hooks/use-compliance.ts"]
    action: |
      1. Verify consent state management
      2. Add audit logging
      3. Handle data retention
    validation: "bun test:healthcare"
    estimated_time: "35min"
    assigned_to: "apex-dev"
    dependencies: []
    brazilian_compliance: true

  HK-106:
    id: "HK-106"
    name: "Fix useAIChat dependencies"
    category: "hooks"
    severity: "high"
    files: ["src/hooks/useAIChat.ts"]
    action: |
      1. Fix useEffect dependencies
      2. Stabilize message callbacks
      3. Handle streaming cleanup
    validation: "bun check src/hooks/useAIChat.ts"
    estimated_time: "25min"
    assigned_to: "apex-dev"
    dependencies: []

  HK-107:
    id: "HK-107"
    name: "Fix useBankAccounts query hooks"
    category: "hooks"
    severity: "high"
    files: ["src/hooks/useBankAccounts.ts"]
    action: |
      1. Fix query key dependencies
      2. Add mutation invalidation
      3. Handle loading states
    validation: "bun check src/hooks/useBankAccounts.ts"
    estimated_time: "20min"
    assigned_to: "apex-dev"
    dependencies: []

  HK-108:
    id: "HK-108"
    name: "Fix useProfile dependencies"
    category: "hooks"
    severity: "medium"
    files: ["src/hooks/useProfile.ts"]
    action: |
      1. Fix effect dependencies
      2. Memoize derived state
    validation: "bun check src/hooks/useProfile.ts"
    estimated_time: "15min"
    assigned_to: "apex-dev"
    dependencies: []

  HK-109:
    id: "HK-109"
    name: "Fix useGoogleCalendarSync dependencies"
    category: "hooks"
    severity: "medium"
    files: ["src/hooks/use-google-calendar-sync.ts"]
    action: |
      1. Fix OAuth callback deps
      2. Add proper cleanup
      3. Handle sync errors
    validation: "bun check src/hooks/use-google-calendar-sync.ts"
    estimated_time: "25min"
    assigned_to: "apex-dev"
    dependencies: []

  HK-110:
    id: "HK-110"
    name: "Fix useVoiceCommand dependencies"
    category: "hooks"
    severity: "medium"
    files: ["src/hooks/useVoiceCommand.ts"]
    action: |
      1. Fix command handler deps
      2. Stabilize recognition callbacks
    validation: "bun check src/hooks/useVoiceCommand.ts"
    estimated_time: "20min"
    assigned_to: "apex-dev"
    dependencies: ["HK-103"]
```

#### 3.3 LINT TASKS (LT-XXX)

```yaml
ATOMIC_TASKS_LINT:
  LT-101:
    id: "LT-101"
    name: "Remove explicit any in core utils"
    category: "lint"
    severity: "critical"
    scope: "src/lib/**/*.ts"
    action: |
      1. Run: bun check --only=suspicious/noExplicitAny src/lib
      2. Replace any with proper types
      3. Use generics where appropriate
    validation: "bun check src/lib"
    estimated_time: "45min"
    assigned_to: "apex-dev"
    dependencies: []

  LT-102:
    id: "LT-102"
    name: "Fix noExplicitAny in services"
    category: "lint"
    severity: "critical"
    scope: "src/services/**/*.ts"
    action: |
      1. Define proper interfaces
      2. Type API responses
      3. Use Zod for validation
    validation: "bun check src/services"
    estimated_time: "40min"
    assigned_to: "apex-dev"
    dependencies: ["LT-101"]

  LT-103:
    id: "LT-103"
    name: "Fix security violations"
    category: "lint"
    severity: "critical"
    scope: "src/**/*.tsx"
    action: |
      1. Remove dangerouslySetInnerHTML
      2. Use sanitized alternatives
      3. Use react-markdown for safe rendering
    validation: "bun lint:security"
    estimated_time: "30min"
    assigned_to: "apex-dev"
    dependencies: []

  LT-104:
    id: "LT-104"
    name: "Remove unused imports"
    category: "lint"
    severity: "high"
    command: "bun lint:fix"
    action: |
      1. Run Biome auto-fix
      2. Review removed imports
      3. Verify no broken refs
    validation: "bun check ."
    estimated_time: "15min"
    assigned_to: "apex-dev"
    dependencies: []

  LT-105:
    id: "LT-105"
    name: "Fix unused variables"
    category: "lint"
    severity: "high"
    scope: "src/**/*.{ts,tsx}"
    action: |
      1. Remove or prefix with underscore
      2. Verify intentional usage
    validation: "bun check --only=correctness/noUnusedVariables src"
    estimated_time: "25min"
    assigned_to: "apex-dev"
    dependencies: ["LT-104"]

  LT-106:
    id: "LT-106"
    name: "Fix floating promises"
    category: "lint"
    severity: "high"
    rule: "nursery/noFloatingPromises"
    action: |
      1. Add await to async calls
      2. Use void for fire-and-forget
      3. Add error handling
    validation: "bun check --only=nursery/noFloatingPromises src"
    estimated_time: "35min"
    assigned_to: "apex-dev"
    dependencies: []

  LT-107:
    id: "LT-107"
    name: "Organize imports consistently"
    category: "lint"
    severity: "low"
    command: "bun lint:fix"
    action: |
      1. Apply Biome import organization
      2. Verify blank line separation
    validation: "bun check --only=source.organizeImports src"
    estimated_time: "10min"
    assigned_to: "apex-dev"
    dependencies: []

  LT-108:
    id: "LT-108"
    name: "Fix noDoubleEquals violations"
    category: "lint"
    severity: "high"
    action: |
      1. Replace == with ===
      2. Replace != with !==
    validation: "bun check --only=suspicious/noDoubleEquals src"
    estimated_time: "20min"
    assigned_to: "apex-dev"
    dependencies: []

  LT-109:
    id: "LT-109"
    name: "Fix complexity violations"
    category: "lint"
    severity: "medium"
    action: |
      1. Refactor functions > 25 complexity
      2. Extract helper functions
      3. Simplify conditionals
    validation: "bun check --only=complexity/noExcessiveCognitiveComplexity src"
    estimated_time: "45min"
    assigned_to: "apex-dev"
    dependencies: []
```

#### 3.4 FRONTEND TASKS (FE-XXX)

```yaml
ATOMIC_TASKS_FRONTEND:
  FE-101:
    id: "FE-101"
    name: "Fix button type accessibility"
    category: "frontend"
    severity: "high"
    rule: "a11y/useButtonType"
    action: |
      1. Add type="button" to non-submit
      2. Add type="submit" to form submit
    validation: "bun check --only=a11y/useButtonType src/components"
    estimated_time: "20min"
    assigned_to: "apex-ui-ux-designer"
    dependencies: []

  FE-102:
    id: "FE-102"
    name: "Add alt text to images"
    category: "frontend"
    severity: "high"
    rule: "a11y/useAltText"
    action: |
      1. Add descriptive alt text
      2. Use empty alt for decorative
    validation: "bun check --only=a11y/useAltText src"
    estimated_time: "25min"
    assigned_to: "apex-ui-ux-designer"
    dependencies: []

  FE-103:
    id: "FE-103"
    name: "Fix keyboard event handlers"
    category: "frontend"
    severity: "high"
    rule: "a11y/useKeyWithClickEvents"
    action: |
      1. Add onKeyDown with onClick
      2. Handle Enter and Space
      3. Ensure focusability
    validation: "bun check --only=a11y/useKeyWithClickEvents src"
    estimated_time: "30min"
    assigned_to: "apex-ui-ux-designer"
    dependencies: []

  FE-104:
    id: "FE-104"
    name: "Fix anchor validation"
    category: "frontend"
    severity: "medium"
    rule: "a11y/useValidAnchor"
    action: |
      1. Replace # with proper hrefs
      2. Use button for non-navigation
    validation: "bun check --only=a11y/useValidAnchor src"
    estimated_time: "20min"
    assigned_to: "apex-ui-ux-designer"
    dependencies: []

  FE-105:
    id: "FE-105"
    name: "Add SVG titles"
    category: "frontend"
    severity: "medium"
    rule: "a11y/noSvgWithoutTitle"
    action: |
      1. Add <title> to meaningful SVGs
      2. Add aria-hidden to decorative
    validation: "bun check --only=a11y/noSvgWithoutTitle src"
    estimated_time: "25min"
    assigned_to: "apex-ui-ux-designer"
    dependencies: []

  FE-106:
    id: "FE-106"
    name: "Fix form accessibility"
    category: "frontend"
    severity: "high"
    action: |
      1. Add proper labels
      2. Associate labels with inputs
      3. Add error announcements
    validation: "bun test:e2e:a11y"
    estimated_time: "35min"
    assigned_to: "apex-ui-ux-designer"
    dependencies: []

  FE-107:
    id: "FE-107"
    name: "Fix focus management"
    category: "frontend"
    severity: "medium"
    action: |
      1. Remove positive tabindex
      2. Ensure logical focus order
      3. Add skip links
    validation: "bun check --only=a11y/noPositiveTabindex src"
    estimated_time: "25min"
    assigned_to: "apex-ui-ux-designer"
    dependencies: []
```

#### 3.5 DATABASE TASKS (DB-XXX)

```yaml
ATOMIC_TASKS_DATABASE:
  DB-101:
    id: "DB-101"
    name: "Sync Drizzle types with schema"
    category: "database"
    severity: "critical"
    action: |
      1. Run: bun db:generate
      2. Compare generated types
      3. Update imports
    validation: "bun type-check src/db"
    estimated_time: "20min"
    assigned_to: "database-specialist"
    dependencies: []

  DB-102:
    id: "DB-102"
    name: "Implement missing RLS policies"
    category: "database"
    severity: "critical"
    files: ["src/db/rls.ts"]
    action: |
      1. Audit user-facing tables
      2. Add RLS for SELECT/INSERT/UPDATE/DELETE
      3. Ensure user_id checks
    validation: "bun db:compliance"
    estimated_time: "45min"
    assigned_to: "database-specialist"
    dependencies: ["DB-101"]
    brazilian_compliance: true

  DB-103:
    id: "DB-103"
    name: "Add $inferInsert/$inferSelect types"
    category: "database"
    severity: "high"
    scope: "src/db/schema/**/*.ts"
    action: |
      1. Export InsertType and SelectType
      2. Use typeof table.$inferInsert
      3. Update usages
    validation: "bun type-check src/db/schema"
    estimated_time: "30min"
    assigned_to: "database-specialist"
    dependencies: ["DB-101"]

  DB-104:
    id: "DB-104"
    name: "Fix LGPD compliance gaps"
    category: "database"
    severity: "critical"
    action: |
      1. Audit PII fields
      2. Add encryption for sensitive data
      3. Implement consent tracking
      4. Add audit trails
    validation: "bun db:compliance"
    estimated_time: "60min"
    assigned_to: "database-specialist"
    dependencies: ["DB-102"]
    brazilian_compliance: true

  DB-105:
    id: "DB-105"
    name: "Validate PIX schema compliance"
    category: "database"
    severity: "critical"
    files: ["src/db/schema/pix*.ts"]
    action: |
      1. Verify BCB format compliance
      2. Add transaction audit
      3. Validate key formats
    validation: "bun test:healthcare"
    estimated_time: "40min"
    assigned_to: "database-specialist"
    dependencies: ["DB-101"]
    brazilian_compliance: true

  DB-106:
    id: "DB-106"
    name: "Optimize N+1 query patterns"
    category: "database"
    severity: "high"
    scope: "src/db/**/*.ts"
    action: |
      1. Identify N+1 patterns
      2. Add eager loading
      3. Use batch queries
    validation: "bun db:optimize"
    estimated_time: "45min"
    assigned_to: "database-specialist"
    dependencies: ["DB-103"]

  DB-107:
    id: "DB-107"
    name: "Add missing indexes"
    category: "database"
    severity: "medium"
    action: |
      1. Analyze query patterns
      2. Add indexes for frequent queries
      3. Verify performance improvement
    validation: "bun db:health"
    estimated_time: "30min"
    assigned_to: "database-specialist"
    dependencies: ["DB-106"]
```

#### 3.6 DEAD CODE TASKS (DC-XXX)

```yaml
ATOMIC_TASKS_DEADCODE:
  DC-101:
    id: "DC-101"
    name: "Remove orphan files"
    category: "deadcode"
    severity: "medium"
    command: "bunx knip"
    action: |
      1. Run knip for unused files
      2. Verify files are truly unused
      3. Remove or document
    validation: "bunx knip --no-exit-code"
    estimated_time: "30min"
    assigned_to: "apex-dev"
    dependencies: []

  DC-102:
    id: "DC-102"
    name: "Remove unused exports"
    category: "deadcode"
    severity: "medium"
    action: |
      1. Identify exports without imports
      2. Remove or mark as internal
    validation: "bunx knip --include exports"
    estimated_time: "25min"
    assigned_to: "apex-dev"
    dependencies: ["DC-101"]

  DC-103:
    id: "DC-103"
    name: "Remove commented code"
    category: "deadcode"
    severity: "low"
    action: |
      1. Search for large comment blocks
      2. Verify in git history
      3. Remove
    validation: "git diff --stat"
    estimated_time: "20min"
    assigned_to: "apex-dev"
    dependencies: []
```

---

## 📍 PHASE 4: IMPLEMENTATION WORKFLOW

### TDD Protocol per Task

```yaml
TDD_WORKFLOW:
  1_READ_TASK:
    action: "Read atomic task definition"
    verify: "Dependencies completed"

  2_CREATE_BRANCH:
    action: "git checkout -b fix/[task-id]-[description]"
    when: "For complex tasks"

  3_RED_PHASE:
    action: "Verify error exists"
    command: "bun check [file]"

  4_GREEN_PHASE:
    actions:
      - "Research solution (Context7/Tavily)"
      - "Implement minimal fix"
      - "Follow existing patterns (Serena)"

  5_VALIDATE:
    commands:
      - "bun check [file]"
      - "bun type-check"
      - "bun test [related-tests]"

  6_REFACTOR:
    action: "Improve while keeping tests green"

  7_COMMIT:
    format: "fix([domain]): [task-id] - [description]"
```

### Fix Patterns Reference

```typescript
// ❌ BEFORE: Missing dependency
useEffect(() => {
  fetchUser(userId);
}, []); // userId missing

// ✅ AFTER: Complete dependencies
useEffect(() => {
  fetchUser(userId);
}, [userId, fetchUser]);

// ❌ BEFORE: any type
const processData = (data: any) => { ... }

// ✅ AFTER: Proper typing
interface DataPayload {
  id: string;
  value: number;
}
const processData = (data: DataPayload) => { ... }

// ❌ BEFORE: Missing button type
<button onClick={handleClick}>Submit</button>

// ✅ AFTER: Explicit type
<button type="submit" onClick={handleClick}>Submit</button>

// ❌ BEFORE: Untyped navigation
navigate({ to: '/posts/123' })

// ✅ AFTER: Type-safe with from
navigate({
  from: Route.fullPath,
  to: '/posts/$postId',
  params: { postId: '123' }
})
```

---

## 📍 PHASE 5: QUALITY GATES VALIDATION

### Quality Gate Matrix

```yaml
QUALITY_GATES:
  GATE_1_LINT:
    command: "bun check ."
    expected: "0 errors"
    blocking: true

  GATE_2_TYPES:
    command: "bun type-check"
    expected: "0 errors"
    blocking: true

  GATE_3_TESTS:
    command: "bun test --run"
    expected: "100% pass"
    blocking: true

  GATE_4_COVERAGE:
    command: "bun test:coverage"
    thresholds:
      global: "≥90%"
      security: "≥95%"
      compliance: "≥95%"
      hooks: "≥90%"
    blocking: true

  GATE_5_SECURITY:
    command: "bun lint:security"
    expected: "0 critical/high"
    blocking: true

  GATE_6_DEADCODE:
    command: "bunx knip"
    expected: "0 unused files/exports"
    blocking: false

  GATE_7_E2E:
    command: "bun test:e2e"
    expected: "100% pass"
    blocking: true

  GATE_8_LGPD:
    command: "bun test:e2e:lgpd"
    expected: "100% pass"
    blocking: true
    brazilian_compliance: true
```

---

## 📊 TASK DEPENDENCY GRAPH

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TASK DEPENDENCY FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CRITICAL PATH (Sequential)                                                │
│  ═══════════════════════════                                               │
│  RT-101 ──► RT-102 ──► RT-105                                              │
│     │         │                                                            │
│     │         └───────► RT-103, RT-104                                     │
│     │                                                                       │
│     └─────────────────► RT-106, RT-107, RT-108                             │
│                                                                             │
│  DB-101 ──► DB-102 ──► DB-104                                              │
│     │         │                                                            │
│     │         └───────► DB-105                                             │
│     │                                                                       │
│     └────► DB-103 ────► DB-106 ──► DB-107                                  │
│                                                                             │
│  PARALLEL TRACKS                                                           │
│  ══════════════                                                            │
│                                                                             │
│  Track A (apex-dev):          Track B (database-specialist):               │
│  ┌─────────────────┐          ┌─────────────────┐                          │
│  │ HK-101 → HK-106 │          │ DB-101 → DB-104 │                          │
│  │ HK-102 → HK-107 │          │ DB-103 → DB-106 │                          │
│  │ HK-103 → HK-110 │          │ DB-105 → DB-107 │                          │
│  │ HK-104          │          └─────────────────┘                          │
│  │ HK-105          │                                                       │
│  │ HK-108, HK-109  │          Track C (apex-ui-ux):                        │
│  └─────────────────┘          ┌─────────────────┐                          │
│                               │ FE-101 → FE-106 │                          │
│  Track D (apex-dev):          │ FE-102 → FE-107 │                          │
│  ┌─────────────────┐          │ FE-103, FE-104  │                          │
│  │ LT-101 → LT-102 │          │ FE-105          │                          │
│  │ LT-103          │          └─────────────────┘                          │
│  │ LT-104 → LT-105 │                                                       │
│  │ LT-106 → LT-109 │                                                       │
│  │ LT-107, LT-108  │                                                       │
│  └─────────────────┘                                                       │
│                                                                             │
│  CLEANUP (After all tracks):                                               │
│  ════════════════════════════                                              │
│  DC-101 ──► DC-102 ──► DC-103                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 EXECUTION COMMANDS

### Full Quality Audit

```markdown
Execute Full Quality Audit do AegisWallet v2.0

## Comportamento Esperado
- AÇÃO: Implemente todas as correções
- Parallel execution: Maximize eficiência
- Research-first: Pesquise soluções oficiais
- Atomic tasks: Valide após cada correção
- Zero tolerance: Não aceite workarounds

## Quality Threshold
- ≥95% confidence antes de implementação
- Zero erros de lint/type ao final
- Cobertura mantida ou melhorada
- Brazilian compliance preservado

## Domains
- [ ] Routes (TanStack Router type safety)
- [ ] Hooks (React 19 exhaustive deps)
- [ ] Lint (Biome 2.3 all domains)
- [ ] Frontend (A11y, components)
- [ ] Database (Drizzle, RLS, LGPD)

Comece pela Phase 0: Discovery.
```

### Domain-Specific Audits

```bash
# Route-only audit
/quality-control --domain=routes

# Hook-only audit
/quality-control --domain=hooks

# Lint-only audit
/quality-control --domain=lint

# Frontend-only audit
/quality-control --domain=frontend

# Database-only audit
/quality-control --domain=database
```

### Quick Validation

```bash
# Quick parallel check
bun quality:parallel

# Full quality gates
bun quality:gates

# Security-focused
bun quality:security
```

---

## ⚠️ FAILURE RECOVERY

### Blocked Task Protocol

```yaml
BLOCKED_TASK_RECOVERY:
  step_1: "Document blocker"
  step_2: "Escalate to apex-researcher"
  step_3: "Create issue for human review if still blocked"
  step_4: "Continue with next independent tasks"
```

### Quality Gate Failure Protocol

```yaml
GATE_FAILURE_RECOVERY:
  step_1: "Identify failing tasks"
  step_2: "Rollback: git checkout -- [files]"
  step_3: "Re-research solution"
  step_4: "Re-implement with correct fix"
  step_5: "Re-validate: bun quality:gates"
```

---

## 📚 REFERENCES

### Official Documentation
- [TanStack Router](https://tanstack.com/router/latest/docs) - File-based routing
- [Biome](https://biomejs.dev/guides) - Linting rules
- [Drizzle ORM](https://orm.drizzle.team/docs) - Schema, Neon
- [React 19](https://react.dev/reference/react) - Hooks
- [Vitest](https://vitest.dev/guide) - Testing
---

*Quality Control v2.0 - AegisWallet Enhanced Testing Infrastructure*
*Last Updated: 2025-12-01*
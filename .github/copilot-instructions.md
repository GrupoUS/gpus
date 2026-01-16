# AegisWallet - GitHub Copilot Universal Instructions

> **Orchestration Rules for AI-Assisted Development**

## 🎯 Project Identity

**AegisWallet** is a voice-first autonomous financial assistant for the Brazilian market.
- **NOT** a cryptocurrency wallet
- **Mission**: 95% automation of financial management tasks
- **Market**: Brazil (Portuguese-first, LGPD compliance, PIX/boletos integration)

## 🛠️ Technology Stack (Mandatory)

```yaml
Core:
  runtime: Bun (latest)
  backend: Hono (4.9.9) + tRPC (11.6)
  frontend: React 19 + TanStack Router (1.114) + TanStack Query (5.90)
  database: Supabase (PostgreSQL + Auth + Realtime + RLS)
  styling: Tailwind CSS (4.1) + shadcn/ui
  validation: Zod (4.1) + React Hook Form (7.55)

Principles:
  - KISS: Simple solutions over complex ones
  - YAGNI: Build only what's needed now
  - Voice-First: Primary interaction through PT-BR voice commands
  - Type Safety: End-to-end TypeScript with strict mode
  - Security: LGPD compliance, RLS on all tables, audit trails
```

---

# 🧠 INTEGRATED AGENT EXPERTISE SYSTEM

## Primary Agent: @vibecoder (Master Developer with Embedded Expertise)

**@vibecoder** is the primary implementation agent with embedded expertise from all specialists. Instead of handing off to other agents, vibecoder reads and integrates their domain knowledge directly.

## 🎯 Domain Expertise Integration

### 📊 Research & Compliance Intelligence (from @apex-researcher)

**When to activate**: Any task involving regulations, compliance, market research, or requirements analysis

**Embedded expertise patterns**:
```yaml
research_methodology:
  - "Use context7 for official documentation (LGPD, BCB, PIX specs)"
  - "Use tavily for current market patterns and community validation"
  - "Cross-reference ≥3 sources for ≥95% accuracy"
  - "Sequential-thinking for complex problem decomposition"

brazilian_compliance:
  lgpd_mandatory: "Data minimization, consent management, audit trails"
  bcb_regulations: "PIX transaction patterns, financial security standards"
  portuguese_first: "All UI/UX must be Portuguese-first with Brazilian cultural patterns"
  
validation_thresholds:
  confidence_gate: "≥9.5/10 before implementation"
  accuracy_requirement: "≥95% cross-source validation"
```

**Knowledge absorption workflow**:
1. **Regulatory research needed** → Read apex-researcher patterns → Apply context7 + tavily
2. **Market analysis** → Use sequential-thinking → Cross-reference findings
3. **Requirements clarification** → Apply Brazilian compliance checks → Validate with sources

### 🎨 UI/UX Design Intelligence (from @apex-ui-ux-designer)

**When to activate**: Any UI component, user flow, or interface design

**Embedded expertise patterns**:
```yaml
design_system:
  mobile_first: "95% mobile usage - design mobile, enhance desktop"
  accessibility_wcag: "WCAG 2.1 AA+ mandatory, keyboard navigation complete"
  shadcn_integration: "@shadcn core + @magicui effects + @aceternity interactions"

voice_first_interface:
  primary_interaction: "PT-BR voice commands as primary input method"
  touch_targets: "Minimum 44px for important actions"
  response_latency: "≤2000ms max response time"
  
performance_targets:
  LCP: "≤2.5s (Largest Contentful Paint)"
  INP: "≤200ms (Interaction to Next Paint)"
  CLS: "≤0.1 (Cumulative Layout Shift)"
  accessibility_score: "95%+ WCAG 2.1 AA compliance"

brazilian_localization:
  currency: "BRL (Real brasileiro)"
  payment_methods: "PIX integration, parcelamento (2-12x)"
  date_format: "DD/MM/YYYY"
  timezone: "America/Sao_Paulo"
```

**Component workflow**:
1. **New UI needed** → Apply mobile-first patterns → Use shadcn registry workflow
2. **Accessibility required** → Apply WCAG 2.1 AA+ standards → Test with axe-core
3. **Voice interface** → Design PT-BR commands → Optimize for speech-to-text

### 🗄️ Database & PostgreSQL Intelligence (from @database-specialist)

**When to activate**: Any database operation, schema change, migration, or data handling

**Embedded expertise patterns**:
```yaml
neon_postgresql_mastery:
  serverless_architecture: "Connection pooling, auto-scaling, cold start optimization"
  branch_management: "Development/staging/production branch workflows"
  cli_operations: "neon databases, neon projects, neon auth, connection management"

drizzle_orm_excellence:
  schema_management: "TypeScript-first design, relation mapping, migration generation"
  query_patterns: "Type-safe queries, joins, aggregations, window functions"
  migration_strategy: "generate/migrate/push/pull/studio command mastery"

lgpd_compliance_database:
  data_encryption: "AES-256 for sensitive columns (CPF, financial data)"
  rls_policies: "User isolation via Clerk user_id, role-based access"
  audit_trails: "Comprehensive logging, tamper detection, automated reporting"
  minimization: "Collect only necessary data, automatic cleanup"

performance_optimization:
  query_response: "Sub-100ms critical paths, sub-50ms indexed queries"
  connection_efficiency: "<10ms pool acquisition, 100+ concurrent connections"
  index_strategy: "95%+ usage rate, <5% unused indexes, composite optimization"
```

**Database workflow**:
1. **Schema changes** → Apply Drizzle patterns → Generate migrations → Validate RLS
2. **Performance issues** → Analyze queries → Optimize indexes → Tune connection pool
3. **LGPD requirements** → Implement encryption → Set up RLS → Configure audit trails

### 🧪 Testing & Quality Intelligence (from @tester)

**When to activate**: Any testing strategy, quality assurance, or validation

**Embedded expertise patterns**:
```yaml
tdd_discipline:
  red_phase: "Write failing tests FIRST, never skip RED phase"
  coverage_targets: "≥90% global, ≥95% for security/compliance modules"
  test_pyramid: "Unit → Integration → E2E with Playwright"

testing_commands:
  unit_tests: "bun test"
  coverage: "bun test:coverage"
  e2e_all: "bun test:e2e"
  e2e_lgpd: "bun test:e2e:lgpd"
  accessibility: "bun test:e2e:a11y"

brazilian_compliance_testing:
  lgpd_validation: "Consent banners, data export, deletion rights, audit trails"
  portuguese_voice_commands: "6 essential PT-BR financial voice commands"
  accessibility_mandatory: "Zero WCAG violations, screen reader support"

quality_gates:
  - "bun test:e2e:smoke - All must pass"
  - "bun test:e2e:lgpd - LGPD compliance"
  - "bun test:e2e:a11y - Zero violations"
  - "bun test:coverage - ≥90%"
  - "Cross-browser: Chromium + Firefox + WebKit"
```

**Testing workflow**:
1. **New feature** → Write failing tests (RED) → Implement (GREEN) → Refactor
2. **LGPD involved** → Add compliance tests → Verify data protection → Validate audit trails
3. **UI changes** → Accessibility testing → Visual regression → Voice command testing

### 🏛️ Architecture Intelligence (from @architect-review)

**When to activate**: System design, API architecture, scalability decisions

**Embedded expertise patterns**:
```yaml
architecture_principles:
  scalability_first: "Design for 10x current load from day one"
  security_by_design: "Zero-trust architecture, principle of least privilege"
  performance_budget: "Response times <200ms for critical paths"
  
api_design:
  restful_patterns: "HTTP method semantics, proper status codes"
  validation_first: "Zod schemas for all inputs/outputs"
  error_handling: "Consistent error responses, proper logging"
  
integration_patterns:
  supabase_integration: "RLS policies, auth context, realtime subscriptions"
  clerk_authentication: "Session management, user contexts, webhook handling"
  voice_processing: "Speech-to-text integration, Portuguese NLP"
```

---

## 🔄 Integrated Development Workflow

### Sequential Expertise Application (No Handoffs Required)

```
1. ANALYZE & RESEARCH
   @vibecoder reads apex-researcher patterns → Applies context7 + tavily → Validates ≥9.5/10

2. DESIGN & ARCHITECTURE  
   @vibecoder applies architect-review patterns → Designs with scalability → Security by design

3. UI/UX CONSIDERATIONS
   @vibecoder uses apex-ui-ux-designer expertise → Mobile-first → WCAG 2.1 AA+ → Voice-first

4. DATABASE DESIGN
   @vibecoder applies database-specialist knowledge → Neon + Drizzle → LGPD compliance → RLS

5. IMPLEMENTATION
   @vibecoder implements with embedded expertise → Type safety → Performance optimization

6. TESTING & VALIDATION
   @vibecoder applies tester patterns → TDD RED/GREEN → E2E → LGPD validation → Accessibility

7. QUALITY ASSURANCE
   @vibecoder performs code-reviewer style validation → Security audit → Performance check
```

---

## 📋 Task Complexity Assessment

**Scale 1-10** - Assign before starting any task:

| Level | Description | Recommended Agent |
|-------|-------------|-------------------|
| 1-3 | Simple, routine tasks | Standard implementation |
| 4-6 | Moderate complexity | Domain specialist |
| 7-10 | Complex, critical | `@vibecoder` + full review |

---

## 🚨 Critical Rules

### MUST Always

- ✅ Start with `sequential-thinking` tool for complex tasks
- ✅ Research before critical implementations (use `@apex-researcher`)
- ✅ Follow KISS and YAGNI principles
- ✅ Test EVERY implementation with `@tester`
- ✅ Ensure 100% Brazilian compliance for financial features
- ✅ Create pages for EVERY link (NO 404s allowed)
- ✅ Use TypeScript strict mode with proper Zod validation
- ✅ Implement RLS on all database tables

### MUST NOT

- ❌ Change functionality without explicit approval
- ❌ Introduce breaking changes without documentation
- ❌ Skip quality gates (code review, testing)
- ❌ Proceed with <85% confidence (ask for clarification)
- ❌ Use ORMs or abstract database layers
- ❌ Over-engineer solutions
- ❌ Skip LGPD compliance validation

---

## 🇧🇷 Brazilian Compliance Integration

### LGPD Compliance Flow
```
@apex-researcher (LGPD requirements)
    ↓
@database-specialist (compliant data storage)
    ↓
@code-reviewer (implementation validation)
    ↓
@tester (UI verification)
```

### Financial Regulations Flow
```
@apex-researcher (BCB regulations)
    ↓
@architect-review (compliant architecture)
    ↓
@vibecoder (implementation with compliance checks)
    ↓
@code-reviewer (security validation)
```

### Portuguese Localization
- All UI must be Portuguese-first
- Use cultural patterns appropriate for Brazil
- Test with Portuguese language validation

---

## 📊 Quality Standards

### Code Quality Gates
- **OXLint**: 50-100x faster than ESLint, ≥95% pass rate
- **TypeScript**: Zero errors in strict mode
- **Test Coverage**: ≥90% for critical components
- **Security**: Zero critical vulnerabilities
- **Performance**: Response times <200ms for critical paths

### Quality Metrics
```yaml
Quality:
  code: "≥9.5/10 rating from @code-reviewer"
  security: "Zero critical vulnerabilities"
  coverage: "≥90% for critical business logic"
  performance: "Core Web Vitals ≥ 90"
  compliance: "100% LGPD and WCAG 2.1 AA+"
```

---

## 📁 Key Directories

```
src/
├── components/          # React UI (shadcn/ui in ui/)
├── routes/              # TanStack Router pages
├── hooks/               # Custom hooks (data, voice)
├── lib/                 # Banking, voice, PIX, utilities
├── server/routers/      # tRPC routers
├── integrations/supabase/ # Supabase client
supabase/migrations/     # Database schema and RLS
.github/agents/          # Custom Copilot agents (8 total)
```

---

## 🚀 Essential Commands

```bash
# Development
bun dev                    # Start development servers
bun build                  # Build application

# Quality Assurance
bun lint                   # OXLint validation
bun type-check             # TypeScript strict mode
bun test                   # Vitest unit/integration tests

# Database
bunx supabase db push      # Push migrations
bunx supabase gen types    # Generate TypeScript types
```

---

## 🔗 Import Patterns

```typescript
// Supabase Client
import { supabase } from "@/integrations/supabase/client"

// API Client (Hono RPC)
import { apiClient } from "@/lib/api-client"

// React Query
import { useQuery, useMutation } from "@tanstack/react-query"

// Hono Server
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
```

---

## 🎯 Expertise Activation Triggers

### Financial/Banking Tasks (Complexity 7-10)
**@vibecoder applies integrated expertise**:
1. **Research phase**: apex-researcher patterns → BCB/PIX/LGPD research → context7 + tavily validation
2. **Architecture phase**: architect-review patterns → Secure transaction design → Performance budgeting
3. **Database phase**: database-specialist patterns → Audit trails → RLS policies → LGPD encryption
4. **Implementation**: Full-stack development with embedded security patterns
5. **Testing phase**: tester patterns → TDD RED/GREEN → Compliance validation → E2E testing

### UI/UX Development (Complexity 4-8)
**@vibecoder applies integrated expertise**:
1. **Design research**: apex-ui-ux-designer patterns → Mobile-first → WCAG 2.1 AA+
2. **Voice interface**: PT-BR command design → Speech-to-text optimization
3. **Component implementation**: shadcn/ui registry → Accessibility testing
4. **Visual validation**: axe-core testing → Cross-browser compatibility

### Database Operations (Complexity 6-9)
**@vibecoder applies integrated expertise**:
1. **Schema design**: database-specialist patterns → Neon + Drizzle optimization
2. **LGPD compliance**: Data encryption → RLS policies → Audit trails
3. **Performance**: Query optimization → Index strategy → Connection pooling
4. **Migration strategy**: Zero-downtime deployment → Rollback planning

### Architecture & API Design (Complexity 8-10)
**@vibecoder applies integrated expertise**:
1. **System design**: architect-review patterns → Scalability planning → Security by design
2. **API development**: RESTful patterns → Zod validation → Error handling
3. **Integration**: Supabase + Clerk patterns → Authentication flows
4. **Performance**: Response budgeting → Caching strategies

---

## 🔧 Expertise Integration Commands

### Research & Validation Commands
```bash
# Regulatory compliance research
context7 → get-library-docs for BCB/PIX/LGPD specs
tavily-search → current fintech patterns
sequential-thinking → multi-perspective analysis
```

### Database Operations
```bash
# Neon + Drizzle workflow
bun db:generate          # Generate migrations
bun db:migrate           # Apply migrations  
bun db:studio            # Visual management
bun scripts/test-rls-isolation.ts  # RLS validation
```

### UI/UX Development
```bash
# shadcn/ui integration
npx shadcn@latest add [component]  # Add components
bun test:e2e:a11y                   # Accessibility testing
bun test:e2e:smoke                  # Visual regression
```

### Quality Assurance
```bash
# Testing and validation
bun test:coverage                    # Coverage analysis
bun test:e2e:lgpd                   # LGPD compliance
bun test:e2e                        # Full E2E suite
```

---

## 💡 Key Principles

1. **Integrated Expertise**: @vibecoder reads and applies all specialist knowledge directly
2. **Sequential Excellence**: Apply domain expertise in logical order without handoffs
3. **Embedded Quality**: Each expertise includes its own validation patterns
4. **Brazilian First**: LGPD, PIX, and Portuguese requirements embedded in all decisions
5. **Knowledge Absorption**: Read specialist patterns before domain-specific implementation

---

## 📋 Integrated Example Workflow

### User: "Implement PIX transfer with LGPD compliance"

```
1. @vibecoder analyzes complexity: 8/10 (financial integration)

2. Research Phase (apex-researcher patterns):
   - context7 → BCB PIX official specifications
   - tavily → Current fintech implementation patterns
   - sequential-thinking → Multi-perspective compliance analysis
   - Validation threshold: ≥9.5/10 confidence before proceeding

3. Design Phase (architect-review patterns):
   - Secure transaction architecture with scalability planning
   - API design with Zod validation and proper error handling
   - Integration patterns for Supabase + Clerk authentication

4. Database Phase (database-specialist patterns):
   - Neon + Drizzle schema design with audit trails
   - LGPD compliance: AES-256 encryption, RLS policies, data minimization
   - Performance optimization: Index strategy, connection pooling

5. UI/UX Phase (apex-ui-ux-designer patterns):
   - Mobile-first design with 44px touch targets
   - WCAG 2.1 AA+ compliance with axe-core validation
   - Voice-first PT-BR interface with speech-to-text optimization

6. Implementation Phase:
   - Full-stack development with embedded security patterns
   - TypeScript strict mode with comprehensive type safety
   - Performance budget: <200ms response times

7. Testing Phase (tester patterns):
   - TDD RED/GREEN: Write failing tests first
   - LGPD validation: Consent, data export, deletion rights
   - E2E testing: Cross-browser (Chromium + Firefox + WebKit)
   - Quality gates: ≥90% coverage, zero WCAG violations

8. Quality Assurance:
   - Security audit with code-reviewer patterns
   - Performance validation against Core Web Vitals
   - Brazilian compliance verification
   - Documentation with comprehensive API guides
```

---

## 🎯 @vibecoder Expertise Summary

**Your Mission**: Master developer with embedded specialist intelligence for Brazilian fintech excellence.

### Core Capabilities
- **Research Intelligence**: context7 + tavily + sequential-thinking for ≥95% accuracy
- **Database Mastery**: Neon + Drizzle + LGPD compliance with embedded security patterns
- **UI/UX Excellence**: Mobile-first + WCAG 2.1 AA+ + voice-first PT-BR interfaces
- **Architecture Leadership**: Scalability-first + security-by-design + performance budgets
- **Testing Discipline**: TDD RED/GREEN + comprehensive E2E + Brazilian compliance validation

### Decision Framework
```yaml
complexity_assessment: "1-10 scale for every task"
expertise_activation: "Read relevant specialist patterns before implementation"
validation_thresholds: "≥9.5/10 confidence, ≥90% test coverage"
brazilian_priority: "LGPD > Security > Performance > Features"
```

### Quality Gates (Mandatory)
- ✅ Research validation with context7 + tavily
- ✅ TDD RED phase before any implementation
- ✅ LGPD compliance for all data handling
- ✅ WCAG 2.1 AA+ for all UI changes
- ✅ Performance budgets (<200ms critical paths)
- ✅ Cross-browser testing (Chromium + Firefox + WebKit)
- ✅ ≥90% test coverage with ≥95% for security modules

---

**Remember**: You are the master developer with integrated specialist expertise. Read the relevant patterns, apply them sequentially, and deliver production-ready solutions that Brazilian users love. Every decision should serve our vision of a simple, autonomous financial assistant while maintaining technical excellence.


# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `npm exec -- ultracite fix`
- **Check for issues**: `npm exec -- ultracite check`
- **Diagnose setup**: `npm exec -- ultracite doctor`

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**
- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**
- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**
- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `npm exec -- ultracite fix` before committing to ensure compliance.

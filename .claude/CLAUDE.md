# Factory Orchestration System

> **Note**: This is the condensed orchestration reference. For detailed Spec Mode research patterns, see `research.md`. For complete subagent definitions and development standards, see root `AGENTS.md`.

Dynamic subagent routing and parallel execution coordination for AegisWallet subagents and skills.

## Available Subagents & Capabilities

| Subagent | Primary Focus | MCPs Assigned | When to Use |
|----------|---------------|---------------|-------------|
| **apex-dev** | Advanced implementation (complexity ≥7) | serena, context7 | Performance-critical, security-sensitive |
| **database-specialist** | Supabase/PostgreSQL + LGPD | serena | ANY database operation, RLS, migrations |
| **code-reviewer** | Security + Brazilian compliance | context7, tavily | Post-implementation, security validation |
| **apex-ui-ux-designer** | UI/UX + WCAG 2.1 AA+ | context7, serena | ANY new UI component, accessibility |
| **apex-researcher** | Brazilian regulations (≥95% accuracy) | context7, tavily, serena | Compliance questions, research |
| **product-architect** | PRD + Diátaxis framework | sequential-thinking | Strategy, documentation |

## Core Orchestration Rules

### Spec Mode Auto-Activation

**Triggers**: "spec - research", "research and plan", "analyze and plan", "spec mode research"

**Protocol**:
1. Immediate Routing → apex-researcher (bypass all analysis)
2. Priority Override → HIGHEST (Level 1)
3. Parallel Execution → Context7 + Tavily + Serena + Sequential Thinking
4. Auto-Compliance → Brazilian regulations activated for financial topics
5. Deliverable → Research Intelligence Report + Implementation Plan

**Guaranteed Access**: No queue waiting, full MCP orchestration, Brazilian compliance auto-activation, ≥95% cross-validation accuracy requirement.

### Apex-Dev Central Orchestration (MANDATORY)

**TODOS os prompts DEVEM passar pelo apex-dev primeiro**

- apex-dev é responsável por análise, coordenação e implementação
- Nenhum subagent pode ser invocado diretamente (exceto apex-researcher para spec mode)
- apex-dev decide QUANDO e QUAIS subagents consultar em paralelo
- apex-dev serve como hub central para consolidação de insights
- apex-dev garante preservação completa do contexto entre todas as fases

**Execution Flow**:
```
Prompt → apex-dev (análise) → [PARALELO] subagents → apex-dev (consolidação) → Implementação → [PARALELO] validação → apex-dev (ajustes)
```

### Task Tool Invocation Framework

The Task tool is the **primary mechanism** for invoking specialized subagents. Each subagent runs with assigned MCPs, structured input/output contracts preserve context, and parallel execution reduces time by 40-70%.

**When to Use Task Tool**:
- ✅ Complexity ≥4 (moderate to mission-critical)
- ✅ Security-sensitive operations (financial data, auth, PII)
- ✅ Database operations (ANY database change)
- ✅ UI/UX components (ANY interface work)
- ✅ Research required (external docs, patterns)

**Mandatory Triggers** (ALWAYS use Task tool):
- **Database**: schema, migration, query, RLS
- **UI**: component, ui, ux, page, form, accessibility
- **Security**: security, auth, permission, LGPD, PIX
- **Research**: research, spec, analyze, investigate

#### Single Subagent Invocation

**Template**:
```
Task:
  subagent_type: "[subagent-name]"
  prompt: |
    ## Goal
    [Clear, specific objective]

    ## Context
    [Background, existing patterns, constraints]

    ## Requirements
    - [Requirement 1]
    - [Requirement 2]

    ## Expected Output
    [Deliverable format]

```

#### Parallel Subagent Invocation

**When to Use Parallel** (one message, multiple Task calls):
- Complexity ≥7 (complex or mission-critical)
- Multiple domains (database + UI + security)
- Comprehensive analysis needed
- Time-sensitive (40-60% time reduction)

**Common Parallel Combinations**:
- **Feature Implementation**: [code-reviewer, database-specialist, apex-ui-ux-designer]
- **Database Changes**: [database-specialist, code-reviewer]
- **Security Sensitive**: [code-reviewer, apex-researcher, database-specialist, apex-ui-ux-designer]
- **UI Component**: [apex-ui-ux-designer, code-reviewer] (MANDATORY for any UI work)
- **Research Spec Mode**: apex-researcher (primary) with optional support from other specialists

**Parallel Execution Matrix**:

| Complexity | Pre-Implementation | Post-Implementation |
|------------|-------------------|---------------------|
| 1-3 (Simple) | apex-dev alone | code-reviewer |
| 4-6 (Moderate) | apex-dev + 1-2 specialists | Sequential validation |
| 7-8 (Complex) | 3-4 specialists parallel | Parallel validation |
| 9-10 (Mission) | All specialists + apex-researcher | Parallel validation |

#### Parameter Structure & Best Practices

**Required**: `subagent_type`, `prompt` (with Goal, Context, Requirements, Expected Output sections)
**Optional**: `model` (sonnet/opus/haiku), `timeout` (default: 120s, max: 600s)

**Best Practices**:
1. Always start with apex-dev analysis (MANDATORY)
2. Provide complete context in prompts
3. Use parallel dispatch for efficiency (complexity ≥7)
4. Respect subagent specializations
5. Follow Priority Hierarchy: Security > Compliance > Architecture > Performance > Features
6. Validate subagent outputs (confidence ≥85%)
7. Never skip Brazilian compliance

## Implementation Guidelines

### Complexity Scales

**Implementation Complexity (1-10)**:
- **Simple (1-3)**: Single file, known pattern, 15-30 min, apex-dev alone
- **Moderate (4-6)**: Multi-file, testing required, 1-3 hours, apex-dev + 1-2 specialists
- **Complex (7-8)**: Multi-domain, security-sensitive, 4-8 hours, apex-dev + 3-4 specialists (parallel)
- **Mission (9-10)**: System-wide impact, regulatory compliance, 12-24 hours, all subagents + apex-researcher (parallel)

**Research Depth (L1-L10)**:
- **Basic (L1-L3)**: 1-2 sources, Context7 only, 15-30 min
- **Moderate (L4-L6)**: 3-5 sources, Context7 + Tavily, 45-90 min
- **Complex (L7-L8)**: 5-10 sources, Context7 + Tavily + Serena, 2-4 hours
- **Mission (L9-L10)**: 10+ sources, all MCPs + skills, 4-8 hours

**Scale Mapping**: Simple (1-3) → L1-L3, Moderate (4-6) → L4-L6, Complex (7-8) → L7-L8, Mission (9-10) → L9-L10

### Atomic Task Decomposition

**Definition**: Smallest executable unit delivering value, independently validatable, 30 min - 2 hours duration.

**Process**: Parse requirement → Assess complexity → Break into phases (Research → Design → Database → Backend → Frontend → Testing) → Create atomic tasks → Assign subagents → Estimate time → Map dependencies

**Task Template**:
```yaml
task_id: "[phase]_[sequence]_[description]"
complexity: "1-10 or L1-L10"
estimated_duration: "X hours/minutes"
assigned_subagents: ["primary", "support"]
parallel_execution: true/false
dependencies: ["task_id_dependencies"]
deliverables: ["output_1", "output_2"]
quality_gates: ["validation_1", "validation_2"]
brazilian_compliance: true/false
```

**Dependencies**:
- **Hard** (Sequential only): DB schema → API implementation, Authentication → Authorization
- **Soft** (Parallel possible): Frontend can mock backend endpoints
- **None** (Fully parallel): Research across domains, independent validations

**Time Estimation**:
- Base times: 1-3 (30min-2h), 4-6 (2h-4h), 7-8 (4h-8h), 9-10 (12h-24h)
- Research adjustment: L1-L3 (+10min), L4-L6 (+30min), L7-L8 (+90min), L9-L10 (+180min)
- Brazilian Compliance: +60min (LGPD + PIX + Accessibility)
- Parallel efficiency: 2 subagents (~45%), 3-4 subagents (~55%), 5+ subagents (~60%)

### Task Routing Matrix

**Complexity-Based Routing**:

| Complexity | Primary | Parallel | Brazilian Focus |
|------------|---------|----------|----------------|
| 1-3 | apex-dev | code-reviewer | Basic validation |
| 4-6 | apex-dev | code-reviewer + apex-ui-ux-designer | Accessibility, compliance |
| 7-8 | apex-dev | code-reviewer + database-specialist + apex-ui-ux-designer | Performance, security |
| 9-10 | apex-dev | All specialists + apex-researcher | Full research → implementation |

**Specialized Triggers**:
- **LGPD/privacy**: apex-dev → apex-researcher → code-reviewer
- **PIX/financial**: apex-dev → apex-researcher → code-reviewer + database-specialist
- **Accessibility**: apex-dev → apex-ui-ux-designer → code-reviewer

### Execution Flow (6 Phases)

1. **Phase 1 - Analysis** (apex-dev alone): Assess complexity, identify domain, analyze requirements, determine Brazilian compliance needs, identify required subagents

2. **Phase 2 - Parallel Consultation** (subagents simultâneos): apex-dev dispatches parallel analyses based on complexity ≥7, security sensitivity, UI components (ALWAYS apex-ui-ux-designer), database changes (ALWAYS database-specialist), compliance questions (apex-researcher PRIMARY)

3. **Phase 3 - Synthesis** (apex-dev): Receive insights from all subagents, synthesize into implementation plan, resolve conflicts, define detailed strategy

4. **Phase 4 - Implementation** (apex-dev): Implement following consolidated specs, apply security validations, use database schemas, follow UI patterns, document decisions

5. **Phase 5 - Validation** (parallel): code-reviewer (security), database-specialist (performance/RLS), apex-ui-ux-designer (accessibility), apex-researcher (Brazilian compliance if applicable)

6. **Phase 6 - Finalization** (apex-dev): Apply corrections from validations, document final decisions, prepare delivery

## Subagent Orchestration

### Communication Contracts

**apex-dev** expects: goal, scope, complexity (1-10), requirements (functional/non-functional), constraints. Delivers: implementation plan, technical approach, risk assessment, resource requirements, integration strategy, quality gates.

**code-reviewer** expects: file paths, review type (security/architecture/compliance/full), security focus (OWASP Top 10), Brazilian compliance (LGPD/PIX/accessibility), risk tolerance. Delivers: security findings with severity, compliance status, architecture assessment, performance impact, recommendations, confidence score.

**database-specialist** expects: schema changes, performance requirements (query times, concurrency), security requirements (RLS, encryption), Brazilian compliance (LGPD data protection, audit trails), integration points. Delivers: schema recommendations, performance optimization (query optimization, indexing), security enhancements (RLS policies, access control), compliance validation, integration impact, migration strategy.

**apex-ui-ux-designer** expects: goal, component type (page/component/flow/system), Brazilian requirements (accessibility, Portuguese, financial patterns), existing patterns (design system references), mobile requirements, accessibility requirements (WCAG 2.1 AA+, NBR 17225). Delivers: design recommendations with rationale, accessibility audit (WCAG 2.1 AA+ compliance), user experience analysis, Brazilian adaptation (cultural/localization), component specifications, success metrics.

**apex-researcher** expects: topic, complexity (L1-L10), sources needed (documentation, community, specs), Brazilian focus (LGPD/BCB/PIX regulatory), validation required (≥95% cross-validation). Delivers: research findings with confidence levels, source validation, implementation guidance, gap analysis, compliance requirements (Brazilian regulatory), expert consensus.

**product-architect** expects: deliverable type (documentation/PRD/rules), audience (developers/stakeholders/users), success criteria, diataxis form (tutorial/how-to/reference/explanation), cross references. Delivers: documentation quality scores, PRD completeness, rules effectiveness, audience alignment, success metrics, improvement opportunities.

### Handoff Protocol

**apex-dev → Subagent**: Complete task description with goals/constraints, clear expectations/acceptance criteria, available tools/timeframes, success metrics, required output format.

**Subagent → apex-dev**: Comprehensive work summary, complete deliverables list, key decisions with reasoning/alternatives, recommended next actions/handoffs, quality self-assessment with confidence levels.

**Error Escalation**:
1. Subagent self-resolution with available resources
2. Request additional context from apex-dev
3. Escalate to apex-researcher for research-based resolution
4. Escalate to code-reviewer for security/compliance resolution
5. Escalate to product-architect for documentation/governance resolution

### MCP Orchestration

**MCPs by Subagent**:
- **apex-researcher**: context7, tavily, serena, sequential-thinking (multi-source validation, regulatory research, LGPD/BCB/PIX docs)
- **code-reviewer**: context7, tavily (OWASP docs, security patterns, LGPD security requirements)
- **database-specialist**: serena (codebase analysis, existing schemas, migration history, LGPD encryption patterns)
- **apex-ui-ux-designer**: context7, serena (WCAG docs, design system patterns, NBR 17225, Brazilian fintech UX)
- **apex-dev**: serena, context7 (codebase search, existing patterns, framework docs)
- **product-architect**: sequential-thinking (strategic analysis, documentation planning, governance)

**MCP Functions**:
- **Context7**: Official framework docs, OWASP Top 10, WCAG 2.1, LGPD/BCB regulations, React/Next.js/Hono docs
- **Tavily**: Multi-source information gathering, community best practices, real-world implementations, Brazilian fintech trends, expert insights
- **Serena**: Semantic code search, existing schema patterns, component library patterns, API conventions, auth patterns
- **Sequential Thinking**: Multi-perspective reasoning, regulatory analysis, strategic documentation, conflict resolution, pattern recognition

**Cross-Validation Strategy** (≥95% accuracy required):
1. Context7: Official authoritative sources (BCB, WCAG, OWASP)
2. Tavily: Community validation, real-world implementations
3. Serena: Codebase consistency, existing patterns
4. Sequential Thinking: Synthesis and gap identification

**Brazilian Compliance Auto-Activation**:
- **LGPD keyword**: apex-researcher → Context7 (BCB) + Tavily (expert analysis)
- **PIX keyword**: apex-researcher → Context7 (BCB clearing docs)
- **Accessibility keywords**: apex-ui-ux-designer → Context7 (WCAG + NBR 17225)
- **CPF/financial data**: code-reviewer → Context7 (LGPD encryption standards)

Process: Automatic MCP routing based on keyword detection → Brazilian compliance skills auto-invoked → Portuguese-first validation → Quality gate: 100% compliance required for deployment

### Skill Integration

**Available Skills** (`.claude/skills/`):
- **Development**: ai-data-analyst, product-management, frontend-design, vibe-coding
- **Creative**: canvas-design, algorithmic-art, theme-factory, web-artifacts-builder
- **Document**: docx, pdf, pptx, xlsx

**Invocation Triggers** (Automatic): market research → product-management, UI/UX design → frontend-design, data analysis → ai-data-analyst, testing → webapp-testing

**Skill ↔ Subagent Patterns**:
- **aegis-architect**: apex-dev, apex-ui-ux-designer, database-specialist (voice-first architecture, Brazilian fintech patterns, performance)
- **webapp-testing**: apex-dev, code-reviewer (LGPD testing, Portuguese voice validation, tRPC/Supabase RLS)

## Quality & Performance

### Priority Hierarchy & Conflict Resolution

1. **Security** (code-reviewer overrides all)
2. **Compliance** (LGPD and regulatory requirements)
3. **Architecture** (system architecture decisions)
4. **Performance** (within security constraints)
5. **Features** (established patterns)

**Escalation Rules**:
- Subagent disagreement → apex-researcher (regulatory research)
- Compliance conflict → apex-researcher (regulatory clarification)
- Performance vs security → security takes precedence
- Spec mode request → IMMEDIATE apex-researcher routing
- Brazilian regulatory questions → apex-researcher as primary authority

### Performance Metrics

- **Spec Mode Activation**: <30 seconds to research initiation
- **Parallel Research**: 60% faster through MCP orchestration
- **Complex Features**: 8-12 hours (vs 20-30 sequential) = 60% reduction
- **Quality Assurance**: 50% faster through parallel validation
- **Context Transfer**: <5% information loss between subagent transitions
- **Routing Decisions**: <2 minutes intelligent routing

**Resource Allocation**: Spec Mode Priority (immediate apex-researcher + full MCP access), subagent specialization (core competency optimization), dynamic load balancing, intelligent routing (95% accuracy with spec mode override), Brazilian compliance (auto-activated regulatory research)

### Enhanced Deliverables

**Research Intelligence Reports**: Research complexity assessment (L1-L10), ≥95% cross-source validation with confidence scores, actionable implementation recommendations with code examples, gap analysis (research limitations + follow-up recommendations), Brazilian compliance (LGPD/PIX/BCB status)

**Atomic Task Execution Reports**: Complete breakdown into atomic units (30min-2h each), planned vs actual parallelization efficiency, individual subagent contributions and quality metrics, planned vs actual execution times per task, validation checkpoints and pass/fail status

**Multi-Subagent Validation Summaries**: Individual validation results from each specialist, validation confidence by subagent (≥85% required), conflict resolution documentation, priority hierarchy application (which recommendations took precedence and why), overall approval status and remaining work

**Implementation Documentation**: Key decisions with rationale and alternatives considered, system architecture and data flow visualizations, practical implementation patterns and templates, actual vs target performance benchmarks, complete LGPD/PIX/BCB compliance verification

## Representative Examples

### Example: PaymentCard Component (Complexity 6)

**Phase 1 - Analysis**: Complexity 6 (reusable component, Brazilian patterns), Research L5 (Brazilian fintech UX patterns), Domain: Frontend (UI component), Triggers: ["component", "payment", "financial"], Subagents: [apex-ui-ux-designer, code-reviewer], Brazilian compliance: true (R$ formatting, Portuguese, trust patterns)

**Phase 2 - Parallel Consultation** (2 Task calls):
- **apex-ui-ux-designer**: Design PaymentCard with Brazilian fintech patterns (mobile-first 320px-1920px, R$ formatting, Portuguese labels, trust patterns green/yellow/red, WCAG 2.1 AA+, 44px+ touch targets)
- **code-reviewer**: Security review for financial transaction card (XSS prevention, sensitive data exposure, LGPD compliance/data minimization)

**Phase 3 - Synthesis**:
- **UI designer output**: Props (amount, currency, date, status, merchantName), Layout (Flex row desktop, column mobile <640px), ARIA ('Pagamento de R$ {amount} para {merchantName} em {date}'), Contrast 4.5:1+, R$ format (Intl.NumberFormat 'pt-BR'), Status colors (green/yellow/red)
- **Security output**: Sanitize merchantName (DOMPurify), Validate amount is number (TypeScript), No full card numbers, LGPD data minimization (stateless, no PII storage)

**Phase 4 - Implementation**: Files created (PaymentCard.tsx, PaymentCard.test.tsx), Highlights: TypeScript strict, R$ format, XSS prevention, Portuguese ARIA, responsive mobile-first Tailwind

**Phase 5 - Parallel Validation** (2 Task calls):
- **apex-ui-ux-designer**: Accessibility audit → Approved (WCAG AA, 4.5:1 contrast, keyboard nav, Portuguese ARIA, mobile 320px-1920px pass)
- **code-reviewer**: Security validation → Approved (XSS prevented, LGPD compliant)

**Results**: Complete in 2h 20min (vs 3.5h sequential = 40% faster). Breakdown: Parallel consultation 30min, Implementation 90min, Parallel validation 10min, Documentation 10min.

### Example: PIX Database Migration (Complexity 7)

**Phase 1 - Analysis**: Complexity 7 (database + security + Brazilian compliance), Research L7 (BCB PIX standards + LGPD), Domain: Database + Security + Compliance, Triggers: ["database", "PIX", "LGPD"], Subagents: [database-specialist, code-reviewer, apex-researcher], Brazilian compliance: MANDATORY

**Phase 2 - Parallel Consultation** (3 Task calls):
- **apex-researcher**: Research BCB PIX standards and LGPD requirements (L7 complexity, Context7 BCB/LGPD docs, Tavily Brazilian fintech implementations, ≥95% cross-validation) → Output: PIX requirements (end-to-end ID 32 chars UUID, max 10 seconds processing, 5 years retention), LGPD requirements (CPF encryption AES-256-GCM, amounts encrypted at rest, explicit consent, audit trail with IP/timestamp), Confidence 97%
- **database-specialist**: Design high-performance PIX transactions schema (Supabase PostgreSQL, 1000+ concurrent transactions, <100ms inserts/<50ms lookups, indexes for user queries/date ranges) → Output: Complete schema design (TypeScript + SQL with pix_transactions table, composite indexes idx_pix_user_date and idx_pix_status), RLS policies (user_id isolation), Performance estimate (50ms inserts, 30ms lookups)
- **code-reviewer**: Security review for PIX transaction handling (AES-256 encryption, input validation PIX keys/amounts, injection prevention, rate limiting) → Output: Security recommendations (use pgcrypto for encryption, validate PIX keys CPF/CNPJ/email/phone, rate limit 10 transactions/minute, audit trigger for SELECT/UPDATE/DELETE), Threat model (SQL injection PREVENTED, data exposure MITIGATED, audit tampering PREVENTED)

**Phase 3 - Synthesis**: Consolidated PIX transaction schema with AES-256-GCM encryption, RLS policies, audit trail, composite indexes, PIX key validation for all formats (CPF/CNPJ/email/phone/random)

**Phase 4 - Implementation**: Files created (001_pix_transactions.sql migration, pix_transactions.ts schema, encryption.ts, validation.ts), Highlights: AES-256-GCM encryption for CPF and amounts, RLS policies with user_id isolation, Audit trail table with append-only trigger, Composite indexes for performance, PIX key validation

**Phase 5 - Parallel Validation** (2 Task calls):
- **database-specialist**: Validate schema performance and LGPD compliance → Approved with minor optimization (48ms inserts, 28ms lookups better than target, LGPD compliant, suggest partitioning after 1M+ transactions)
- **code-reviewer**: Final security audit → Approved (AES-256-GCM verified, RLS secure, audit trail complete, recommend monitoring for suspicious patterns)

**Results**: Complete in 3h 45min (vs 6h sequential = 38% faster). Deployment checklist: ✅ BCB PIX standards compliance, ✅ LGPD encryption and audit, ✅ Performance targets exceeded, ✅ Security audit passed, ✅ RLS policies validated.

## Cross-References

- **For Spec Mode research patterns (L7-L10)**: See `.claude/commands/research.md` for comprehensive research orchestration, MCP coordination, and atomic task generation for research workflows
- **For complete subagent definitions**: See root `AGENTS.md` for detailed subagent capabilities, development standards, testing requirements, and Brazilian compliance details
- **For complexity assessment**: See Complexity Scales section above for Implementation (1-10) and Research Depth (L1-L10)
- **For MCP functions**: See MCP Orchestration section for detailed Context7, Tavily, Serena, and Sequential Thinking capabilities

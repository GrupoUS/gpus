# Factory Orchestration System (Docker MCP Enhanced)

Dynamic agent routing and parallel execution coordination for AegisWallet droids and skills via Docker MCP Gateway.

**Business Context**: Brazilian financial market with PIX, LGPD, and accessibility requirements demanding extra security scrutiny and Portuguese-first interfaces.

## Available Droids & MCP Stack

| Droid | Primary Focus | MCPs (via Docker Gateway) | When to Use |
|-------|---------------|---------------------------|-------------|
| **apex-dev** | Advanced implementation (complexity ≥7) | serena, context7, neon, playwright | Performance-critical, database, testing |
| **database-specialist** | Convex + LGPD | serena | ANY database operation, schema, indexes |
| **code-reviewer** | Security + Brazilian compliance | context7, tavily, fetch | Post-implementation, security validation |
| **apex-ui-ux-designer** | UI/UX + WCAG 2.1 AA+ | context7, serena, playwright | ANY new UI component, accessibility testing |
| **apex-researcher** | Brazilian regulations (≥95% accuracy) | context7, tavily, serena, fetch, sequential-thinking | Compliance questions, research |
| **product-architect** | PRD + Diátaxis framework | sequential-thinking, serena | Strategy, documentation |

## Spec Mode Auto-Activation

**Triggers**: "spec - research", "research and plan", "analyze and plan", "spec mode research"

**Protocol**:
1. Immediate Routing → apex-researcher (bypass all analysis)
2. Priority Override → HIGHEST (Level 1)
3. Parallel Execution → All MCPs via Docker Gateway
4. Auto-Compliance → Brazilian regulations activated
5. Deliverable → Research Intelligence Report + Implementation Plan

### Execution Flow
```
Prompt → apex-dev (análise inicial) → [PARALELO] droids especializados → apex-dev (consolidação) → Implementação → [PARALELO] validação → apex-dev (ajustes finais)
```

## Docker MCP Parallel Dispatch

### Parallel Execution Triggers (via Docker MCP Gateway)
- **Complexity ≥7**: High technical complexity → Multiple specialists parallel
- **Security Sensitive**: Financial data, PII → Security-first parallel analysis
- **Brazilian Compliance**: LGPD/PIX/BCB → Compliance specialists parallel
- **UI Components**: ANY interface work → apex-ui-ux-designer mandatory
- **Database Operations**: ANY schema changes → database-specialist mandatory

### Parallel Execution Matrix (Docker MCP Optimized)
| Complexity | Pre-Implementation (Parallel) | Post-Implementation (Parallel) |
|------------|------------------------------|--------------------------------|
| **1-3** (Simple) | apex-dev alone | code-reviewer |
| **4-6** (Moderate) | apex-dev + 1-2 specialists | Sequential validation |
| **7-8** (Complex) | 3-4 specialists parallel | Parallel validation |
| **9-10** (Mission) | All specialists + apex-researcher | Full parallel validation |

### Essential Parallel Combinations
- **Feature**: [code-reviewer, database-specialist, apex-ui-ux-designer]
- **Database**: [database-specialist, code-reviewer]
- **Security**: [code-reviewer, apex-researcher, database-specialist]
- **UI/UX**: [apex-ui-ux-designer, code-reviewer] (MANDATORY)
- **Research**: apex-researcher + [domain specialists]

## Docker MCP Communication Contracts

### Essential Input/Output via Docker Gateway

#### apex-dev (Implementation)
```yaml
input: [goal, scope, complexity(1-10), requirements, brazilian_compliance]
output: [implementation_plan, technical_approach, risk_assessment, resource_requirements]
mcps: [serena, context7, neon, playwright]
```

#### database-specialist (PostgreSQL + LGPD)
```yaml
input: [schema_changes, performance_requirements, security_requirements, brazilian_compliance]
output: [schema_recommendations, performance_optimization, security_enhancements, migration_strategy]
mcps: [serena, neon]
```

#### code-reviewer (Security + Compliance)
```yaml
input: [files, review_type, security_focus, brazilian_compliance, risk_tolerance]
output: [security_findings, compliance_status, recommendations, confidence_score]
mcps: [context7, tavily, fetch]
```

#### apex-ui-ux-designer (Accessibility + UX)
```yaml
input: [goal, component_type, brazilian_requirements, accessibility_requirements]
output: [design_recommendations, accessibility_audit, component_specification]
mcps: [context7, serena, playwright]
```

#### apex-researcher (Brazilian Regulations)
```yaml
input: [topic, complexity(L1-L10), brazilian_focus, validation_required]
output: [research_findings, source_validation, compliance_requirements]
mcps: [context7, tavily, serena, fetch, sequential-thinking]
```

#### product-architect (Strategy + Documentation)
```yaml
input: [deliverable_type, audience, success_criteria, diataxis_form]
output: [documentation_quality, prd_completeness, rules_effectiveness]
mcps: [sequential-thinking, serena]
```

## Docker MCP Quick Reference

### Secrets & API Keys

- Never commit API keys (e.g. `CONTEXT7_API_KEY`, `TAVILY_API_KEY`). Set them via local/CI environment variables (Railway, GitHub Actions, or your local shell).
- If a key was committed, rotate it immediately and remove it from tracked files.

### Escalation Protocol
1. **Level 1**: Droid self-resolution (using assigned MCPs)
2. **Level 2**: Request additional context from apex-dev
3. **Level 3**: Escalate to apex-researcher (via context7 + tavily)
4. **Level 4**: Escalate to code-reviewer (via tavily security research)
5. **Level 5**: Escalate to product-architect (via sequential-thinking)

### Brazilian Compliance Priority (MANDATORY)
- **Security > Compliance > Architecture > Performance > Features**
- **Mandatory MCPs**: context7 (LGPD/BCB docs) + tavily (current patterns)
- **Validation**: ≥95% cross-source validation required
- **Documentation**: Portuguese-first interfaces required

### Docker MCP Performance Targets
- **Latency**: <3ms for MCP calls via Docker Gateway
- **Context Management**: Automatic deduplication via Docker
- **Parallel Execution**: Optimized concurrent MCP calls
- **Resource Isolation**: Built-in Docker container security

## Docker MCP Execution Flow (6 Phases)

1. **Phase 1**: apex-dev analysis (complexity, domain, requirements)
2. **Phase 2**: Parallel consultation (complexity≥7 → specialists)
3. **Phase 3**: apex-dev synthesis (consolidate insights)
4. **Phase 4**: apex-dev implementation (following consolidated specs)
5. **Phase 5**: Parallel validation (security, performance, accessibility)
6. **Phase 6**: apex-dev finalization (apply corrections, deliver)

**Mandatory Parallel Triggers**:
- UI Component → apex-ui-ux-designer (ALWAYS)
- Database Changes → database-specialist (ALWAYS)
- Brazilian Compliance → apex-researcher (PRIMARY)
- Security Sensitive → code-reviewer + apex-researcher

## Docker MCP Integration Summary

**✅ Enhanced with Docker MCP Gateway:**
- **7 MCPs integrated**: serena + context7 + tavily + sequential-thinking + neon + playwright + fetch
- **<3ms latency target** via Docker Gateway optimization
- **<200 line documentation** with focused content
- **Brazilian compliance** maintained via context7 + tavily MCPs

**🔧 Key Improvements:**
- Real MCP integration (not theoretical)
- Performance optimization via Docker Gateway
- Simplified communication contracts
- Essential parallel execution triggers
- Complete Brazilian compliance validation

---

> **For complete development standards**: See root `AGENTS.md` for comprehensive rules, agent definitions, testing requirements, and Brazilian compliance details.

---
description: Pipeline QA integrado com auto-research e auto-fix
agent: code-reviewer
---

# /qa - Quality Assurance Pipeline

Pipeline integrado: **Verificação → Auto-Research → Auto-Fix**

## Fluxo Integrado

```mermaid
flowchart LR
    A[/qa] --> B[Phase 1: Local Checks]
    B --> C{Erros?}
    C -->|Não| D[Phase 2: Deploy]
    D --> E{Erros?}
    E -->|Não| F[✅ QA PASS]
    C -->|Sim| G[Agregar Erros]
    E -->|Sim| G
    G --> H["/research 'Fix: [errors]'"]
    H --> I[Plano Aprovado]
    I --> J[/implement]
    J --> K[Re-run /qa]
```
# Code Quality Review

Perform comprehensive code quality review: $ARGUMENTS

## Task

Follow these steps to conduct a thorough code review:

1. **Code Quality Assessment**
   - Scan for code smells, anti-patterns, and potential bugs
   - Check for consistent coding style and naming conventions
   - Identify unused imports, variables, or dead code
   - Review error handling and logging practices

2. **Security Review**
   - Look for common security vulnerabilities (SQL injection, XSS, etc.)
   - Check for hardcoded secrets, API keys, or passwords
   - Review authentication and authorization logic
   - Examine input validation and sanitization

3. **Performance Analysis**
   - Identify potential performance bottlenecks
   - Check for inefficient algorithms or database queries
   - Review memory usage patterns and potential leaks
   - Analyze bundle size and optimization opportunities

4. **Architecture & Design**
   - Evaluate code organization and separation of concerns
   - Check for proper abstraction and modularity
   - Review dependency management and coupling
   - Assess scalability and maintainability

5. **Testing Coverage**
   - Check existing test coverage and quality
   - Identify areas lacking proper testing
   - Review test structure and organization
   - Suggest additional test scenarios

6. **Documentation Review**
   - Evaluate code comments and inline documentation
   - Check API documentation completeness
   - Review README and setup instructions
   - Identify areas needing better documentation

7. **Recommendations**
   - Prioritize issues by severity (critical, high, medium, low)
   - Provide specific, actionable recommendations
   - Suggest tools and practices for improvement
   - Create a summary report with next steps

Remember to be constructive and provide specific examples with file paths and line numbers where applicable.

## Phase 1: Local Quality Checks

> **⚠️ CRITICAL GATE**: Não prosseguir se qualquer check falhar

```bash
# Code quality & linting
bun run lint:check

# Type safety & build verification
bun run build

# Test coverage
bun run test:coverage
```

## Phase 2: Deployment Validation

> **✅ PREREQUISITE**: Phase 1 deve passar completamente

```bash
# Railway deployment status
railway status

# Convex backend deployment
bunx convex deploy --prod
```

## Phase 3: Error Aggregation & Auto-Research

Se erros forem detectados em qualquer fase:
1. **Aggrega todos os erros** em um resumo
2. **Invoca automaticamente**: `/research "Fix QA errors: [errors summary]"`
3. Aguarda plano detalhado do @apex-researcher

## Phase 4: Auto-Implementation

Após plano aprovado:
1. **Invoca `/implement`** para executar os fixes
2. **Re-executa `/qa`** para validação final
3. Repete até QA PASS

## Success Metrics

| Gate | Command | Expected Result |
|------|---------|----------------|
| Lint | `bun run lint:check` | 0 errors |
| Build | `bun run build` | Clean build |
| Tests | `bun run test:coverage` | All tests pass |
| Deploy | `railway status` | Healthy |
| Backend | `bunx convex deploy --prod` | Success |

## Quick Reference

| Task | Command |
|------|---------|
| Run QA pipeline | `/qa` |
| Fix errors automatically | `/qa --auto-fix` |
| Debug specific phase | `/qa --phase=lint` |

## Technical Notes

- **Auto-research**: Acionado automaticamente quando erros são detectados
- **Auto-implementation**: Executado após plano aprovado
- **Re-run automático**: `/qa` re-executa após `/implement` completar
- **Preserve tasks**: Novas tasks de fix são adicionadas ao TodoWrite existente

---

**Pipeline completo: `/qa` → detecta erros → `/research` → `/implement` → `/qa` (re-run)**
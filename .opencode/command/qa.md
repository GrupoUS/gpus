---
description: Pipeline QA integrado com auto-research e auto-fix
agent: code-reviewer
subtask: true
---

# /qa - Quality Assurance Pipeline

Pipeline integrado: **Verificação → Auto-Research → Auto-Fix → Re-run**

## Fluxo de Orquestração

```mermaid
flowchart LR
    A[/qa] --> B[Phase 1: Local Checks]
    B --> C{Erros?}
    C -->|Não| D[Phase 1.5: Arch Check]
    D --> E{Issues?}
    E -->|Não| F[Phase 2: Deploy]
    F --> G{Erros?}
    G -->|Não| H[✅ QA PASS]
    C -->|Sim| I[Agregar Erros]
    E -->|Sim| I
    G -->|Sim| I
    I --> J["/research 'Fix: [errors]'"]
    J --> K[Plano Aprovado]
    K --> L[/implement]
    L --> M[Re-run /qa]
```

## Task

Perform comprehensive code quality review. Follow the pipeline steps for automated quality assurance.

## Phase 1: Local Quality Checks

> **⚠️ CRITICAL GATE**: Não prosseguir se qualquer check falhar

```bash
# Code quality & linting (Biome)
bun run lint:check

# Type safety & build verification
bun run build

# Test coverage (Vitest)
bun run test:coverage
```

## Phase 1.5: Architecture Verification

> **🏗️ ARCHITECTURE GATE**: Validar conformidade arquitetural

Se houver mudanças estruturais (schema, API, boundaries):

1. **Invocar**: `@architect-reviewer verify implementation`
2. **Validar**:
   - Padrões de design (LEVER framework)
   - Escalabilidade e Performance
   - Conformidade com princípios do projeto

## Phase 2: Deployment Validation

> **✅ PREREQUISITE**: Phase 1 deve passar completamente

### 2.1 Deploy Status Check

```bash
# Railway deployment status
railway status

# Convex backend deployment
bunx convex deploy --yes
```

### 2.2 Deploy Logs Verification

> **🔍 CRITICAL**: Inspecionar logs para identificar erros de runtime/deploy

```bash
# Railway: Verificar logs recentes de deploy (últimas 100 linhas)
railway logs --lines 100

# Convex: Verificar logs de produção
bunx convex logs --prod --history 100
```

## Agent Coordination & Background Tasks

Use background tasks for parallel verification if applicable:

```yaml
orchestration:
  parallel_checks:
    - task: "Linting & Formatting"
      command: "bun run lint:check"
    - task: "Unit Tests"
      command: "bun run test"
  
  auto_fix_flow:
    - research: "@apex-researcher for error analysis"
    - implementation: "@apex-dev for automated fixes"
```

## Phase 3: Error Aggregation & Auto-Research

Se erros forem detectados em qualquer fase:
1. **Aggrega todos os erros** em um resumo estruturado.
2. **Invoca automaticamente**: `/research "Fix QA errors: [errors summary]"`
3. Aguarda plano detalhado do `@apex-researcher`.

## Phase 4: Auto-Implementation

Após plano aprovado:
1. **Invoca `/implement`** para executar os fixes via `@apex-dev`.
2. **Re-executa `/qa`** para validação final.
3. Repete até **QA PASS**.

## Success Metrics

| Gate | Command | Expected Result |
|------|---------|----------------|
| Lint | `bun run lint:check` | 0 errors |
| Build | `bun run build` | Clean build |
| Tests | `bun run test:coverage` | All tests pass |
| Deploy | `railway status` | Healthy |
| Backend | `bunx convex deploy --yes` | Success |
| Production Logs | `railway logs` | No crashes |

---

**Pipeline completo: `/qa` → detecta erros → `/research` → `/implement` → `/qa` (re-run)**

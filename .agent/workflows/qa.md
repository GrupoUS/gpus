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

## Phase 0: System Snapshot

Antes de iniciar as revisões, captura o estado atual para os subagents.
- `git status`
- `git diff`
- `git log -n 5`

## Phase 1: Parallel Local Verification

> **⚠️ CRITICAL GATE**: Não prosseguir se qualquer check de bloqueio falhar.

```yaml
orchestration:
  limits:
    max_concurrent: 4
  phases:
    - id: "P1"
      name: "Local Checks & Reviews"
      parallel: true
      tasks:
        - id: "LINT-1"
          kind: "command"
          command: "bun run lint:check"
          gate: "blocking"
        - id: "BUILD-1"
          kind: "command"
          command: "bun run build"
          gate: "blocking"
        - id: "TEST-1"
          kind: "command"
          command: "bun run test --run"
          gate: "blocking"
        - id: "SEC-1"
          kind: "agent"
          agent: "code-reviewer"
          prompt: "Verify auth, LGPD, and security risks in the current diff. Analyze if any sensitive data handling or auth patterns are compromised."
          gate: "blocking"
        - id: "ARCH-1"
          kind: "agent"
          agent: "architect-reviewer"
          prompt: "Validate architecture boundaries and API patterns in the diff."
          gate: "informational"
      barrier: { require_done: ["LINT-1", "BUILD-1", "TEST-1", "SEC-1"] }

    - id: "P2"
      name: "Deep Validation"
      parallel: true
      tasks:
        - id: "DB-1"
          kind: "agent"
          agent: "database-specialist"
          prompt: "Validate Convex schema and mutations if convex/ directory was modified."
          gate: "informational"
        - id: "A11Y-1"
          kind: "agent"
          agent: "apex-ui-ux-designer"
          prompt: "Check WCAG compliance and Portuguese UI in changed components."
          gate: "informational"
```

## Phase 2: Deployment Validation

> **✅ PREREQUISITE**: Phase 1 deve passar completamente.

```yaml
orchestration:
  phases:
    - id: "P3"
      name: "Deploy & Logs"
      parallel: true
      tasks:
        - id: "DEP-RAILWAY"
          kind: "command"
          command: "railway status"
        - id: "DEP-CONVEX"
          kind: "command"
          command: "bunx convex deploy --yes"
      barrier: { require_done: ["DEP-RAILWAY", "DEP-CONVEX"] }

    - id: "P4"
      name: "Runtime Verification"
      parallel: true
      tasks:
        - id: "LOG-RAILWAY"
          kind: "command"
          command: "railway logs --lines 100"
        - id: "LOG-CONVEX"
          kind: "command"
          command: "bunx convex logs --prod --history 100"
```

## Phase 3: Error Aggregation & Auto-Research

Se erros forem detectados em qualquer fase:
1. **Sisyphus agrega todos os erros** em um resumo estruturado.
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
| Tests | `bun run test --run` | All tests pass |
| Security | `@code-reviewer` | No Critical/High |
| Deploy | `railway status` | Healthy |
| Backend | `bunx convex deploy --yes` | Success |
| Production Logs | `railway logs` | No crashes |

---

**Pipeline completo: `/qa` → detecta erros → `/research` → `/implement` → `/qa` (re-run)**

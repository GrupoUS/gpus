---
description: Pesquisa multi-fonte com validação cruzada e geração de atomic tasks (>=95% accuracy)
agent: apex-researcher
subtask: true
---

# /research: $ARGUMENTS

Este comando roda em **Plan Mode** (pesquisa + planejamento). Ele **não** implementa.

## Fluxo de Orquestração de Alta Performance

```mermaid
flowchart TD
    A[Início /research] --> B[Phase 1: Discovery (Parallel)]
    B --> C1[Explore: EXP-STRUCT]
    B --> C2[Explore: EXP-TRACE]
    B --> C3[Librarian: LIB-DOCS]
    B --> C4[Librarian: LIB-EXAMPLES]
    B --> C5[Plan Draft: PLAN-1]
    C1 & C2 & C3 & C4 & C5 --> D[Barrier: Synthesis]
    D --> E[Phase 2: Targeted Follow-up]
    E --> F[Oracle: Architecture Review (L4+)]
    F --> G[Gerar YAML Output Contract]
    G --> H[Executar todowrite para Atomic Tasks]
```

## Task

Follow this systematic approach to create a new feature: $ARGUMENTS

1. **Feature Planning**
   - Define feature requirements and acceptance criteria
   - Break down feature into smaller, manageable tasks (AT-XXX)
   - Identify affected components and potential impact areas

2. **Research and Analysis (Background Tasks)**
   - **Explore Agent**: Contextual grep for codebase patterns and implementations
   - **Librarian Agent**: Reference grep for official documentation and OSS examples
   - **Sequential Thinking**: Structured problem-solving and decision trees

3. **Architecture Design**
   - Design feature architecture and data flow
   - Plan database schema changes if needed (Convex)
   - Define API endpoints and contracts

4. **Implementation Strategy**
   - Use multi-perspective analysis (user, developer, business, security)
   - Validate logic, cover edge cases and errors
   - Plan validation tasks (VT-XXX)

## 📄 ONE-SHOT PROMPT TEMPLATE (YAML-Structured)

```yaml
role: "[SPECIFIC EXPERTISE] Developer"
objective:
  task: "[DESCRIBE WHAT NEEDS TO BE DONE]"
  context: "[PROJECT TYPE, STACK, CONSTRAINTS]"
chain_of_thought_process:
  analyze:
    checklist:
      - "Core requirement: _________"
      - "Technical constraints: _________"
      - "Expected output: _________"
      - "Edge cases to consider: _________"
  research:
    checklist:
      - "Framework/library documentation needed: _________"
      - "Patterns to apply (and anti-patterns to avoid): _________"
      - "Security and compliance considerations: _________"
  think:
    step_by_step:
      - "First: _________  # initial setup/analysis"
      - "Then: _________   # core design/specification"
      - "Next: _________   # validation/testing strategy"
      - "Finally: _________ # optimization/cleanup"
```

## Background Task Orchestration

```yaml
orchestration:
  limits:
    max_concurrent: 5
    timeout: 180000

  phases:
    - id: "P1"
      name: "Discovery"
      parallel: true
      tasks:
        - id: "EXP-STRUCT"
          agent: "explore"
          prompt: "Map file structure + entrypoints + patterns (routes, hooks, Convex)"
        - id: "EXP-TRACE"
          agent: "explore"
          prompt: "Trace references (api.*, route usage, component composition)"
        - id: "LIB-DOCS"
          agent: "librarian"
          prompt: "Official docs via Context7 (Convex, Clerk, TanStack, shadcn)"
        - id: "LIB-EXAMPLES"
          agent: "librarian"
          prompt: "GitHub/OSS examples for complex patterns"
        - id: "PLAN-1"
          agent: "apex-researcher"
          prompt: "Initial plan + acceptance criteria (Draft)"
      barrier: { require_done: ["EXP-STRUCT", "EXP-TRACE", "LIB-DOCS", "LIB-EXAMPLES", "PLAN-1"] }

    - id: "P2"
      name: "Targeted Refinement"
      parallel: true
      tasks:
        - id: "REV-1"
          agent: "architect-reviewer"
          prompt: "Validate P1 findings against architecture rules"
          gate: "informational"
        - id: "PLAN-REFINE"
          agent: "apex-researcher"
          prompt: "Finalize AT/VT task list based on Wave 1 evidence"
          dependencies: ["P1"]

  collection:
    - action: "Synthesize findings into .opencode/specs/[feature-id]/spec.md"
    - action: "Execute todowrite() for AT-XXX and VT-XXX"

  cleanup:
    - action: "background_cancel(all=true)"
```

## Instruções para @apex-researcher

1. **Detecte complexidade (L1-L10)** com justificativa.
2. **Priorize repo-first** (serena/mgrep) usando background tasks para exploração inicial.
3. **Use context7** via background tasks para documentação oficial.
4. **Coordenação**: Use `background_task`, `background_output` e `background_cancel` para maximizar o throughput.
5. **Retorne o YAML completo** no Output Contract.
6. **Execute todowrite()** para criar as atomic tasks (AT-XXX e VT-XXX).
   - Tasks ordenadas por fase (1-5)
   - Validation tasks no final

## Step 2: Gerar Spec e Aprovação

- **Spec**: Criar em `.opencode/specs/[feature-id]/spec.md`.
- **Aprovação**: Apresentar resumo compacto ao usuário com Tasks e Validação.

## Referências
- Constituição: `.opencode/memory/constitution.md`
- Implementação: `.opencode/command/implement.md`
- Coordenação: `.opencode/AGENTS.md`

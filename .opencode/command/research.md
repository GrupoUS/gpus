---
description: Pesquisa multi-fonte com validação cruzada e geração de atomic tasks (>=95% accuracy)
subtask: true
---

# Research Command: $ARGUMENTS

Este comando é executado pelo **Plan Agent** em Plan Mode. O fluxo completo é:

```
┌─────────────────────────────────────────────────────────────────┐
│                        PLAN MODE                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Plan Agent invoca @apex-researcher                      │
│      ↓                                                           │
│  Step 2: apex-researcher retorna Research Report + Atomic Tasks  │
│      ↓                                                           │
│  Step 3: Plan Agent cria TodoWrite com atomic tasks              │
│      ↓                                                           │
│  Step 4: Plan Agent apresenta plano para aprovação               │
│      ↓                                                           │
│  Step 5: Usuário aprova → Handoff para Act Mode                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Invoke Research Subagent

O Plan Agent DEVE invocar o apex-researcher como subagent com o seguinte prompt:

```markdown
@apex-researcher Pesquise sobre: $ARGUMENTS

## Contexto do Projeto

- **Stack**: Bun + Convex + TanStack Router + shadcn/ui + Clerk
- **Domínio**: CRM para gestão de alunos em cursos de saúde estética
- **Compliance**: LGPD obrigatório para dados de alunos
- **Produtos**: TRINTAE3, OTB, Black NEON, Comunidade US, Auriculo, Na Mesa Certa

## Instruções

1. Detecte a complexidade (L1-L10) baseado no escopo da pesquisa
2. Use os MCPs apropriados: serena, context7, gh_grep, sequentialthinking
3. Delegue para @database-specialist ou @code-reviewer se necessário
4. Retorne seu research_report no formato YAML especificado no seu Output Contract
5. SEMPRE inclua atomic_tasks_proposal com tasks detalhadas
6. Para L5+, inclua subtasks em cada atomic task

## Entregue

Retorne o YAML completo com:
- research_report (summary, findings, gaps)
- atomic_tasks_proposal (tasks com subtasks para L5+)
- validation_tasks (build, lint, test)
- implementation_notes
```

---

## Step 2: Process Research Report

Quando o apex-researcher retornar, o Plan Agent deve:

### 2.1 Validar Estrutura YAML
```yaml
# Verificar que o retorno contém:
research_report:
  summary: "[presente]"
  complexity: "[L1-L10]"
  key_findings: "[array não vazio]"

atomic_tasks_proposal:
  - id: "[AT-XXX formato]"
    title: "[presente]"
    # Para L5+: subtasks presentes

validation_tasks:
  - id: "[VT-XXX formato]"
```

### 2.2 Revisar Findings
- Verificar confidence levels (high/medium/low)
- Notar gaps_uncertainties para discussão com usuário
- Confirmar que sources estão identificados

### 2.3 Verificar Completude
- Atomic tasks cobrem todo o escopo da pesquisa
- Subtasks presentes se complexity >= L5
- Validation tasks incluem build, lint, test

---

## Step 2.5: Generate Executable Specification

Após processar o research report, o Plan Agent DEVE gerar uma especificação executável validando contra a constituição do projeto e enriquecendo as tasks com campos de execução.

### 2.5.1 Constitution Validation

Carregar e validar contra `.opencode/memory/constitution.md`:

```yaml
constitution_validation:
  load: ".opencode/memory/constitution.md"
  
  validate_each_task:
    - principle_1_bun_first: "Task não usa npm/yarn/pnpm"
    - principle_2_typescript_strict: "Task não introduz 'any' types"
    - principle_3_lgpd_compliance: "Se envolve dados pessoais, inclui encryption/audit"
    - principle_4_biome_standards: "Task passa lint:check"
    - principle_5_convex_patterns: "Usa withIndex, auth checks, validators"
    - principle_6_test_coverage: "Task inclui ou referencia testes"
    - principle_7_accessibility: "UI tasks incluem WCAG 2.1 AA"
    - principle_8_portuguese_ui: "User-facing text em português"
    - principle_9_performance: "Considera bundle size e lazy loading"
    - principle_10_functional: "Sem class components"
  
  on_violation:
    - flag_task: "Marcar task com ⚠️ constitution violation"
    - add_remediation: "Adicionar subtask de correção"
    - notify_user: "Alertar no plano apresentado"
```

### 2.5.2 Enhance Task Fields

Garantir que cada atomic_task inclui os campos de execução para `/implement`:

```yaml
required_fields:
  - id: "AT-XXX"
  - title: "Verb + Noun action title"
  - description: "What apex-dev should implement"
  - type: "setup | test | core | integration | polish"
  - phase: "1-5 (matches type: setup=1, test=2, core=3, integration=4, polish=5)"
  - parallel_group: "A | B | C | null (tasks with same group can run together)"
  - priority: "high | medium | low"
  - estimated_effort: "small (<1h) | medium (1-4h) | large (4h+)"
  - files_affected: ["path/to/file.ts"]
  - dependencies: ["AT-XXX"] # Other task IDs this depends on
  - acceptance_criteria: ["Testable criterion"]
  - test_strategy: "unit | integration | e2e | none"
  - rollback_strategy: "git checkout [file] | rm [file] | bun remove [pkg]"
  - subtasks: [] # For L5+ complexity
```

### 2.5.3 Phase Assignment Rules

```yaml
phase_mapping:
  phase_1_setup:
    type: "setup"
    activities: ["directories", "dependencies", "config", "schema migrations"]
    example_tasks:
      - "Create new directory structure"
      - "Add npm dependencies"
      - "Configure environment variables"
      - "Add table to Convex schema"
  
  phase_2_tests:
    type: "test"
    activities: ["unit tests", "integration tests", "e2e tests", "fixtures"]
    example_tasks:
      - "Write unit tests for new component"
      - "Create test fixtures"
      - "Add E2E test for user flow"
  
  phase_3_core:
    type: "core"
    activities: ["queries", "mutations", "components", "hooks", "utilities"]
    example_tasks:
      - "Implement Convex mutation"
      - "Create React component"
      - "Add custom hook"
  
  phase_4_integration:
    type: "integration"
    activities: ["routes", "auth guards", "middleware", "connections"]
    example_tasks:
      - "Wire component to route"
      - "Add authentication guard"
      - "Connect frontend to backend"
  
  phase_5_polish:
    type: "polish"
    activities: ["optimization", "cleanup", "documentation", "accessibility"]
    example_tasks:
      - "Add code splitting"
      - "Optimize bundle size"
      - "Add JSDoc comments"
```

### 2.5.4 Parallel Group Assignment

```yaml
parallel_grouping:
  rules:
    - "Tasks with NO dependencies can be in parallel groups"
    - "Tasks in same parallel group MUST NOT modify same files"
    - "Assign sequential (null) to tasks with dependencies"
  
  example:
    # These can run in parallel (Group A)
    - id: "AT-002"
      title: "Write notification mutation tests"
      parallel_group: "A"
      files_affected: ["convex/__tests__/notifications.test.ts"]
    
    - id: "AT-003"
      title: "Write notification UI tests"
      parallel_group: "A"
      files_affected: ["src/components/__tests__/NotificationBell.test.tsx"]
    
    # This must be sequential (depends on AT-001)
    - id: "AT-004"
      title: "Implement sendNotification mutation"
      parallel_group: null
      dependencies: ["AT-001"]
```

### 2.5.5 Rollback Strategy Templates

```yaml
rollback_templates:
  file_created:
    strategy: "rm [path/to/file]"
    example: "rm src/components/notifications/NotificationBell.tsx"
  
  file_modified:
    strategy: "git checkout [path/to/file]"
    example: "git checkout convex/schema.ts"
  
  dependency_added:
    strategy: "bun remove [package]"
    example: "bun remove @tanstack/react-query"
  
  schema_migration:
    strategy: "Revert schema + redeploy: git checkout convex/schema.ts && bunx convex deploy"
    example: "git checkout convex/schema.ts && bunx convex deploy"
  
  multiple_files:
    strategy: "git checkout [file1] [file2] && rm [new_file]"
    example: "git checkout src/lib/utils.ts convex/leads.ts && rm src/hooks/useNotifications.ts"
```

### 2.5.6 Spec Artifacts (L7+ Complexity Only)

Para features de alta complexidade (L7+), opcionalmente gerar artefatos de especificação:

```yaml
spec_artifacts:
  when: "complexity >= L7"
  location: ".opencode/specs/[feature-id]/"
  
  files:
    data_model_md:
      purpose: "Entity definitions and relationships"
      content: |
        # Data Model: [Feature Name]
        
        ## Entities
        - Entity1: description
        - Entity2: description
        
        ## Relationships
        - Entity1 → Entity2: relationship type
        
        ## Convex Schema
        ```typescript
        // Proposed schema changes
        ```
    
    contracts_md:
      purpose: "API contracts and interfaces"
      content: |
        # API Contracts: [Feature Name]
        
        ## Queries
        - `api.feature.list`: Returns all items
        - `api.feature.get`: Returns single item
        
        ## Mutations
        - `api.feature.create`: Creates new item
        - `api.feature.update`: Updates existing item
        
        ## TypeScript Interfaces
        ```typescript
        // Proposed interfaces
        ```
    
    quickstart_md:
      purpose: "Integration guide for developers"
      content: |
        # Quickstart: [Feature Name]
        
        ## Prerequisites
        - [x] Requirement 1
        - [x] Requirement 2
        
        ## Usage
        ```typescript
        // Example usage code
        ```
        
        ## Testing
        ```bash
        bun test src/features/[feature]
        ```
```

### 2.5.7 Validation Checklist

Antes de prosseguir para Step 3 (Create TodoWrite):

```yaml
step_2_5_checklist:
  constitution:
    - [ ] Constitution loaded from .opencode/memory/constitution.md
    - [ ] Each task validated against 10 principles
    - [ ] Violations flagged with remediation subtasks
  
  task_fields:
    - [ ] All tasks have `type` field (setup/test/core/integration/polish)
    - [ ] All tasks have `phase` field (1-5)
    - [ ] Parallel groups assigned where applicable
    - [ ] All tasks have `test_strategy` field
    - [ ] All tasks have `rollback_strategy` field
  
  spec_artifacts:
    - [ ] L7+ features have optional spec artifacts generated
    - [ ] Artifacts stored in .opencode/specs/[feature-id]/
  
  quality:
    - [ ] Tasks are actionable and specific
    - [ ] Dependencies are correctly identified
    - [ ] Acceptance criteria are testable
```

---

## Step 3: Create TodoWrite

O Plan Agent DEVE criar as tasks usando TodoWrite baseado no atomic_tasks_proposal.

### Para L1-L4 (Tasks Simples - Sem Subtasks)

```javascript
// Criar TodoWrite com cada atomic_task como item
todowrite([
  {
    id: "AT-001",
    content: "[AT-001] Title - Description",
    status: "pending",
    priority: "high" // conforme atomic_task.priority
  },
  {
    id: "AT-002",
    content: "[AT-002] Title - Description",
    status: "pending",
    priority: "medium"
  },
  // Validation tasks ao final
  {
    id: "VT-001",
    content: "[VT-001] Build validation: bun run build",
    status: "pending",
    priority: "high"
  },
  {
    id: "VT-002",
    content: "[VT-002] Lint check: bun run lint:check",
    status: "pending",
    priority: "high"
  },
  {
    id: "VT-003",
    content: "[VT-003] Test suite: bun run test",
    status: "pending",
    priority: "high"
  }
])
```

### Para L5+ (Tasks com Subtasks)

```javascript
// Criar TodoWrite com tasks E subtasks
todowrite([
  // Main task
  {
    id: "AT-001",
    content: "[AT-001] Main Task Title",
    status: "pending",
    priority: "high"
  },
  // Subtasks com indentação visual
  {
    id: "AT-001-A",
    content: "  ↳ [AT-001-A] Subtask A description",
    status: "pending",
    priority: "high"
  },
  {
    id: "AT-001-B",
    content: "  ↳ [AT-001-B] Subtask B description",
    status: "pending",
    priority: "high"
  },
  // Next main task
  {
    id: "AT-002",
    content: "[AT-002] Second Main Task",
    status: "pending",
    priority: "medium"
  },
  {
    id: "AT-002-A",
    content: "  ↳ [AT-002-A] Subtask description",
    status: "pending",
    priority: "medium"
  },
  // Validation tasks
  {
    id: "VT-001",
    content: "[VT-001] Build validation: bun run build",
    status: "pending",
    priority: "high"
  },
  {
    id: "VT-002",
    content: "[VT-002] Lint check: bun run lint:check",
    status: "pending",
    priority: "high"
  },
  {
    id: "VT-003",
    content: "[VT-003] Test suite: bun run test",
    status: "pending",
    priority: "high"
  }
])
```

---

## Step 4: Present Plan for Approval

O Plan Agent DEVE apresentar o plano completo ao usuário neste formato:

```markdown
---

## 📋 Research Complete: $ARGUMENTS

### Summary
[research_report.summary]

### Complexity: L[X]
[research_report.complexity_justification]

---

### 🔍 Key Findings

| # | Finding | Confidence | Source |
|---|---------|------------|--------|
| 1 | [finding] | 🟢 High | [source] |
| 2 | [finding] | 🟡 Medium | [source] |
| 3 | [finding] | 🔴 Low | [source] |

---

### ⚠️ Gaps & Uncertainties

[Se houver gaps:]
- **[gap]**: [impact] → Mitigation: [mitigation]

[Se não houver:]
- Nenhum gap identificado. Pesquisa completa.

---

### 📝 Atomic Tasks Proposal

#### Main Tasks

| ID | Task | Priority | Effort | Dependencies |
|----|------|----------|--------|--------------|
| AT-001 | [title] | 🔴 High | [effort] | - |
| AT-002 | [title] | 🟡 Medium | [effort] | AT-001 |
| AT-003 | [title] | 🟢 Low | [effort] | AT-002 |

[Se L5+, mostrar subtasks expandidas:]

#### Task Details with Subtasks

**[AT-001] [title]**
- Description: [description]
- Files: [files_affected]
- Acceptance Criteria:
  - [ ] [criterion 1]
  - [ ] [criterion 2]
- Subtasks:
  - [AT-001-A] [subtask title]
  - [AT-001-B] [subtask title]

**[AT-002] [title]**
...

---

### ✅ Validation Tasks

| ID | Task | Command |
|----|------|---------|
| VT-001 | Build validation | `bun run build` |
| VT-002 | Lint check | `bun run lint:check` |
| VT-003 | Test suite | `bun run test` |

---

### 📌 Implementation Notes

[Listar implementation_notes do research report]

---

## 🚀 Ready to Implement?

O plano acima contém **[N] atomic tasks** com **[M] subtasks**.

**Para aprovar e prosseguir:**
1. Revise o plano acima
2. Solicite ajustes se necessário
3. Confirme com "aprovar plano" ou "approve plan"

**Para ajustar:**
- "Adicionar task para [X]"
- "Remover task AT-XXX"
- "Mudar prioridade de AT-XXX para high"
- "Preciso de mais detalhes sobre [finding]"

---
```

---

## Step 5: Handle User Response

### Se usuário APROVAR:

```markdown
✅ **Plano aprovado!**

### Next Steps:

1. **Switch to Act Mode** para iniciar implementação
2. **apex-dev** executará as atomic tasks na ordem definida
3. Cada task será marcada: `pending` → `in_progress` → `completed`
4. Validation tasks rodarão ao final

### TodoWrite Status:
- [X] Atomic tasks criadas
- [X] Subtasks criadas (se L5+)
- [X] Validation tasks incluídas
- [ ] Aguardando execução em Act Mode

**Mude para Act Mode quando estiver pronto para implementar.**
```

### Se usuário PEDIR AJUSTES:

1. Processar solicitação de ajuste
2. Atualizar TodoWrite conforme necessário
3. Reapresentar plano atualizado
4. Aguardar nova aprovação

### Se usuário PEDIR MAIS PESQUISA:

1. Invocar `@apex-researcher` novamente com escopo específico
2. Integrar novos findings ao research report existente
3. Atualizar atomic tasks se necessário
4. Reapresentar plano completo

---

## Quality Checklist

Antes de apresentar o plano ao usuário, verificar:

- [ ] `@apex-researcher` invocado como subagent
- [ ] Research report recebido em formato YAML válido
- [ ] Complexity L1-L10 determinada e justificada
- [ ] Key findings têm confidence levels
- [ ] Gaps/uncertainties documentados com mitigations
- [ ] Atomic tasks criadas via TodoWrite
- [ ] Subtasks criadas para L5+ complexity
- [ ] Validation tasks incluídas (build, lint, test)
- [ ] Plano formatado para fácil leitura
- [ ] Instruções claras para aprovação/ajuste

---

## Stack Reference

O projeto usa:
- **Runtime**: Bun (sempre use bun, nunca npm/yarn)
- **Frontend**: React 19 + Vite + TanStack Router
- **Backend**: Convex (database + real-time + functions)
- **Auth**: Clerk (RBAC: admin, sdr, cs, support)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Linting**: Biome

---

## Example Flow

### User Request
```
/research como implementar sistema de notificações push para alertar SDRs sobre novos leads
```

### Plan Agent Actions
1. Invoca `@apex-researcher` com o prompt estruturado
2. Recebe research_report com complexity L6 e 4 atomic tasks
3. Cria TodoWrite com tasks + subtasks
4. Apresenta plano formatado
5. Usuário aprova
6. Instrui mudança para Act Mode

### Resulting TodoWrite
```
[AT-001] Configure push notification service
  ↳ [AT-001-A] Research and select push provider
  ↳ [AT-001-B] Add environment variables
[AT-002] Create notification Convex mutations
  ↳ [AT-002-A] Add notifications table to schema
  ↳ [AT-002-B] Create sendNotification mutation
  ↳ [AT-002-C] Create markAsRead mutation
[AT-003] Build notification UI components
  ↳ [AT-003-A] Create NotificationBell component
  ↳ [AT-003-B] Create NotificationList dropdown
[AT-004] Integrate with lead creation flow
  ↳ [AT-004-A] Trigger notification on new lead
  ↳ [AT-004-B] Filter by SDR assignment
[VT-001] Build validation: bun run build
[VT-002] Lint check: bun run lint:check
[VT-003] Test suite: bun run test
[VT-004] Security review: @code-reviewer
```
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

## Brazilian Compliance Triggers

Se a pesquisa envolver estes termos, `@apex-researcher` ativará validação LGPD automaticamente:

| Categoria | Keywords |
|-----------|----------|
| Dados Pessoais | `aluno`, `estudante`, `matrícula`, `CPF`, `dados pessoais` |
| Consentimento | `consentimento`, `proteção de dados`, `LGPD` |
| Saúde | `saúde estética`, `ANVISA`, `procedimento` |
| Financeiro | `PIX`, `BCB`, `pagamento`, `fatura` |

Quando compliance é ativado:
- `@code-reviewer` é delegado para análise de segurança
- Atomic tasks incluem requisitos de compliance
- Validation tasks incluem security review

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
```


# /research: $ARGUMENTS

Este comando roda em **Plan Mode** (pesquisa + planejamento). Ele **não** implementa.

## Fluxo

```
Plan Agent → invoca @apex-researcher
apex-researcher → pesquisa e retorna YAML (Output Contract)
apex-researcher → executa todowrite() (cria tasks)
Plan Agent → apresenta plano para aprovação
Usuário aprova → Act Mode (/implement)
```

## Task

Follow this systematic approach to create a new feature: $ARGUMENTS

1. **Feature Planning**
   - Define the feature requirements and acceptance criteria
   - Break down the feature into smaller, manageable tasks
   - Identify affected components and potential impact areas
   - Plan the API/interface design before implementation

2. **Research and Analysis**
   - Study existing codebase patterns and conventions
   - Identify similar features for consistency
   - Research external dependencies or libraries needed
   - Review any relevant documentation or specifications

3. **Architecture Design**
   - Design the feature architecture and data flow
   - Plan database schema changes if needed
   - Define API endpoints and contracts
   - Consider scalability and performance implications
   - Ensure development environment is up to date
   - Install any new dependencies required

4. **Implementation Strategy**
   - Start with core functionality and build incrementally
   - Follow the project's coding standards and patterns
   - Implement proper error handling and validation
   - Use dependency injection and maintain loose coupling

5. **Database Changes (if applicable)**
   - Create migration scripts for schema changes
   - Ensure backward compatibility
   - Plan for rollback scenarios
   - Test migrations on sample data

6. **API Development**
   - Implement API endpoints with proper HTTP status codes
   - Add request/response validation
   - Implement proper authentication and authorization
   - Document API contracts and examples

7. **Frontend Implementation (if applicable)**
   - Create reusable components following project patterns
   - Implement responsive design and accessibility
   - Add proper state management
   - Handle loading and error states

8. **Testing Implementation**
   - Write unit tests for core business logic
   - Create integration tests for API endpoints
   - Add end-to-end tests for user workflows
   - Test error scenarios and edge cases

9. **Security Considerations**
    - Implement proper input validation and sanitization
    - Add authorization checks for sensitive operations
    - Review for common security vulnerabilities
    - Ensure data protection and privacy compliance

10. **Performance Optimization**
    - Optimize database queries and indexes
    - Implement caching where appropriate
    - Monitor memory usage and optimize algorithms
    - Consider lazy loading and pagination

11. **Documentation**
    - Add inline code documentation and comments
    - Update API documentation
    - Create user documentation if needed
    - Update project README if applicable

12. **Code Review Preparation**
    - Run all tests and ensure they pass
    - Run linting and formatting tools
    - Check for code coverage and quality metrics
    - Perform self-review of the changes

Remember to maintain code quality, follow project conventions, and prioritize user experience throughout the development process.

---

## Step 1: Invocar o subagent de pesquisa

Use este prompt:

```markdown
@apex-researcher Pesquise sobre: $ARGUMENTS

## Contexto do Projeto
- Stack: Bun + Convex + TanStack Router + shadcn/ui + Clerk
- Domínio: CRM para educação em saúde estética
- Compliance: LGPD obrigatório para dados de alunos

## Instruções
1. Detecte complexidade (L1-L10) com justificativa
2. Priorize repo-first (serena/mgrep) antes de fontes externas
3. Use context7 para docs oficiais quando necessário
4. Delegue para @database-specialist (Convex) e/ou @code-reviewer (LGPD/OWASP) quando aplicável
5. Retorne o YAML completo no Output Contract do apex-researcher
6. Execute todowrite() após o YAML (MANDATÓRIO)
```

---

## Step 2: Validar o YAML recebido

Confirme que o retorno contém, no mínimo:

```yaml
research_report:
  summary: "[presente]"
  complexity: "L1" # ... L10
  key_findings: ["não vazio"]

atomic_tasks_proposal:
  - id: "AT-001"
    title: "[presente]"

validation_tasks:
  - id: "VT-001"
```

Checklist:

- [ ] `complexity` e `complexity_justification` coerentes
- [ ] `key_findings` com `confidence` + `source`
- [ ] `gaps_uncertainties` preenchido quando houver incertezas
- [ ] Para L5+: subtasks presentes nas tasks relevantes
- [ ] Se LGPD acionado: incluir VT-004 (security review)

---

## Step 3: Persistir a spec executável

Gerar um arquivo de spec para o `/implement` consumir.

- Template: `.opencode/specs/_template.md`
- Destino: `.opencode/specs/[feature-id]/spec.md`
- `feature-id`: slug (lowercase, hífens, sem caracteres especiais, máx. 30)

Para L7+ (opcional):

- `.opencode/specs/[feature-id]/data-model.md`
- `.opencode/specs/[feature-id]/contracts.md`
- `.opencode/specs/[feature-id]/quickstart.md`

---

## Step 4: Verificar o TodoWrite

O `apex-researcher` executa `todowrite()` como parte do contrato. Verifique se:

- Tasks estão ordenadas por `Phase: 1 → 5`
- Subtasks aparecem logo após o parent
- Validation tasks ficam ao final (`VT-001..VT-003`, e `VT-004` se aplicável)
- Tudo começa com status `pending`

---

## Step 5: Apresentar plano para aprovação

Formato recomendado (compacto):

```markdown
## 📋 Research Complete: $ARGUMENTS

### Summary
[research_report.summary]

### Complexity
L[X] — [research_report.complexity_justification]

### Key Findings
| # | Finding | Confidence | Source |
|---|---------|------------|--------|
| 1 | ... | High | serena |

### Gaps
- (se houver) ...

### Tasks (high level)
| ID | Title | Phase | Priority | Dependencies |
|----|-------|-------|----------|--------------|
| AT-001 | ... | 3 | high | - |

### Validation
- VT-001: `bun run build`
- VT-002: `bun run lint:check`
- VT-003: `bun run test`
- VT-004: `@code-reviewer` (se LGPD)

### Ready?
Aprovar: "aprovar plano" / "approve plan"
Ajustar: "adicionar task para X" / "remover AT-XXX"
```

---

## Step 6: Processar resposta do usuário

- **Aprovou**: confirmar e instruir Act Mode (`/implement`).
- **Pediu ajustes**: atualizar TodoWrite e reapresentar.
- **Pediu mais pesquisa**: re-invocar `@apex-researcher` com o novo escopo.

---

## Referências

- Constituição (princípios): `.opencode/memory/constitution.md`
- Execução/rollback/ordenação por fase: `.opencode/command/implement.md`
- Template de spec: `.opencode/specs/_template.md`

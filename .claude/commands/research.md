---
description: Pesquisa multi-fonte com validação cruzada e geração de atomic tasks (>=95% accuracy)
agent: apex-researcher
subtask: true
---

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
   - Advanced search query formulation
   - Domain-specific searching and filtering
   - Result quality evaluation and ranking
   - Information synthesis across sources
   - Fact verification and cross-referencing
   - Historical and trend analysis
   - Use specific phrases in quotes for exact matches
   - Exclude irrelevant terms with negative keywords
   - Target specific timeframes for recent/historical data
   - Formulate multiple query variations

2. **Research and Analysis**
   - Study existing codebase patterns and conventions
   - Identify similar features for consistency
   - Research external dependencies or libraries needed
   - Review any relevant documentation or specifications
   - Extract full content from promising results
   - Parse structured data from pages
   - Follow citation trails and references
   - Capture data before it changes
   - Domain knowledge and current best practices
   - Prompt patterns and anti-patterns
   - Platform constraints and standards

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
   - Layered reasoning with multi-perspective analysis
   - Validate logic, cover edge cases and errors

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

## Instruções
1. Detecte complexidade (L1-L10) com justificativa
2. Priorize repo-first (serena/mgrep) antes de fontes externas
3. Use context7 para docs oficiais quando necessário
4. Delegue para @database-specialist (Convex) e/ou @code-reviewer (LGPD/OWASP) se necessário mais informações específicas
5. Retorne o ONE-SHOT PROMPT TEMPLATE YAML completo no Output Contract do apex-researcher
6. Execute a tool todowrite para criar as atomic tasks com base no ONE-SHOT PROMPT TEMPLATE YAML (MANDATÓRIO)
7. Verifique se o todowrite segue a estrutura:
   - Tasks ordenadas por fase (1-5)
   - Subtasks imediatamente após o parent
   - Validation tasks no final (VT-001..VT-003)
   - Todos os status iniciam como "pending"


## Step 2: Gerar um arquivo de spec para o `/implement` consumir.

- Template: `.opencode/specs/_template.md`
- Destino: `.opencode/specs/[feature-id]/spec.md`
- `feature-id`: slug (lowercase, hífens, sem caracteres especiais, máx. 30)

## Step 3: Apresentar plano para aprovação

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
- VT-002: `bun run lint`
- VT-003: `bun run test`
- VT-004: `@code-reviewer` (se LGPD)
- VT-005: `@database-specialist` (se Convex)

### Ready?
Aprovar: "aprovar" / "implemente"
Ajustar: "adicionar task para X" / "remover AT-XXX"
```

## Step 4: Processar resposta do usuário

- **Aprovou**: confirmar e instruir Act Mode (`/implement`).
- **Pediu ajustes**: atualizar TodoWrite e reapresentar.
- **Pediu mais pesquisa**: re-invocar `@apex-researcher` com o novo escopo.

---

## Referências

- Constituição (princípios): `.opencode/memory/constitution.md`
- Execução/rollback/ordenação por fase: `.opencode/command/implement.md`
- Template de spec: `.opencode/specs/_template.md`

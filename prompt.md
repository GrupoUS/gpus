# [TARGET] MASTER PROMPT GENERATOR v4.0

```yaml
NOVIDADES:
  instrucoes_explicitas: "Claude segue instruções com precisão - seja específico"
  contexto_motivacional: "Explique o PORQUÊ das instruções para melhor performance"
  long_horizon_reasoning: "Suporte nativo para tarefas de longo prazo com state tracking"
  context_awareness: "Claude monitora seu próprio token budget"
  parallel_tool_calling: "Chamadas de ferramentas paralelas otimizadas (~100% success rate)"
  interleaved_thinking: "Reflexão entre chamadas de ferramentas para melhor decisão"
  subagent_orchestration: "Orquestração nativa de subagentes sem prompting explícito"
```

---

## [BRAIN] PRINCÍPIOS CORE

```yaml
FILOSOFIA: "Clareza > Complexidade | Contexto + Motivação > Comandos | Resultados > Processo"

REGRAS:
  1_EXPLICITO_E_MOTIVADO: "Seja explícito E explique o porquê - Claude 4 generaliza do contexto"
  2_EXEMPLOS_ALINHADOS: "Exemplos devem refletir EXATAMENTE o comportamento desejado"
  3_POSITIVO_SOBRE_NEGATIVO: "Diga o que fazer, não o que evitar"
  4_THINKING_ESTRATEGICO: "Use extended/interleaved thinking para tarefas complexas"
  5_PARALLEL_BY_DEFAULT: "Claude 4 paraliza naturalmente - ajuste apenas se necessário"

MUDANCAS_IMPORTANTES:
  precisao_instrucoes: |
    Claude 4 segue instruções com alta precisão. Se você quer comportamento
    "acima e além", solicite EXPLICITAMENTE. Não presuma defaults generosos.

  contexto_motivacional: |
    Fornecer o PORQUÊ das instruções melhora dramaticamente os resultados.
    Exemplo ruim: "NUNCA use reticências"
    Exemplo bom: "Sua resposta será lida por TTS, então nunca use reticências
                  pois o engine não saberá pronunciá-las."

  exemplos_vigilantes: |
    Claude 4 presta muita atenção a detalhes e exemplos. Garanta que seus
    exemplos demonstrem EXATAMENTE os comportamentos desejados.
```

---

## [STATS] SELEÇÃO DE TEMPLATE POR COMPLEXIDADE

| Complexidade | Indicadores | Template | Thinking Recomendado |
|--------------|-------------|----------|---------------------|
| **MICRO** (1-2) | Função única, bug fix, refactor simples | Quick Template | Standard (sem extended) |
| **STANDARD** (3-5) | Feature, multi-arquivos | Standard Template | Interleaved thinking |
| **COMPLEX** (6-8) | Arquitetura, integração | Full A.R.T.E | Extended thinking (8-16K) |
| **SYSTEM** (9-10) | Novos sistemas, migrações | Extended + Multi-Window | Extended thinking (32K+) |

---

## [BRAIN] Extended Thinking Configuration

```yaml
thinking_strategy:
  budget: "16000"  # tokens para extended thinking (min: 1024)
  approach: "general_first"  # Comece amplo, especifique se necessário

  # Claude 4 performa melhor com instruções de alto nível primeiro
  initial_prompt: |
    Pense profundamente sobre este problema. Considere múltiplas abordagens
    e mostre seu raciocínio completo. Tente diferentes métodos se a
    primeira abordagem não funcionar.

  # Só adicione instruções step-by-step se o output inicial não for ideal
  fallback_detailed: false

reflection_after_tools:
  enabled: true
  prompt: |
    Após receber resultados de ferramentas, reflita cuidadosamente sobre
    a qualidade e determine os próximos passos ótimos antes de prosseguir.
    Use seu thinking para planejar e iterar baseado nessa nova informação.
```

---

## [STATS] Fase 1: ANALYZE

### Matriz de Requisitos
| Categoria | Requisito | Prioridade | Método de Validação |
|-----------|-----------|------------|---------------------|
| Funcional | [REQ_1] | Must | [COMO_TESTAR] |
| Non-Funcional | [PERF_REQ] | Must | [BENCHMARK] |

### Avaliação de Estado Atual
```yaml
existing_architecture: "[DESCREVA_ESTADO_ATUAL]"
integration_points: ["[SISTEMA_1]", "[SISTEMA_2]"]
technical_debt: "[DÉBITO_RELEVANTE]"
```

---

## [SEARCH] Fase 2: RESEARCH

### Avaliação de Tecnologias
| Opção | Prós | Contras | Fit Score |
|-------|------|---------|-----------|
| [OPÇÃO_1] | [VANTAGENS] | [DESVANTAGENS] | [1-5] |

### Padrões a Considerar
```yaml
recommended_patterns:
  - pattern: "[NOME_PADRÃO]"
    rationale: "[PORQUE_SE_ENCAIXA]"
    tradeoffs: "[O_QUE_ABRIMOS_MÃO]"
```

---

## [BRAIN] Fase 3: THINK

### Arquitetura da Solução
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Componente  │────▶│ Componente  │────▶│ Componente  │
│      A      │     │      B      │     │      C      │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Registros de Decisão (ADRs)
```yaml
decision_1:
  context: "[SITUAÇÃO_REQUERENDO_DECISÃO]"
  options_considered: ["[OPT_1]", "[OPT_2]"]
  decision: "[ABORDAGEM_ESCOLHIDA]"
  rationale: "[PORQUE_ESSA_ESCOLHA]"
  consequences: "[IMPLICAÇÕES]"
```

---

## [FILES] Fase 4: ELABORATE

### Roadmap de Implementação
```yaml
phase_1_foundation:
  duration: "[ESTIMATIVA]"
  deliverables:
    - "[ENTREGÁVEL_1]"
    - "[ENTREGÁVEL_2]"

phase_2_core:
  duration: "[ESTIMATIVA]"
  deliverables:
    - "[ENTREGÁVEL_3]"
  dependencies: ["phase_1_foundation"]
```

### Estrutura de Arquivos
```
src/
├── [module_1]/
│   ├── [component].ts       # [PROPÓSITO]
│   ├── [service].ts         # [PROPÓSITO]
│   └── [types].ts           # [PROPÓSITO]
└── shared/
    └── ...
```

---

## [TOOLS] INSTRUÇÕES DE COMPORTAMENTO

### Ação vs Sugestão

É preciso: se você pedir "sugestões", ele sugere. Se quiser ação:

```yaml
# PROATIVO (implementa por padrão)
proactive_prompt: |
  Por padrão, implemente mudanças ao invés de apenas sugerir.
  Se a intenção do usuário não estiver clara, infira a ação mais útil
  e prossiga, usando ferramentas para descobrir detalhes faltantes
  ao invés de adivinhar.
  Tente inferir a intenção sobre se uma chamada de ferramenta é pretendida
  ou não, e aja de acordo.

# CONSERVADOR (só age se explicitamente pedido)
conservative_prompt: |
  Não pule para implementação ou mudanças em arquivos a menos que
  claramente instruído a fazer mudanças. Quando a intenção for ambígua,
  default para fornecer informações, fazer pesquisa e dar recomendações
  ao invés de agir. Só proceda com edições quando explicitamente solicitado.
```

### Controle de Formato de Output

```yaml
# Método 1: Diga o que fazer (não o que não fazer)
bad: "Não use markdown na sua resposta"
good: "Sua resposta deve ser composta de parágrafos de prosa fluida"

# Método 2: Use indicadores XML
good: "Escreva as seções em prosa da sua resposta em <prose> tags"

# Método 3: Matching de estilo
principle: "O estilo de formatação do seu prompt influencia o estilo da resposta"

# Método 4: Prompt detalhado para formatação específica
detailed_format_prompt: |
  Ao escrever relatórios, documentos, explicações técnicas ou conteúdo longo,
  escreva em prosa clara e fluida usando parágrafos e sentenças completas.
  Use quebras de parágrafo padrão para organização.
  Reserve markdown principalmente para `inline code`, blocos de código, e headings simples.
  Evite usar **bold** e *itálico*.
  NÃO use listas ordenadas (1. ...) ou não-ordenadas (*) a menos que:
    a) você esteja apresentando itens verdadeiramente discretos, ou
    b) o usuário explicitamente pediu uma lista
  Ao invés de listar itens com bullets, incorpore-os naturalmente em sentenças.
  NUNCA output uma série de bullet points excessivamente curtos.
```

### Parallel Tool Calling

```yaml
# Claude 4 já paraliza naturalmente, mas para ~100% success rate:
parallel_boost_prompt: |
  Se você pretende chamar múltiplas ferramentas e não há dependências
  entre as chamadas, faça todas as chamadas independentes em paralelo.
  Priorize chamar ferramentas simultaneamente sempre que as ações possam
  ser feitas em paralelo ao invés de sequencialmente.

  Por exemplo, ao ler 3 arquivos, execute 3 chamadas de ferramenta em
  paralelo para ler todos os 3 arquivos no contexto ao mesmo tempo.

  Maximize o uso de chamadas paralelas onde possível para aumentar
  velocidade e eficiência.

  No entanto, se algumas chamadas dependem de chamadas anteriores para
  informar valores dependentes como parâmetros, NÃO chame essas
  ferramentas em paralelo e chame-as sequencialmente.

  Nunca use placeholders ou adivinhe parâmetros faltantes em chamadas.

# Para REDUZIR paralelismo (casos especiais):
sequential_prompt: |
  Execute operações sequencialmente com breves pausas entre cada passo
  para garantir estabilidade.
```

### Interleaved Thinking (Reflexão Pós-Tool)

```yaml
interleaved_thinking_prompt: |
  Após receber resultados de ferramentas, reflita cuidadosamente sobre
  sua qualidade e determine os próximos passos ótimos antes de prosseguir.
  Use seu thinking para planejar e iterar baseado nessa nova informação,
  e então tome a melhor próxima ação.
```

---

## [DESIGN] FRONTEND & UI GENERATION (Claude 4 Specific)

```yaml
# Claude 4.5 excele em UI mas pode defaultar para patterns genéricos sem direção

creativity_boost_prompt: |
  Não segure nada. Dê o seu melhor.
  Crie uma demonstração impressionante mostrando capacidades de web development.

aesthetic_direction_prompt: |
  Crie um dashboard profissional usando paleta azul escuro e ciano,
  tipografia sans-serif moderna (ex: Inter para headings, system fonts para body),
  e layouts baseados em cards com sombras sutis.

  Inclua detalhes pensados como hover states, transições e micro-interações.
  Aplique princípios de design: hierarquia, contraste, balanço e movimento.

diversity_prompt: |
  Forneça múltiplas opções de design.
  Crie estéticas de fusão combinando elementos de diferentes fontes -
  um color scheme, tipografia diferente, outro princípio de layout.
  Evite layouts centralizados genéricos, gradientes simplistas e styling uniforme.

explicit_features: |
  Inclua tantas features e interações relevantes quanto possível.
  Adicione animações e elementos interativos.
  Crie uma implementação totalmente featured além do básico.
```

---

## [RESEARCH] AGENTIC CODING BEST PRACTICES

### Anti-Hardcoding & Soluções Gerais

```yaml
general_solution_prompt: |
  Por favor escreva uma solução de alta qualidade e propósito geral
  usando as ferramentas padrão disponíveis.

  Não crie helper scripts ou workarounds para completar a tarefa
  mais eficientemente.

  Implemente uma solução que funcione corretamente para TODOS os inputs
  válidos, não apenas os casos de teste.

  Não hard-code valores ou crie soluções que só funcionam para inputs
  específicos de teste. Ao invés, implemente a lógica real que resolve
  o problema de forma geral.

  Foque em entender os requisitos do problema e implementar o algoritmo
  correto. Testes estão lá para verificar corretude, não para definir
  a solução.

  Forneça uma implementação principiada que siga melhores práticas e
  princípios de design de software.

  Se a tarefa for irrazoável ou inviável, ou se algum dos testes estiver
  incorreto, por favor me informe ao invés de contorná-los.

  A solução deve ser robusta, mantenível e extensível.
```

### Minimizando Alucinações

```yaml
anti_hallucination_prompt: |
  Nunca especule sobre código que você não abriu.

  Se o usuário referenciar um arquivo específico, você DEVE ler o arquivo
  antes de responder.

  Certifique-se de investigar e ler arquivos relevantes ANTES de responder
  perguntas sobre o codebase.

  Nunca faça afirmações sobre código antes de investigar a menos que você
  tenha certeza da resposta correta - dê respostas fundamentadas e
  livres de alucinação.
```

### Limpeza de Arquivos Temporários

```yaml
cleanup_prompt: |
  Se você criar quaisquer novos arquivos temporários, scripts ou arquivos
  auxiliares para iteração, limpe esses arquivos removendo-os ao final
  da tarefa.
```

---

## [BRAIN] EXTENDED THINKING BEST PRACTICES

### Configuração Recomendada

```yaml
thinking_configuration:
  # Comece com o mínimo e aumente conforme necessário
  budget_strategy:
    start: 1024      # Mínimo permitido
    simple_tasks: 2000-4000
    moderate: 8000-16000
    complex: 16000-32000
    extreme: 32000+  # Use batch processing para >32K

  # Use instruções de alto nível primeiro
  prompting_approach:
    initial: |
      Pense profundamente sobre este problema.
      Considere múltiplas abordagens e mostre seu raciocínio completo.
      Tente diferentes métodos se sua primeira abordagem não funcionar.

    # Só adicione steps detalhados se o output inicial não for satisfatório
    detailed_fallback: |
      Por favor trabalhe através deste problema seguindo estes passos:
      1. [PASSO_1]
      2. [PASSO_2]
      ...

multishot_with_thinking:
  description: "Use <thinking> tags em exemplos para mostrar padrões de raciocínio"
  example: |
    Problema 1: Qual é 15% de 80?
    <thinking>
    Para encontrar 15% de 80:
    1. Converter 15% para decimal: 15% = 0.15
    2. Multiplicar: 0.15 × 80 = 12
    </thinking>
    A resposta é 12.

    Agora resolva: Problema 2: Qual é 35% de 240?

verification_prompts: |
  Escreva uma função para calcular o fatorial de um número.
  Antes de terminar, por favor verifique sua solução com casos de teste para:
  - n=0
  - n=1
  - n=5
  - n=10
  E corrija quaisquer problemas que encontrar.
```

### Notas Importantes sobre Extended Thinking

```yaml
technical_notes:
  - "Mínimo de 1024 tokens para budget de thinking"
  - "Para budgets acima de 32K, use batch processing"
  - "Extended thinking performa melhor em inglês (output pode ser em qualquer idioma)"
  - "Não passe o thinking de Claude de volta no bloco de texto do usuário"
  - "Prefilling de extended thinking NÃO é permitido"
  - "Para thinking abaixo do mínimo, use modo standard com CoT tradicional"

debugging_tip: |
  Use o output de thinking de Claude para debugar sua lógica,
  embora este método não seja sempre perfeitamente confiável.
```

## [WARNING] ANTI-PATTERNS ESPECÍFICOS CLAUDE 4

### [STOP] Anti-Pattern 1: Presunção de Comportamento "Above and Beyond"

```yaml
bad: "Crie um dashboard analytics"
# Claude 4 criará exatamente o pedido, sem extras

good: |
  Crie um dashboard analytics.
  Inclua tantas features e interações relevantes quanto possível.
  Vá além do básico para criar uma implementação totalmente featured.
  Não segure nada. Dê o seu melhor.
```

### [STOP] Anti-Pattern 2: Instruções Negativas sem Contexto

```yaml
bad: "NUNCA use reticências"
# Claude segue, mas sem entender o porquê

good: |
  Sua resposta será lida em voz alta por um engine text-to-speech,
  então nunca use reticências pois o TTS não saberá como pronunciá-las.
# Claude generaliza: evitará outros símbolos problemáticos para TTS também
```

### [STOP] Anti-Pattern 3: Exemplos Desalinhados

```yaml
bad: |
  Sempre responda formalmente.
  Exemplo: "Hey, what's up! That's super cool!"
# Claude 4 presta MUITA atenção a exemplos - isso confunde

good: |
  Sempre responda formalmente.
  Exemplo: "Agradeço sua pergunta. A resposta é..."
```

### [STOP] Anti-Pattern 4: Ambiguidade Ação vs Sugestão

```yaml
bad: "Você pode sugerir algumas mudanças para melhorar esta função?"
# Claude 4 vai SUGERIR, não implementar

good_for_action: "Mude esta função para melhorar sua performance."
good_for_suggestions: "Liste possíveis melhorias para esta função, sem implementar."
```

---

## [CHECKLIST] PRE-SUBMISSION CHECKLIST v4

```yaml
clarity_check:
  - [ ] Objetivo pode ser mal interpretado? (Se sim, clarifique)
  - [ ] Termos técnicos definidos ou são padrão da indústria?
  - [ ] Desenvolvedor novo no projeto entenderia o contexto?
  - [ ] MOTIVAÇÃO incluída para instruções importantes? (NOVO)

behavior_check:  # NOVO para Claude 4
  - [ ] Ação vs Sugestão claramente especificado?
  - [ ] Formato de output desejado explicitamente descrito?
  - [ ] Nível de criatividade/completude especificado?
  - [ ] Instruções dizem O QUE FAZER (não O QUE NÃO FAZER)?

examples_check:  # CRÍTICO para Claude 4
  - [ ] Exemplos demonstram EXATAMENTE o comportamento desejado?
  - [ ] Nenhum exemplo contradiz as instruções?
  - [ ] Exemplos cobrem edge cases importantes?

thinking_check:  # NOVO para Extended Thinking
  - [ ] Tarefa complexa o suficiente para extended thinking?
  - [ ] Budget de thinking apropriado para complexidade?
  - [ ] Instruções de alto nível primeiro (antes de step-by-step)?
  - [ ] Verificação/reflexão solicitada onde apropriado?

scope_check:
  - [ ] Uma única tarefa focada?
  - [ ] Dividir em múltiplos prompts seria mais claro?
  - [ ] Dependências de outro trabalho declaradas?
  - [ ] Para tarefas longas: multi-window workflow configurado?
```

---

## [ROCKET] QUICK REFERENCE CARD v4

```
┌─────────────────────────────────────────────────────────────────┐
│                PROMPT STRUCTURE FORMULA v4                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. WHAT    → Objetivo claro e específico                       │
│  2. WHY     → Motivação/contexto (CLAUDE 4 CRITICAL!)           │
│  3. WHERE   → Stack, arquivos, ambiente                         │
│  4. BOUNDS  → Restrições, limitações, must-not-do               │
│  5. SHAPE   → Exemplos de input/output (ALINHADOS!)             │
│  6. DONE    → Critérios de sucesso, testes de aceitação         │
│  7. ACTION  → Explicitar: implementar vs sugerir (NOVO!)        │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                    CLAUDE 4 GOLDEN RULES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✓ Seja EXPLÍCITO - Claude 4 segue literalmente                 │
│  ✓ Explique o PORQUÊ - Claude generaliza do contexto            │
│  ✓ Diga O QUE FAZER, não o que evitar                           │
│  ✓ Exemplos devem ALINHAR perfeitamente com instruções          │
│  ✓ Especifique se quer AÇÃO ou SUGESTÃO                         │
│  ✓ Use extended thinking para tarefas complexas                 │
│  ✓ Aproveite parallel tool calling (default)                    │
│  ✓ Para "above and beyond": peça EXPLICITAMENTE                 │
│                                                                  │
│  ✗ Não presuma comportamento generoso automático                │
│  ✗ Não use apenas instruções negativas                          │
│  ✗ Não forneça exemplos desalinhados                            │
│  ✗ Não seja ambíguo sobre ação vs sugestão                      │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                    THINKING BUDGET GUIDE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Simples:     1K-4K tokens   │  Bug fix, refactor básico        │
│  Moderado:    8K-16K tokens  │  Feature, multi-file             │
│  Complexo:    16K-32K tokens │  Arquitetura, integração         │
│  Extremo:     32K+ tokens    │  Use batch processing            │
│                                                                  │
│  Regra: Comece com mínimo, aumente conforme necessário          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

# [ROCKET] MASTER PROMPT

**DELIVERY: ALWAYS output the complete prompt in English in a single Markdown block (Markdown + YAML, no citations, no sub markdown division, one single markdown block, ready to copy)**

```yaml
METHODOLOGY: Analyze → Research → Think → Elaborate (A.P.T.E)
process:
  - Analyze explicit and implicit requirements
  - Research domain, standards, and constraints
  - Think with layered reasoning and validation gates
  - Elaborate a complete, testable specification
Prompt_MUST_INCLUDE:
  - Clear objective and scope boundaries
  - Technical/environmental context
  - Input/output structure with examples when needed
  - Quality gates and measurable success criteria
  - Non-negotiable constraints
  - Hierarchical structure: context → requirements → validation
METHODOLOGY: "Think → Research → Plan → Implement → Validate"
FRAMEWORK: "A.P.T.E (Analyze → Pesquisar → Think → Elaborate)"
PRINCIPLES:
  - "KISS: Keep It Simple — choose the simplest viable solution"
  - "YAGNI: Build only what's needed now"
  - "Chain of Thought: Step-by-step reasoning"
```

## Focus Areas to search

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

### WebFetch Deep Dive

- Extract full content from promising results
- Parse structured data from pages
- Follow citation trails and references
- Capture data before it changes

## Approach

1. Understand the research objective clearly
2. Create 3-5 query variations for coverage
3. Search broadly first, then refine
4. Verify key facts across multiple sources
5. Track contradictions and consensus

## [WORKFLOW] A.P.T.E WORKFLOW

```yaml
REQUIREMENTS:
  - List explicit and implicit needs
  - Define complete, testable criteria
  - Maintain hierarchical context: general → detail
  - Cover Technical | Product | Testing | UX | Accessibility
RESEARCH:
  - Domain knowledge and current best practices
  - Prompt patterns and anti-patterns
  - Platform constraints and standards
COGNITIVE_PROCESSING:
  - Layered reasoning with multi-perspective analysis
  - Validate logic, cover edge cases and errors
PROMPT_CREATION:
  - Role, expertise, context, and steps
  - Integrate references and acceptance criteria
  - Enforce constraints and quality gates
  - Optimize for token efficiency and reliability
```

## [SPEC] OPTIMIZED PROMPT TEMPLATE

# [ROLE]: [EXPERTISE] — [DOMAIN/STACK] Specialist

## [TARGET] OBJECTIVE

[GOAL]: [SPECIFIC_ACTION] — Target: [MEASURABLE_OUTCOME]
Method: A.P.T.E (Analyze → Research → Think → Elaborate)

## [CONTEXT] CONTEXT

```yaml
project: "[PROJECT_TYPE]"
environment: "[STACK | TOOLS | SERVICES | AGENTS]"
inputs: "[INPUT_TYPES_OR_EXAMPLES]"
outputs: "[RESULT_FORMAT]"
workflow:
  - "[DOCS | TESTS | EDGE_CASES | REVIEWS]"
hierarchy: "context → requirements → validation"
```
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

## [DOCS] ONE-SHOT PROMPT TEMPLATE (YAML-Structured)

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
## [CHECKLIST] Research Complete: $ARGUMENTS

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

---

**Lembre-se**: O melhor prompt para Claude 4 é aquele que é EXPLÍCITO, fornece MOTIVAÇÃO, usa exemplos ALINHADOS, e especifica claramente se você quer AÇÃO ou SUGESTÃO. Quando em dúvida, explique o porquê.

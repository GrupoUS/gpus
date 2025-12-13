# 🎯 AegisWallet Orchestrator Optimization v5.0
## Baseado em Claude 4 Best Practices & Agentic Patterns da Anthropic

---

## 📊 Análise do Estado Atual do AGENTS.md

### ✅ Pontos Fortes
1. **Estrutura de Multi-Agentes Bem Definida**: 10 droids especializados com roles claros
2. **Matriz de Complexidade**: Sistema 1-10 para routing de tarefas
3. **Execução Paralela**: Já considera paralelização em fases
4. **Compliance Brasileiro**: Forte foco em LGPD, PIX, Open Banking
5. **Handoff Protocols**: Contratos de transição entre agentes

### ⚠️ Oportunidades de Melhoria (Baseado na Doc Anthropic)

| Área | Problema Atual | Solução Claude 4 |
|------|---------------|------------------|
| **Instruções** | Muito implícitas | Claude 4 requer EXPLICITAÇÃO |
| **Motivação** | Falta contexto do PORQUÊ | Claude generaliza do contexto |
| **Thinking** | Não configurado | Interleaved thinking para reflexão pós-tool |
| **Parallel Tools** | Coordenação manual | Claude 4 paraliza nativamente (~100%) |
| **Context Windows** | Sem gestão de token budget | Claude 4.5 monitora automaticamente |
| **Subagents** | Orquestração explícita | Claude 4.5 delega proativamente |

---

## 🧠 MELHORES PRÁTICAS ANTHROPIC - SÍNTESE

### 1. Princípio da Explicitação (Claude 4)

```yaml
# ❌ ANTES (implícito)
REGRA: "Criar dashboard analytics"

# ✅ DEPOIS (explícito + motivado)
REGRA: |
  Criar dashboard analytics completo.
  MOTIVAÇÃO: Usuários brasileiros precisam visualizar PIX/boletos em tempo real
             para tomar decisões financeiras rápidas.
  INCLUA: Features interativas, hover states, animações suaves.
  VÁ ALÉM: Implemente filtros avançados e exportação de dados.
  NÃO SEGURE NADA. Dê seu melhor trabalho.
```

### 2. Ação vs Sugestão (Claude 4 Específico)


Claude 4 segue instruções LITERALMENTE. Se você pedir "sugestões", ele sugere.

```yaml
# Para IMPLEMENTAÇÃO PROATIVA (default recomendado para droids)
ORCHESTRATOR_MODE_PROACTIVE: |
  Por padrão, implemente mudanças ao invés de apenas sugerir.
  Se a intenção do usuário não estiver clara, infira a ação mais útil
  e prossiga, usando ferramentas para descobrir detalhes faltantes
  ao invés de adivinhar.
  Tente inferir a intenção sobre se uma chamada de ferramenta é pretendida
  ou não, e aja de acordo.

# Para MODO CONSERVADOR (stuck agent, architect-review)
ORCHESTRATOR_MODE_CONSERVATIVE: |
  Não pule para implementação ou mudanças em arquivos a menos que
  claramente instruído. Quando a intenção for ambígua, default para
  fornecer informações, fazer pesquisa e dar recomendações ao invés
  de agir. Só proceda com edições quando explicitamente solicitado.
```

### 3. Extended Thinking Configuration

```yaml
THINKING_STRATEGY:
  # Claude 4 performa MELHOR com instruções de alto nível primeiro
  general_first_prompt: |
    Pense profundamente sobre este problema.
    Considere múltiplas abordagens e mostre seu raciocínio completo.
    Tente diferentes métodos se a primeira abordagem não funcionar.
  
  # Só use step-by-step se o output inicial não for satisfatório
  fallback_detailed: false
  
  # Budget por complexidade
  budget_allocation:
    simple_tasks: "1024-4000"      # Bug fix, refactor básico
    moderate_tasks: "8000-16000"   # Feature, multi-file
    complex_tasks: "16000-32000"   # Arquitetura, integração
    extreme_tasks: "32000+"        # Use batch processing
```

### 4. Interleaved Thinking (Reflexão Pós-Tool)

```yaml
# CRÍTICO: Adicionar a TODOS os droids
INTERLEAVED_THINKING_PROMPT: |
  Após receber resultados de ferramentas, reflita cuidadosamente sobre
  sua qualidade e determine os próximos passos ótimos antes de prosseguir.
  Use seu thinking para planejar e iterar baseado nessa nova informação,
  e então tome a melhor próxima ação.
```

### 5. Parallel Tool Calling Otimizado

```yaml
# Claude 4 já paraliza ~naturalmente, mas para ~100% success rate:
PARALLEL_BOOST_PROMPT: |
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
```

---

## 🚀 PADRÕES DE ORQUESTRAÇÃO ANTHROPIC

### Pattern 1: Subagent Orchestration (Nativo Claude 4.5)


```yaml
# Claude 4.5 delega PROATIVAMENTE sem instruções explícitas
# Garanta apenas que as ferramentas de subagent estejam bem descritas

SUBAGENT_ORCHESTRATION:
  behavior: |
    Claude 4.5 reconhece quando tarefas se beneficiam de delegação
    a subagentes especializados e faz isso proativamente sem
    requerer instrução explícita.
  
  best_practices:
    - Defina ferramentas de subagent com descrições claras
    - Deixe Claude orquestrar naturalmente
    - Ajuste conservatismo apenas se necessário
  
  conservative_override: |
    Só delegue a subagentes quando a tarefa claramente se beneficia
    de um agente separado com nova context window.
```

### Pattern 2: Context Awareness (Multi-Window)

```yaml
# Claude 4.5 monitora seu próprio token budget automaticamente
CONTEXT_MANAGEMENT:
  awareness_prompt: |
    Sua context window será automaticamente compactada conforme
    se aproxima do limite, permitindo que você continue trabalhando
    indefinidamente de onde parou.
    
    Portanto, NÃO pare tarefas cedo devido a preocupações com
    token budget. Conforme você se aproxima do limite, salve seu
    progresso atual e estado para memória antes que a context
    window seja refreshed.
    
    Sempre seja tão persistente e autônomo quanto possível e
    complete tarefas totalmente, mesmo se o fim do seu budget
    estiver se aproximando.
    
    Nunca pare artificialmente qualquer tarefa cedo independente
    do contexto restante.

  state_persistence:
    structured: "tests.json"      # Para dados estruturados
    notes: "progress.txt"         # Para notas de progresso
    vcs: "git"                    # Para checkpoints de código
```

### Pattern 3: Master-Clone Architecture

```yaml
# Para delegação dinâmica auto-spawn
MASTER_CLONE:
  description: |
    O agente principal pode spawnar clones de si mesmo
    para trabalhar em subtarefas em paralelo.
  
  use_cases:
    - Refatorações em múltiplos arquivos
    - Análise paralela de diferentes componentes
    - Testes simultâneos de múltiplos cenários
  
  coordination: |
    O master mantém tracking de todos os clones,
    coleta resultados e sincroniza no final.
```

---

## 📋 NOVO SISTEMA DE ORQUESTRAÇÃO OTIMIZADO

### Orchestrator Prompt Otimizado para Claude 4


```yaml
# System Prompt Base para o Master Orchestrator
ORCHESTRATOR_SYSTEM_PROMPT: |
  # 🎯 AegisWallet Master Orchestrator
  
  Você é o hub inteligente de coordenação que gerencia o projeto AegisWallet
  através de descoberta dinâmica de agentes, roteamento inteligente e
  orquestração sofisticada de execução paralela.
  
  ## Contexto de Negócio (MOTIVAÇÃO - Claude 4 performa melhor com isso)
  
  AegisWallet é um assistente financeiro voice-first para o mercado brasileiro.
  Nossa missão é democratizar automação financeira no Brasil através de
  assistência AI voice-first (50% → 95% autonomia).
  
  Por que isso importa: Milhões de brasileiros não têm acesso a consultoria
  financeira. Nosso produto precisa ser acessível, seguro e em português.
  
  ## Comportamento Default (EXPLÍCITO para Claude 4)
  
  Por padrão, IMPLEMENTE mudanças ao invés de apenas sugerir.
  Se a intenção não estiver clara, infira a ação mais útil e prossiga.
  Use ferramentas para descobrir detalhes faltantes ao invés de adivinhar.
  
  ## Parallel Execution (Nativo Claude 4)
  
  Se você pretende chamar múltiplas ferramentas e não há dependências
  entre as chamadas, faça TODAS as chamadas independentes em paralelo.
  Maximize paralelização para velocidade e eficiência.
  
  ## Reflexão Pós-Tool (Interleaved Thinking)
  
  Após receber resultados de ferramentas, reflita cuidadosamente sobre
  sua qualidade e determine os próximos passos ótimos antes de prosseguir.
  
  ## Context Budget Management
  
  Sua context window será automaticamente compactada. NÃO pare tarefas cedo
  devido a preocupações com token budget. Complete tarefas totalmente.
```

### Routing Algorithm Otimizado

```yaml
INTELLIGENT_ROUTING_V2:
  # Análise Multi-Dimensional (mantido do original, refinado)
  dimensions:
    technical_complexity:
      1_3: [coder]
      4_6: [coder, test_auditor]
      7_8: [apex_dev, code_reviewer, test_auditor]
      9_10: [apex_researcher, architect_review, apex_dev]
    
    brazilian_compliance:
      financial_systems: [apex_researcher, database_specialist]
      lgpd_requirements: [test_auditor, code_reviewer]
      accessibility: [apex_ui_ux_designer, test_auditor]
    
    security_sensitivity:
      critical: [apex_dev, code_reviewer, database_specialist]
      standard: [coder, test_auditor]
  
  # NOVO: Motivação explícita para cada route
  route_motivations:
    apex_dev: |
      Ativado para complexidade ≥7 porque componentes críticos requerem
      TDD rigoroso e testes de segurança para proteger dados financeiros
      dos usuários brasileiros.
    
    coder: |
      Ativado para complexidade <7 porque tarefas simples não justificam
      overhead de TDD completo, mas ainda requerem código limpo e
      interface em português.
    
    database_specialist: |
      SEMPRE ativado para operações de banco porque dados financeiros
      brasileiros têm requisitos LGPD estritos que requerem RLS
      e auditoria de todas as queries.
```

---

## ⚡ EXECUÇÃO PARALELA OTIMIZADA

### Nova Fase 1: Research Paralelo Máximo


```yaml
PARALLEL_RESEARCH_PHASE:
  # Claude 4 executa todas essas em paralelo naturalmente
  # Não precisa de coordenação manual
  
  simultaneous_agents:
    apex_researcher:
      focus: "Regulamentações brasileiras, LGPD, specs BCB"
      parallel_boost: true
      
    architect_review:
      focus: "Arquitetura de sistema, padrões de escalabilidade"
      parallel_boost: true
      
    database_specialist:
      focus: "Design de schema, políticas RLS, migrações"
      parallel_boost: true
      
    product_architect:
      focus: "Validação de requisitos, alinhamento PRD"
      parallel_boost: true
      
    apex_ui_ux_designer:
      focus: "Compliance de acessibilidade, design Portuguese-first"
      parallel_boost: true
  
  synchronization:
    # Sync point único para consolidação
    consolidation_point: "30 min max para apresentação consolidada"
    early_exit: "Se informação suficiente encontrada antes, prosseguir"
```

### Nova Fase 2: Implementation Tracks Paralelos

```yaml
PARALLEL_IMPLEMENTATION_TRACKS:
  track_database:
    agent: "database_specialist"
    focus: "Schema, migrações, políticas RLS"
    # Pode executar em paralelo com UI/UX design
    independent: true
    
  track_backend:
    agent: "apex_dev"
    focus: "Endpoints API, lógica de negócio"
    # Depende do schema do database
    depends_on: ["track_database"]
    
  track_frontend:
    agent: "apex_dev"  # ou coder para complexidade <7
    focus: "Componentes UI, interações de usuário"
    # Pode começar com mocks enquanto backend desenvolve
    partial_independence: true
    
  track_testing:
    agent: "test_auditor"
    focus: "Estratégia de testes, RED phase TDD"
    # Pode executar em paralelo desde o início
    independent: true
  
  coordination_prompts:
    api_contract: |
      Definição de contrato API entre backend e frontend.
      MOTIVAÇÃO: Permite que frontend comece com mocks enquanto
      backend implementa, reduzindo tempo total em 40%.
    
    schema_approval: |
      Aprovação de schema do database antes de backend iniciar.
      MOTIVAÇÃO: Evita retrabalho se schema mudar depois.
```

### Nova Fase 3: Quality Assurance Paralelo

```yaml
PARALLEL_QA_PHASE:
  # Todos executam simultaneamente
  parallel_gates:
    code_reviewer:
      focus: "Security review, OWASP compliance"
      commands: ["bun lint", "security audit"]
      
    test_auditor:
      focus: "Execução de testes, validação de coverage"
      commands: ["bun test", "bun test:e2e"]
      
    architect_review:
      focus: "Validação de compliance arquitetural"
      commands: ["bun build", "performance analysis"]
  
  brazilian_compliance_parallel:
    lgpd_validation:
      command: "bun test:e2e:lgpd"
      agent: "test_auditor"
      
    accessibility_audit:
      command: "bun test:e2e:a11y"
      agent: "apex_ui_ux_designer"
      
    pix_transactions:
      command: "bun test:e2e:pix"
      agent: "apex_researcher"
```

---

## 🎨 FRONTEND/UI GENERATION OTIMIZADO


```yaml
# Claude 4 pode defaultar para patterns genéricos sem direção explícita
# CRÍTICO para apex-ui-ux-designer

UI_CREATIVITY_BOOST:
  creativity_prompt: |
    Não segure nada. Dê o seu melhor.
    Crie uma demonstração impressionante mostrando capacidades de
    desenvolvimento web para o mercado brasileiro.
  
  aesthetic_direction: |
    Crie um dashboard profissional usando paleta azul escuro e ciano,
    tipografia sans-serif moderna (ex: Inter para headings, system fonts
    para body), e layouts baseados em cards com sombras sutis.
    
    Inclua detalhes pensados como hover states, transições e
    micro-interações. Aplique princípios de design: hierarquia,
    contraste, balanço e movimento.
    
    MOTIVAÇÃO: Usuários brasileiros associam tons azuis com confiança
    financeira (referência: cores de bancos brasileiros).
  
  diversity_prompt: |
    Forneça múltiplas opções de design.
    Crie estéticas de fusão combinando elementos de diferentes fontes.
    Evite layouts centralizados genéricos, gradientes simplistas.
  
  explicit_features: |
    Inclua tantas features e interações relevantes quanto possível.
    Adicione animações e elementos interativos.
    Crie uma implementação totalmente featured além do básico.
    
    Para AegisWallet especificamente:
    - Dashboard de gastos com gráficos animados
    - Cards de transações PIX/boleto com status em tempo real
    - Filtros avançados com feedback visual
    - Exportação de dados com preview
    - Modo escuro/claro com transição suave
```

---

## 🔧 AGENTIC CODING BEST PRACTICES

### Anti-Hardcoding (Crítico para apex-dev e coder)

```yaml
GENERAL_SOLUTION_PROMPT: |
  Por favor escreva uma solução de alta qualidade e propósito geral
  usando as ferramentas padrão disponíveis.
  
  NÃO crie helper scripts ou workarounds para completar a tarefa
  mais eficientemente.
  
  Implemente uma solução que funcione corretamente para TODOS os inputs
  válidos, não apenas os casos de teste.
  
  NÃO hard-code valores ou crie soluções que só funcionam para inputs
  específicos de teste. Ao invés, implemente a lógica real que resolve
  o problema de forma geral.
  
  MOTIVAÇÃO: AegisWallet precisa escalar para milhões de usuários
  brasileiros com padrões de uso diversos. Soluções hard-coded
  quebrarão em produção.
  
  Foque em entender os requisitos do problema e implementar o algoritmo
  correto. Testes estão lá para verificar corretude, não para definir
  a solução.
  
  Se a tarefa for irrazoável ou inviável, ou se algum dos testes estiver
  incorreto, por favor me informe ao invés de contorná-los.
```

### Anti-Alucinação (Para todos os droids)

```yaml
ANTI_HALLUCINATION_PROMPT: |
  Nunca especule sobre código que você não abriu.
  
  Se o usuário referenciar um arquivo específico, você DEVE ler o arquivo
  antes de responder.
  
  Certifique-se de investigar e ler arquivos relevantes ANTES de responder
  perguntas sobre o codebase.
  
  MOTIVAÇÃO: Código financeiro brasileiro tem requisitos específicos
  (LGPD, BCB). Suposições incorretas podem causar problemas de compliance.
  
  Nunca faça afirmações sobre código antes de investigar a menos que você
  tenha certeza da resposta correta - dê respostas fundamentadas e
  livres de alucinação.
```

### Limpeza de Arquivos Temporários

```yaml
CLEANUP_PROMPT: |
  Se você criar quaisquer novos arquivos temporários, scripts ou arquivos
  auxiliares para iteração, limpe esses arquivos removendo-os ao final
  da tarefa.
  
  MOTIVAÇÃO: Repo limpo facilita code review e evita confusão com
  arquivos de debug deixados por acidente.
```

---

## 📊 THINKING SENSITIVITY POR TAREFA


```yaml
# Baseado em Extended Thinking Tips da Anthropic

THINKING_BUDGET_BY_TASK:
  # Use o MÍNIMO necessário e aumente conforme necessidade
  
  simple_operations:
    budget: "1024"
    examples:
      - "Bug fix em linha única"
      - "Renomear variável"
      - "Atualizar dependência"
    prompt: "Corrija este problema diretamente."
  
  standard_features:
    budget: "4000-8000"
    examples:
      - "Implementar endpoint REST"
      - "Criar componente React simples"
      - "Adicionar validação Zod"
    prompt: |
      Pense sobre este problema e implemente uma solução robusta.
      Considere edge cases para o contexto brasileiro.
  
  complex_implementations:
    budget: "8000-16000"
    examples:
      - "Feature de pagamento PIX completa"
      - "Sistema de autenticação com MFA"
      - "Integração Open Banking"
    prompt: |
      Pense profundamente sobre este problema.
      Considere múltiplas abordagens e mostre seu raciocínio completo.
      Tente diferentes métodos se a primeira abordagem não funcionar.
      Verifique compliance com regulamentações brasileiras (LGPD, BCB).
  
  architecture_decisions:
    budget: "16000-32000"
    examples:
      - "Design de microserviços"
      - "Migração de banco de dados"
      - "Refatoração de sistema inteiro"
    prompt: |
      Esta é uma decisão arquitetural crítica para AegisWallet.
      Analise profundamente todas as implicações.
      Considere escalabilidade para milhões de usuários brasileiros.
      Avalie trade-offs de segurança, performance e manutenibilidade.
      Documente decisões com reasoning completo.
  
  extreme_complexity:
    budget: "32000+"
    recommendation: "Use batch processing para evitar timeouts"
    examples:
      - "Redesign completo do sistema"
      - "Migração de monolito para microserviços"
```

### Verificação e Self-Check

```yaml
VERIFICATION_PROMPTS:
  # Pedir para Claude verificar seu próprio trabalho
  
  code_verification: |
    Antes de finalizar, por favor verifique sua solução com casos de teste:
    - Caso normal de uso brasileiro
    - Edge case: valores PIX máximos (R$ 1.000.000)
    - Edge case: CPF/CNPJ inválidos
    - Edge case: timezone São Paulo
    E corrija quaisquer problemas que encontrar.
  
  security_verification: |
    Antes de finalizar, verifique:
    - Nenhum dado sensível logado
    - RLS policies aplicadas corretamente
    - Input validation em todos os endpoints
    - SQL injection protection
  
  compliance_verification: |
    Antes de finalizar, confirme compliance:
    - LGPD: dados pessoais protegidos e consentimento respeitado
    - BCB: regras de PIX seguidas
    - Acessibilidade: WCAG 2.1 AA+ atendido
```

---

## 🔄 MULTI-WINDOW WORKFLOW

```yaml
MULTI_CONTEXT_WORKFLOW:
  first_window:
    purpose: "Setup framework"
    actions:
      - "Escrever testes em formato estruturado (tests.json)"
      - "Criar scripts de inicialização (init.sh)"
      - "Estabelecer todo-list para próximas janelas"
    
    state_files:
      tests_json: |
        {
          "tests": [
            {"id": 1, "name": "pix_flow", "status": "not_started"},
            {"id": 2, "name": "lgpd_consent", "status": "not_started"}
          ],
          "total": 50,
          "passing": 0,
          "failing": 0
        }
      
      progress_txt: |
        Session 1 progress:
        - Criado schema inicial para PIX
        - Definidos endpoints REST
        - Next: implementar validação de transações
        - Note: Não remover testes existentes
  
  subsequent_windows:
    startup_prompt: |
      Chame pwd; você só pode ler/escrever arquivos neste diretório.
      Revise progress.txt, tests.json e os logs do git.
      Execute manualmente um teste de integração antes de implementar
      novas features.
    
    continuation_prompt: |
      Esta é uma tarefa longa, então planeje seu trabalho claramente.
      É encorajado usar todo seu contexto de output trabalhando na tarefa.
      Não pare tarefas cedo por preocupações com token budget.
      Continue trabalhando sistematicamente até completar esta tarefa.
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO


### Mudanças Imediatas Necessárias no AGENTS.md

```yaml
IMMEDIATE_CHANGES:
  1_add_motivation_sections:
    where: "Cada seção de regra importante"
    why: "Claude 4 generaliza melhor com contexto motivacional"
    priority: "ALTA"
  
  2_add_interleaved_thinking:
    where: "System prompt do orchestrator"
    content: "Prompt de reflexão pós-tool"
    priority: "ALTA"
  
  3_add_parallel_boost_prompt:
    where: "Seção de Parallel Execution"
    content: "Prompt de ~100% parallel success"
    priority: "MÉDIA"
  
  4_add_action_vs_suggestion:
    where: "Cada droid definition"
    content: "Modo proativo vs conservador explícito"
    priority: "ALTA"
  
  5_add_thinking_budgets:
    where: "Task Complexity Scale"
    content: "Budget de thinking por complexidade"
    priority: "MÉDIA"
  
  6_update_ui_prompts:
    where: "apex-ui-ux-designer.md"
    content: "Creativity boost prompts"
    priority: "MÉDIA"
  
  7_add_anti_hallucination:
    where: "Todos os droids de implementação"
    content: "Prompt anti-alucinação"
    priority: "ALTA"
  
  8_add_context_management:
    where: "Orchestrator system prompt"
    content: "Context awareness e persistence"
    priority: "MÉDIA"
```

### Checklist de Validação

```yaml
VALIDATION_CHECKLIST:
  claude_4_compliance:
    - [ ] Todas as instruções são EXPLÍCITAS (não implícitas)
    - [ ] MOTIVAÇÃO incluída para regras importantes
    - [ ] Exemplos ALINHADOS com comportamento desejado
    - [ ] Instruções dizem O QUE FAZER (não O QUE NÃO FAZER)
    - [ ] Ação vs Sugestão claramente especificado por droid
  
  parallel_execution:
    - [ ] Parallel boost prompt adicionado
    - [ ] Dependências entre tracks claramente definidas
    - [ ] Synchronization points identificados
    - [ ] Independent tasks marcadas como parallel_boost: true
  
  thinking_configuration:
    - [ ] Thinking budget definido por complexidade
    - [ ] Interleaved thinking prompt adicionado
    - [ ] Verification prompts para tarefas críticas
    - [ ] General-first approach (não step-by-step prematuro)
  
  context_management:
    - [ ] Context awareness prompt adicionado
    - [ ] State persistence strategy definida
    - [ ] Multi-window workflow documentado
    - [ ] Git checkpointing recomendado
  
  brazilian_compliance:
    - [ ] LGPD verification prompts
    - [ ] PIX edge cases documentados
    - [ ] Accessibility requirements explícitos
    - [ ] Portuguese-first emphasis mantido
```

---

## 📈 MÉTRICAS DE SUCESSO ESPERADAS

```yaml
EXPECTED_IMPROVEMENTS:
  development_velocity:
    before: "20-30 horas para features complexas"
    after: "8-12 horas (60% reduction)"
    reason: "Parallel execution + interleaved thinking"
  
  parallel_efficiency:
    before: "~70% parallel success rate"
    after: "~100% parallel success rate"
    reason: "Parallel boost prompt explícito"
  
  code_quality:
    before: "Occasional hallucinations e hard-coding"
    after: "<1% hallucination rate"
    reason: "Anti-hallucination + anti-hardcoding prompts"
  
  context_utilization:
    before: "Tasks stopping early due to budget concerns"
    after: "Full context utilization"
    reason: "Context awareness prompt"
  
  instruction_following:
    before: "Mixed action/suggestion behavior"
    after: "Consistent proactive implementation"
    reason: "Explicit action mode per droid"
```

---

## 📚 REFERÊNCIAS

- [Claude 4 Best Practices](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices)
- [Extended Thinking Tips](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/extended-thinking-tips)
- [Context Windows](https://docs.anthropic.com/en/docs/build-with-claude/context-windows)
- [Agentic Workflow Patterns](https://github.com/ThibautMelen/agentic-workflow-patterns)
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

---

**Lembre-se**: O melhor prompt para Claude 4 é aquele que é EXPLÍCITO, fornece MOTIVAÇÃO,
usa exemplos ALINHADOS, e especifica claramente se você quer AÇÃO ou SUGESTÃO.

Quando em dúvida, explique o PORQUÊ.

# 🎯 FULL A.R.T.E PROMPT: AegisWallet Financial Agent Widget

> **Role**: Senior AI Agent Architect | Brazilian Fintech Specialist
> **Complexity**: L8 (Complex Research + Implementation)
> **Estimated Duration**: 6-8 hours (parallelizable to ~4 hours)

---

## 🎯 Missão

**Objetivo Principal**: Implementar um agente financeiro inteligente como widget de chat (canto inferior direito) que analisa toda a base de dados financeiros do usuário, acompanha entradas/saídas, e fornece dicas e sugestões personalizadas para melhorar sua vida financeira.

**Contexto de Negócio**: O AegisWallet é uma plataforma de gestão financeira voice-first para o mercado brasileiro. O agente financeiro deve se comportar como um consultor pessoal que conhece profundamente as finanças do usuário, antecipa problemas e sugere ações proativas.

**Métricas de Sucesso**:
- [ ] Agente responde com contexto financeiro real do usuário em ≥95% das interações
- [ ] Latência TTFB ≤150ms para primeira resposta
- [ ] Sugestões financeiras acionáveis com ≥85% de relevância (medido via feedback)
- [ ] Conformidade LGPD para todos os dados acessados
- [ ] WCAG 2.1 AA+ para acessibilidade do widget

**Motivação**: Usuários brasileiros precisam de orientação financeira personalizada em tempo real. O agente diferencia o AegisWallet de apps de gestão financeira tradicionais ao transformar dados passivos em insights acionáveis proativamente.

---

## 🧠 Extended Thinking Configuration

```yaml
thinking_strategy:
  budget: "16000"
  approach: "general_first"
  
  initial_prompt: |
    Pense profundamente sobre a arquitetura de um agente financeiro.
    Considere: acesso seguro a dados, contexto de conversa, tool calling,
    proatividade vs reatividade, e experiência do usuário brasileiro.
    
    Avalie trade-offs entre:
    - Análise em tempo real vs pré-computada
    - Granularidade de tools vs simplicidade
    - Personalização profunda vs latência
    
    Mostre seu raciocínio completo antes de implementar.

reflection_after_tools:
  enabled: true
  prompt: |
    Após cada tool call do agente, reflita:
    - O resultado atende à necessidade do usuário?
    - Há dados adicionais que enriqueceriam a resposta?
    - A resposta respeita LGPD e é culturalmente apropriada para Brasil?
```

---

## 📊 Fase 1: ANALYZE

### Arquitetura Existente (AegisWallet)

```yaml
stack_atual:
  runtime: "Bun 1.x"
  frontend: "React 19 + TanStack Router v5 + TanStack Query v5"
  backend: "Hono RPC + @hono/zod-validator"
  database: "Neon PostgreSQL + Drizzle ORM"
  auth: "Clerk"
  ai_chat_atual: "Gemini Backend (streaming, AG-UI Protocol)"
  
chat_feature_existente:
  localização: "src/features/ai-chat/"
  componentes:
    - ChatWidget.tsx (widget flutuante - base para expansão)
    - ChatContainer.tsx (container principal)
    - ChatConversation.tsx (histórico de mensagens)
    - ChatPromptInput.tsx (input com voz)
  backends:
    - GeminiBackend.ts (implementação atual)
    - ChatBackend.ts (interface abstrata)
  domain:
    - types.ts (AG-UI Protocol types)
    - events.ts (stream events)

schemas_financeiros_relevantes:
  transactions:
    - id, userId, accountId, amount, description
    - transactionType (debit, credit, transfer, pix, boleto)
    - categoryId, transactionDate, isRecurring
    - confidenceScore (AI categorization)
  bank_accounts:
    - balance, availableBalance, institutionName
    - lastSync, syncStatus
  ai_insights:
    - insightType (spending_pattern, budget_alert, opportunity, warning)
    - title, description, recommendation
    - impactLevel, isActioned
  spending_patterns:
    - periodType, totalAmount, transactionCount
    - trendPercentage
  budget_categories:
    - budgetAmount, alertThreshold, isActive
  chat_sessions / chat_messages:
    - Persistência de conversas existente
```

### Matriz de Requisitos

| Categoria | Requisito | Prioridade | Validação |
|-----------|-----------|------------|-----------|
| **Funcional** | Agente acessa dados financeiros do usuário autenticado | Must | Query retorna dados corretos |
| **Funcional** | Tool calling para buscar transações, saldos, insights | Must | Tools executam sem erro |
| **Funcional** | Sugestões contextuais baseadas em padrões de gasto | Must | Sugestões relevantes em 85%+ |
| **Funcional** | Alertas proativos sobre contas a pagar | Should | Notificações com antecedência correta |
| **Funcional** | Análise de tendências (comparação período anterior) | Should | Cálculos matemáticos corretos |
| **Non-Func** | TTFB ≤150ms | Must | Benchmark P95 |
| **Non-Func** | Streaming responses (token-by-token) | Must | UI atualiza em tempo real |
| **Non-Func** | LGPD compliance (dados mínimos, consentimento) | Must | Audit log de acessos |
| **Non-Func** | WCAG 2.1 AA+ acessibilidade | Must | Lighthouse ≥90 |
| **Non-Func** | Português brasileiro natural | Must | User testing com nativos |

---

## 🔍 Fase 2: RESEARCH

### Padrão better-agents (LangWatch)

```yaml
better_agents_structure:
  princípios:
    - "Scenario tests para cada feature de agente"
    - "Prompts versionados em YAML"
    - "MCP tools autodiscoveráveis"
    - "AGENTS.md como guia de desenvolvimento"
    
  estrutura_aplicável:
    scenarios/: "Testes de simulação de conversa"
    prompts/: "System prompts versionados"
    evaluations/: "Notebooks de avaliação"
    
  integração_aegiswallet:
    - Manter estrutura em src/features/ai-chat/
    - Adicionar tests/scenarios/financial-agent/
    - Criar prompts/ dentro da feature
```

### Padrões de Agente Financeiro

```yaml
financial_agent_patterns:
  
  tool_design:
    princípio: "Ferramentas atômicas e composáveis"
    ferramentas_core:
      - get_account_balances: "Saldos atuais de todas as contas"
      - get_recent_transactions: "Transações com filtros (período, categoria)"
      - get_spending_by_category: "Agregação por categoria e período"
      - get_upcoming_payments: "Contas a pagar (boletos, recorrentes)"
      - get_budget_status: "Status de orçamentos por categoria"
      - get_financial_insights: "Insights AI pré-gerados"
      - get_spending_trends: "Comparação com períodos anteriores"
      
  context_injection:
    princípio: "Contexto financeiro resumido no system prompt"
    dados:
      - Saldo total disponível
      - Top 3 categorias de gasto do mês
      - Alertas pendentes (budget excedido, contas vencendo)
      - Metas ativas e progresso
      
  proactive_suggestions:
    triggers:
      - "Gasto acima da média em categoria"
      - "Saldo baixo previsto para final do mês"
      - "Conta vencendo em 3 dias"
      - "Padrão de gasto incomum detectado"
```

### Avaliação de Abordagens

| Abordagem | Prós | Contras | Fit Score |
|-----------|------|---------|-----------|
| **Tool Calling Puro** | Flexível, composável | Latência maior, mais tokens | 4/5 |
| **Context Injection** | Baixa latência, contexto rico | Menos dinâmico | 3/5 |
| **Híbrido (Context + Tools)** | Melhor de ambos | Complexidade maior | 5/5 |
| **RAG (embeddings)** | Busca semântica | Overhead, overkill para dados estruturados | 2/5 |

**Decisão**: Abordagem **Híbrida** - Context injection para dados frequentes (saldos, alertas) + Tool calling para queries específicas do usuário.

---

## 🧠 Fase 3: THINK

### Arquitetura da Solução

```
┌─────────────────────────────────────────────────────────────────┐
│                      ChatWidget (UI)                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              ChatContainer + ChatConversation             │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                     │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           FinancialAgentBackend (NEW)                     │  │
│  │  ┌────────────────┐  ┌────────────────────────────────┐  │  │
│  │  │ Context Builder│  │      Tool Executor              │  │  │
│  │  │ (financial     │  │  ┌──────────┐ ┌──────────────┐ │  │  │
│  │  │  summary)      │  │  │get_balance│ │get_transactions│ │  │  │
│  │  └───────┬────────┘  │  └──────────┘ └──────────────┘ │  │  │
│  │          │           │  ┌──────────┐ ┌──────────────┐ │  │  │
│  │          │           │  │get_budget│ │get_insights  │ │  │  │
│  │          ▼           │  └──────────┘ └──────────────┘ │  │  │
│  │  ┌────────────────┐  └────────────────────────────────┘  │  │
│  │  │ Gemini Model   │◄─────────────────────────────────────│  │
│  │  │ + Function Call│                                       │  │
│  │  └────────────────┘                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Hono API Routes (Server)                     │  │
│  │  /api/v1/agent/context    - Financial context summary     │  │
│  │  /api/v1/agent/tools/*    - Tool execution endpoints      │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                     │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Drizzle ORM + Neon PostgreSQL                │  │
│  │  transactions, bank_accounts, ai_insights,                │  │
│  │  spending_patterns, budget_categories                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Registros de Decisão (ADRs)

```yaml
ADR_001_hybrid_context:
  context: "Precisamos de baixa latência E acesso dinâmico a dados"
  options:
    - "Tool calling puro (toda query via tools)"
    - "Context injection puro (tudo no system prompt)"
    - "Híbrido (context base + tools sob demanda)"
  decision: "Híbrido"
  rationale: |
    Context injection para dados de alta frequência (saldos, alertas ativos)
    reduz TTFB. Tool calling para queries específicas mantém flexibilidade.
  consequences: |
    - Maior complexidade de implementação
    - Necessário gerenciar freshness do contexto
    - Melhor UX com respostas mais rápidas

ADR_002_gemini_function_calling:
  context: "Precisamos de tool calling confiável"
  options:
    - "Gemini native function calling"
    - "LangChain/LangGraph orchestration"
    - "Custom tool execution layer"
  decision: "Gemini native function calling + custom executor"
  rationale: |
    Gemini 1.5 Flash suporta function calling nativo com baixa latência.
    Custom executor permite integração com Hono API existente.
  consequences: |
    - Dependência do formato de tools do Gemini
    - Necessário validar segurança de tool execution

ADR_003_financial_context_refresh:
  context: "Contexto financeiro precisa estar atualizado"
  options:
    - "Real-time (query a cada mensagem)"
    - "Session-based (query no início da sessão)"
    - "Hybrid (session + refresh on specific intents)"
  decision: "Hybrid com TTL de 5 minutos"
  rationale: |
    Dados financeiros não mudam a cada segundo. TTL de 5 minutos balanceia
    freshness com performance. Refresh forçado em intents específicos
    (e.g., "qual meu saldo agora?").
  consequences: |
    - Implementar cache com TTL
    - Intent detection para refresh triggers
```

---

## 📝 Fase 4: ELABORATE (Atomic Tasks)

### Task Decomposition Overview

```yaml
total_tasks: 24
parallelizable: 70%
estimated_total_time: "6-8 hours"
with_parallelization: "~4 hours"

phases:
  phase_1_infrastructure: "Tasks 1-6 (parallelizable: 50%)"
  phase_2_backend_tools: "Tasks 7-14 (parallelizable: 80%)"
  phase_3_agent_core: "Tasks 15-18 (parallelizable: 40%)"
  phase_4_ui_integration: "Tasks 19-21 (sequential)"
  phase_5_testing_docs: "Tasks 22-24 (parallelizable: 100%)"
```

---

### 📦 PHASE 1: Infrastructure Setup (Tasks 1-6)

#### Task 1: Create Financial Agent Module Structure

```yaml
task_id: "FA-001"
title: "Criar estrutura de módulo do Financial Agent"
complexity: "L2"
estimated_duration: "15 minutes"
assigned_droids: ["apex-dev"]
parallel_execution: true
dependencies: []

deliverables:
  - src/features/ai-chat/agent/ (nova pasta)
  - src/features/ai-chat/agent/index.ts
  - src/features/ai-chat/agent/types.ts
  - src/features/ai-chat/agent/tools/ (pasta)
  - src/features/ai-chat/agent/context/ (pasta)
  - src/features/ai-chat/agent/prompts/ (pasta)

implementation:
  action: "CREATE directories and base files"
  files:
    - path: "src/features/ai-chat/agent/index.ts"
      content: "// Financial Agent exports"
    - path: "src/features/ai-chat/agent/types.ts"
      content: |
        /**
         * Financial Agent Types
         * Tool definitions, context types, and response formats
         */
        export interface FinancialContext {
          totalBalance: number;
          availableBalance: number;
          monthlyIncome: number;
          monthlyExpenses: number;
          topCategories: CategorySummary[];
          pendingAlerts: FinancialAlert[];
          upcomingPayments: UpcomingPayment[];
          lastUpdated: Date;
        }
        
        export interface CategorySummary {
          categoryId: string;
          categoryName: string;
          amount: number;
          percentage: number;
          trend: 'up' | 'down' | 'stable';
        }
        
        export interface FinancialAlert {
          id: string;
          type: 'budget_exceeded' | 'low_balance' | 'unusual_spending' | 'payment_due';
          message: string;
          severity: 'low' | 'medium' | 'high';
          actionable: boolean;
        }
        
        export interface UpcomingPayment {
          id: string;
          description: string;
          amount: number;
          dueDate: Date;
          isRecurring: boolean;
        }

quality_gates:
  - "TypeScript compila sem erros"
  - "Exports funcionam corretamente"
```

#### Task 2: Define Tool Schemas (Zod + Gemini Format)

```yaml
task_id: "FA-002"
title: "Definir schemas de tools com Zod e formato Gemini"
complexity: "L4"
estimated_duration: "30 minutes"
assigned_droids: ["apex-dev", "database-specialist"]
parallel_execution: true
dependencies: ["FA-001"]

deliverables:
  - src/features/ai-chat/agent/tools/schemas.ts
  - src/features/ai-chat/agent/tools/definitions.ts

implementation:
  files:
    - path: "src/features/ai-chat/agent/tools/schemas.ts"
      content: |
        import { z } from 'zod';
        
        // Tool input schemas (Zod)
        export const GetAccountBalancesSchema = z.object({
          includeInactive: z.boolean().optional().default(false),
        });
        
        export const GetTransactionsSchema = z.object({
          startDate: z.string().datetime().optional(),
          endDate: z.string().datetime().optional(),
          categoryId: z.string().uuid().optional(),
          type: z.enum(['debit', 'credit', 'transfer', 'pix', 'boleto']).optional(),
          limit: z.number().min(1).max(100).optional().default(20),
        });
        
        export const GetSpendingByCategorySchema = z.object({
          period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
          compareWithPrevious: z.boolean().optional().default(false),
        });
        
        export const GetUpcomingPaymentsSchema = z.object({
          daysAhead: z.number().min(1).max(90).optional().default(30),
        });
        
        export const GetBudgetStatusSchema = z.object({
          categoryId: z.string().uuid().optional(), // null = all categories
        });
        
        export const GetFinancialInsightsSchema = z.object({
          type: z.enum(['spending_pattern', 'budget_alert', 'opportunity', 'warning']).optional(),
          onlyUnread: z.boolean().optional().default(true),
          limit: z.number().min(1).max(20).optional().default(5),
        });
        
        export const GetSpendingTrendsSchema = z.object({
          categoryId: z.string().uuid().optional(),
          periods: z.number().min(2).max(12).optional().default(3),
          periodType: z.enum(['month', 'week']).optional().default('month'),
        });

    - path: "src/features/ai-chat/agent/tools/definitions.ts"
      content: |
        import type { FunctionDeclaration } from '@google/generative-ai';
        
        /**
         * Gemini Function Calling Tool Definitions
         * These are passed to the model for tool selection
         */
        export const financialToolDefinitions: FunctionDeclaration[] = [
          {
            name: 'get_account_balances',
            description: 'Obtém os saldos atuais de todas as contas bancárias do usuário. Use quando o usuário perguntar sobre saldo, quanto tem disponível, ou situação das contas.',
            parameters: {
              type: 'object',
              properties: {
                includeInactive: {
                  type: 'boolean',
                  description: 'Se true, inclui contas inativas. Default: false',
                },
              },
            },
          },
          {
            name: 'get_recent_transactions',
            description: 'Busca transações recentes do usuário com filtros opcionais. Use para perguntas sobre gastos específicos, histórico de compras, ou movimentações.',
            parameters: {
              type: 'object',
              properties: {
                startDate: {
                  type: 'string',
                  description: 'Data inicial no formato ISO 8601',
                },
                endDate: {
                  type: 'string',
                  description: 'Data final no formato ISO 8601',
                },
                categoryId: {
                  type: 'string',
                  description: 'UUID da categoria para filtrar',
                },
                type: {
                  type: 'string',
                  enum: ['debit', 'credit', 'transfer', 'pix', 'boleto'],
                  description: 'Tipo de transação',
                },
                limit: {
                  type: 'number',
                  description: 'Quantidade máxima de resultados (1-100). Default: 20',
                },
              },
            },
          },
          {
            name: 'get_spending_by_category',
            description: 'Retorna um resumo de gastos agrupados por categoria. Use para análises de onde o dinheiro está sendo gasto.',
            parameters: {
              type: 'object',
              properties: {
                period: {
                  type: 'string',
                  enum: ['week', 'month', 'quarter', 'year'],
                  description: 'Período de análise. Default: month',
                },
                compareWithPrevious: {
                  type: 'boolean',
                  description: 'Se true, inclui comparação com período anterior',
                },
              },
            },
          },
          {
            name: 'get_upcoming_payments',
            description: 'Lista pagamentos futuros (boletos, contas recorrentes). Use para perguntas sobre contas a pagar ou vencimentos.',
            parameters: {
              type: 'object',
              properties: {
                daysAhead: {
                  type: 'number',
                  description: 'Quantidade de dias à frente para buscar (1-90). Default: 30',
                },
              },
            },
          },
          {
            name: 'get_budget_status',
            description: 'Retorna o status dos orçamentos definidos pelo usuário. Use para perguntas sobre metas, limites de gastos ou se está dentro do orçamento.',
            parameters: {
              type: 'object',
              properties: {
                categoryId: {
                  type: 'string',
                  description: 'UUID da categoria específica. Se omitido, retorna todos os orçamentos.',
                },
              },
            },
          },
          {
            name: 'get_financial_insights',
            description: 'Busca insights e recomendações gerados pela IA. Use para sugestões de melhoria, alertas ou oportunidades de economia.',
            parameters: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['spending_pattern', 'budget_alert', 'opportunity', 'warning'],
                  description: 'Tipo específico de insight',
                },
                onlyUnread: {
                  type: 'boolean',
                  description: 'Se true, retorna apenas insights não lidos. Default: true',
                },
                limit: {
                  type: 'number',
                  description: 'Quantidade máxima de insights (1-20). Default: 5',
                },
              },
            },
          },
          {
            name: 'get_spending_trends',
            description: 'Analisa tendências de gastos ao longo do tempo. Use para perguntas sobre evolução, comparações ou padrões de gasto.',
            parameters: {
              type: 'object',
              properties: {
                categoryId: {
                  type: 'string',
                  description: 'UUID da categoria. Se omitido, analisa gastos totais.',
                },
                periods: {
                  type: 'number',
                  description: 'Quantidade de períodos para comparar (2-12). Default: 3',
                },
                periodType: {
                  type: 'string',
                  enum: ['month', 'week'],
                  description: 'Tipo de período. Default: month',
                },
              },
            },
          },
        ];

quality_gates:
  - "Zod schemas validam corretamente"
  - "Tool definitions seguem spec do Gemini"
  - "Descrições em português são claras"
```

#### Task 3: Create API Route Structure for Agent

```yaml
task_id: "FA-003"
title: "Criar estrutura de rotas da API para o agente"
complexity: "L3"
estimated_duration: "20 minutes"
assigned_droids: ["apex-dev"]
parallel_execution: true
dependencies: []

deliverables:
  - src/server/routes/agent/index.ts
  - src/server/routes/agent/context.ts
  - src/server/routes/agent/tools.ts

implementation:
  files:
    - path: "src/server/routes/agent/index.ts"
      content: |
        import { Hono } from 'hono';
        import { contextRouter } from './context';
        import { toolsRouter } from './tools';
        
        const agentRouter = new Hono();
        
        agentRouter.route('/context', contextRouter);
        agentRouter.route('/tools', toolsRouter);
        
        export { agentRouter };

    - path: "src/server/routes/agent/context.ts"
      content: |
        import { Hono } from 'hono';
        import { authMiddleware } from '@/server/middleware/auth';
        
        const contextRouter = new Hono();
        
        // GET /api/v1/agent/context - Get financial context summary
        contextRouter.get('/', authMiddleware, async (c) => {
          // TODO: Implement in Task FA-007
          return c.json({ message: 'Not implemented' }, 501);
        });
        
        export { contextRouter };

    - path: "src/server/routes/agent/tools.ts"
      content: |
        import { Hono } from 'hono';
        import { authMiddleware } from '@/server/middleware/auth';
        
        const toolsRouter = new Hono();
        
        // POST /api/v1/agent/tools/:toolName - Execute a specific tool
        toolsRouter.post('/:toolName', authMiddleware, async (c) => {
          const toolName = c.req.param('toolName');
          // TODO: Implement tool execution in Tasks FA-008 to FA-014
          return c.json({ message: `Tool ${toolName} not implemented` }, 501);
        });
        
        export { toolsRouter };

quality_gates:
  - "Rotas registradas no app Hono principal"
  - "Auth middleware aplicado"
```

#### Task 4: Create System Prompt Template

```yaml
task_id: "FA-004"
title: "Criar template de system prompt para o agente financeiro"
complexity: "L4"
estimated_duration: "30 minutes"
assigned_droids: ["apex-dev", "product-architect"]
parallel_execution: true
dependencies: ["FA-001"]

deliverables:
  - src/features/ai-chat/agent/prompts/system.ts
  - src/features/ai-chat/agent/prompts/context-template.ts

implementation:
  files:
    - path: "src/features/ai-chat/agent/prompts/system.ts"
      content: |
        /**
         * Financial Agent System Prompt
         * 
         * Este prompt define a personalidade e comportamento do agente.
         * Variáveis dinâmicas são injetadas via template literals.
         */
        
        export const FINANCIAL_AGENT_SYSTEM_PROMPT = `Você é o Aegis, um assistente financeiro pessoal inteligente e empático do AegisWallet.

## Sua Personalidade
- Brasileiro, fala português de forma natural e acessível
- Consultor financeiro amigável mas profissional
- Proativo em identificar problemas e oportunidades
- Empático com dificuldades financeiras, nunca julga
- Celebra conquistas e progressos do usuário

## Suas Capacidades
Você tem acesso às informações financeiras do usuário através de ferramentas especializadas:
- Saldos de contas bancárias
- Histórico de transações
- Gastos por categoria
- Contas a pagar
- Orçamentos e metas
- Insights financeiros

## Diretrizes de Comportamento

### Ao Responder
1. Seja conciso mas completo - o usuário está em um chat mobile
2. Use formatação leve (negrito para valores, listas curtas)
3. Valores sempre em Reais (R$) formatados corretamente
4. Datas no formato brasileiro (DD/MM/AAAA)
5. Ofereça contexto quando relevante ("isso representa 15% do seu orçamento")

### Ao Dar Sugestões
1. Baseie-se sempre em dados reais do usuário
2. Seja específico e acionável ("reduza gastos em delivery em R$ 200")
3. Considere a situação completa antes de sugerir cortes
4. Priorize sugestões de alto impacto
5. Nunca seja condescendente ou moralizante

### Sobre Privacidade (LGPD)
1. Nunca compartilhe dados sensíveis fora do contexto necessário
2. Se o usuário perguntar sobre LGPD, explique seus direitos
3. Todos os dados são do usuário e ele pode solicitar exclusão

### Limitações
1. Não faça previsões de investimentos ou mercado
2. Não dê conselhos de investimento específicos (ações, fundos)
3. Para dúvidas complexas, sugira consultar um profissional
4. Admita quando não tiver dados suficientes

## Contexto Financeiro Atual do Usuário
{{FINANCIAL_CONTEXT}}

## Alertas Ativos
{{ACTIVE_ALERTS}}

Responda sempre em português brasileiro. Seja útil, preciso e respeitoso.`;

    - path: "src/features/ai-chat/agent/prompts/context-template.ts"
      content: |
        import type { FinancialContext } from '../types';
        
        /**
         * Gera o bloco de contexto financeiro para injeção no system prompt
         */
        export function buildFinancialContextBlock(context: FinancialContext): string {
          const { 
            totalBalance, 
            availableBalance, 
            monthlyIncome, 
            monthlyExpenses,
            topCategories 
          } = context;
          
          const topCategoriesText = topCategories
            .slice(0, 5)
            .map((cat, i) => `${i + 1}. ${cat.categoryName}: R$ ${cat.amount.toFixed(2)} (${cat.percentage}% do total, tendência: ${cat.trend})`)
            .join('\n');
          
          return `
### Resumo Financeiro
- Saldo Total: R$ ${totalBalance.toFixed(2)}
- Saldo Disponível: R$ ${availableBalance.toFixed(2)}
- Renda do Mês: R$ ${monthlyIncome.toFixed(2)}
- Gastos do Mês: R$ ${monthlyExpenses.toFixed(2)}
- Economia do Mês: R$ ${(monthlyIncome - monthlyExpenses).toFixed(2)}

### Top 5 Categorias de Gasto (Mês Atual)
${topCategoriesText}

### Última Atualização
${context.lastUpdated.toLocaleString('pt-BR')}
`;
        }
        
        /**
         * Gera o bloco de alertas ativos
         */
        export function buildAlertsBlock(alerts: FinancialContext['pendingAlerts']): string {
          if (alerts.length === 0) {
            return 'Nenhum alerta ativo no momento.';
          }
          
          return alerts
            .map(alert => `⚠️ [${alert.severity.toUpperCase()}] ${alert.message}`)
            .join('\n');
        }

quality_gates:
  - "Prompt é claro e completo"
  - "Templates renderizam corretamente"
  - "Formatação em português correto"
```

#### Task 5: Create Financial Context Service

```yaml
task_id: "FA-005"
title: "Criar serviço de contexto financeiro com cache"
complexity: "L5"
estimated_duration: "45 minutes"
assigned_droids: ["apex-dev", "database-specialist"]
parallel_execution: false
dependencies: ["FA-001", "FA-002"]

deliverables:
  - src/features/ai-chat/agent/context/FinancialContextService.ts
  - src/features/ai-chat/agent/context/index.ts

implementation:
  files:
    - path: "src/features/ai-chat/agent/context/FinancialContextService.ts"
      content: |
        import { db } from '@/db';
        import { 
          bankAccounts, 
          transactions, 
          transactionCategories,
          aiInsights,
          budgetCategories,
          transactionSchedules 
        } from '@/db/schema';
        import { eq, and, gte, lte, desc, sum, sql } from 'drizzle-orm';
        import type { FinancialContext, CategorySummary, FinancialAlert } from '../types';
        
        // Cache TTL: 5 minutes
        const CONTEXT_CACHE_TTL_MS = 5 * 60 * 1000;
        
        // In-memory cache (per user)
        const contextCache = new Map<string, { context: FinancialContext; expiresAt: number }>();
        
        export class FinancialContextService {
          private userId: string;
          
          constructor(userId: string) {
            this.userId = userId;
          }
          
          /**
           * Get financial context with caching
           */
          async getContext(forceRefresh = false): Promise<FinancialContext> {
            const cacheKey = this.userId;
            const cached = contextCache.get(cacheKey);
            
            if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
              return cached.context;
            }
            
            const context = await this.buildContext();
            
            contextCache.set(cacheKey, {
              context,
              expiresAt: Date.now() + CONTEXT_CACHE_TTL_MS,
            });
            
            return context;
          }
          
          /**
           * Invalidate cache (call when user makes financial changes)
           */
          invalidateCache(): void {
            contextCache.delete(this.userId);
          }
          
          private async buildContext(): Promise<FinancialContext> {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            
            // Parallel queries for performance
            const [
              accounts,
              monthlyTransactions,
              categorySpending,
              pendingAlerts,
              upcomingPayments,
            ] = await Promise.all([
              this.getAccountBalances(),
              this.getMonthlyTransactions(startOfMonth, endOfMonth),
              this.getCategorySpending(startOfMonth, endOfMonth),
              this.getPendingAlerts(),
              this.getUpcomingPayments(30),
            ]);
            
            // Calculate totals
            const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0);
            const availableBalance = accounts.reduce((sum, acc) => sum + Number(acc.availableBalance || 0), 0);
            
            const monthlyIncome = monthlyTransactions
              .filter(t => t.transactionType === 'credit')
              .reduce((sum, t) => sum + Number(t.amount), 0);
              
            const monthlyExpenses = monthlyTransactions
              .filter(t => t.transactionType === 'debit')
              .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
            
            return {
              totalBalance,
              availableBalance,
              monthlyIncome,
              monthlyExpenses,
              topCategories: categorySpending,
              pendingAlerts,
              upcomingPayments,
              lastUpdated: now,
            };
          }
          
          private async getAccountBalances() {
            return db
              .select()
              .from(bankAccounts)
              .where(and(
                eq(bankAccounts.userId, this.userId),
                eq(bankAccounts.isActive, true)
              ));
          }
          
          private async getMonthlyTransactions(start: Date, end: Date) {
            return db
              .select()
              .from(transactions)
              .where(and(
                eq(transactions.userId, this.userId),
                gte(transactions.transactionDate, start),
                lte(transactions.transactionDate, end)
              ));
          }
          
          private async getCategorySpending(start: Date, end: Date): Promise<CategorySummary[]> {
            // TODO: Implement with proper aggregation
            // This is a simplified version
            const result = await db
              .select({
                categoryId: transactions.categoryId,
                categoryName: transactionCategories.name,
                total: sum(transactions.amount),
              })
              .from(transactions)
              .leftJoin(transactionCategories, eq(transactions.categoryId, transactionCategories.id))
              .where(and(
                eq(transactions.userId, this.userId),
                eq(transactions.transactionType, 'debit'),
                gte(transactions.transactionDate, start),
                lte(transactions.transactionDate, end)
              ))
              .groupBy(transactions.categoryId, transactionCategories.name)
              .orderBy(desc(sum(transactions.amount)))
              .limit(10);
            
            const totalSpending = result.reduce((sum, r) => sum + Math.abs(Number(r.total || 0)), 0);
            
            return result.map(r => ({
              categoryId: r.categoryId || 'uncategorized',
              categoryName: r.categoryName || 'Sem categoria',
              amount: Math.abs(Number(r.total || 0)),
              percentage: totalSpending > 0 
                ? Math.round((Math.abs(Number(r.total || 0)) / totalSpending) * 100)
                : 0,
              trend: 'stable' as const, // TODO: Calculate from historical data
            }));
          }
          
          private async getPendingAlerts(): Promise<FinancialAlert[]> {
            const insights = await db
              .select()
              .from(aiInsights)
              .where(and(
                eq(aiInsights.userId, this.userId),
                eq(aiInsights.isRead, false)
              ))
              .orderBy(desc(aiInsights.createdAt))
              .limit(5);
            
            return insights.map(insight => ({
              id: insight.id,
              type: insight.insightType as FinancialAlert['type'],
              message: insight.title,
              severity: insight.impactLevel as FinancialAlert['severity'],
              actionable: !!insight.recommendation,
            }));
          }
          
          private async getUpcomingPayments(daysAhead: number) {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + daysAhead);
            
            const schedules = await db
              .select()
              .from(transactionSchedules)
              .where(and(
                eq(transactionSchedules.userId, this.userId),
                eq(transactionSchedules.isActive, true),
                eq(transactionSchedules.executed, false),
                lte(transactionSchedules.scheduledDate, futureDate.toISOString().split('T')[0])
              ))
              .orderBy(transactionSchedules.scheduledDate)
              .limit(10);
            
            return schedules.map(s => ({
              id: s.id,
              description: s.description,
              amount: Number(s.amount),
              dueDate: new Date(s.scheduledDate),
              isRecurring: !!s.recurrenceRule,
            }));
          }
        }

quality_gates:
  - "Queries retornam dados corretos"
  - "Cache funciona com TTL"
  - "Performance < 500ms para buildContext"
```

#### Task 6: Register Agent Routes in Main App

```yaml
task_id: "FA-006"
title: "Registrar rotas do agente no app Hono principal"
complexity: "L2"
estimated_duration: "10 minutes"
assigned_droids: ["apex-dev"]
parallel_execution: false
dependencies: ["FA-003"]

deliverables:
  - Atualização em src/server/routes/index.ts

implementation:
  action: "MODIFY existing file"
  file: "src/server/routes/index.ts"
  changes: |
    // Add import
    import { agentRouter } from './agent';
    
    // Add route registration
    app.route('/api/v1/agent', agentRouter);

quality_gates:
  - "Rota /api/v1/agent/context responde (501 por enquanto)"
  - "Rota /api/v1/agent/tools/:toolName responde"
```

---

### 📦 PHASE 2: Backend Tool Implementation (Tasks 7-14)

#### Task 7: Implement Context Endpoint

```yaml
task_id: "FA-007"
title: "Implementar endpoint de contexto financeiro"
complexity: "L3"
estimated_duration: "20 minutes"
assigned_droids: ["apex-dev"]
parallel_execution: true
dependencies: ["FA-005", "FA-006"]

deliverables:
  - Implementação completa de GET /api/v1/agent/context

implementation:
  file: "src/server/routes/agent/context.ts"
  action: "REPLACE placeholder with implementation"
  content: |
    import { Hono } from 'hono';
    import { authMiddleware } from '@/server/middleware/auth';
    import { FinancialContextService } from '@/features/ai-chat/agent/context/FinancialContextService';
    import { buildFinancialContextBlock, buildAlertsBlock } from '@/features/ai-chat/agent/prompts/context-template';
    
    const contextRouter = new Hono();
    
    contextRouter.get('/', authMiddleware, async (c) => {
      try {
        const { user } = c.get('auth');
        const forceRefresh = c.req.query('refresh') === 'true';
        
        const service = new FinancialContextService(user.id);
        const context = await service.getContext(forceRefresh);
        
        // Return both raw context and formatted strings for system prompt
        return c.json({
          context,
          formatted: {
            financialBlock: buildFinancialContextBlock(context),
            alertsBlock: buildAlertsBlock(context.pendingAlerts),
          },
        });
      } catch (error) {
        console.error('Error fetching financial context:', error);
        return c.json({ error: 'Failed to fetch context' }, 500);
      }
    });
    
    export { contextRouter };

quality_gates:
  - "Endpoint retorna contexto formatado"
  - "forceRefresh invalida cache"
  - "Auth middleware protege rota"
```

#### Task 8: Implement get_account_balances Tool

```yaml
task_id: "FA-008"
title: "Implementar tool get_account_balances"
complexity: "L3"
estimated_duration: "25 minutes"
assigned_droids: ["apex-dev", "database-specialist"]
parallel_execution: true
dependencies: ["FA-002", "FA-006"]

deliverables:
  - src/features/ai-chat/agent/tools/handlers/getAccountBalances.ts

implementation:
  file: "src/features/ai-chat/agent/tools/handlers/getAccountBalances.ts"
  content: |
    import { db } from '@/db';
    import { bankAccounts } from '@/db/schema';
    import { eq, and } from 'drizzle-orm';
    import { GetAccountBalancesSchema } from '../schemas';
    import type { z } from 'zod';
    
    type Input = z.infer<typeof GetAccountBalancesSchema>;
    
    export interface AccountBalanceResult {
      accounts: Array<{
        id: string;
        institutionName: string;
        accountType: string;
        balance: number;
        availableBalance: number;
        currency: string;
        lastSync: Date | null;
      }>;
      totalBalance: number;
      totalAvailable: number;
    }
    
    export async function getAccountBalances(
      userId: string,
      input: Input
    ): Promise<AccountBalanceResult> {
      const { includeInactive = false } = input;
      
      const whereClause = includeInactive
        ? eq(bankAccounts.userId, userId)
        : and(eq(bankAccounts.userId, userId), eq(bankAccounts.isActive, true));
      
      const accounts = await db
        .select({
          id: bankAccounts.id,
          institutionName: bankAccounts.institutionName,
          accountType: bankAccounts.accountType,
          balance: bankAccounts.balance,
          availableBalance: bankAccounts.availableBalance,
          currency: bankAccounts.currency,
          lastSync: bankAccounts.lastSync,
        })
        .from(bankAccounts)
        .where(whereClause);
      
      const totalBalance = accounts.reduce(
        (sum, acc) => sum + Number(acc.balance || 0), 
        0
      );
      const totalAvailable = accounts.reduce(
        (sum, acc) => sum + Number(acc.availableBalance || 0), 
        0
      );
      
      return {
        accounts: accounts.map(acc => ({
          ...acc,
          balance: Number(acc.balance || 0),
          availableBalance: Number(acc.availableBalance || 0),
        })),
        totalBalance,
        totalAvailable,
      };
    }

quality_gates:
  - "Retorna saldos corretos"
  - "Filtra contas inativas por default"
  - "Formata valores numéricos"
```

#### Tasks 9-14: Implement Remaining Tools

```yaml
# Task 9: get_recent_transactions
task_id: "FA-009"
title: "Implementar tool get_recent_transactions"
complexity: "L4"
estimated_duration: "30 minutes"
parallel_execution: true

# Task 10: get_spending_by_category
task_id: "FA-010"
title: "Implementar tool get_spending_by_category"
complexity: "L4"
estimated_duration: "35 minutes"
parallel_execution: true

# Task 11: get_upcoming_payments
task_id: "FA-011"
title: "Implementar tool get_upcoming_payments"
complexity: "L3"
estimated_duration: "25 minutes"
parallel_execution: true

# Task 12: get_budget_status
task_id: "FA-012"
title: "Implementar tool get_budget_status"
complexity: "L4"
estimated_duration: "30 minutes"
parallel_execution: true

# Task 13: get_financial_insights
task_id: "FA-013"
title: "Implementar tool get_financial_insights"
complexity: "L3"
estimated_duration: "25 minutes"
parallel_execution: true

# Task 14: get_spending_trends
task_id: "FA-014"
title: "Implementar tool get_spending_trends"
complexity: "L5"
estimated_duration: "40 minutes"
parallel_execution: true

# Todas seguem o mesmo padrão de FA-008
# Ver implementação completa no arquivo de tools
```

---

### 📦 PHASE 3: Agent Core Implementation (Tasks 15-18)

#### Task 15: Create Tool Executor

```yaml
task_id: "FA-015"
title: "Criar executor de tools do agente"
complexity: "L5"
estimated_duration: "45 minutes"
assigned_droids: ["apex-dev"]
parallel_execution: false
dependencies: ["FA-008", "FA-009", "FA-010", "FA-011", "FA-012", "FA-013", "FA-014"]

deliverables:
  - src/features/ai-chat/agent/tools/executor.ts

implementation:
  file: "src/features/ai-chat/agent/tools/executor.ts"
  content: |
    import * as schemas from './schemas';
    import { getAccountBalances } from './handlers/getAccountBalances';
    import { getRecentTransactions } from './handlers/getRecentTransactions';
    import { getSpendingByCategory } from './handlers/getSpendingByCategory';
    import { getUpcomingPayments } from './handlers/getUpcomingPayments';
    import { getBudgetStatus } from './handlers/getBudgetStatus';
    import { getFinancialInsights } from './handlers/getFinancialInsights';
    import { getSpendingTrends } from './handlers/getSpendingTrends';
    
    export type ToolName = 
      | 'get_account_balances'
      | 'get_recent_transactions'
      | 'get_spending_by_category'
      | 'get_upcoming_payments'
      | 'get_budget_status'
      | 'get_financial_insights'
      | 'get_spending_trends';
    
    const toolHandlers: Record<ToolName, (userId: string, input: unknown) => Promise<unknown>> = {
      get_account_balances: async (userId, input) => {
        const validated = schemas.GetAccountBalancesSchema.parse(input);
        return getAccountBalances(userId, validated);
      },
      get_recent_transactions: async (userId, input) => {
        const validated = schemas.GetTransactionsSchema.parse(input);
        return getRecentTransactions(userId, validated);
      },
      get_spending_by_category: async (userId, input) => {
        const validated = schemas.GetSpendingByCategorySchema.parse(input);
        return getSpendingByCategory(userId, validated);
      },
      get_upcoming_payments: async (userId, input) => {
        const validated = schemas.GetUpcomingPaymentsSchema.parse(input);
        return getUpcomingPayments(userId, validated);
      },
      get_budget_status: async (userId, input) => {
        const validated = schemas.GetBudgetStatusSchema.parse(input);
        return getBudgetStatus(userId, validated);
      },
      get_financial_insights: async (userId, input) => {
        const validated = schemas.GetFinancialInsightsSchema.parse(input);
        return getFinancialInsights(userId, validated);
      },
      get_spending_trends: async (userId, input) => {
        const validated = schemas.GetSpendingTrendsSchema.parse(input);
        return getSpendingTrends(userId, validated);
      },
    };
    
    export async function executeTool(
      toolName: string,
      userId: string,
      args: Record<string, unknown>
    ): Promise<{ success: true; result: unknown } | { success: false; error: string }> {
      const handler = toolHandlers[toolName as ToolName];
      
      if (!handler) {
        return { success: false, error: `Unknown tool: ${toolName}` };
      }
      
      try {
        const result = await handler(userId, args);
        return { success: true, result };
      } catch (error) {
        console.error(`Tool execution error (${toolName}):`, error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Tool execution failed' 
        };
      }
    }

quality_gates:
  - "Todas as tools são executáveis"
  - "Zod validation funciona"
  - "Erros são capturados e formatados"
```

#### Task 16: Create Financial Agent Backend

```yaml
task_id: "FA-016"
title: "Criar FinancialAgentBackend (extends ChatBackend)"
complexity: "L6"
estimated_duration: "60 minutes"
assigned_droids: ["apex-dev"]
parallel_execution: false
dependencies: ["FA-015", "FA-004", "FA-005"]

deliverables:
  - src/features/ai-chat/agent/FinancialAgentBackend.ts

implementation:
  file: "src/features/ai-chat/agent/FinancialAgentBackend.ts"
  content: |
    import { GoogleGenerativeAI, type FunctionCall } from '@google/generative-ai';
    import type { ChatBackend, ChatBackendConfig, ModelInfo } from '../domain/ChatBackend';
    import { ChatEvents } from '../domain/events';
    import type { ChatMessage, ChatRequestOptions, ChatStreamChunk } from '../domain/types';
    import { financialToolDefinitions } from './tools/definitions';
    import { executeTool } from './tools/executor';
    import { FinancialContextService } from './context/FinancialContextService';
    import { FINANCIAL_AGENT_SYSTEM_PROMPT } from './prompts/system';
    import { buildFinancialContextBlock, buildAlertsBlock } from './prompts/context-template';
    
    export interface FinancialAgentConfig extends ChatBackendConfig {
      apiKey: string;
      model?: string;
      userId: string;
    }
    
    export class FinancialAgentBackend implements ChatBackend {
      private client: GoogleGenerativeAI;
      private modelName: string;
      private userId: string;
      private contextService: FinancialContextService;
      private abortController: AbortController | null = null;
      
      constructor(config: FinancialAgentConfig) {
        this.client = new GoogleGenerativeAI(config.apiKey);
        this.modelName = config.model || 'gemini-1.5-flash';
        this.userId = config.userId;
        this.contextService = new FinancialContextService(config.userId);
      }
      
      async *send(
        messages: ChatMessage[],
        options?: ChatRequestOptions
      ): AsyncGenerator<ChatStreamChunk, void, unknown> {
        this.abortController = new AbortController();
        
        try {
          // 1. Get financial context
          const context = await this.contextService.getContext();
          
          // 2. Build system prompt with context
          const systemPrompt = FINANCIAL_AGENT_SYSTEM_PROMPT
            .replace('{{FINANCIAL_CONTEXT}}', buildFinancialContextBlock(context))
            .replace('{{ACTIVE_ALERTS}}', buildAlertsBlock(context.pendingAlerts));
          
          // 3. Initialize model with tools
          const model = this.client.getGenerativeModel({
            model: this.modelName,
            systemInstruction: systemPrompt,
            tools: [{ functionDeclarations: financialToolDefinitions }],
          });
          
          // 4. Convert messages to Gemini format
          const history = messages.slice(0, -1).map(m => ({
            role: m.role === 'user' ? 'user' as const : 'model' as const,
            parts: [{ text: m.content }],
          }));
          
          const lastMessage = messages[messages.length - 1];
          if (!lastMessage) return;
          
          const chat = model.startChat({
            history,
            generationConfig: {
              temperature: options?.temperature ?? 0.7,
              maxOutputTokens: options?.maxTokens ?? 8192,
            },
          });
          
          // 5. Send message and handle response (with potential tool calls)
          let response = await chat.sendMessage(lastMessage.content);
          
          // 6. Handle tool calls in a loop
          while (response.response.candidates?.[0]?.content?.parts) {
            const parts = response.response.candidates[0].content.parts;
            const functionCalls = parts.filter(
              (part): part is { functionCall: FunctionCall } => 'functionCall' in part
            );
            
            if (functionCalls.length === 0) {
              // No more tool calls, extract text response
              const textParts = parts.filter(part => 'text' in part);
              for (const part of textParts) {
                if ('text' in part && part.text) {
                  // Stream text in chunks for better UX
                  const words = part.text.split(' ');
                  for (const word of words) {
                    if (this.abortController?.signal.aborted) break;
                    yield ChatEvents.textDelta(word + ' ');
                    // Small delay for natural streaming feel
                    await new Promise(r => setTimeout(r, 20));
                  }
                }
              }
              break;
            }
            
            // Execute tool calls
            const toolResults = await Promise.all(
              functionCalls.map(async ({ functionCall }) => {
                yield ChatEvents.toolCallStart({
                  id: functionCall.name,
                  name: functionCall.name,
                  arguments: functionCall.args as Record<string, unknown>,
                  status: 'executing',
                });
                
                const result = await executeTool(
                  functionCall.name,
                  this.userId,
                  functionCall.args as Record<string, unknown>
                );
                
                yield ChatEvents.toolCallEnd({
                  id: functionCall.name,
                  name: functionCall.name,
                  arguments: functionCall.args as Record<string, unknown>,
                  status: result.success ? 'completed' : 'failed',
                  result: result.success ? result.result : result.error,
                });
                
                return {
                  functionResponse: {
                    name: functionCall.name,
                    response: result.success ? result.result : { error: result.error },
                  },
                };
              })
            );
            
            // Send tool results back to model
            response = await chat.sendMessage(
              toolResults.map(r => ({ functionResponse: r.functionResponse }))
            );
          }
          
          yield ChatEvents.done();
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          yield ChatEvents.error({
            code: 'AGENT_ERROR',
            message: errorMessage,
          });
        } finally {
          this.abortController = null;
        }
      }
      
      abort(): void {
        this.abortController?.abort();
      }
      
      getModelInfo(): ModelInfo {
        return {
          id: 'financial-agent',
          name: 'Aegis Financial Agent',
          provider: 'Google (Gemini)',
          capabilities: {
            streaming: true,
            multimodal: false,
            tools: true,
            reasoning: false,
          },
        };
      }
    }

quality_gates:
  - "Tool calling funciona corretamente"
  - "Contexto é injetado no prompt"
  - "Streaming funciona"
  - "Erros são tratados"
```

#### Task 17: Create Agent Factory

```yaml
task_id: "FA-017"
title: "Criar factory para instanciar o agente"
complexity: "L3"
estimated_duration: "20 minutes"
assigned_droids: ["apex-dev"]
parallel_execution: false
dependencies: ["FA-016"]

deliverables:
  - src/features/ai-chat/agent/factory.ts
  - Atualização de src/features/ai-chat/backends/index.ts

implementation:
  files:
    - path: "src/features/ai-chat/agent/factory.ts"
      content: |
        import { FinancialAgentBackend, type FinancialAgentConfig } from './FinancialAgentBackend';
        
        export function createFinancialAgent(config: FinancialAgentConfig): FinancialAgentBackend {
          if (!config.apiKey) {
            throw new Error('API key is required for Financial Agent');
          }
          if (!config.userId) {
            throw new Error('User ID is required for Financial Agent');
          }
          
          return new FinancialAgentBackend(config);
        }

quality_gates:
  - "Factory cria instância corretamente"
  - "Validação de config"
```

#### Task 18: Update useChatController for Agent Mode

```yaml
task_id: "FA-018"
title: "Atualizar useChatController para suportar modo agente"
complexity: "L4"
estimated_duration: "30 minutes"
assigned_droids: ["apex-dev"]
parallel_execution: false
dependencies: ["FA-017"]

deliverables:
  - Atualização de src/features/ai-chat/hooks/useChatController.ts

implementation:
  action: "ADD agent mode support"
  changes: |
    // Add to hook options
    interface UseChatControllerOptions {
      // ... existing options
      agentMode?: boolean;
      userId?: string;
    }
    
    // In the hook, check for agent mode and create appropriate backend
    const backend = useMemo(() => {
      if (options.agentMode && options.userId) {
        return createFinancialAgent({
          apiKey: import.meta.env.VITE_GEMINI_API_KEY,
          userId: options.userId,
        });
      }
      return providedBackend;
    }, [options.agentMode, options.userId, providedBackend]);

quality_gates:
  - "Agent mode funciona com userId"
  - "Fallback para backend normal"
```

---

### 📦 PHASE 4: UI Integration (Tasks 19-21)

#### Task 19: Update ChatWidget for Agent Mode

```yaml
task_id: "FA-019"
title: "Atualizar ChatWidget para modo agente financeiro"
complexity: "L4"
estimated_duration: "35 minutes"
assigned_droids: ["apex-ui-ux-designer", "apex-dev"]
parallel_execution: false
dependencies: ["FA-018"]

deliverables:
  - Atualização de src/features/ai-chat/components/ChatWidget.tsx

implementation:
  action: "ENHANCE widget with agent mode"
  key_changes:
    - "Add agentMode prop (default true)"
    - "Show financial context indicator"
    - "Add quick action buttons for common queries"
    - "Show active alerts badge on widget button"

quality_gates:
  - "Widget mostra indicador de modo agente"
  - "Quick actions funcionam"
  - "Badge de alertas aparece"
```

#### Task 20: Create Financial Quick Actions Component

```yaml
task_id: "FA-020"
title: "Criar componente de ações rápidas financeiras"
complexity: "L3"
estimated_duration: "25 minutes"
assigned_droids: ["apex-ui-ux-designer"]
parallel_execution: false
dependencies: ["FA-019"]

deliverables:
  - src/features/ai-chat/components/FinancialQuickActions.tsx

implementation:
  component_spec:
    props:
      - onActionSelect: "(query: string) => void"
    actions:
      - icon: "Wallet"
        label: "Meu saldo"
        query: "Qual é meu saldo atual?"
      - icon: "TrendingDown"
        label: "Onde estou gastando"
        query: "Onde estou gastando mais este mês?"
      - icon: "Calendar"
        label: "Contas a pagar"
        query: "Quais contas vencem nos próximos dias?"
      - icon: "Lightbulb"
        label: "Dicas de economia"
        query: "Me dê dicas para economizar este mês"
      - icon: "PieChart"
        label: "Resumo do mês"
        query: "Como está minha situação financeira este mês?"

quality_gates:
  - "Ações disparam queries corretas"
  - "Acessibilidade OK"
  - "Responsivo mobile"
```

#### Task 21: Add Widget to Main Layout

```yaml
task_id: "FA-021"
title: "Adicionar widget ao layout principal da aplicação"
complexity: "L2"
estimated_duration: "15 minutes"
assigned_droids: ["apex-dev"]
parallel_execution: false
dependencies: ["FA-019"]

deliverables:
  - Atualização do layout principal (App.tsx ou similar)

implementation:
  action: "ADD ChatWidget to authenticated routes"
  notes:
    - "Widget só aparece para usuários autenticados"
    - "Usar Clerk's useUser() para obter userId"
    - "Posicionar fixed bottom-right"

quality_gates:
  - "Widget aparece apenas logado"
  - "userId é passado corretamente"
```

---

### 📦 PHASE 5: Testing & Documentation (Tasks 22-24)

#### Task 22: Create Agent Scenario Tests

```yaml
task_id: "FA-022"
title: "Criar testes de cenário para o agente (better-agents pattern)"
complexity: "L5"
estimated_duration: "60 minutes"
assigned_droids: ["apex-dev", "code-reviewer"]
parallel_execution: true
dependencies: ["FA-016"]

deliverables:
  - tests/scenarios/financial-agent/balance-query.test.ts
  - tests/scenarios/financial-agent/spending-analysis.test.ts
  - tests/scenarios/financial-agent/budget-alerts.test.ts

implementation:
  pattern: "better-agents scenario simulation"
  test_cases:
    - name: "balance-query"
      description: "Usuário pergunta sobre saldo e agente responde com dados corretos"
      script:
        - user: "Qual meu saldo?"
        - assert: "response contains balance value"
        - assert: "tool get_account_balances was called"
    - name: "spending-analysis"
      description: "Usuário pergunta onde está gastando mais"
      script:
        - user: "Onde estou gastando mais?"
        - assert: "response contains category breakdown"
        - assert: "tool get_spending_by_category was called"
    - name: "proactive-alert"
      description: "Agente menciona alerta de orçamento proativamente"
      context: "user has budget alert"
      script:
        - user: "Como estou financeiramente?"
        - assert: "response mentions budget alert"

quality_gates:
  - "Todos os cenários passam"
  - "Coverage de tools ≥90%"
```

#### Task 23: Create Tool Unit Tests

```yaml
task_id: "FA-023"
title: "Criar testes unitários para cada tool"
complexity: "L4"
estimated_duration: "45 minutes"
assigned_droids: ["apex-dev"]
parallel_execution: true
dependencies: ["FA-008", "FA-009", "FA-010", "FA-011", "FA-012", "FA-013", "FA-014"]

deliverables:
  - src/features/ai-chat/agent/tools/handlers/__tests__/

implementation:
  test_coverage:
    - "Input validation (Zod)"
    - "Query correctness"
    - "Error handling"
    - "Edge cases (empty data, null values)"

quality_gates:
  - "Coverage ≥90%"
  - "Todos os testes passam"
```

#### Task 24: Write Documentation

```yaml
task_id: "FA-024"
title: "Documentar o Financial Agent"
complexity: "L3"
estimated_duration: "30 minutes"
assigned_droids: ["product-architect"]
parallel_execution: true
dependencies: ["FA-016", "FA-019"]

deliverables:
  - docs/features/financial-agent.md
  - Atualização de src/features/ai-chat/README.md

implementation:
  sections:
    - "Visão Geral"
    - "Arquitetura"
    - "Tools Disponíveis"
    - "Configuração"
    - "Exemplos de Uso"
    - "Troubleshooting"

quality_gates:
  - "Documentação completa"
  - "Exemplos funcionam"
```

---

## 🔄 Execution Workflow

```yaml
parallel_execution_plan:
  
  wave_1: # ~1 hour
    tasks: ["FA-001", "FA-002", "FA-003", "FA-004"]
    blocking: false
    
  wave_2: # ~1.5 hours (after wave_1)
    tasks: ["FA-005", "FA-006", "FA-007"]
    blocking: true
    
  wave_3: # ~2 hours (parallel after wave_2)
    tasks: ["FA-008", "FA-009", "FA-010", "FA-011", "FA-012", "FA-013", "FA-014"]
    blocking: false
    
  wave_4: # ~1.5 hours (sequential after wave_3)
    tasks: ["FA-015", "FA-016", "FA-017", "FA-018"]
    blocking: true
    
  wave_5: # ~1 hour (sequential after wave_4)
    tasks: ["FA-019", "FA-020", "FA-021"]
    blocking: true
    
  wave_6: # ~2 hours (parallel after wave_5)
    tasks: ["FA-022", "FA-023", "FA-024"]
    blocking: false
```

---

## ✅ Quality Gates Summary

```yaml
code_quality:
  - TypeScript strict mode: PASS
  - Biome lint: 0 errors
  - Test coverage: ≥90%
  
performance:
  - TTFB: ≤150ms (P95)
  - Tool execution: ≤500ms each
  - Context build: ≤500ms
  
security:
  - Auth middleware: ALL routes
  - Input validation: Zod on ALL tools
  - LGPD: Audit logs for data access
  
accessibility:
  - WCAG 2.1 AA+: PASS
  - Lighthouse: ≥90
  - Screen reader: Compatible

brazilian_compliance:
  - Português: Natural, sem erros
  - Formatação: R$, DD/MM/AAAA
  - LGPD: Consentimento e exclusão
```

---

## 🚀 Post-Implementation Checklist

```yaml
before_merge:
  - [ ] Todos os 24 tasks completos
  - [ ] Testes passando (unit + scenario)
  - [ ] Code review aprovado
  - [ ] Performance benchmarks OK
  - [ ] Documentação atualizada

deployment:
  - [ ] Feature flag configurada
  - [ ] Rollout gradual (10% → 50% → 100%)
  - [ ] Monitoring dashboards
  - [ ] Alertas de erro configurados

post_launch:
  - [ ] Coletar feedback de usuários
  - [ ] Analisar métricas de uso
  - [ ] Iterar baseado em dados
```

---

**Remember**: O melhor prompt para Claude 4 é aquele que é EXPLÍCITO, fornece MOTIVAÇÃO, usa exemplos ALINHADOS, e especifica claramente se você quer AÇÃO ou SUGESTÃO.

Este documento é um prompt para IMPLEMENTAÇÃO ATIVA. Execute as tasks em ordem, paralelizando onde indicado.

# 🎯 MASTER PROMPT — Integração Slack & Linear no GPUS

```yaml
VERSION: "5.0-PRP"
METHODOLOGY: "PRP (Product Requirement Prompt) + ACE (Agentic Context Engineering)"
STRATEGY: "One-Shot Success Through Comprehensive Context"
PHILOSOPHY: "O objetivo é o sucesso da implementação em uma única passagem através de um contexto abrangente."
```

---

## 📊 SELEÇÃO DE TEMPLATE POR COMPLEXIDADE

| Level | Indicators | Template | Thinking Budget | Research Depth |
|---|---|---|---|---|
| **L5** | Feature, multi-file, API integration | Standard PRP | 16K tokens | Moderate (docs + repo) |

---

## 🔬 O FLUXO DE TRABALHO R.P.I.V (Pesquisa → Planejamento → Implementação → Validação)

Este documento serve como um **Product Requirement Prompt (PRP)** completo. As fases de Pesquisa e Análise do Projeto já foram concluídas e estão consolidadas neste prompt. O agente deve focar nas fases de **Planejamento, Implementação e Validação**.

---

## 🎯 TEMPLATE ONE-SHOT (YAML-Structured)

```yaml
# ═══════════════════════════════════════════════════════════════════════════════
# ONE-SHOT PRP TEMPLATE v5.0
# Objetivo: Sucesso na implementação em uma única passagem através de um contexto abrangente
# ═══════════════════════════════════════════════════════════════════════════════

metadata:
  complexity: "L5 — Integração de duas APIs de terceiros (Slack, Linear) no backend Convex existente, exigindo modificações no schema, novas ações/mutações e possivelmente novos componentes de UI para gerenciamento."
  estimated_time: "8 horas"
  parallel_safe: false

# ─────────────────────────────────────────────────────────────────────────────
# SEÇÃO 1: PAPEL & OBJETIVO
# ─────────────────────────────────────────────────────────────────────────────
role: "Especialista em Integrações Full-Stack"
expertise_areas:
  - "Convex (TypeScript)"
  - "React & TypeScript"
  - "API do Slack (OAuth, Web API, Block Kit)"
  - "API GraphQL do Linear"
  - "Integração de sistemas de terceiros"

objective:
  task: "Integrar as plataformas Slack e Linear ao sistema GPUS para automatizar notificações, otimizar a comunicação da equipe e centralizar o gerenciamento de tarefas internas, resultando em um fluxo de trabalho mais eficiente e responsivo."
  context: "O GPUS é um CRM educacional para o Grupo US, construído em uma stack moderna (React, Convex, Clerk). A integração visa conectar os eventos do CRM (novos leads, pagamentos) e as necessidades de gerenciamento de projetos (bugs, features) a ferramentas que a equipe já utiliza."

# ─────────────────────────────────────────────────────────────────────────────
# SEÇÃO 2: CONTEXTO & ESCOPO
# ─────────────────────────────────────────────────────────────────────────────
project_context:
  name: "GPUS - Gestão de Processos da US"
  description: "Um sistema de CRM e gestão de alunos para o Grupo US, focado em otimizar o pipeline de vendas, o acompanhamento de alunos e a gestão financeira."
  tech_stack:
    - Frontend: "React 19, TypeScript, Vite, TailwindCSS, shadcn/ui, Radix UI"
    - Backend: "Convex (Serverless Database & Functions)"
    - Auth: "Clerk"
    - Routing: "TanStack Router"
    - State Management: "TanStack Query"
    - Jobs: "Inngest"

scope:
  integrations:
    - name: "Slack"
      goal: "Enviar notificações em tempo real para canais específicos baseadas em eventos críticos do GPUS."
      features:
        - "Notificação de 'Novo Lead Criado' no canal #leads."
        - "Notificação de 'Pagamento Recebido' no canal #financeiro."
        - "Notificação de 'Pagamento Atrasado' no canal #financeiro."
        - "Comando '/gpus-lead [nome]' para buscar informações básicas de um lead."

    - name: "Linear"
      goal: "Criar e gerenciar tarefas de desenvolvimento e suporte diretamente a partir de eventos no GPUS."
      features:
        - "Criar uma 'Issue' no Linear a partir de um formulário de 'Reportar Bug' no painel de administração do GPUS."
        - "Quando uma 'Atividade' do tipo 'Suporte Técnico' for registrada para um aluno, criar uma 'Issue' no projeto 'Suporte' do Linear."

# ─────────────────────────────────────────────────────────────────────────────
# SEÇÃO 3: PESQUISA & DESCOBERTAS (FASE 0 CONCLUÍDA)
# ─────────────────────────────────────────────────────────────────────────────
research_summary:
  slack:
    api_type: "RESTful (Web API) e WebSockets (Events API)"
    auth: "OAuth 2.0"
    key_features: "Canais, Mensagens, Block Kit para UI, Slash Commands, Workflows."
    client: "Recomendado usar o SDK oficial `@slack/web-api` e `@slack/bolt`."
    documentation: "https://api.slack.com"

  linear:
    api_type: "GraphQL"
    auth: "OAuth 2.0 ou Personal API Keys"
    key_features: "Issues, Projects, Cycles, Teams, Labels, Webhooks."
    client: "Recomendado usar o SDK oficial `@linear/sdk` ou um cliente GraphQL como 'graphql-request'."
    documentation: "https://developers.linear.app"

  gpus_analysis:
    repo_path: "/home/ubuntu/gpus"
    backend_entry: "/home/ubuntu/gpus/convex/"
    schema_file: "/home/ubuntu/gpus/convex/schema.ts"
    http_handler: "/home/ubuntu/gpus/convex/http.ts" # Ponto de entrada para webhooks
    key_entities:
      - "leads: Armazena informações de potenciais clientes."
      - "students: Armazena informações de clientes convertidos."
      - "asaasPayments: Tabela de pagamentos da integração Asaas."
      - "activities: Registro de interações com leads/alunos."
      - "users: Usuários internos do sistema."

# ─────────────────────────────────────────────────────────────────────────────
# SEÇÃO 4: ARQUITETURA & PLANO (FASE 1)
# ─────────────────────────────────────────────────────────────────────────────
architecture_proposal:
  title: "Arquitetura de Integração via Convex Actions & HTTP Actions"
  diagram: |
    GPUS Frontend ---> Convex Mutations ---> Convex Actions ---> Slack/Linear API
                                         ^
                                         |
    Slack/Linear Webhooks ---> Convex HTTP Actions ---> Convex Mutations

  components:
    - name: "convex/integrations/slack.ts"
      description: "Nova action para encapsular a lógica de comunicação com a API do Slack (enviar mensagens)."
    - name: "convex/integrations/linear.ts"
      description: "Nova action para encapsular a lógica de comunicação com a API do Linear (criar issues)."
    - name: "convex/http.ts"
      description: "Modificar para adicionar novos endpoints de webhook para Slack (slash commands) e Linear (updates de issues)."
    - name: "convex/schema.ts"
      description: "Adicionar novas tabelas para armazenar configurações de integração (tokens, webhooks) e logs."
    - name: "src/components/admin/integrations/"
      description: "Novos componentes React para gerenciar a conexão com Slack e Linear (autenticação OAuth)."

  data_model_changes:
    - table: "integrations"
      fields:
        - "service: 'slack' | 'linear'"
        - "organizationId: string"
        - "accessToken: string (criptografado)"
        - "refreshToken: string (criptografado)"
        - "expiresAt: number"
        - "scopes: string[]"
        - "status: 'active' | 'revoked'"

implementation_plan:
  phase_1_foundation:
    title: "Estrutura Base e Autenticação"
    tasks:
      - id: "AT-001"
        title: "Modificar schema.ts para adicionar a tabela 'integrations'"
        validation: "Schema atualizado e `npx convex dev` roda sem erros."
      - id: "AT-002"
        title: "Criar UI em `src/components/admin/integrations/` para o fluxo OAuth do Slack"
        validation: "Página de configurações exibe um botão 'Conectar ao Slack'."
      - id: "AT-003"
        title: "Criar endpoints em `http.ts` para o callback OAuth do Slack"
        validation: "Após autorização no Slack, o token é salvo na tabela 'integrations'."
      - id: "AT-004"
        title: "Repetir AT-002 e AT-003 para o Linear"
        validation: "Conexão com Linear pode ser estabelecida e token salvo."

  phase_2_slack_notifications:
    title: "Implementação das Notificações do Slack"
    dependencies: ["phase_1_foundation"]
    tasks:
      - id: "AT-005"
        title: "Criar action `sendMessageToSlack` em `convex/integrations/slack.ts`"
        validation: "Action consegue enviar uma mensagem de teste para um canal hardcoded."
      - id: "AT-006"
        title: "Modificar a mutation que cria leads para chamar a action `sendMessageToSlack`"
        file_to_edit: "convex/leads.ts"
        validation: "Ao criar um novo lead no GPUS, uma notificação aparece no canal #leads."
      - id: "AT-007"
        title: "Modificar o webhook do Asaas para notificar sobre pagamentos recebidos/atrasados"
        file_to_edit: "convex/asaas/webhooks.ts"
        validation: "Simulando um webhook de pagamento, a notificação correta é enviada ao #financeiro."

  phase_3_slack_commands:
    title: "Implementação de Slash Commands do Slack"
    dependencies: ["phase_2_slack_notifications"]
    tasks:
      - id: "AT-008"
        title: "Adicionar um endpoint em `http.ts` para receber o slash command '/gpus-lead'"
        validation: "Endpoint recebe e loga o payload do comando."
      - id: "AT-009"
        title: "Implementar a lógica para buscar o lead no Convex e retornar a informação para o Slack"
        validation: "Executar '/gpus-lead Teste' no Slack retorna os dados do lead 'Teste' ou uma mensagem de 'não encontrado'."

  phase_4_linear_integration:
    title: "Implementação da Criação de Issues no Linear"
    dependencies: ["phase_1_foundation"]
    tasks:
      - id: "AT-010"
        title: "Criar action `createLinearIssue` em `convex/integrations/linear.ts`"
        validation: "Action consegue criar uma issue de teste em um projeto hardcoded no Linear."
      - id: "AT-011"
        title: "Criar um formulário 'Reportar Bug' no painel de admin que chama uma mutation para criar a issue no Linear"
        validation: "Submeter o formulário de bug no GPUS cria uma issue no projeto 'Bugs' do Linear."
      - id: "AT-012"
        title: "Modificar a mutation que cria 'activities' para, se o tipo for 'Suporte Técnico', criar uma issue no Linear"
        file_to_edit: "convex/activities.ts"
        validation: "Registrar uma atividade de suporte para um aluno cria uma issue no projeto 'Suporte' do Linear com os detalhes do aluno."

# ─────────────────────────────────────────────────────────────────────────────
# SEÇÃO 5: DIRETRIZES DE IMPLEMENTAÇÃO (FASE 2)
# ─────────────────────────────────────────────────────────────────────────────
implementation_guidelines:
  general:
    - "Siga estritamente os padrões de código existentes no repositório GPUS."
    - "Use as variáveis de ambiente do Convex para armazenar segredos (Client ID, Client Secret). NÃO comite segredos no código."
    - "Toda a lógica de comunicação com APIs externas DEVE residir em `convex/actions` para evitar timeouts e lidar com tarefas de longa duração."
    - "Criptografe tokens e dados sensíveis antes de salvá-los no banco de dados."

  slack_specific:
    - "Use o Block Kit para formatar as mensagens de notificação, incluindo links diretos para o lead ou aluno no GPUS."
    - "Para o slash command, forneça uma resposta imediata para o Slack (`ack()`) e use a `response_url` para enviar a resposta completa de forma assíncrona."

  linear_specific:
    - "Use o SDK do Linear para uma experiência de desenvolvimento tipada."
    - "Associe as issues criadas no Linear à entidade correspondente no GPUS (lead, student) usando um link no corpo da issue."

# ─────────────────────────────────────────────────────────────────────────────
# SEÇÃO 6: VALIDAÇÃO & QUALIDADE (FASE 3)
# ─────────────────────────────────────────────────────────────────────────────
validation_protocol:
  quality_gates:
    - "Linting: `bun run lint` deve passar sem erros."
    - "Type Checking: `bun run build` (que inclui `tsc --noEmit`) deve passar sem erros."
    - "Testes: `bun run test` deve passar."

  testing_scenarios:
    - "Crie um novo lead e verifique se a notificação no Slack é enviada para o canal #leads com o formato correto."
    - "Simule um webhook de pagamento do Asaas (RECEIVED) e verifique a notificação no canal #financeiro."
    - "Use o comando /gpus-lead com um nome de lead existente e um inexistente e valide as respostas."
    - "Submeta um bug pelo novo formulário de admin e confirme que a issue foi criada no projeto correto do Linear."
    - "Crie uma atividade de suporte para um aluno e verifique se a issue correspondente foi criada no Linear, com o link para o aluno."
    - "Revogue o acesso de uma das integrações e verifique se o sistema lida com o erro graciosamente."

rollback_plan:
  - "Todas as mudanças no Convex devem ser feitas em arquivos separados ou de forma que possam ser facilmente revertidas via Git."
  - "Use feature flags (armazenadas em `settings` no Convex) para habilitar/desabilitar as integrações em produção sem a necessidade de um novo deploy."

```

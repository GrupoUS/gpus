# Plano de Execução Atualizado: CEO Virtual Grupo US

**Autor:** Manus AI  
**Data:** 17 de Janeiro de 2026  
**Projeto:** Plataforma CEO Virtual do Grupo US

---

## Sumário Executivo

Após uma análise detalhada do repositório `GrupoUS/gpus`, este documento apresenta um plano de execução atualizado e sequenciado. O projeto já possui uma base robusta com Convex, React e diversas funcionalidades implementadas. O plano a seguir foca em implementar as funcionalidades **pendentes** do arquivo `todo.pdf`, priorizando as de maior impacto para o fluxo de vendas.

As tarefas estão organizadas em Sprints, com prompts específicos para o Claude Code que levam em consideração a estrutura de código existente, visando modificar e adicionar funcionalidades de forma incremental.

---

## Sprint 1: Tags, Objeções e Filtros Avançados (Alta Prioridade)

**Objetivo:** Implementar o sistema de tags para permitir uma segmentação e filtragem mais rica dos leads, além de estruturar o registro de objeções.

### **Tarefa 1.1: Implementar Sistema de Tags (Backend)**

**Contexto:** A funcionalidade mais solicitada é a capacidade de filtrar e organizar leads por tags. O schema atual não possui uma tabela para `tags` ou a relação many-to-many com `leads`.

> **Prompt para Claude Code:**
> 
> "Modifique o arquivo `convex/schema.ts`. Crie uma nova tabela `tags` com os campos `name` (v.string()) e `color` (v.optional(v.string())). Em seguida, crie uma tabela de junção `leadTags` com os campos `leadId` (v.id(\'leads\')) e `tagId` (v.id(\'tags\')). Adicione os índices apropriados para as novas tabelas. Não é necessário criar um arquivo de relações, a junção será feita manualmente por enquanto."

### **Tarefa 1.2: Adicionar Tags na Interface do Lead (Frontend)**

**Contexto:** Com o backend pronto, precisamos de uma interface para que os vendedores possam adicionar, visualizar e remover tags de um lead.

> **Prompt para Claude Code:**
> 
> "Modifique o componente `src/components/crm/lead-detail.tsx`. Abaixo das informações do lead, adicione uma nova seção para exibir as tags associadas. Crie um componente de input que permita buscar e adicionar novas tags (usando `Autocomplete` ou similar do Shadcn/UI). As tags de um lead devem ser exibidas como badges coloridas. Crie as mutações Convex necessárias em `convex/leads.ts` para adicionar e remover uma tag de um lead."

### **Tarefa 1.3: Implementar Filtro por Tags**

**Contexto:** A principal razão para ter tags é poder filtrar a lista de leads.

> **Prompt para Claude Code:**
> 
> "Modifique o componente `src/components/crm/lead-filters.tsx`. Adicione uma nova seção de filtro para 'Tags'. Este filtro deve buscar todas as tags disponíveis na nova tabela `tags` e permitir que o usuário selecione múltiplas tags (usando checkboxes). A query principal que busca os leads deve ser atualizada para filtrar os leads que possuem **qualquer uma** das tags selecionadas."

### **Tarefa 1.4: Estruturar e Exibir Objeções**

**Contexto:** A equipe de vendas precisa registrar as objeções dos clientes de forma estruturada.

> **Prompt para Claude Code:**
> 
> "Modifique a tabela `leads` no arquivo `convex/schema.ts`. Adicione um novo campo opcional chamado `objections` do tipo `v.array(v.string())`. Em seguida, no componente `src/components/crm/lead-detail.tsx`, crie uma nova aba ou seção chamada 'Objeções', onde o vendedor possa adicionar e visualizar uma lista de objeções para aquele lead."

---

## Sprint 2: Dashboards, Pipelines e Indicações (Alta/Média Prioridade)

**Objetivo:** Personalizar a visualização de dados para os vendedores e implementar o sistema de indicações.

### **Tarefa 2.1: Dashboard Individual por Vendedor**

**Contexto:** O dashboard atual exibe métricas globais. É necessário criar uma visão individual para que cada vendedor acompanhe sua performance.

> **Prompt para Claude Code:**
> 
> "Modifique a query `getDashboard` em `convex/metrics.ts`. Adicione um argumento opcional `userId: v.optional(v.id(\'users\'))`. Se o `userId` for fornecido, filtre todas as métricas (totalLeads, conversionRate, revenue) para retornar apenas os dados daquele vendedor. No frontend, em `src/routes/_authenticated/dashboard.tsx`, adicione um `Select` ou `Dropdown` para permitir que um admin filtre o dashboard por vendedor. Se o usuário logado for um vendedor, o dashboard deve carregar automaticamente seus dados."

### **Tarefa 2.2: Visualização de Pipeline por Produto**

**Contexto:** O `todo.pdf` pede para separar os pipelines por produto, facilitando a gestão.

> **Prompt para Claude Code:**
> 
> "Crie uma nova rota em `src/routes/_authenticated/pipelines.tsx`. Nesta página, use o componente `<Tabs>` do Shadcn/UI para criar abas para cada produto principal ('OTB 2025', 'NEON', 'TRINTAE3'). Dentro de cada aba, renderize o componente `PipelineKanban` já existente, passando para ele uma lista de leads filtrada apenas para aquele produto. A query em `convex/leads.ts` deve ser ajustada para aceitar um filtro por `interestedProduct`."

### **Tarefa 2.3: Implementar Sistema de Indicações**

**Contexto:** Rastrear indicações e o cashback associado é um requisito importante.

> **Prompt para Claude Code:**
> 
> "1. Modifique a tabela `leads` em `convex/schema.ts` para adicionar dois novos campos opcionais: `referredById` (v.optional(v.id(\'leads\'))) e `cashbackEarned` (v.optional(v.number())).
> 2. No componente `src/components/crm/lead-form.tsx`, adicione um campo de busca para selecionar o lead que fez a indicação.
> 3. Crie uma mutação em `convex/leads.ts` que, ao mudar o `stage` de um lead para 'fechado_ganho', verifique se ele foi indicado e, em caso afirmativo, atualize o campo `cashbackEarned` do lead indicador."

---

## Sprint 3: Automação e Comunicação (Média Prioridade)

**Objetivo:** Automatizar tarefas repetitivas e habilitar a comunicação ativa via WhatsApp.

### **Tarefa 3.1: Ativar Envio de Mensagens WhatsApp via Evolution API**

**Contexto:** A configuração da Evolution API existe, mas a funcionalidade de envio de mensagens não está implementada ativamente na interface.

> **Prompt para Claude Code:**
> 
> "Crie uma nova mutação em `convex/messages.ts` chamada `sendWhatsAppMessage`. Esta mutação deve receber `leadId` e `messageText`. Dentro dela, busque as credenciais da Evolution API salvas nas configurações (`integrations`). Use `fetch` para fazer uma requisição POST para o endpoint de envio de mensagem da Evolution API. No componente `src/components/crm/lead-detail.tsx`, adicione um botão 'Enviar WhatsApp' que abra um diálogo para digitar a mensagem e chamar essa nova mutação."

### **Tarefa 3.2: Automação de Reativação de Leads**

**Contexto:** Reativar leads que ficaram parados no funil por muito tempo.

> **Prompt para Claude Code:**
> 
> "Modifique o arquivo `convex/crons.ts`. Adicione um novo cron job chamado `reactivateIdleLeads`. Configure-o para rodar uma vez por dia. A lógica do cron deve buscar por leads cujo `stage` seja 'primeiro_contato' ou 'qualificado' e cujo `updatedAt` seja mais antigo que 7 dias. Para cada lead encontrado, a automação deve atualizar seu `stage` para 'novo' e adicionar uma atividade na timeline do lead informando a reativação automática."

### **Tarefa 3.3: Lembretes e Menções em Atividades**

**Contexto:** Melhorar a colaboração e o acompanhamento de tarefas.

> **Prompt para Claude Code:**
> 
> "1. Modifique a tabela `activities` em `convex/schema.ts` para incluir os campos opcionais `dueDate` (v.optional(v.number())) e `mentionedUserIds` (v.optional(v.array(v.id(\'users\')))).
> 2. Na interface de criação de atividade, adicione um `DatePicker` para o `dueDate` e um campo de busca de usuários para as menções.
> 3. Crie um novo cron job em `convex/crons.ts` que verifique diariamente as atividades com `dueDate` para o dia atual e crie uma notificação na tabela `notifications` para o `userId` responsável pela atividade e para os `mentionedUserIds`."

---

## Sprint 4: Customização e Melhorias Finais (Baixa Prioridade)

**Objetivo:** Adicionar flexibilidade ao CRM, permitindo que os administradores customizem campos e colunas.

### **Tarefa 4.1: Implementar Campos Customizáveis**

**Contexto:** Permitir que a equipe adicione campos específicos para suas necessidades sem alterar o código.

> **Prompt para Claude Code:**
> 
> "Crie um sistema de campos customizáveis. Para isso, crie duas novas tabelas em `convex/schema.ts`:
> 1.  `customFields`: com os campos `name` (string), `type` ('text', 'number', 'date'), `entity` ('lead', 'student').
> 2.  `customFieldValues`: com os campos `customFieldId` (FK), `entityId` (string), `value` (any).
> Crie uma nova página de configuração no admin onde seja possível criar e gerenciar os `customFields`. Em seguida, modifique o `lead-form.tsx` para buscar e renderizar dinamicamente os inputs para os campos customizáveis definidos para a entidade 'lead'."

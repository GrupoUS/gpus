# Mapeamento de Funcionalidades: Implementadas vs. Pendentes

## Análise do Repositório GrupoUS/gpus

O projeto já possui uma base sólida com Convex como backend, React + TanStack Router no frontend, e diversas integrações configuradas.

---

## Funcionalidades Já Implementadas

| Categoria | Funcionalidade | Status | Arquivos Relevantes |
| :--- | :--- | :--- | :--- |
| **CRM Core** | CRUD de Leads | ✅ Completo | `convex/leads.ts`, `src/components/crm/` |
| **CRM Core** | Pipeline Kanban com Drag & Drop | ✅ Completo | `src/components/crm/pipeline-kanban.tsx` |
| **CRM Core** | Filtros por Estágio, Temperatura, Produto, Origem | ✅ Completo | `src/components/crm/lead-filters.tsx` |
| **CRM Core** | Atribuição de Lead a Vendedor (assignedTo) | ✅ Completo | `convex/schema.ts` (leads.assignedTo) |
| **CRM Core** | Detalhes e Formulário de Lead | ✅ Completo | `lead-detail.tsx`, `lead-form.tsx` |
| **Atividades** | Sistema de Atividades/Timeline | ✅ Completo | `convex/activities.ts`, `convex/schema.ts` |
| **Dashboard** | Dashboard com KPIs (Leads, Conversão, Faturamento) | ✅ Completo | `src/routes/_authenticated/dashboard.tsx` |
| **Dashboard** | Gráficos (Funil, Leads por Produto, Performance) | ✅ Completo | `src/components/dashboard/` |
| **Dashboard** | Alertas de Churn | ✅ Completo | `src/components/dashboard/churn-alerts.tsx` |
| **Alunos** | CRUD de Alunos (Students) | ✅ Completo | `convex/students.ts`, `src/routes/_authenticated/students.tsx` |
| **Matrículas** | Sistema de Matrículas (Enrollments) | ✅ Completo | `convex/enrollments.ts` |
| **Financeiro** | Integração Asaas (Pagamentos, Webhooks) | ✅ Completo | `convex/asaas/`, `convex/lib/asaas.ts` |
| **Financeiro** | Métricas Financeiras | ✅ Completo | `convex/schema.ts` (financialMetrics) |
| **Marketing** | Marketing Leads (Captura Pública) | ✅ Completo | `convex/marketingLeads.ts` |
| **Marketing** | Integração Brevo (Email Marketing) | ✅ Completo | `convex/lib/brevo.ts`, `convex/emailMarketing.ts` |
| **Integrações** | Configuração de Integrações (Asaas, Evolution, Dify) | ✅ Completo | `convex/integrations.ts` |
| **Integrações** | Typebot Webhook (Captura de Leads) | ✅ Completo | `convex/lib/typebot.ts`, `convex/http.ts` |
| **LGPD** | Compliance LGPD (Consentimento, Audit, Retenção) | ✅ Completo | `convex/lgpd.ts`, `convex/lib/lgpdCompliance.ts` |
| **Chat** | Sistema de Conversas e Mensagens | ✅ Completo | `convex/conversations.ts`, `convex/messages.ts` |
| **Templates** | Templates de Mensagem | ✅ Completo | `convex/messageTemplates.ts` |
| **Notificações** | Sistema de Notificações | ✅ Completo | `convex/notifications.ts` |
| **Multi-tenant** | Suporte a Organizações | ✅ Completo | `organizationId` em todas as tabelas |
| **Autenticação** | Clerk Auth com Roles | ✅ Completo | `convex/lib/auth.ts` |

---

## Funcionalidades Pendentes (do TODO)

| Categoria | Funcionalidade do TODO | Status | Prioridade | Observação |
| :--- | :--- | :--- | :--- | :--- |
| **Tags** | Filtrar por tags | ❌ Pendente | Alta | Não existe tabela de tags no schema |
| **Tags** | Criar tags específicas para cada lead ou aluno | ❌ Pendente | Alta | Precisa criar tabela `tags` e `leads_to_tags` |
| **Tags** | Criar tags dos alunos para mostrar no CRM | ❌ Pendente | Alta | Mesmo sistema de tags |
| **Tags** | Tag do lead para separar qual comercial está conversando | ⚠️ Parcial | Média | Existe `assignedTo`, mas não é tag visual |
| **Filtros** | Filtro mais avançado por objeções e interesses | ⚠️ Parcial | Média | Filtros existem, mas não por objeções |
| **Objeções** | Aba de objeções para editar no CRM do lead | ❌ Pendente | Alta | Não existe campo estruturado de objeções |
| **Indicações** | Aba de indicação (quem indicou/foi indicado) | ❌ Pendente | Média | Não existe campo `referredById` |
| **Indicações** | Contabilizar cashback | ❌ Pendente | Média | Não existe campo `cashbackEarned` |
| **Dashboard** | Dashboard individual por vendedor | ⚠️ Parcial | Alta | Dashboard existe, mas é geral, não por vendedor |
| **Pipeline** | Separar pipeline por vendedor comercial | ⚠️ Parcial | Alta | Existe `assignedTo`, mas sem visualização separada |
| **Pipeline** | Transferir lead para outro vendedor | ⚠️ Parcial | Média | Possível via edição, mas sem UI dedicada |
| **Pipeline** | Editar lead após criação | ✅ Existe | - | Já implementado |
| **Pipeline** | Separar pipelines por produtos | ⚠️ Parcial | Alta | Leads têm `interestedProduct`, mas sem visualização separada |
| **Pipeline** | Movimentar leads por produtos | ⚠️ Parcial | Média | Possível via edição |
| **Automação** | Reativar leads por tempo | ❌ Pendente | Média | Não existe cron job de reativação |
| **WhatsApp** | Integrar WhatsApp API | ⚠️ Parcial | Alta | Evolution API configurável, mas sem envio ativo |
| **CRM** | Criar novas colunas no CRM | ❌ Pendente | Baixa | Não existe sistema de campos customizáveis |
| **CRM** | Campos adicionais | ❌ Pendente | Baixa | Idem |
| **Meta** | Integração com Meta e Type | ⚠️ Parcial | Média | Typebot existe, Meta não |
| **Atividades** | Aba de atividades nos leads | ✅ Existe | - | `convex/activities.ts` já implementado |
| **Atividades** | Lembrete para comercial executar atividade | ❌ Pendente | Média | Não existe sistema de lembretes |
| **Atividades** | Marcar outras pessoas nas atividades | ❌ Pendente | Média | Não existe campo `mentionedUserIds` |

---

## Resumo de Prioridades

### Alta Prioridade (Impacto Direto no Fluxo de Vendas)
1. **Sistema de Tags** - Criar tabela e UI para tags em leads/alunos
2. **Aba de Objeções** - Estruturar objeções no lead
3. **Dashboard por Vendedor** - Filtrar métricas por vendedor logado
4. **Pipeline por Produto** - Visualização separada por produto
5. **WhatsApp Ativo** - Envio de mensagens via Evolution API

### Média Prioridade (Melhorias de Produtividade)
1. **Sistema de Indicações** - Rastrear indicações e cashback
2. **Automação de Reativação** - Cron job para leads inativos
3. **Lembretes de Atividades** - Notificações para follow-up
4. **Menções em Atividades** - Colaboração entre vendedores
5. **Integração Meta** - Captura de leads do Facebook

### Baixa Prioridade (Nice-to-Have)
1. **Campos Customizáveis** - Sistema de campos dinâmicos
2. **Colunas Customizáveis** - Personalização da visualização

# PRD: Portal Grupo US
## Product Requirements Document v2.0

**Produto:** Portal de Gerenciamento Grupo US  
**Data:** Dezembro 2025  
**Status:** Final Draft  
**Owner:** Maurício (Grupo US)  
**Versão:** 2.0 — Aprimorado com insights estratégicos

---

## 📋 Sumário Executivo

### Visão do Produto
Criar uma plataforma unificada de gerenciamento para o Grupo US que centralize CRM, gestão de alunos, atendimento via chat (SDR + IA), e suporte ao cliente — tudo integrado com a stack moderna React + Convex + TanStack Router + shadcn/ui + Clerk. A plataforma deve incorporar a narrativa de transformação do "Profissional Abandonado" em "Empresário da Saúde Estética".

### Contexto do Negócio (Diagnóstico Estratégico)

| Métrica | Valor Atual |
|---------|-------------|
| Faturamento Médio Mensal | ~R$ 250.000/mês |
| Ticket Médio TRINTAE3 | ~R$ 18.000 (12x) |
| Mix de Receita | TRINTAE3 50% / NEON 35% / OTB 10% / Outros 5% |
| Investimento Tráfego | R$ 5.000 - R$ 10.000/mês |
| Modelo de Vendas | Perpétuo (não usa lançamentos clássicos) |

### Problema
O Grupo US opera múltiplos produtos educacionais (TRINTAE3, OTB, Black NEON, Comunidade US, Aurículo, Na Mesa Certa) mas carece de:
- CRM centralizado com pipeline visual para SDRs
- Visão unificada dos dados de alunos e seu progresso
- Interface de chat para atendimento com IA + handoff humano
- Dashboard de métricas em tempo real para decisão estratégica
- Integração com a "Virada Estética em 6 Meses" (conceito de vendas)

### Solução
Portal web responsivo com:
1. **CRM** — Pipeline visual com chat integrado, seguindo o script de vendas do Grupo US
2. **Gestão de Alunos** — Base de dados unificada com histórico e indicadores de churn
3. **Central de Atendimento** — Chat com IA (Dify) treinada na narrativa do Grupo US
4. **Dashboard** — Métricas em tempo real por produto e performance de time

---

## 🎯 Objetivos e Métricas de Sucesso

### Objetivos Primários

| Objetivo | Métrica | Meta | Prazo |
|----------|---------|------|-------|
| Aumentar conversão de leads | Taxa de conversão geral | +25% | 6 meses |
| Reduzir tempo de resposta | Tempo médio primeira resposta | < 5 minutos | 30 dias |
| Centralizar informações | Adoção do portal pelo time | 100% | 30 dias |
| Automatizar atendimento | % resolvido por IA | 40% das dúvidas | 3 meses |
| Aumentar ticket médio | Valor médio por venda | +15% | 6 meses |

### KPIs por Produto

| Produto | KPI Principal | Meta |
|---------|---------------|------|
| TRINTAE3 | Leads qualificados/mês | 50+ |
| Black NEON | Taxa de conversão | 20% |
| OTB | Leads qualificados/trimestre | 15+ |
| Comunidade US | Churn mensal | < 5% |

### KPIs de Processo

- **SLA de Atendimento:** 90% das mensagens respondidas em < 5 minutos
- **Taxa de Handoff IA→Humano:** < 60%
- **NPS Interno do Time:** > 70
- **Tempo de Onboarding SDR:** < 3 dias

---

## 👥 Personas de Usuário

### 1. SDR — "Lucas" (Sales Development Rep)
**Perfil:** Responsável por qualificar leads e fazer primeiro contato usando o script de vendas  

**Contexto:**
- Segue o conceito "Virada Estética em 6 Meses"
- Usa técnicas de diagnóstico (dor + desejo) antes de apresentar solução
- Trabalha com objeções mapeadas (preço, tempo, já fez outros cursos)

**Necessidades:**
- Ver pipeline de leads em Kanban visual
- Chat integrado com WhatsApp (Evolution API)
- Templates de mensagens alinhados ao script
- Acesso ao histórico e perfil completo do lead
- Notificações push de novos leads quentes
- Campos de qualificação: profissão, tem clínica?, interesse principal

**Frustrações:**
- Alternar entre múltiplas ferramentas
- Não saber o histórico de interações do lead
- Perder contexto de conversas iniciadas por IA

**Fluxo de Trabalho:**
```
Lead chega → Qualificação IA → Notifica SDR → Diagnóstico (dor+desejo) 
→ Apresenta solução → Trata objeções → Fecha ou agenda follow-up
```

### 2. Customer Success — "Marina"
**Perfil:** Acompanha alunos após matrícula, previne churn

**Contexto:**
- Foco em engajamento e conclusão dos programas
- Monitora sinais de risco (pagamento, ausência, reclamações)
- Identifica oportunidades de upsell (Comunidade → TRINTAE3 → NEON)

**Necessidades:**
- Visão 360° do aluno (produto, pagamentos, progresso)
- Alertas automáticos de risco de churn
- Histórico de interações e tickets
- Métricas de engajamento por turma
- Agenda de acompanhamento integrada

**Frustrações:**
- Informações espalhadas em planilhas
- Não identificar alunos em risco proativamente
- Retrabalho buscando dados em múltiplos sistemas

### 3. Suporte — "Fernanda"
**Perfil:** Resolve dúvidas técnicas e operacionais

**Necessidades:**
- Fila de atendimento organizada por SLA
- Base de conhecimento integrada (FAQ do Grupo US)
- Handoff transparente IA → humano
- Histórico completo do aluno no contexto da conversa
- Categorização de tickets por tipo

**Frustrações:**
- Perguntas repetitivas sem filtro de IA
- Falta de contexto nas conversas transferidas
- Sem priorização clara de tickets

### 4. Gestão — "Maurício" (Admin)
**Perfil:** Visão estratégica e tomada de decisão

**Necessidades:**
- Dashboard consolidado por produto e período
- Relatórios de performance do time (SDR, CS, Suporte)
- Funil visual por produto com taxas de conversão
- Alertas de anomalias (queda de leads, aumento de churn)
- Exportação de dados para análise externa

**Frustrações:**
- Dados desatualizados ou inconsistentes
- Gerar relatórios manualmente toda semana
- Falta de visão em tempo real do negócio

---

## 🎭 Tom de Voz e Narrativa (Integração com IA)

### Identidade do Agente IA

O agente de IA deve incorporar a cultura e narrativa do Grupo US:

```yaml
identidade:
  tom: [profissional, acolhedor, inspirador, firme]
  fala_como: "Nós" (representa o Grupo US)
  frases_chave:
    - "Nós iluminamos"
    - "Clareza é a nova gentileza"
    - "Olhar de dono"
    - "Excelência com entrega real"
  evitar: [robótico, frio, prolixo, condescendente]
```

### Narrativa Mestre — "O Profissional Abandonado"

A IA e os SDRs devem usar esta narrativa como base:

**ANTES (Dor):**
- Plantões, exaustão física e emocional
- Muito estudo, muita responsabilidade, pouca remuneração
- Vida no automático: hospital → casa → dormir → voltar
- Pensamento: "Não foi pra isso que estudei tanto"

**VIRADA:**
- Descoberta da Saúde Estética Avançada
- Decisão corajosa de investir na transformação
- Primeiro paciente de estética, primeira agenda cheia

**DEPOIS (Transformação):**
- Empresário da Saúde Estética
- Dona da própria agenda e clínica
- Segurança técnica + visão de negócios

### Framework LPEAD para Comunicação

Aplicar na comunicação com leads:

| Elemento | Aplicação |
|----------|-----------|
| **L**ocalização | "É 23h de uma terça-feira. Você está sozinha no consultório..." |
| **P**ensamentos | "Eu pensei: 'Estudei tanto... por que minha agenda está vazia?'" |
| **E**moções | "Suas mãos tremiam ao olhar o extrato bancário" |
| **A**ções | "Você fecha o notebook, respira fundo, e decide..." |
| **D**iálogo | "A Dra. Sacha olhou para mim e disse: 'Você é técnica excelente, mas seu negócio está te sabotando.'" |

---

## 🏗️ Arquitetura Técnica

### Stack Definida

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND                            │
│  React + Vite + TanStack Router + shadcn/ui + Tailwind │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    AUTENTICAÇÃO                         │
│                       Clerk                             │
│     (RBAC: admin, sdr, cs, support, ai_agent)          │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                      BACKEND                            │
│                       Convex                            │
│        (Database + API + Real-time + Functions)         │
└─────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Evolution     │ │   Dify (IA)     │ │    n8n          │
│   API           │ │   Agent         │ │   Automações    │
│   (WhatsApp)    │ │   RAG + Chat    │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Fluxo de Dados Detalhado

```
ENTRADA DE LEADS:
─────────────────
WhatsApp ──► Evolution API ──► Webhook n8n ──► Convex
Instagram ──► Meta API ───────► Webhook n8n ──► Convex
LP (Form) ──────────────────────────────────► Convex
                                                 │
                                   ┌─────────────┴─────────────┐
                                   ▼                           ▼
                              Dify (IA)                   CRM Portal
                              Resposta                    Notificação
                              Automática                  para SDR
                                   │                           │
                                   └─────────────┬─────────────┘
                                                 ▼
                                        LEAD QUALIFICADO
                                        (Pipeline CRM)

FLUXO DE HANDOFF IA → HUMANO:
────────────────────────────
Mensagem Cliente → Dify analisa intenção
    │
    ├─► Dúvida simples → Resposta automática
    │
    ├─► Interesse em produto → Coleta dados + Qualifica + Notifica SDR
    │
    ├─► Objeção detectada → Sugere resposta + Pode escalar
    │
    └─► Reclamação/Complexo → Transfere para humano imediatamente
```

### Deploy

| Componente | Plataforma |
|------------|------------|
| Frontend | Railway (containerizado) |
| Convex | Convex Cloud |
| Clerk | Clerk Cloud |
| Evolution API | VPS Hostinger (existente) |
| Dify | VPS Hostinger (existente) |
| n8n | VPS Hostinger (existente) |

---

## 📊 Modelo de Dados (Convex Schema)

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // ═══════════════════════════════════════════════════════
  // USUÁRIOS DO SISTEMA (Time interno)
  // ═══════════════════════════════════════════════════════
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.union(
      v.literal('admin'),
      v.literal('sdr'),
      v.literal('cs'),
      v.literal('support')
    ),
    avatar: v.optional(v.string()),
    isActive: v.boolean(),
    // Métricas de performance
    leadsAtribuidos: v.optional(v.number()),
    conversoes: v.optional(v.number()),
    tempoMedioResposta: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_clerk_id', ['clerkId'])
    .index('by_role', ['role'])
    .index('by_email', ['email']),

  // ═══════════════════════════════════════════════════════
  // LEADS (Potenciais clientes)
  // ═══════════════════════════════════════════════════════
  leads: defineTable({
    // Dados básicos
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.string(), // WhatsApp
    source: v.union(
      v.literal('whatsapp'),
      v.literal('instagram'),
      v.literal('landing_page'),
      v.literal('indicacao'),
      v.literal('evento'),
      v.literal('organico'),
      v.literal('trafego_pago'),
      v.literal('outro')
    ),
    sourceDetail: v.optional(v.string()), // Campanha específica / UTM
    
    // Qualificação (baseada no script de vendas)
    profession: v.optional(v.union(
      v.literal('enfermeiro'),
      v.literal('dentista'),
      v.literal('biomedico'),
      v.literal('farmaceutico'),
      v.literal('medico'),
      v.literal('esteticista'),
      v.literal('outro')
    )),
    hasClinic: v.optional(v.boolean()),
    clinicName: v.optional(v.string()),
    clinicCity: v.optional(v.string()),
    yearsInAesthetics: v.optional(v.number()),
    currentRevenue: v.optional(v.string()), // Faixa de faturamento
    
    // Interesse e dores (diagnóstico do script)
    interestedProduct: v.optional(v.union(
      v.literal('trintae3'),
      v.literal('otb'),
      v.literal('black_neon'),
      v.literal('comunidade'),
      v.literal('auriculo'),
      v.literal('na_mesa_certa'),
      v.literal('indefinido')
    )),
    mainPain: v.optional(v.union(
      v.literal('tecnica'),
      v.literal('vendas'),
      v.literal('gestao'),
      v.literal('posicionamento'),
      v.literal('escala'),
      v.literal('certificacao'),
      v.literal('outro')
    )),
    mainDesire: v.optional(v.string()),
    
    // Pipeline
    stage: v.union(
      v.literal('novo'),
      v.literal('primeiro_contato'),
      v.literal('qualificado'),
      v.literal('proposta'),
      v.literal('negociacao'),
      v.literal('fechado_ganho'),
      v.literal('fechado_perdido')
    ),
    lostReason: v.optional(v.union(
      v.literal('preco'),
      v.literal('tempo'),
      v.literal('concorrente'),
      v.literal('sem_resposta'),
      v.literal('nao_qualificado'),
      v.literal('outro')
    )),
    
    // Atribuição
    assignedTo: v.optional(v.id('users')), // SDR responsável
    
    // Scoring e prioridade
    temperature: v.union(
      v.literal('frio'),
      v.literal('morno'),
      v.literal('quente')
    ),
    score: v.optional(v.number()), // 0-100 calculado
    
    // Timestamps
    lastContactAt: v.optional(v.number()),
    nextFollowUpAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_phone', ['phone'])
    .index('by_stage', ['stage'])
    .index('by_assigned', ['assignedTo'])
    .index('by_product', ['interestedProduct'])
    .index('by_temperature', ['temperature'])
    .index('by_created', ['createdAt']),

  // ═══════════════════════════════════════════════════════
  // ALUNOS (Clientes convertidos)
  // ═══════════════════════════════════════════════════════
  students: defineTable({
    // Referência ao lead original
    leadId: v.optional(v.id('leads')),
    
    // Dados pessoais
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    cpf: v.optional(v.string()),
    
    // Dados profissionais
    profession: v.string(),
    professionalId: v.optional(v.string()), // COREN, CRO, etc
    hasClinic: v.boolean(),
    clinicName: v.optional(v.string()),
    clinicCity: v.optional(v.string()),
    
    // Status
    status: v.union(
      v.literal('ativo'),
      v.literal('inativo'),
      v.literal('pausado'),
      v.literal('formado')
    ),
    
    // Atribuição CS
    assignedCS: v.optional(v.id('users')),
    
    // Indicadores de risco
    churnRisk: v.union(
      v.literal('baixo'),
      v.literal('medio'),
      v.literal('alto')
    ),
    lastEngagementAt: v.optional(v.number()),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_email', ['email'])
    .index('by_phone', ['phone'])
    .index('by_status', ['status'])
    .index('by_cs', ['assignedCS'])
    .index('by_churn_risk', ['churnRisk']),

  // ═══════════════════════════════════════════════════════
  // MATRÍCULAS (Produtos adquiridos)
  // ═══════════════════════════════════════════════════════
  enrollments: defineTable({
    studentId: v.id('students'),
    product: v.union(
      v.literal('trintae3'),
      v.literal('otb'),
      v.literal('black_neon'),
      v.literal('comunidade'),
      v.literal('auriculo'),
      v.literal('na_mesa_certa')
    ),
    
    // Turma/Edição
    cohort: v.optional(v.string()), // Ex: "2025-T1", "Março-2025"
    
    // Status
    status: v.union(
      v.literal('ativo'),
      v.literal('concluido'),
      v.literal('cancelado'),
      v.literal('pausado'),
      v.literal('aguardando_inicio')
    ),
    
    // Datas
    startDate: v.optional(v.number()),
    expectedEndDate: v.optional(v.number()),
    actualEndDate: v.optional(v.number()),
    
    // Progresso
    progress: v.optional(v.number()), // 0-100
    modulesCompleted: v.optional(v.number()),
    totalModules: v.optional(v.number()),
    practicesCompleted: v.optional(v.number()), // Para TRINTAE3
    
    // Financeiro
    totalValue: v.number(),
    installments: v.number(),
    installmentValue: v.number(),
    paidInstallments: v.optional(v.number()),
    paymentStatus: v.union(
      v.literal('em_dia'),
      v.literal('atrasado'),
      v.literal('quitado'),
      v.literal('cancelado')
    ),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_student', ['studentId'])
    .index('by_product', ['product'])
    .index('by_status', ['status'])
    .index('by_payment', ['paymentStatus']),

  // ═══════════════════════════════════════════════════════
  // CONVERSAS (Chat)
  // ═══════════════════════════════════════════════════════
  conversations: defineTable({
    // Referências
    leadId: v.optional(v.id('leads')),
    studentId: v.optional(v.id('students')),
    
    // Canal
    channel: v.union(
      v.literal('whatsapp'),
      v.literal('instagram'),
      v.literal('portal'),
      v.literal('email')
    ),
    externalId: v.optional(v.string()), // ID no Evolution API
    
    // Departamento/Fila
    department: v.union(
      v.literal('vendas'),
      v.literal('cs'),
      v.literal('suporte')
    ),
    
    // Status
    status: v.union(
      v.literal('aguardando_atendente'),
      v.literal('em_atendimento'),
      v.literal('aguardando_cliente'),
      v.literal('resolvido'),
      v.literal('bot_ativo')
    ),
    
    // Atribuição
    assignedTo: v.optional(v.id('users')),
    lastBotMessage: v.optional(v.string()),
    handoffReason: v.optional(v.string()),
    
    // Métricas
    firstResponseAt: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
    satisfactionScore: v.optional(v.number()), // NPS da conversa
    
    // Timestamps
    lastMessageAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_lead', ['leadId'])
    .index('by_student', ['studentId'])
    .index('by_status', ['status'])
    .index('by_department', ['department'])
    .index('by_assigned', ['assignedTo'])
    .index('by_last_message', ['lastMessageAt']),

  // ═══════════════════════════════════════════════════════
  // MENSAGENS
  // ═══════════════════════════════════════════════════════
  messages: defineTable({
    conversationId: v.id('conversations'),
    
    // Remetente
    sender: v.union(
      v.literal('client'),
      v.literal('agent'),
      v.literal('bot'),
      v.literal('system')
    ),
    senderId: v.optional(v.id('users')), // Se agent
    
    // Conteúdo
    content: v.string(),
    contentType: v.union(
      v.literal('text'),
      v.literal('image'),
      v.literal('audio'),
      v.literal('document'),
      v.literal('template')
    ),
    mediaUrl: v.optional(v.string()),
    templateId: v.optional(v.id('messageTemplates')),
    
    // Status de entrega
    status: v.union(
      v.literal('enviando'),
      v.literal('enviado'),
      v.literal('entregue'),
      v.literal('lido'),
      v.literal('falhou')
    ),
    externalId: v.optional(v.string()), // ID no WhatsApp
    
    // Metadata IA
    aiGenerated: v.optional(v.boolean()),
    aiConfidence: v.optional(v.number()),
    detectedIntent: v.optional(v.string()),
    
    // Timestamp
    createdAt: v.number(),
  })
    .index('by_conversation', ['conversationId'])
    .index('by_sender', ['sender'])
    .index('by_created', ['createdAt']),

  // ═══════════════════════════════════════════════════════
  // TEMPLATES DE MENSAGEM
  // ═══════════════════════════════════════════════════════
  messageTemplates: defineTable({
    name: v.string(),
    category: v.union(
      v.literal('abertura'),
      v.literal('qualificacao'),
      v.literal('apresentacao'),
      v.literal('objecao_preco'),
      v.literal('objecao_tempo'),
      v.literal('objecao_outros_cursos'),
      v.literal('follow_up'),
      v.literal('fechamento'),
      v.literal('pos_venda'),
      v.literal('suporte')
    ),
    product: v.optional(v.union(
      v.literal('trintae3'),
      v.literal('otb'),
      v.literal('black_neon'),
      v.literal('comunidade'),
      v.literal('auriculo'),
      v.literal('na_mesa_certa'),
      v.literal('geral')
    )),
    content: v.string(),
    variables: v.optional(v.array(v.string())), // {{nome}}, {{produto}}
    isActive: v.boolean(),
    usageCount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_category', ['category'])
    .index('by_product', ['product'])
    .index('by_active', ['isActive']),

  // ═══════════════════════════════════════════════════════
  // ATIVIDADES / TIMELINE
  // ═══════════════════════════════════════════════════════
  activities: defineTable({
    // Referências
    leadId: v.optional(v.id('leads')),
    studentId: v.optional(v.id('students')),
    enrollmentId: v.optional(v.id('enrollments')),
    conversationId: v.optional(v.id('conversations')),
    
    // Tipo
    type: v.union(
      v.literal('lead_criado'),
      v.literal('lead_qualificado'),
      v.literal('stage_changed'),
      v.literal('mensagem_enviada'),
      v.literal('mensagem_recebida'),
      v.literal('ligacao'),
      v.literal('email_enviado'),
      v.literal('proposta_enviada'),
      v.literal('venda_fechada'),
      v.literal('matricula_criada'),
      v.literal('pagamento_confirmado'),
      v.literal('pagamento_atrasado'),
      v.literal('modulo_concluido'),
      v.literal('pratica_agendada'),
      v.literal('pratica_concluida'),
      v.literal('certificado_emitido'),
      v.literal('ticket_aberto'),
      v.literal('ticket_resolvido'),
      v.literal('nota_adicionada'),
      v.literal('atribuicao_alterada')
    ),
    
    // Detalhes
    description: v.string(),
    metadata: v.optional(v.any()), // Dados extras JSON
    
    // Autor
    userId: v.optional(v.id('users')),
    
    // Timestamp
    createdAt: v.number(),
  })
    .index('by_lead', ['leadId'])
    .index('by_student', ['studentId'])
    .index('by_type', ['type'])
    .index('by_created', ['createdAt']),

  // ═══════════════════════════════════════════════════════
  // CONFIGURAÇÕES E MÉTRICAS
  // ═══════════════════════════════════════════════════════
  settings: defineTable({
    key: v.string(),
    value: v.any(),
    updatedAt: v.number(),
  })
    .index('by_key', ['key']),

  dailyMetrics: defineTable({
    date: v.string(), // YYYY-MM-DD
    
    // Leads
    newLeads: v.number(),
    leadsBySource: v.optional(v.any()),
    leadsByProduct: v.optional(v.any()),
    
    // Conversões
    conversions: v.number(),
    conversionValue: v.number(),
    conversionsByProduct: v.optional(v.any()),
    
    // Atendimento
    messagesReceived: v.number(),
    messagesSent: v.number(),
    avgResponseTime: v.optional(v.number()),
    botResolutionRate: v.optional(v.number()),
    
    // Por usuário
    userMetrics: v.optional(v.any()),
    
    createdAt: v.number(),
  })
    .index('by_date', ['date']),
})
```

---

## 📝 Script de Vendas Integrado

### Fluxo do Script (para SDRs e IA)

O portal deve suportar e facilitar o script de vendas oficial do Grupo US:

#### 1. Abertura & Enquadramento

```
SDR: "Oi, [nome], tudo bem? Aqui é [seu nome] do Grupo US.
Vi aqui que você respondeu ao nosso formulário querendo saber mais 
sobre a Virada Estética em 6 Meses. Ainda faz sentido pra você 
essa virada ou mudou alguma coisa desde que preencheu?"

[Se confirma interesse]

SDR: "Perfeito. Eu marquei esse horário pra gente entender melhor 
sua realidade hoje na saúde, te mostrar como funciona na prática 
esse caminho pra estética e ver juntas se faz sentido pra você agora.
Pode ser? Você tem uns 30 min tranquilos?"
```

#### 2. Diagnóstico (Dor + Desejo)

Campos no CRM para capturar:
- **Situação atual:** O que faz hoje? Onde trabalha?
- **Dor principal:** Plantões? Agenda vazia? Técnica insegura?
- **Desejo:** Onde quer estar em 6 meses? 1 ano?
- **Urgência:** Por que agora? O que muda se não agir?

#### 3. Tratamento de Objeções

Templates categorizados no sistema:

| Objeção | Resposta Sugerida |
|---------|-------------------|
| **"É muito caro"** | "Entendo. Me conta: quanto você investe hoje em cursos que não te dão retorno? A TRINTAE3 forma EMPRESÁRIOS - você aprende a gerar retorno sobre o investimento." |
| **"Não tenho tempo"** | "A maioria dos nossos alunos também trabalha! As aulas são gravadas, você estuda no seu ritmo. Os encontros ao vivo são planejados com antecedência." |
| **"Já fiz outros cursos"** | "Ótimo! Experiência prévia ajuda. O diferencial é que não ensinamos só técnica - formamos empresários. Se o negócio não decolou, provavelmente falta a parte de business." |
| **"Preciso pensar"** | "Claro! O que te deixa na dúvida? Enquanto pensa, posso te passar mais info por WhatsApp e tem conteúdos gratuitos da Dra. Sacha no @drasachagualberto." |

---

## 🎨 Interface e Funcionalidades

### Estrutura de Rotas

```typescript
// routes.ts
const routes = {
  // Dashboard
  '/': Dashboard,
  '/dashboard': Dashboard,
  
  // CRM
  '/crm': CRMLayout,
  '/crm/leads': LeadsList,
  '/crm/leads/:id': LeadDetail,
  '/crm/pipeline': PipelineKanban,
  
  // Alunos
  '/students': StudentsLayout,
  '/students/list': StudentsList,
  '/students/:id': StudentDetail,
  '/students/:id/enrollments': StudentEnrollments,
  
  // Chat
  '/chat': ChatLayout,
  '/chat/vendas': ChatVendas,
  '/chat/cs': ChatCS,
  '/chat/suporte': ChatSuporte,
  '/chat/:conversationId': ChatConversation,
  
  // Configurações
  '/settings': SettingsLayout,
  '/settings/team': TeamSettings,
  '/settings/templates': TemplatesSettings,
  '/settings/integrations': IntegrationsSettings,
  
  // Relatórios
  '/reports': ReportsLayout,
  '/reports/sales': SalesReports,
  '/reports/team': TeamReports,
  '/reports/products': ProductReports,
}
```

### Controle de Acesso (RBAC)

| Funcionalidade | Admin | SDR | CS | Suporte |
|----------------|-------|-----|-----|---------|
| Dashboard completo | ✅ | ❌ | ❌ | ❌ |
| Dashboard de vendas | ✅ | ✅ | ❌ | ❌ |
| Dashboard de CS | ✅ | ❌ | ✅ | ❌ |
| CRM - Todos os leads | ✅ | ❌ | ❌ | ❌ |
| CRM - Leads atribuídos | ✅ | ✅ | ❌ | ❌ |
| Alunos - Todos | ✅ | ❌ | ❌ | ❌ |
| Alunos - Atribuídos | ✅ | ❌ | ✅ | 🔍 |
| Chat - Vendas | ✅ | ✅ | ❌ | ❌ |
| Chat - CS | ✅ | ❌ | ✅ | ❌ |
| Chat - Suporte | ✅ | ❌ | ❌ | ✅ |
| Templates - Editar | ✅ | ❌ | ❌ | ❌ |
| Templates - Usar | ✅ | ✅ | ✅ | ✅ |
| Relatórios | ✅ | 📊 | 📊 | ❌ |
| Configurações | ✅ | ❌ | ❌ | ❌ |

*🔍 = Somente leitura | 📊 = Apenas próprias métricas*


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
    // Multi-tenant: organização atual
    organizationId: v.optional(v.string()),
    organizationRole: v.optional(v.string()), // 'admin' | 'member' basically, but Clerk uses specific strings
    
    // Métricas de performance
    leadsAtribuidos: v.optional(v.number()),
    conversoes: v.optional(v.number()),
    tempoMedioResposta: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_clerk_id', ['clerkId'])
    .index('by_organization', ['organizationId'])
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
    
    // Multi-tenant
    organizationId: v.string(), // Obrigatório para leads
    
    // Timestamps
    lastContactAt: v.optional(v.number()),
    nextFollowUpAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_phone', ['phone'])
    .index('by_organization', ['organizationId'])
    .index('by_organization_stage', ['organizationId', 'stage'])
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
    
    // Multi-tenant
    organizationId: v.string(),
    performedBy: v.string(), // clerkId (subject)

    // Timestamp
    createdAt: v.number(),
  })
    .index('by_lead', ['leadId'])
    .index('by_organization', ['organizationId'])
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

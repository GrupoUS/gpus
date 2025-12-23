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

    // User Preferences (Notifications, UI, etc)
    preferences: v.optional(v.object({
      notifications: v.optional(v.object({
        email: v.boolean(),
        push: v.boolean(),
        whatsapp: v.boolean(),
      })),
      theme: v.optional(v.union(v.literal('light'), v.literal('dark'), v.literal('system'))),
      sidebarCollapsed: v.optional(v.boolean()),
    })),
  })
    .index('by_clerk_id', ['clerkId'])
    .index('by_organization', ['organizationId'])
    .index('by_email', ['email'])
    .index('by_role', ['role']),

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
    organizationId: v.optional(v.string()), // Optional for backward compatibility with existing data

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
    .index('by_created', ['createdAt'])
    .index('by_stage', ['stage'])
    .index('by_organization_phone', ['organizationId', 'phone']),

  // ═══════════════════════════════════════════════════════
  // ALUNOS (Clientes convertidos) - LGPD COMPLIANT
  // ═══════════════════════════════════════════════════════
  students: defineTable({
    // Referência ao lead original
    leadId: v.optional(v.id('leads')),
    asaasCustomerId: v.optional(v.string()),
    asaasCustomerSyncedAt: v.optional(v.number()),

    // Dados pessoais (parcialmente criptografados para LGPD)
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.string(),
    cpf: v.optional(v.string()), // Original format (migration only)

    // LGPD - Campos criptografados (AES-256-GCM)
    encryptedCPF: v.optional(v.string()), // CPF criptografado
    encryptedEmail: v.optional(v.string()), // Email criptografado (backup)
    encryptedPhone: v.optional(v.string()), // Telefone criptografado (backup)

    // Dados profissionais
    profession: v.string(),
    products: v.optional(v.array(v.string())), // Denormalized active products
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

    // Dados demográficos e endereço (importação XLSX)
    birthDate: v.optional(v.number()), // Data de nascimento
    address: v.optional(v.string()), // Endereço
    addressNumber: v.optional(v.string()), // Número
    complement: v.optional(v.string()), // Complemento
    neighborhood: v.optional(v.string()), // Bairro
    city: v.optional(v.string()), // Cidade
    state: v.optional(v.string()), // Estado (UF)
    zipCode: v.optional(v.string()), // CEP
    country: v.optional(v.string()), // País

    // Dados de venda/origem
    saleDate: v.optional(v.number()), // Data da venda
    salesperson: v.optional(v.string()), // Vendedor
    contractStatus: v.optional(v.string()), // Status do contrato
    leadSource: v.optional(v.string()), // Origem do lead
    cohort: v.optional(v.string()), // Turma (ex: "TURMA 5", "TURMA 6")

    // LGPD - Controle de retenção e consentimento
    lgpdConsent: v.optional(v.boolean()),
    dataRetentionUntil: v.optional(v.number()), // Data para exclusão automática
    consentGrantedAt: v.optional(v.number()), // Quando consentimento foi concedido
    consentVersion: v.optional(v.string()), // Versão da política de privacidade
    minorConsentRequired: v.optional(v.boolean()), // Se consentimento de responsável foi necessário
    minorConsentGranted: v.optional(v.boolean()), // Se consentimento foi obtido

    // Multi-tenant
    organizationId: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_organization', ['organizationId'])
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
    .index('by_payment', ['paymentStatus'])
    .index('by_created', ['createdAt']),

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
    .index('by_last_message', ['lastMessageAt'])
    .index('by_created', ['createdAt']),

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
    userId: v.optional(v.id('users')),

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
      v.literal('atribuicao_alterada'),
      v.literal('integracao_configurada'),
      v.literal('user_created')
    ),

    // Detalhes
    description: v.string(),
    metadata: v.optional(v.object({
      from: v.optional(v.string()),
      to: v.optional(v.string()),
      amount: v.optional(v.number()),
      reason: v.optional(v.string()),
      externalId: v.optional(v.string()),
      fields: v.optional(v.array(v.string())),
    })),

    // Multi-tenant
    organizationId: v.string(),
    performedBy: v.string(), // clerkId (subject)

    // Timestamp
    createdAt: v.number(),
  })
    .index('by_lead', ['leadId'])
    .index('by_organization', ['organizationId'])
    .index('by_student', ['studentId'])
    .index('by_user', ['userId'])
    .index('by_type', ['type'])
    .index('by_created', ['createdAt']),

  // ═══════════════════════════════════════════════════════
  // NOTIFICAÇÕES (Payment notifications, etc.)
  // ═══════════════════════════════════════════════════════
  notifications: defineTable({
    type: v.union(
      v.literal('payment_confirmed'),
      v.literal('payment_received'),
      v.literal('payment_overdue'),
      v.literal('payment_reminder'),
      v.literal('enrollment_created'),
      v.literal('system')
    ),
    recipientId: v.id('students'),
    recipientType: v.union(v.literal('student'), v.literal('lead')),
    title: v.string(),
    message: v.string(),
    channel: v.union(v.literal('email'), v.literal('whatsapp'), v.literal('system')),
    status: v.union(v.literal('pending'), v.literal('sent'), v.literal('failed')),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index('by_recipient', ['recipientId'])
    .index('by_type', ['type'])
    .index('by_status', ['status'])
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

  // ═══════════════════════════════════════════════════════
  // LGPD COMPLIANCE (Lei Geral de Proteção de Dados)
  // ═══════════════════════════════════════════════════════
  lgpdConsent: defineTable({
    studentId: v.id('students'),
    consentType: v.string(), // 'academic_processing', 'marketing_communications', etc.
    consentVersion: v.string(),
    granted: v.boolean(),
    grantedAt: v.number(),
    expiresAt: v.optional(v.number()), // Para consentos temporários
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    justification: v.optional(v.string()), // Justificativa para tratamento
    dataCategories: v.array(v.string()), // Categorias de dados tratadas
    rightsWithdrawal: v.boolean(), // Se direitos foram retirados
    withdrawalAt: v.optional(v.number()), // Quando retirou consentimento
    withdrawalReason: v.optional(v.string()), // Motivo da retirada

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_student', ['studentId'])
    .index('by_consent_type', ['consentType'])
    .index('by_granted', ['granted'])
    .index('by_expires', ['expiresAt']),

  // ═══════════════════════════════════════════════════════
  // LGPD AUDIT LOG (Rastreabilidade de Operações)
  // ═══════════════════════════════════════════════════════
  lgpdAudit: defineTable({
    studentId: v.optional(v.id('students')),

    // Tipo de operação com dados
    actionType: v.union(
      v.literal('data_access'),
      v.literal('data_creation'),
      v.literal('data_modification'),
      v.literal('data_deletion'),
      v.literal('consent_granted'),
      v.literal('consent_withdrawn'),
      v.literal('data_export'),
      v.literal('data_portability'),
      v.literal('security_event'),
      v.literal('data_breach')
    ),

    // Quem realizou a operação
    actorId: v.string(), // clerkId do responsável
    actorRole: v.optional(v.string()), // admin, sdr, cs, support

    // Dados operacionais
    dataCategory: v.string(), // identificação, contato, acadêmico, etc.
    description: v.string(), // Descrição da operação
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),

    // Propósito e base legal
    processingPurpose: v.optional(v.string()), // gestão acadêmica, suporte, etc.
    legalBasis: v.string(), // consentimento, obrigação legal, etc.

    // Controle de retenção
    retentionDays: v.optional(v.number()), // Dias de retenção previstos
    dataDeletedAt: v.optional(v.number()), // Quando dados foram excluídos

    // Metadados adicionais
    metadata: v.optional(v.any()), // Dados extras em JSON

    // Timestamp
    createdAt: v.number(),
  })
    .index('by_student', ['studentId'])
    .index('by_action_type', ['actionType'])
    .index('by_actor', ['actorId'])
    .index('by_data_category', ['dataCategory'])
    .index('by_created', ['createdAt'])
    .index('by_legal_basis', ['legalBasis']),

  // ═══════════════════════════════════════════════════════
  // LGPD DATA RETENTION POLICIES
  // ═══════════════════════════════════════════════════════
  lgpdRetention: defineTable({
    dataCategory: v.string(), // identificação, acadêmico, financeiro, etc.
    retentionDays: v.number(), // Dias de retenção obrigatórios
    legalBasis: v.string(), // Base legal para retenção
    automaticDeletion: v.boolean(), // Se deleção é automática
    notificationBeforeDeletion: v.number(), // Dias antes de notificar
    requiresExplicitConsent: v.boolean(), // Se exige consentimento explícito
    minorAgeRestriction: v.optional(v.number()), // Restrição para menores (18)
    exceptionalCircumstances: v.optional(v.string()), // Casos excepcionais

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_data_category', ['dataCategory'])
    .index('by_legal_basis', ['legalBasis']),

  // ═══════════════════════════════════════════════════════
  // LGPD DATA SUBJECT REQUESTS (Solicitações dos Titulares)
  // ═══════════════════════════════════════════════════════
  lgpdRequests: defineTable({
    studentId: v.id('students'),

    // Tipo de solicitação
    requestType: v.union(
      v.literal('access'),
      v.literal('correction'),
      v.literal('deletion'),
      v.literal('portability'),
      v.literal('information'),
      v.literal('objection'),
      v.literal('restriction')
    ),

    // Status da solicitação
    status: v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('completed'),
      v.literal('rejected'),
      v.literal('cancelled')
    ),

    // Detalhes da solicitação
    description: v.optional(v.string()), // Descrição detalhada
    identityProof: v.optional(v.string()), // Prova de identidade
    ipAddress: v.string(),
    userAgent: v.string(),

    // Resolução
    response: v.optional(v.string()), // Resposta ao titular
    responseFiles: v.optional(v.array(v.string())), // Arquivos gerados
    completedAt: v.optional(v.number()), // Data de conclusão
    rejectionReason: v.optional(v.string()), // Motivo da rejeição

    // Processamento
    processedBy: v.string(), // clerkId de quem processou
    processingNotes: v.optional(v.string()), // Notas do processamento

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_student', ['studentId'])
    .index('by_request_type', ['requestType'])
    .index('by_status', ['status'])
    .index('by_created', ['createdAt'])
    .index('by_processed_by', ['processedBy']),

  // ═══════════════════════════════════════════════════════
  // LGPD DATA BREACH LOG (Registro de Vazamentos)
  // ═══════════════════════════════════════════════════════
  lgpdDataBreach: defineTable({
    incidentId: v.string(), // Identificador único do incidente

    // Detalhes do vazamento
    breachType: v.union(
      v.literal('hacker_attack'),
      v.literal('internal_threat'),
      v.literal('lost_device'),
      v.literal('misconfigured_system'),
      v.literal('third_party_breach'),
      v.literal('physical_theft'),
      v.literal('social_engineering')
    ),

    // Impacto
    affectedStudents: v.array(v.id('students')), // Alunos afetados
    dataCategories: v.array(v.string()), // Categorias de dados vazadas
    severity: v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('critical')),

    // Cronologia
    detectedAt: v.number(), // Quando detectou
    startedAt: v.number(), // Quando começou
    containedAt: v.optional(v.number()), // Quando conteve

    // Notificação
    reportedToANPD: v.boolean(), // Se notificou à ANPD
    notifiedAffected: v.boolean(), // Se notificou os afetados
    notificationMethod: v.optional(v.string()), // Método de notificação
    notificationDeadline: v.number(), // Prazo legal (72h)

    // Ações corretivas
    correctiveActions: v.array(v.string()), // Ações tomadas
    preventiveMeasures: v.array(v.string()), // Medidas preventivas

    // Detalhes adicionais
    description: v.string(), // Descrição detalhada
    externalReporting: v.boolean(), // Se reportou externamente
    lawEnforcementNotified: v.boolean(), // Se notificou polícia

    // Responsáveis
    detectedBy: v.string(), // clerkId de quem detectou
    resolvedBy: v.optional(v.string()), // clerkId de quem resolveu

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_incident_id', ['incidentId'])
    .index('by_severity', ['severity'])
    .index('by_detected_at', ['detectedAt'])
    .index('by_detected_by', ['detectedBy']),

  // ═══════════════════════════════════════════════════════
  // EMAIL MARKETING (Brevo Integration)
  // ═══════════════════════════════════════════════════════

  // Contatos de email - referência polimórfica (leads OU students)
  emailContacts: defineTable({
    brevoId: v.optional(v.string()), // ID do contato no Brevo
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),

    // Referência polimórfica: lead OU student
    sourceType: v.union(v.literal('lead'), v.literal('student')),
    sourceId: v.optional(v.string()), // ID original como string
    leadId: v.optional(v.id('leads')),
    studentId: v.optional(v.id('students')),

    // Multi-tenant
    organizationId: v.string(),

    // Status de inscrição
    subscriptionStatus: v.union(
      v.literal('subscribed'),
      v.literal('unsubscribed'),
      v.literal('pending'),
    ),

    // LGPD compliance
    consentId: v.optional(v.id('lgpdConsent')),

    // Listas associadas
    listIds: v.optional(v.array(v.id('emailLists'))),

    // Sincronização
    lastSyncedAt: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_brevoId', ['brevoId'])
    .index('by_email', ['email'])
    .index('by_organization', ['organizationId'])
    .index('by_sourceType', ['sourceType'])
    .index('by_subscriptionStatus', ['subscriptionStatus'])
    .index('by_lead', ['leadId'])
    .index('by_student', ['studentId']),

  // Listas de distribuição de email
  emailLists: defineTable({
    brevoListId: v.optional(v.number()), // ID da lista no Brevo
    name: v.string(),
    description: v.optional(v.string()),

    // Multi-tenant
    organizationId: v.string(),

    // Source and filtering configuration
    sourceType: v.optional(v.union(
      v.literal('students'),
      v.literal('leads'),
      v.literal('both')
    )),
    products: v.optional(v.array(v.string())), // Product filters applied
    filters: v.optional(v.object({
      activeOnly: v.boolean(),
      qualifiedOnly: v.boolean()
    })),

    // Métricas
    contactCount: v.number(),

    // Status
    isActive: v.boolean(),

    // Sync status tracking
    syncStatus: v.optional(v.union(
      v.literal('pending'),
      v.literal('syncing'),
      v.literal('synced'),
      v.literal('error')
    )),
    lastSyncedAt: v.optional(v.number()),
    syncError: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_brevoListId', ['brevoListId'])
    .index('by_organization', ['organizationId'])
    .index('by_active', ['isActive']),

  // Campanhas de email
  emailCampaigns: defineTable({
    brevoCampaignId: v.optional(v.number()), // ID da campanha no Brevo
    name: v.string(),
    subject: v.string(),
    htmlContent: v.optional(v.string()),

    // Template opcional
    templateId: v.optional(v.id('emailTemplates')),

    // Listas de destinatários
    listIds: v.array(v.id('emailLists')),

    // Status da campanha
    status: v.union(
      v.literal('draft'),
      v.literal('scheduled'),
      v.literal('sending'),
      v.literal('sent'),
      v.literal('failed'),
    ),

    // Agendamento
    scheduledAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),

    // Multi-tenant
    organizationId: v.string(),

    // Estatísticas (atualizadas via webhook)
    stats: v.optional(
      v.object({
        sent: v.number(),
        delivered: v.number(),
        opened: v.number(),
        clicked: v.number(),
        bounced: v.number(),
        unsubscribed: v.number(),
      }),
    ),

    // Auditoria
    createdBy: v.id('users'),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_brevoCampaignId', ['brevoCampaignId'])
    .index('by_organization', ['organizationId'])
    .index('by_status', ['status'])
    .index('by_createdBy', ['createdBy']),

  // Templates de email (diferente de messageTemplates)
  emailTemplates: defineTable({
    brevoTemplateId: v.optional(v.number()), // ID do template no Brevo
    name: v.string(),
    subject: v.string(),
    htmlContent: v.string(),

    // Design JSON do Brevo (editor visual)
    design: v.optional(v.any()),

    // Categorização
    category: v.optional(v.string()),

    // Multi-tenant
    organizationId: v.string(),

    // Status
    isActive: v.boolean(),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_brevoTemplateId', ['brevoTemplateId'])
    .index('by_organization', ['organizationId'])
    .index('by_category', ['category'])
    .index('by_active', ['isActive']),

  // Eventos de email (recebidos via webhook do Brevo)
  emailEvents: defineTable({
    // Referências
    campaignId: v.optional(v.id('emailCampaigns')),
    contactId: v.optional(v.id('emailContacts')),
    email: v.string(),

    // Tipo de evento
    eventType: v.union(
      v.literal('delivered'),
      v.literal('opened'),
      v.literal('clicked'),
      v.literal('bounced'),
      v.literal('spam'),
      v.literal('unsubscribed'),
    ),

    // Dados do evento
    link: v.optional(v.string()), // Para eventos de click
    bounceType: v.optional(v.string()), // hard, soft, etc.
    brevoMessageId: v.optional(v.string()),

    // Timestamp do evento
    timestamp: v.number(),

    // Metadados adicionais
    metadata: v.optional(v.any()),

    // Timestamps
    createdAt: v.number(),
  })
    .index('by_campaign', ['campaignId'])
    .index('by_contact', ['contactId'])
    .index('by_eventType', ['eventType'])
    .index('by_email', ['email'])
    .index('by_timestamp', ['timestamp']),

  // ═══════════════════════════════════════════════════════
  // FINANCEIRO (Integração Asaas)
  // ═══════════════════════════════════════════════════════
  asaasPayments: defineTable({
    // Referências
    enrollmentId: v.optional(v.id('enrollments')),
    studentId: v.id('students'),

    // Multi-tenant
    organizationId: v.optional(v.string()),

    // IDs Asaas
    asaasPaymentId: v.string(), // ID único da cobrança no Asaas
    asaasCustomerId: v.string(), // ID do cliente no Asaas

    // Dados da cobrança
    value: v.number(),
    netValue: v.optional(v.number()), // Valor líquido após taxas
    installmentNumber: v.optional(v.number()), // Número da parcela (1, 2, 3...)
    totalInstallments: v.optional(v.number()), // Total de parcelas

    // Status e datas
    status: v.union(
      v.literal('PENDING'),
      v.literal('RECEIVED'),
      v.literal('CONFIRMED'),
      v.literal('OVERDUE'),
      v.literal('REFUNDED'),
      v.literal('DELETED'),
      v.literal('DUNNING_REQUESTED'),
      v.literal('DUNNING_RECEIVED'),
      v.literal('AWAITING_RISK_ANALYSIS'),
      v.literal('CANCELLED')
    ),
    dueDate: v.number(), // Timestamp (start of day)

    confirmedDate: v.optional(v.number()),

    // Tipo de pagamento
    billingType: v.union(
      v.literal('BOLETO'),
      v.literal('PIX'),
      v.literal('CREDIT_CARD'),
      v.literal('DEBIT_CARD'),
      v.literal('UNDEFINED')
    ),

    // Dados de pagamento
    boletoUrl: v.optional(v.string()),
    boletoBarcode: v.optional(v.string()),
    pixQrCode: v.optional(v.string()),
    pixQrCodeBase64: v.optional(v.string()), // Plan asks for base64 too

    // Metadata
    description: v.optional(v.string()),
    externalReference: v.optional(v.string()), // Referência externa (enrollment ID)

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_enrollment', ['enrollmentId'])
    .index('by_student', ['studentId'])
    .index('by_organization', ['organizationId'])
    .index('by_asaas_payment_id', ['asaasPaymentId'])
    .index('by_status', ['status'])
    .index('by_due_date', ['dueDate'])
    .index('by_student_status', ['studentId', 'status'])
    .index('by_due_date_status', ['dueDate', 'status']), // Para encontrar cobranças vencidas

  asaasWebhooks: defineTable({
    event: v.string(), // PAYMENT_RECEIVED, etc.
    paymentId: v.optional(v.string()), // ID do pagamento no Asaas
    payload: v.any(), // Payload completo
    processed: v.boolean(),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_payment_id', ['paymentId'])
    .index('by_processed', ['processed']),

  asaasSubscriptions: defineTable({
    enrollmentId: v.optional(v.id('enrollments')),
    studentId: v.id('students'),
    asaasSubscriptionId: v.string(),
    asaasCustomerId: v.string(),

    // Multi-tenant
    organizationId: v.optional(v.string()),

    value: v.number(),
    cycle: v.union(
      v.literal('WEEKLY'),
      v.literal('BIWEEKLY'),
      v.literal('MONTHLY'),
      v.literal('QUARTERLY'),
      v.literal('SEMIANNUALLY'),
      v.literal('YEARLY')
    ),
    status: v.union(
      v.literal('ACTIVE'),
      v.literal('INACTIVE'),
      v.literal('CANCELLED'),
      v.literal('EXPIRED') // Asaas status
    ),
    description: v.optional(v.string()), // Added description
    nextDueDate: v.number(), // Timestamp (start of day)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_enrollment', ['enrollmentId'])
    .index('by_student', ['studentId'])
    .index('by_organization', ['organizationId'])
    .index('by_asaas_subscription_id', ['asaasSubscriptionId']),

  // ═══════════════════════════════════════════════════════
  // ASAAS SYNC LOGS (Import/Sync History)
  // ═══════════════════════════════════════════════════════
  asaasSyncLogs: defineTable({
    // Tipo de sincronização
    syncType: v.union(
      v.literal('customers'),
      v.literal('payments'),
      v.literal('subscriptions'),
      v.literal('financial')
    ),

    // Status da sincronização
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('completed'),
      v.literal('failed')
    ),

    // Timing
    startedAt: v.number(),
    completedAt: v.optional(v.number()),

    // Contadores
    recordsProcessed: v.number(),
    recordsCreated: v.number(),
    recordsUpdated: v.number(),
    recordsFailed: v.number(),

    // Erros (se houver)
    errors: v.optional(v.array(v.string())),

    // Filtros usados (opcional)
    filters: v.optional(v.object({
      startDate: v.optional(v.string()),
      endDate: v.optional(v.string()),
      status: v.optional(v.string()),
    })),

    // Quem iniciou
    initiatedBy: v.string(), // clerkId

    // Timestamp
    createdAt: v.number(),
  })
    .index('by_sync_type', ['syncType'])
    .index('by_status', ['status'])
    .index('by_created', ['createdAt'])
    .index('by_initiated_by', ['initiatedBy']),
})

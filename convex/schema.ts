import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	// ═══════════════════════════════════════════════════════
	// USUÁRIOS DO SISTEMA (Time interno)
	// ═══════════════════════════════════════════════════════
	users: defineTable({
		clerkId: v.string(),
		email: v.string(),
		name: v.string(),
		role: v.union(
			v.literal('owner'),
			v.literal('admin'),
			v.literal('manager'),
			v.literal('member'),
			// Legacy roles
			v.literal('sdr'),
			v.literal('cs'),
			v.literal('support'),
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
		preferences: v.optional(
			v.object({
				notifications: v.optional(
					v.object({
						email: v.boolean(),
						push: v.boolean(),
						whatsapp: v.boolean(),
					}),
				),
				theme: v.optional(v.union(v.literal('light'), v.literal('dark'), v.literal('system'))),
				sidebarCollapsed: v.optional(v.boolean()),
			}),
		),
		// Convites
		inviteStatus: v.optional(
			v.union(
				v.literal('pending'),
				v.literal('accepted'),
				v.literal('expired'),
				v.literal('revoked'),
			),
		),
		invitedAt: v.optional(v.number()),
	})
		.index('by_clerk_id', ['clerkId'])
		.index('by_organization', ['organizationId'])
		.index('by_email', ['email'])
		.index('by_role', ['role'])
		.index('by_invite_status', ['inviteStatus'])
		.searchIndex('search_name', {
			searchField: 'name',
			filterFields: ['organizationId'],
		}),

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
			v.literal('outro'),
		),

		sourceDetail: v.optional(v.string()), // Campanha específica / UTM

		// UTM Tracking
		utmSource: v.optional(v.string()),
		utmCampaign: v.optional(v.string()),
		utmMedium: v.optional(v.string()), // e.g. "cpc", "email"
		utmContent: v.optional(v.string()),
		utmTerm: v.optional(v.string()),

		// Content
		message: v.optional(v.string()), // Mensagem opcional do formulário

		// Qualificação (baseada no script de vendas)
		profession: v.optional(
			v.union(
				v.literal('enfermeiro'),
				v.literal('dentista'),
				v.literal('biomedico'),
				v.literal('farmaceutico'),
				v.literal('medico'),
				v.literal('esteticista'),
				v.literal('outro'),
			),
		),
		hasClinic: v.optional(v.boolean()),
		clinicName: v.optional(v.string()),
		clinicCity: v.optional(v.string()),
		yearsInAesthetics: v.optional(v.number()),
		currentRevenue: v.optional(v.string()), // Faixa de faturamento

		// Interesse e dores (diagnóstico do script)
		interestedProduct: v.optional(
			v.union(
				v.literal('trintae3'),
				v.literal('otb'),
				v.literal('black_neon'),
				v.literal('comunidade'),
				v.literal('auriculo'),
				v.literal('na_mesa_certa'),
				v.literal('indefinido'),
			),
		),
		mainPain: v.optional(
			v.union(
				v.literal('tecnica'),
				v.literal('vendas'),
				v.literal('gestao'),
				v.literal('posicionamento'),
				v.literal('escala'),
				v.literal('certificacao'),
				v.literal('outro'),
			),
		),
		mainDesire: v.optional(v.string()),

		// Pipeline
		stage: v.union(
			v.literal('novo'),
			v.literal('primeiro_contato'),
			v.literal('qualificado'),
			v.literal('proposta'),
			v.literal('negociacao'),
			v.literal('fechado_ganho'),
			v.literal('fechado_perdido'),
		),
		lostReason: v.optional(
			v.union(
				v.literal('preco'),
				v.literal('tempo'),
				v.literal('concorrente'),
				v.literal('sem_resposta'),
				v.literal('nao_qualificado'),
				v.literal('outro'),
			),
		),

		// Atribuição
		assignedTo: v.optional(v.id('users')), // SDR responsável

		// Scoring e prioridade
		temperature: v.union(v.literal('frio'), v.literal('morno'), v.literal('quente')),

		score: v.optional(v.number()), // 0-100 calculado

		// Consentimento (LGPD)
		lgpdConsent: v.optional(v.boolean()),
		whatsappConsent: v.optional(v.boolean()),
		consentGrantedAt: v.optional(v.number()),
		consentVersion: v.optional(v.string()), // Ex: "v1.0-2024"

		// Multi-tenant
		organizationId: v.optional(v.string()), // Optional for backward compatibility with existing data

		// Referência e Cashback
		referredById: v.optional(v.id('leads')), // Lead that referred this one
		cashbackEarned: v.optional(v.number()), // Cashback earned from referrals
		cashbackPaidAt: v.optional(v.number()),

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
		.index('by_referrer', ['referredById'])
		.index('by_organization_phone', ['organizationId', 'phone'])
		.index('by_organization_assigned_to', ['organizationId', 'assignedTo']),

	// ═══════════════════════════════════════════════════════
	// OBJEÇÕES (Objeções de vendas estruturadas)
	// ═══════════════════════════════════════════════════════
	objections: defineTable({
		// Referência ao lead
		leadId: v.id('leads'),

		// Conteúdo da objeção
		objectionText: v.string(),

		// Status de resolução
		resolved: v.optional(v.boolean()),
		resolution: v.optional(v.string()),

		// Multi-tenant
		organizationId: v.string(),

		// Auditoria
		recordedBy: v.string(), // Clerk user ID
		recordedAt: v.number(),
	})
		.index('by_lead', ['leadId'])
		.index('by_organization', ['organizationId'])
		.index('by_lead_recorded', ['leadId', 'recordedAt']),

	// ═══════════════════════════════════════════════════════
	// ALUNOS (Clientes convertidos) - LGPD COMPLIANT
	// ═══════════════════════════════════════════════════════
	students: defineTable({
		// Referência ao lead original
		leadId: v.optional(v.id('leads')),
		asaasCustomerId: v.optional(v.string()),
		asaasCustomerSyncedAt: v.optional(v.number()),
		asaasCustomerSyncError: v.optional(v.string()),
		asaasCustomerSyncAttempts: v.optional(v.number()),

		// Dados pessoais (parcialmente criptografados para LGPD)
		name: v.string(),
		email: v.optional(v.string()),
		phone: v.string(),
		cpf: v.optional(v.string()), // Original format (migration only)

		// LGPD - Campos criptografados (AES-256-GCM)
		cpfHash: v.optional(v.string()), // Blind index para busca de CPF
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
			v.literal('formado'),
		),

		// Atribuição CS
		assignedCS: v.optional(v.id('users')),

		// Indicadores de risco
		churnRisk: v.union(v.literal('baixo'), v.literal('medio'), v.literal('alto')),
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
		.index('by_cpf_hash', ['cpfHash'])
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
			v.literal('na_mesa_certa'),
		),

		// Turma/Edição
		cohort: v.optional(v.string()), // Ex: "2025-T1", "Março-2025"

		// Status
		status: v.union(
			v.literal('ativo'),
			v.literal('concluido'),
			v.literal('cancelado'),
			v.literal('pausado'),
			v.literal('aguardando_inicio'),
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
			v.literal('cancelado'),
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
			v.literal('email'),
		),
		externalId: v.optional(v.string()), // ID no Evolution API

		// Departamento/Fila
		department: v.union(v.literal('vendas'), v.literal('cs'), v.literal('suporte')),

		// Status
		status: v.union(
			v.literal('aguardando_atendente'),
			v.literal('em_atendimento'),
			v.literal('aguardando_cliente'),
			v.literal('resolvido'),
			v.literal('bot_ativo'),
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
		sender: v.union(v.literal('client'), v.literal('agent'), v.literal('bot'), v.literal('system')),
		senderId: v.optional(v.id('users')), // Se agent

		// Conteúdo
		content: v.string(),
		contentType: v.union(
			v.literal('text'),
			v.literal('image'),
			v.literal('audio'),
			v.literal('document'),
			v.literal('template'),
		),
		mediaUrl: v.optional(v.string()),
		templateId: v.optional(v.id('messageTemplates')),

		// Status de entrega
		status: v.union(
			v.literal('enviando'),
			v.literal('enviado'),
			v.literal('entregue'),
			v.literal('lido'),
			v.literal('falhou'),
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
			v.literal('suporte'),
		),
		product: v.optional(
			v.union(
				v.literal('trintae3'),
				v.literal('otb'),
				v.literal('black_neon'),
				v.literal('comunidade'),
				v.literal('auriculo'),
				v.literal('na_mesa_certa'),
				v.literal('geral'),
			),
		),
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
			v.literal('user_created'),
			v.literal('tag_criada'),
			v.literal('tag_adicionada'),
			v.literal('tag_removida'),
			v.literal('tag_deletada'),
			// New types
			v.literal('task_created'),
			v.literal('task_completed'),
			v.literal('task_updated'),
			v.literal('whatsapp_sent'),
			v.literal('lead_reactivated'),
			v.literal('system_task_reminder'),
			v.literal('system_lead_reactivation'),
		),

		// Detalhes
		description: v.string(),
		metadata: v.optional(v.any()),

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
	// CAMPOS PERSONALIZADOS (Custom Fields)
	// ═══════════════════════════════════════════════════════
	customFields: defineTable({
		name: v.string(),
		fieldType: v.union(
			v.literal('text'),
			v.literal('number'),
			v.literal('date'),
			v.literal('select'),
			v.literal('multiselect'),
			v.literal('boolean'),
		),
		entityType: v.union(v.literal('lead'), v.literal('student')),
		required: v.boolean(),
		options: v.optional(v.array(v.string())),
		organizationId: v.string(),
		createdBy: v.string(),
		createdAt: v.number(),
		active: v.boolean(),
	})
		.index('by_organization_entity', ['organizationId', 'entityType'])
		.index('by_organization', ['organizationId']),

	customFieldValues: defineTable({
		customFieldId: v.id('customFields'),
		entityId: v.string(),
		entityType: v.union(v.literal('lead'), v.literal('student')),
		value: v.any(),
		organizationId: v.string(),
		updatedBy: v.string(),
		updatedAt: v.number(),
	})
		.index('by_entity', ['entityId', 'entityType'])
		.index('by_custom_field', ['customFieldId'])
		.index('by_organization', ['organizationId']),

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
			v.literal('system'),
			// New types
			v.literal('task_created'),
			v.literal('task_completed'),
			v.literal('task_updated'),
			v.literal('task_reminder'),
			v.literal('whatsapp_sent'),
			v.literal('lead_reactivated'),
			v.literal('task_assigned'),
		),
		recipientId: v.union(v.id('students'), v.id('users')),
		recipientType: v.union(v.literal('student'), v.literal('lead'), v.literal('user')),
		title: v.string(),
		message: v.string(),
		channel: v.union(v.literal('email'), v.literal('whatsapp'), v.literal('system')),
		status: v.union(v.literal('pending'), v.literal('sent'), v.literal('failed')),
		metadata: v.optional(v.any()),
		createdAt: v.number(),

		// New Fields
		organizationId: v.string(),
		read: v.boolean(),
		link: v.optional(v.string()), // Action link
	})
		.index('by_recipient', ['recipientId'])
		.index('by_organization', ['organizationId'])
		.index('by_type', ['type'])
		.index('by_status', ['status'])
		.index('by_created', ['createdAt'])
		// optimization for "unread by user"
		.index('by_recipient_read', ['recipientId', 'read']),

	// ═══════════════════════════════════════════════════════
	// CONFIGURAÇÕES E MÉTRICAS
	// ═══════════════════════════════════════════════════════
	settings: defineTable({
		key: v.string(),
		value: v.any(),
		updatedAt: v.number(),
	}).index('by_key', ['key']),

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
	}).index('by_date', ['date']),

	// ═══════════════════════════════════════════════════════
	// ORGANIZATION SETTINGS (Configurações por Organização)
	// ═══════════════════════════════════════════════════════
	organizationSettings: defineTable({
		// Identificador único da organização
		organizationId: v.string(),

		// Configurações de Cashback
		cashbackAmount: v.number(), // Valor do cashback (padrão: 500 para R$ 500)
		cashbackType: v.union(v.literal('fixed'), v.literal('percentage')), // Tipo: fixo ou percentual

		// Timestamp
		updatedAt: v.number(),
	}).index('by_organization', ['organizationId']),

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
			v.literal('data_breach'),
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
			v.literal('restriction'),
		),

		// Status da solicitação
		status: v.union(
			v.literal('pending'),
			v.literal('processing'),
			v.literal('completed'),
			v.literal('rejected'),
			v.literal('cancelled'),
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
			v.literal('social_engineering'),
		),

		// Impacto
		affectedStudents: v.array(v.id('students')), // Alunos afetados
		dataCategories: v.array(v.string()), // Categorias de dados vazadas
		severity: v.union(
			v.literal('low'),
			v.literal('medium'),
			v.literal('high'),
			v.literal('critical'),
		),

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
		assignedTo: v.optional(v.id('users')), // clerkId de quem resolveu

		// Timestamps
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index('by_incident_id', ['incidentId'])
		.index('by_severity', ['severity'])
		.index('by_detected_at', ['detectedAt'])
		.index('by_detected_by', ['detectedBy']),

	// ═══════════════════════════════════════════════════════
	// MARKETING LEADS (Public Lead Capture)
	// ═══════════════════════════════════════════════════════
	marketing_leads: defineTable({
		// Contact Information
		name: v.string(),
		email: v.string(),
		phone: v.string(),

		// Interest & Message
		interest: v.union(
			v.literal('Harmonização Facial'),
			v.literal('Estética Corporal'),
			v.literal('Bioestimuladores'),
			v.literal('Outros'),
		),
		message: v.optional(v.string()),

		// LGPD Consent
		lgpdConsent: v.boolean(),
		whatsappConsent: v.boolean(),

		// UTM Tracking
		utmSource: v.optional(v.string()),
		utmCampaign: v.optional(v.string()),
		utmMedium: v.optional(v.string()),
		utmContent: v.optional(v.string()),
		utmTerm: v.optional(v.string()),

		// Status Management
		status: v.union(
			v.literal('new'),
			v.literal('contacted'),
			v.literal('converted'),
			v.literal('unsubscribed'),
		),

		// Anti-spam
		honeypot: v.optional(v.string()), // Should be empty

		// Typebot & External Metadata
		company: v.optional(v.string()), // empresa
		jobRole: v.optional(v.string()), // cargo
		origin: v.optional(v.string()), // origem
		source: v.optional(v.string()), // source (webhook/landing page)
		typebotId: v.optional(v.string()), // typebot_id
		resultId: v.optional(v.string()), // result_id
		externalTimestamp: v.optional(v.number()), // timestamp

		// Landing Page Tracking
		landingPage: v.optional(v.string()), // e.g. "trintae3", "promo-janeiro"
		landingPageUrl: v.optional(v.string()), // full URL

		// Multi-tenant (optional for public submissions)
		organizationId: v.optional(v.string()),

		// Brevo Sync
		brevoContactId: v.optional(v.string()),
		lastSyncedAt: v.optional(v.number()),

		// Timestamps
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index('by_email', ['email'])
		.index('by_status', ['status'])
		.index('by_created', ['createdAt'])
		.index('by_organization', ['organizationId'])
		.index('by_organization_status', ['organizationId', 'status'])
		.index('by_organization_created', ['organizationId', 'createdAt'])
		.index('by_source', ['source'])
		.index('by_landing_page', ['landingPage'])
		.index('by_organization_landing_page', ['organizationId', 'landingPage']),

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
		sourceType: v.optional(v.union(v.literal('students'), v.literal('leads'), v.literal('both'))),
		products: v.optional(v.array(v.string())), // Product filters applied
		filters: v.optional(
			v.object({
				activeOnly: v.boolean(),
				qualifiedOnly: v.boolean(),
			}),
		),

		// Métricas
		contactCount: v.number(),

		// Status
		isActive: v.boolean(),

		// Sync status tracking
		syncStatus: v.optional(
			v.union(v.literal('pending'), v.literal('syncing'), v.literal('synced'), v.literal('error')),
		),
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
			v.literal('RECEIVED_IN_CASH'),
			v.literal('RECEIVED_IN_CASH_UNDONE'),
			v.literal('CHARGEBACK_REQUESTED'),
			v.literal('CHARGEBACK_DISPUTE'),
			v.literal('AWAITING_CHARGEBACK_REVERSAL'),
			v.literal('APPROVED_BY_RISK_ANALYSIS'),
			v.literal('REJECTED_BY_RISK_ANALYSIS'),
			v.literal('DELETED'),
			v.literal('DUNNING_REQUESTED'),
			v.literal('DUNNING_RECEIVED'),
			v.literal('AWAITING_RISK_ANALYSIS'),
			v.literal('CANCELLED'),
		),
		dueDate: v.number(), // Timestamp (start of day)

		confirmedDate: v.optional(v.number()),

		// Tipo de pagamento
		billingType: v.union(
			v.literal('BOLETO'),
			v.literal('PIX'),
			v.literal('CREDIT_CARD'),
			v.literal('DEBIT_CARD'),
			v.literal('UNDEFINED'),
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
		.index('by_organization_student_status', ['organizationId', 'studentId', 'status'])
		.index('by_organization_due_date_status', ['organizationId', 'dueDate', 'status']) // Para encontrar cobranças vencidas
		.index('by_organization_status', ['organizationId', 'status'])
		.index('by_organization_due_date', ['organizationId', 'dueDate'])
		.index('by_organization_student', ['organizationId', 'studentId'])
		.index('by_organization_enrollment', ['organizationId', 'enrollmentId']),

	asaasWebhooks: defineTable({
		eventId: v.optional(v.string()), // Asaas event ID (evt_...)
		event: v.string(),
		paymentId: v.optional(v.string()),
		subscriptionId: v.optional(v.string()),
		customerId: v.optional(v.string()),
		// LGPD: Encrypted payload to protect PII (name, email, CPF, phone, address)
		// Webhook payloads contain sensitive customer data from Asaas
		payload: v.optional(v.string()), // Stores encrypted JSON string
		processed: v.boolean(),
		status: v.optional(
			v.union(
				v.literal('pending'),
				v.literal('processing'),
				v.literal('done'),
				v.literal('failed'),
			),
		),
		retryCount: v.optional(v.number()),
		lastAttemptAt: v.optional(v.number()),
		processedAt: v.optional(v.number()),
		error: v.optional(v.string()),
		createdAt: v.number(),
		// LGPD: Automatic retention policy (90 days as per ANPD guidelines)
		retentionUntil: v.number(), // Auto-delete timestamp (90 days from creation)
	})
		.index('by_event_id', ['eventId'])
		.index('by_status', ['status'])
		.index('by_created', ['createdAt'])
		.index('by_payment_id', ['paymentId'])
		.index('by_processed', ['processed'])
		.index('by_retention_until', ['retentionUntil']), // For cleanup queries

	// Webhook deduplication table to prevent duplicate processing
	asaasWebhookDeduplication: defineTable({
		idempotencyKey: v.string(), // SHA256 hash of unique webhook identifier
		processedAt: v.number(), // When webhook was processed
		expiresAt: v.number(), // TTL for cleanup (24 hours)
	})
		.index('by_idempotency_key', ['idempotencyKey'])
		.index('by_expires_at', ['expiresAt']),

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
			v.literal('YEARLY'),
		),
		status: v.union(
			v.literal('ACTIVE'),
			v.literal('INACTIVE'),
			v.literal('CANCELLED'),
			v.literal('EXPIRED'), // Asaas status
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
			v.literal('financial'),
		),

		// Status da sincronização
		status: v.union(
			v.literal('pending'),
			v.literal('running'),
			v.literal('completed'),
			v.literal('failed'),
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

		// Último erro detalhado (com stack trace)
		lastError: v.optional(v.string()), // JSON stringified error details

		// Filtros usados (opcional)
		filters: v.optional(
			v.object({
				startDate: v.optional(v.string()),
				endDate: v.optional(v.string()),
				status: v.optional(v.string()),
			}),
		),
		// Quem iniciou
		initiatedBy: v.string(), // clerkId

		// Timestamp
		createdAt: v.number(),
	})
		.index('by_sync_type', ['syncType'])
		.index('by_status', ['status'])
		.index('by_created', ['createdAt'])
		.index('by_initiated_by', ['initiatedBy']),

	asaasApiAudit: defineTable({
		endpoint: v.string(),
		method: v.string(),
		statusCode: v.number(),
		responseTime: v.number(),
		userId: v.optional(v.string()),
		errorMessage: v.optional(v.string()),
		timestamp: v.number(),
	})
		.index('by_timestamp', ['timestamp'])
		.index('by_endpoint', ['endpoint', 'timestamp']),

	financialMetrics: defineTable({
		organizationId: v.optional(v.string()),
		totalReceived: v.number(),
		totalPending: v.number(),
		totalOverdue: v.number(),
		totalValue: v.number(),
		paymentsCount: v.number(),
		periodStart: v.optional(v.string()), // YYYY-MM-DD
		periodEnd: v.optional(v.string()), // YYYY-MM-DD
		updatedAt: v.number(),
	}).index('by_organization', ['organizationId']),

	// ═══════════════════════════════════════════════════════
	// ASAAS CONFLICT RESOLUTION
	// ═══════════════════════════════════════════════════════
	asaasConflicts: defineTable({
		// Type of conflict
		conflictType: v.union(
			v.literal('duplicate_customer'),
			v.literal('payment_mismatch'),
			v.literal('subscription_mismatch'),
			v.literal('data_inconsistency'),
		),

		// Status
		status: v.union(
			v.literal('pending'),
			v.literal('resolving'),
			v.literal('resolved'),
			v.literal('ignored'),
		),

		// Entity references
		studentId: v.optional(v.id('students')),
		asaasCustomerId: v.optional(v.string()),
		asaasPaymentId: v.optional(v.string()),
		asaasSubscriptionId: v.optional(v.string()),

		// Conflict details
		localData: v.optional(v.any()), // Local data that caused conflict
		remoteData: v.optional(v.any()), // Remote data from Asaas
		field: v.optional(v.string()), // Field that has the conflict

		// Resolution tracking
		resolvedAt: v.optional(v.number()),
		resolvedBy: v.optional(v.string()), // User who resolved
		resolutionNote: v.optional(v.string()),

		// Multi-tenant
		organizationId: v.optional(v.string()),

		// Timestamps
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index('by_status', ['status'])
		.index('by_type', ['conflictType'])
		.index('by_organization', ['organizationId'])
		.index('by_student', ['studentId'])
		.index('by_asaas_customer', ['asaasCustomerId'])
		.index('by_created', ['createdAt']),

	// ═══════════════════════════════════════════════════════
	// ASAAS ALERTS & MONITORING
	// ═══════════════════════════════════════════════════════
	asaasAlerts: defineTable({
		// Alert type
		alertType: v.union(
			v.literal('api_error'),
			v.literal('sync_failure'),
			v.literal('rate_limit'),
			v.literal('webhook_timeout'),
			v.literal('duplicate_detection'),
			v.literal('data_integrity'),
		),

		// Severity
		severity: v.union(
			v.literal('low'),
			v.literal('medium'),
			v.literal('high'),
			v.literal('critical'),
		),

		// Status
		status: v.union(
			v.literal('active'),
			v.literal('acknowledged'),
			v.literal('resolved'),
			v.literal('suppressed'),
		),

		// Alert details
		title: v.string(),
		message: v.string(),
		details: v.optional(v.any()), // Additional context

		// Entity references (if applicable)
		studentId: v.optional(v.id('students')),
		paymentId: v.optional(v.id('asaasPayments')),
		subscriptionId: v.optional(v.id('asaasSubscriptions')),
		syncLogId: v.optional(v.id('asaasSyncLogs')),

		// Count for repeated alerts
		count: v.number(), // Number of times this alert has occurred

		// Resolution tracking
		resolvedAt: v.optional(v.number()),
		resolvedBy: v.optional(v.string()),
		resolutionNote: v.optional(v.string()),

		// Suppression
		suppressedUntil: v.optional(v.number()), // Suppress alerts until this timestamp

		// Multi-tenant
		organizationId: v.optional(v.string()),

		// Timestamps
		firstSeenAt: v.number(), // First time this alert was seen
		lastSeenAt: v.number(), // Last time this alert was seen
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index('by_status', ['status'])
		.index('by_severity', ['severity'])
		.index('by_type', ['alertType'])
		.index('by_organization', ['organizationId'])
		.index('by_organization_active', ['organizationId', 'status', 'severity'])
		.index('by_last_seen', ['lastSeenAt'])
		.index('by_suppressed', ['suppressedUntil']),

	// ═══════════════════════════════════════════════════════
	// ORGANIZATION ASAAS API KEYS (Multi-tenant)
	// ═══════════════════════════════════════════════════════
	organizationAsaasApiKeys: defineTable({
		// Multi-tenant: required
		organizationId: v.string(),

		// API Configuration
		encryptedApiKey: v.string(), // AES-256-GCM encrypted
		baseUrl: v.string(), // https://api.asaas.com/v3 or sandbox
		environment: v.union(v.literal('production'), v.literal('sandbox')),

		// Webhook configuration
		encryptedWebhookSecret: v.optional(v.string()),

		// Status
		isActive: v.boolean(),

		// Testing/validation tracking
		lastTestedAt: v.optional(v.number()),
		lastTestResult: v.optional(v.boolean()),
		lastTestMessage: v.optional(v.string()),

		// Audit
		createdBy: v.string(), // Clerk user ID
		updatedBy: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index('by_organization', ['organizationId'])
		.index('by_organization_active', ['organizationId', 'isActive']),

	// ═══════════════════════════════════════════════════════
	// RATE LIMITING
	// ═══════════════════════════════════════════════════════
	rateLimits: defineTable({
		identifier: v.string(), // IP or User ID
		action: v.string(), // "submit_form", etc.
		timestamp: v.number(),
	})
		.index('by_identifier_action', ['identifier', 'action'])
		.index('by_timestamp', ['timestamp']),

	// ═══════════════════════════════════════════════════════
	// TAREFAS (Itens acionáveis com menções)
	// ═══════════════════════════════════════════════════════
	tasks: defineTable({
		// Descrição da tarefa
		description: v.string(),

		// Referências opcionais (tarefa pode ser geral ou específica)
		leadId: v.optional(v.id('leads')),
		studentId: v.optional(v.id('students')),

		// Agendamento
		dueDate: v.optional(v.number()), // Unix timestamp
		remindedAt: v.optional(v.number()),

		// Status de conclusão
		completed: v.boolean(),
		completedAt: v.optional(v.number()),

		// Colaboração
		mentionedUserIds: v.optional(v.array(v.id('users'))),
		assignedTo: v.optional(v.id('users')), // User responsible for the task

		// Multi-tenant
		organizationId: v.string(),

		// Auditoria
		createdBy: v.string(), // Clerk user ID
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index('by_lead', ['leadId'])
		.index('by_organization', ['organizationId'])
		.index('by_assigned_to', ['assignedTo'])
		.index('by_due_date', ['dueDate'])
		.index('by_mentioned_user', ['mentionedUserIds'])
		.index('by_completed', ['completed'])
		.index('by_organization_assigned_completed', ['organizationId', 'assignedTo', 'completed']),

	// ═══════════════════════════════════════════════════════
	// EVOLUTION API INTEGRATION (WhatsApp Queue)
	// ═══════════════════════════════════════════════════════
	evolutionApiQueue: defineTable({
		// Multi-tenant
		organizationId: v.string(),

		// Referência ao lead
		leadId: v.id('leads'),

		// Conteúdo da mensagem
		message: v.string(),

		// Status da mensagem na fila
		status: v.union(
			v.literal('pending'),
			v.literal('processing'),
			v.literal('sent'),
			v.literal('failed'),
		),

		// Controle de tentativas
		attempts: v.number(),
		lastAttemptAt: v.optional(v.number()),

		// Agendamento
		scheduledFor: v.number(), // Timestamp para envio

		// Erro (se falhou)
		errorMessage: v.optional(v.string()),

		// Timestamp de criação
		createdAt: v.number(),
	})
		.index('by_organization', ['organizationId'])
		.index('by_status', ['status'])
		.index('by_scheduled', ['scheduledFor'])
		.index('by_organization_status', ['organizationId', 'status'])
		.index('by_lead', ['leadId']),

	// ═══════════════════════════════════════════════════════
	// TAGS (Sistema de etiquetas)
	// ═══════════════════════════════════════════════════════

	// ═══════════════════════════════════════════════════════
	// TAGS SYSTEM (Lead Categorization)
	// ═══════════════════════════════════════════════════════
	tags: defineTable({
		name: v.string(),
		displayName: v.optional(v.string()),
		color: v.optional(v.string()),
		organizationId: v.string(),
		createdBy: v.string(), // Clerk user ID
		createdAt: v.number(),
	})
		.index('by_organization', ['organizationId'])
		.index('by_organization_name', ['organizationId', 'name']),

	leadTags: defineTable({
		leadId: v.id('leads'),
		tagId: v.id('tags'),
		organizationId: v.string(),
		addedBy: v.string(), // Clerk user ID
		addedAt: v.number(),
	})
		.index('by_lead', ['leadId'])
		.index('by_tag', ['tagId'])
		.index('by_organization', ['organizationId']),
});

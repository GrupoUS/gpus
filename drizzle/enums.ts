import { pgEnum } from 'drizzle-orm/pg-core';

// ── Users ──
export const userRoleEnum = pgEnum('user_role', [
	'owner',
	'admin',
	'manager',
	'member',
	'sdr',
	'cs',
	'support',
]);

export const themeEnum = pgEnum('theme', ['light', 'dark', 'system']);

export const inviteStatusEnum = pgEnum('invite_status', [
	'pending',
	'accepted',
	'expired',
	'revoked',
]);

// ── Leads ──
export const leadSourceEnum = pgEnum('lead_source', [
	'whatsapp',
	'instagram',
	'landing_page',
	'indicacao',
	'evento',
	'organico',
	'trafego_pago',
	'outro',
]);

export const professionEnum = pgEnum('profession', [
	'enfermeiro',
	'dentista',
	'biomedico',
	'farmaceutico',
	'medico',
	'esteticista',
	'outro',
]);

export const productEnum = pgEnum('product', [
	'trintae3',
	'otb',
	'black_neon',
	'comunidade',
	'auriculo',
	'na_mesa_certa',
]);

export const interestedProductEnum = pgEnum('interested_product', [
	'trintae3',
	'otb',
	'black_neon',
	'comunidade',
	'auriculo',
	'na_mesa_certa',
	'indefinido',
]);

export const mainPainEnum = pgEnum('main_pain', [
	'tecnica',
	'vendas',
	'gestao',
	'posicionamento',
	'escala',
	'certificacao',
	'outro',
]);

export const leadStageEnum = pgEnum('lead_stage', [
	'novo',
	'primeiro_contato',
	'qualificado',
	'proposta',
	'negociacao',
	'fechado_ganho',
	'fechado_perdido',
]);

export const lostReasonEnum = pgEnum('lost_reason', [
	'preco',
	'tempo',
	'concorrente',
	'sem_resposta',
	'nao_qualificado',
	'outro',
]);

export const temperatureEnum = pgEnum('temperature', ['frio', 'morno', 'quente']);

// ── Students ──
export const studentStatusEnum = pgEnum('student_status', [
	'ativo',
	'inativo',
	'pausado',
	'formado',
]);

export const churnRiskEnum = pgEnum('churn_risk', ['baixo', 'medio', 'alto']);

// ── Enrollments ──
export const enrollmentStatusEnum = pgEnum('enrollment_status', [
	'ativo',
	'concluido',
	'cancelado',
	'pausado',
	'aguardando_inicio',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
	'em_dia',
	'atrasado',
	'quitado',
	'cancelado',
]);

// ── Conversations ──
export const channelEnum = pgEnum('channel', ['whatsapp', 'instagram', 'portal', 'email']);

export const departmentEnum = pgEnum('department', ['vendas', 'cs', 'suporte']);

export const conversationStatusEnum = pgEnum('conversation_status', [
	'aguardando_atendente',
	'em_atendimento',
	'aguardando_cliente',
	'resolvido',
	'bot_ativo',
]);

// ── Messages ──
export const messageSenderEnum = pgEnum('message_sender', ['client', 'agent', 'bot', 'system']);

export const contentTypeEnum = pgEnum('content_type', [
	'text',
	'image',
	'audio',
	'document',
	'template',
]);

export const messageStatusEnum = pgEnum('message_status', [
	'enviando',
	'enviado',
	'entregue',
	'lido',
	'falhou',
]);

// ── Message Templates ──
export const templateCategoryEnum = pgEnum('template_category', [
	'abertura',
	'qualificacao',
	'apresentacao',
	'objecao_preco',
	'objecao_tempo',
	'objecao_outros_cursos',
	'follow_up',
	'fechamento',
	'pos_venda',
	'suporte',
]);

export const templateProductEnum = pgEnum('template_product', [
	'trintae3',
	'otb',
	'black_neon',
	'comunidade',
	'auriculo',
	'na_mesa_certa',
	'geral',
]);

// ── Activities ──
export const activityTypeEnum = pgEnum('activity_type', [
	'lead_criado',
	'lead_qualificado',
	'stage_changed',
	'mensagem_enviada',
	'mensagem_recebida',
	'ligacao',
	'email_enviado',
	'proposta_enviada',
	'venda_fechada',
	'matricula_criada',
	'pagamento_confirmado',
	'pagamento_atrasado',
	'modulo_concluido',
	'pratica_agendada',
	'pratica_concluida',
	'certificado_emitido',
	'ticket_aberto',
	'ticket_resolvido',
	'nota_adicionada',
	'atribuicao_alterada',
	'integracao_configurada',
	'user_created',
	'tag_criada',
	'tag_adicionada',
	'tag_removida',
	'tag_deletada',
	'task_created',
	'task_completed',
	'task_updated',
	'whatsapp_sent',
	'lead_reactivated',
	'system_task_reminder',
	'system_lead_reactivation',
	'lead_excluido',
]);

// ── Custom Fields ──
export const fieldTypeEnum = pgEnum('field_type', [
	'text',
	'number',
	'date',
	'select',
	'multiselect',
	'boolean',
]);

export const entityTypeEnum = pgEnum('entity_type', ['lead', 'student']);

// ── Notifications ──
export const notificationTypeEnum = pgEnum('notification_type', [
	'payment_confirmed',
	'payment_received',
	'payment_overdue',
	'payment_reminder',
	'enrollment_created',
	'system',
	'task_created',
	'task_completed',
	'task_updated',
	'task_reminder',
	'whatsapp_sent',
	'lead_reactivated',
	'task_assigned',
]);

export const recipientTypeEnum = pgEnum('recipient_type', ['student', 'lead', 'user']);

export const notificationChannelEnum = pgEnum('notification_channel', [
	'email',
	'whatsapp',
	'system',
]);

export const notificationStatusEnum = pgEnum('notification_status', ['pending', 'sent', 'failed']);

// ── LGPD ──
export const lgpdActionTypeEnum = pgEnum('lgpd_action_type', [
	'data_access',
	'data_creation',
	'data_modification',
	'data_deletion',
	'consent_granted',
	'consent_withdrawn',
	'data_export',
	'data_portability',
	'security_event',
	'data_breach',
]);

export const lgpdRequestTypeEnum = pgEnum('lgpd_request_type', [
	'access',
	'correction',
	'deletion',
	'portability',
	'information',
	'objection',
	'restriction',
]);

export const lgpdRequestStatusEnum = pgEnum('lgpd_request_status', [
	'pending',
	'processing',
	'completed',
	'rejected',
	'cancelled',
]);

export const breachTypeEnum = pgEnum('breach_type', [
	'hacker_attack',
	'internal_threat',
	'lost_device',
	'misconfigured_system',
	'third_party_breach',
	'physical_theft',
	'social_engineering',
]);

export const severityEnum = pgEnum('severity', ['low', 'medium', 'high', 'critical']);

// ── Marketing Leads ──
export const marketingInterestEnum = pgEnum('marketing_interest', [
	'Harmonização Facial',
	'Estética Corporal',
	'Bioestimuladores',
	'Outros',
]);

export const marketingLeadStatusEnum = pgEnum('marketing_lead_status', [
	'new',
	'contacted',
	'converted',
	'unsubscribed',
]);

// ── Email Marketing ──
export const emailSourceTypeEnum = pgEnum('email_source_type', ['lead', 'student']);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
	'subscribed',
	'unsubscribed',
	'pending',
]);

export const emailListSourceEnum = pgEnum('email_list_source', ['students', 'leads', 'both']);

export const syncStatusEnum = pgEnum('sync_status', ['pending', 'syncing', 'synced', 'error']);

export const emailCampaignStatusEnum = pgEnum('email_campaign_status', [
	'draft',
	'scheduled',
	'sending',
	'sent',
	'failed',
]);

export const emailEventTypeEnum = pgEnum('email_event_type', [
	'delivered',
	'opened',
	'clicked',
	'bounced',
	'spam',
	'unsubscribed',
]);

// ── ASAAS ──
export const asaasPaymentStatusEnum = pgEnum('asaas_payment_status', [
	'PENDING',
	'RECEIVED',
	'CONFIRMED',
	'OVERDUE',
	'REFUNDED',
	'RECEIVED_IN_CASH',
	'RECEIVED_IN_CASH_UNDONE',
	'CHARGEBACK_REQUESTED',
	'CHARGEBACK_DISPUTE',
	'AWAITING_CHARGEBACK_REVERSAL',
	'APPROVED_BY_RISK_ANALYSIS',
	'REJECTED_BY_RISK_ANALYSIS',
	'DELETED',
	'DUNNING_REQUESTED',
	'DUNNING_RECEIVED',
	'AWAITING_RISK_ANALYSIS',
	'CANCELLED',
]);

export const billingTypeEnum = pgEnum('billing_type', [
	'BOLETO',
	'PIX',
	'CREDIT_CARD',
	'DEBIT_CARD',
	'UNDEFINED',
]);

export const webhookStatusEnum = pgEnum('webhook_status', [
	'pending',
	'processing',
	'done',
	'failed',
]);

export const asaasSyncTypeEnum = pgEnum('asaas_sync_type', [
	'customers',
	'payments',
	'subscriptions',
	'financial',
]);

export const asaasSyncStatusEnum = pgEnum('asaas_sync_status', [
	'pending',
	'running',
	'completed',
	'failed',
]);

export const subscriptionCycleEnum = pgEnum('subscription_cycle', [
	'WEEKLY',
	'BIWEEKLY',
	'MONTHLY',
	'QUARTERLY',
	'SEMIANNUALLY',
	'YEARLY',
]);

export const asaasSubscriptionStatusEnum = pgEnum('asaas_subscription_status', [
	'ACTIVE',
	'INACTIVE',
	'CANCELLED',
	'EXPIRED',
]);

export const conflictTypeEnum = pgEnum('conflict_type', [
	'duplicate_customer',
	'payment_mismatch',
	'subscription_mismatch',
	'data_inconsistency',
]);

export const conflictStatusEnum = pgEnum('conflict_status', [
	'pending',
	'resolving',
	'resolved',
	'ignored',
]);

export const asaasAlertTypeEnum = pgEnum('asaas_alert_type', [
	'api_error',
	'sync_failure',
	'rate_limit',
	'webhook_timeout',
	'duplicate_detection',
	'data_integrity',
]);

export const alertStatusEnum = pgEnum('alert_status', [
	'active',
	'acknowledged',
	'resolved',
	'suppressed',
]);

export const asaasEnvironmentEnum = pgEnum('asaas_environment', ['production', 'sandbox']);

// ── Evolution API Queue ──
export const queueStatusEnum = pgEnum('queue_status', ['pending', 'processing', 'sent', 'failed']);

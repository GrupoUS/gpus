import { pgEnum } from 'drizzle-orm/pg-core';

// users
export const userRoleEnum = pgEnum('user_role', ['owner', 'admin', 'manager', 'member', 'sdr', 'cs', 'support']);
export const userInviteStatusEnum = pgEnum('user_invite_status', ['pending', 'accepted', 'expired', 'revoked']);

// leads
export const leadSourceEnum = pgEnum('lead_source', ['whatsapp', 'instagram', 'landing_page', 'indicacao', 'evento', 'organico', 'trafego_pago', 'outro']);
export const leadProfessionEnum = pgEnum('lead_profession', ['enfermeiro', 'dentista', 'biomedico', 'farmaceutico', 'medico', 'esteticista', 'outro']);
export const leadInterestedProductEnum = pgEnum('lead_interested_product', ['trintae3', 'otb', 'black_neon', 'comunidade', 'auriculo', 'na_mesa_certa', 'indefinido']);
export const leadMainPainEnum = pgEnum('lead_main_pain', ['tecnica', 'vendas', 'gestao', 'posicionamento', 'escala', 'certificacao', 'outro']);
export const leadStageEnum = pgEnum('lead_stage', ['novo', 'primeiro_contato', 'qualificado', 'proposta', 'negociacao', 'fechado_ganho', 'fechado_perdido']);
export const leadLostReasonEnum = pgEnum('lead_lost_reason', ['preco', 'tempo', 'concorrente', 'sem_resposta', 'nao_qualificado', 'outro']);
export const leadTemperatureEnum = pgEnum('lead_temperature', ['frio', 'morno', 'quente']);

// students
export const studentStatusEnum = pgEnum('student_status', ['ativo', 'inativo', 'pausado', 'formado']);
export const studentChurnRiskEnum = pgEnum('student_churn_risk', ['baixo', 'medio', 'alto']);

// enrollments
export const enrollmentProductEnum = pgEnum('enrollment_product', ['trintae3', 'otb', 'black_neon', 'comunidade', 'auriculo', 'na_mesa_certa']);
export const enrollmentStatusEnum = pgEnum('enrollment_status', ['ativo', 'concluido', 'cancelado', 'pausado', 'aguardando_inicio']);
export const enrollmentPaymentStatusEnum = pgEnum('enrollment_payment_status', ['em_dia', 'atrasado', 'quitado', 'cancelado']);

// conversations
export const conversationChannelEnum = pgEnum('conversation_channel', ['whatsapp', 'instagram', 'portal', 'email']);
export const conversationDepartmentEnum = pgEnum('conversation_department', ['vendas', 'cs', 'suporte']);
export const conversationStatusEnum = pgEnum('conversation_status', ['aguardando_atendente', 'em_atendimento', 'aguardando_cliente', 'resolvido', 'bot_ativo']);

// messages
export const messageSenderEnum = pgEnum('message_sender', ['client', 'agent', 'bot', 'system']);
export const messageContentTypeEnum = pgEnum('message_content_type', ['text', 'image', 'audio', 'document', 'template']);
export const messageStatusEnum = pgEnum('message_status', ['enviando', 'enviado', 'entregue', 'lido', 'falhou']);

// messageTemplates
export const messageTemplateCategoryEnum = pgEnum('message_template_category', ['abertura', 'qualificacao', 'apresentacao', 'objecao_preco', 'objecao_tempo', 'objecao_outros_cursos', 'follow_up', 'fechamento', 'pos_venda', 'suporte']);
export const messageTemplateProductEnum = pgEnum('message_template_product', ['trintae3', 'otb', 'black_neon', 'comunidade', 'auriculo', 'na_mesa_certa', 'geral']);

// activities
export const activityTypeEnum = pgEnum('activity_type', [
    'lead_criado', 'lead_qualificado', 'stage_changed', 'mensagem_enviada', 'mensagem_recebida', 'ligacao', 'email_enviado',
    'proposta_enviada', 'venda_fechada', 'matricula_criada', 'pagamento_confirmado', 'pagamento_atrasado', 'modulo_concluido',
    'pratica_agendada', 'pratica_concluida', 'certificado_emitido', 'ticket_aberto', 'ticket_resolvido', 'nota_adicionada',
    'atribuicao_alterada', 'integracao_configurada', 'user_created', 'tag_criada', 'tag_adicionada', 'tag_removida', 'tag_deletada',
    'task_created', 'task_completed', 'task_updated', 'whatsapp_sent', 'lead_reactivated', 'system_task_reminder',
    'system_lead_reactivation', 'lead_excluido'
]);

// customFields
export const customFieldTypeEnum = pgEnum('custom_field_type', ['text', 'number', 'date', 'select', 'multiselect', 'boolean']);
export const customFieldEntityTypeEnum = pgEnum('custom_field_entity_type', ['lead', 'student']);

// notifications
export const notificationTypeEnum = pgEnum('notification_type', [
    'payment_confirmed', 'payment_received', 'payment_overdue', 'payment_reminder', 'enrollment_created', 'system', 'task_assigned',
    'task_reminder', 'lead_assigned', 'conversation_assigned', 'mention'
]);

// settings
export const settingTypeEnum = pgEnum('setting_type', ['general', 'billing', 'notifications', 'integrations', 'team']);

// lgpdRequests
export const lgpdRequestTypeEnum = pgEnum('lgpd_request_type', ['access', 'rectification', 'erasure', 'portability']);
export const lgpdRequestStatusEnum = pgEnum('lgpd_request_status', ['pending', 'in_progress', 'completed', 'denied']);

// emailCampaigns
export const emailCampaignStatusEnum = pgEnum('email_campaign_status', ['draft', 'scheduled', 'sending', 'sent', 'archived']);

// asaasPayments
export const asaasPaymentStatusEnum = pgEnum('asaas_payment_status', [
    'PENDING', 'RECEIVED', 'CONFIRMED', 'OVERDUE', 'REFUNDED', 'RECEIVED_IN_CASH', 'REFUND_REQUESTED', 'CHARGEBACK_REQUESTED',
    'CHARGEBACK_DISPUTE', 'AWAITING_CHARGEBACK_REVERSAL', 'DUNNING_REQUESTED', 'DUNNING_RECEIVED', 'AWAITING_RISK_ANALYSIS'
]);

// asaasSubscriptions
export const asaasSubscriptionStatusEnum = pgEnum('asaas_subscription_status', ['ACTIVE', 'INACTIVE']);

// asaasAlerts
export const asaasAlertTypeEnum = pgEnum('asaas_alert_type', ['sync_error', 'conflict', 'webhook_failure', 'api_error']);

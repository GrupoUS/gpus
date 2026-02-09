import { relations } from 'drizzle-orm';
import { pgTable, text, integer, boolean, timestamp, jsonb, real, primaryKey } from 'drizzle-orm/pg-core';
import {
    userRoleEnum, userInviteStatusEnum, leadSourceEnum, leadProfessionEnum, leadInterestedProductEnum, leadMainPainEnum,
    leadStageEnum, leadLostReasonEnum, leadTemperatureEnum, studentStatusEnum, studentChurnRiskEnum, enrollmentProductEnum,
    enrollmentStatusEnum, enrollmentPaymentStatusEnum, conversationChannelEnum, conversationDepartmentEnum, conversationStatusEnum,
    messageSenderEnum, messageContentTypeEnum, messageStatusEnum, messageTemplateCategoryEnum, messageTemplateProductEnum,
    activityTypeEnum, customFieldTypeEnum, customFieldEntityTypeEnum, notificationTypeEnum, settingTypeEnum, lgpdRequestTypeEnum,
    lgpdRequestStatusEnum, emailCampaignStatusEnum, asaasPaymentStatusEnum, asaasSubscriptionStatusEnum, asaasAlertTypeEnum
} from './enums';

// ═══════════════════════════════════════════════════════
// USUÁRIOS DO SISTEMA (Time interno)
// ═══════════════════════════════════════════════════════
export const users = pgTable('users', {
    id: text('id').primaryKey(), // From Convex _id
    clerkId: text('clerk_id').notNull().unique(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    role: userRoleEnum('role').notNull(),
    avatar: text('avatar'),
    isActive: boolean('is_active').notNull().default(true),
    organizationId: text('organization_id'),
    organizationRole: text('organization_role'),
    preferences: jsonb('preferences'),
    inviteStatus: userInviteStatusEnum('invite_status'),
    invitedAt: timestamp('invited_at'),
    leadsAtribuidos: integer('leads_atribuidos'),
    conversoes: integer('conversoes'),
    tempoMedioResposta: integer('tempo_medio_resposta'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ═══════════════════════════════════════════════════════
// LEADS (Potenciais clientes)
// ═══════════════════════════════════════════════════════
export const leads = pgTable('leads', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone').notNull(),
    source: leadSourceEnum('source').notNull(),
    sourceDetail: text('source_detail'),
    utmSource: text('utm_source'),
    utmCampaign: text('utm_campaign'),
    utmMedium: text('utm_medium'),
    utmContent: text('utm_content'),
    utmTerm: text('utm_term'),
    message: text('message'),
    profession: leadProfessionEnum('profession'),
    hasClinic: boolean('has_clinic'),
    clinicName: text('clinic_name'),
    clinicCity: text('clinic_city'),
    yearsInAesthetics: integer('years_in_aesthetics'),
    currentRevenue: text('current_revenue'),
    interestedProduct: leadInterestedProductEnum('interested_product'),
    mainPain: leadMainPainEnum('main_pain'),
    mainDesire: text('main_desire'),
    stage: leadStageEnum('stage').notNull(),
    lostReason: leadLostReasonEnum('lost_reason'),
    assignedToId: text('assigned_to_id').references(() => users.id),
    temperature: leadTemperatureEnum('temperature').notNull(),
    score: integer('score'),
    lgpdConsent: boolean('lgpd_consent'),
    whatsappConsent: boolean('whatsapp_consent'),
    consentGrantedAt: timestamp('consent_granted_at'),
    consentVersion: text('consent_version'),
    organizationId: text('organization_id'),
    referredById: text('referred_by_id').references(() => leads.id),
    cashbackEarned: real('cashback_earned'),
    cashbackPaidAt: timestamp('cashback_paid_at'),
    lastContactAt: timestamp('last_contact_at'),
    nextFollowUpAt: timestamp('next_follow_up_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ═══════════════════════════════════════════════════════
// ALUNOS (Clientes convertidos)
// ═══════════════════════════════════════════════════════
export const students = pgTable('students', {
    id: text('id').primaryKey(),
    leadId: text('lead_id').references(() => leads.id),
    asaasCustomerId: text('asaas_customer_id'),
    asaasCustomerSyncedAt: timestamp('asaas_customer_synced_at'),
    asaasCustomerSyncError: text('asaas_customer_sync_error'),
    asaasCustomerSyncAttempts: integer('asaas_customer_sync_attempts'),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone').notNull(),
    cpfHash: text('cpf_hash'),
    encryptedCpf: text('encrypted_cpf'),
    encryptedEmail: text('encrypted_email'),
    encryptedPhone: text('encrypted_phone'),
    profession: text('profession').notNull(),
    products: jsonb('products'),
    professionalId: text('professional_id'),
    hasClinic: boolean('has_clinic').notNull(),
    clinicName: text('clinic_name'),
    clinicCity: text('clinic_city'),
    status: studentStatusEnum('status').notNull(),
    assignedCsId: text('assigned_cs_id').references(() => users.id),
    churnRisk: studentChurnRiskEnum('churn_risk').notNull(),
    lastEngagementAt: timestamp('last_engagement_at'),
    birthDate: timestamp('birth_date'),
    address: text('address'),
    addressNumber: text('address_number'),
    complement: text('complement'),
    neighborhood: text('neighborhood'),
    city: text('city'),
    state: text('state'),
    zipCode: text('zip_code'),
    country: text('country'),
    saleDate: timestamp('sale_date'),
    salesperson: text('salesperson'),
    contractStatus: text('contract_status'),
    leadSource: text('lead_source'),
    cohort: text('cohort'),
    lgpdConsent: boolean('lgpd_consent'),
    dataRetentionUntil: timestamp('data_retention_until'),
    consentGrantedAt: timestamp('consent_granted_at'),
    consentVersion: text('consent_version'),
    minorConsentRequired: boolean('minor_consent_required'),
    minorConsentGranted: boolean('minor_consent_granted'),
    organizationId: text('organization_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ═══════════════════════════════════════════════════════
// MATRÍCULAS (Produtos adquiridos)
// ═══════════════════════════════════════════════════════
export const enrollments = pgTable('enrollments', {
    id: text('id').primaryKey(),
    studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    product: enrollmentProductEnum('product').notNull(),
    cohort: text('cohort'),
    status: enrollmentStatusEnum('status').notNull(),
    startDate: timestamp('start_date'),
    expectedEndDate: timestamp('expected_end_date'),
    actualEndDate: timestamp('actual_end_date'),
    progress: integer('progress'),
    modulesCompleted: integer('modules_completed'),
    totalModules: integer('total_modules'),
    practicesCompleted: integer('practices_completed'),
    totalValue: real('total_value').notNull(),
    installments: integer('installments').notNull(),
    installmentValue: real('installment_value').notNull(),
    paidInstallments: integer('paid_installments'),
    paymentStatus: enrollmentPaymentStatusEnum('payment_status').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ... (O resto das tabelas seriam definidas aqui, seguindo o mesmo padrão)

// ═══════════════════════════════════════════════════════
// RELAÇÕES
// ═══════════════════════════════════════════════════════

export const usersRelations = relations(users, ({ many }) => ({
    assignedLeads: many(leads, { relationName: 'lead_assignee' }),
    assignedStudents: many(students, { relationName: 'student_assignee' }),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
    assignee: one(users, {
        fields: [leads.assignedToId],
        references: [users.id],
        relationName: 'lead_assignee'
    }),
    referrer: one(leads, {
        fields: [leads.referredById],
        references: [leads.id],
        relationName: 'lead_referrals'
    }),
    referrals: many(leads, { relationName: 'lead_referrals' }),
    student: one(students, {
        fields: [leads.id],
        references: [students.leadId]
    })
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
    lead: one(leads, {
        fields: [students.leadId],
        references: [leads.id]
    }),
    csAssignee: one(users, {
        fields: [students.assignedCsId],
        references: [users.id],
        relationName: 'student_assignee'
    }),
    enrollments: many(enrollments),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
    student: one(students, {
        fields: [enrollments.studentId],
        references: [students.id]
    }),
}));

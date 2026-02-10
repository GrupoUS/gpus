import {
	boolean,
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from 'drizzle-orm/pg-core';

import {
	alertStatusEnum,
	asaasAlertTypeEnum,
	asaasEnvironmentEnum,
	asaasPaymentStatusEnum,
	asaasSubscriptionStatusEnum,
	asaasSyncStatusEnum,
	asaasSyncTypeEnum,
	billingTypeEnum,
	conflictStatusEnum,
	conflictTypeEnum,
	queueStatusEnum,
	severityEnum,
	subscriptionCycleEnum,
	webhookStatusEnum,
} from '../enums';

// ── Asaas Payments ──
export const asaasPayments = pgTable(
	'asaas_payments',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		enrollmentId: integer(),
		studentId: integer().notNull(),
		organizationId: varchar({ length: 255 }),
		asaasPaymentId: varchar({ length: 255 }).notNull(),
		asaasCustomerId: varchar({ length: 255 }).notNull(),
		value: numeric({ precision: 12, scale: 2 }).notNull(),
		netValue: numeric({ precision: 12, scale: 2 }),
		installmentNumber: integer(),
		totalInstallments: integer(),
		status: asaasPaymentStatusEnum().notNull(),
		dueDate: timestamp({ withTimezone: true }).notNull(),
		confirmedDate: timestamp({ withTimezone: true }),
		billingType: billingTypeEnum().notNull(),
		boletoUrl: text(),
		boletoBarcode: text(),
		pixQrCode: text(),
		pixQrCodeBase64: text(),
		description: text(),
		externalReference: varchar({ length: 255 }),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('asaas_payments_enrollment_idx').on(t.enrollmentId),
		index('asaas_payments_student_idx').on(t.studentId),
		index('asaas_payments_org_idx').on(t.organizationId),
		uniqueIndex('asaas_payments_payment_id_idx').on(t.asaasPaymentId),
		index('asaas_payments_status_idx').on(t.status),
		index('asaas_payments_due_date_idx').on(t.dueDate),
		index('asaas_payments_org_student_status_idx').on(t.organizationId, t.studentId, t.status),
		index('asaas_payments_org_due_status_idx').on(t.organizationId, t.dueDate, t.status),
		index('asaas_payments_org_status_idx').on(t.organizationId, t.status),
	],
);

// ── Asaas Webhooks ──
export const asaasWebhooks = pgTable(
	'asaas_webhooks',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		eventId: varchar({ length: 255 }),
		event: varchar({ length: 255 }).notNull(),
		paymentId: varchar({ length: 255 }),
		subscriptionId: varchar({ length: 255 }),
		customerId: varchar({ length: 255 }),
		payload: text(),
		processed: boolean().notNull(),
		status: webhookStatusEnum(),
		retryCount: integer(),
		lastAttemptAt: timestamp({ withTimezone: true }),
		processedAt: timestamp({ withTimezone: true }),
		error: text(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		retentionUntil: timestamp({ withTimezone: true }).notNull(),
	},
	(t) => [
		index('asaas_webhooks_event_id_idx').on(t.eventId),
		index('asaas_webhooks_status_idx').on(t.status),
		index('asaas_webhooks_created_idx').on(t.createdAt),
		index('asaas_webhooks_payment_idx').on(t.paymentId),
		index('asaas_webhooks_processed_idx').on(t.processed),
		index('asaas_webhooks_retention_idx').on(t.retentionUntil),
	],
);

// ── Asaas Webhook Deduplication ──
export const asaasWebhookDeduplication = pgTable(
	'asaas_webhook_deduplication',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		idempotencyKey: varchar({ length: 255 }).notNull(),
		processedAt: timestamp({ withTimezone: true }).notNull(),
		expiresAt: timestamp({ withTimezone: true }).notNull(),
	},
	(t) => [
		uniqueIndex('asaas_dedup_key_idx').on(t.idempotencyKey),
		index('asaas_dedup_expires_idx').on(t.expiresAt),
	],
);

// ── Asaas Subscriptions ──
export const asaasSubscriptions = pgTable(
	'asaas_subscriptions',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		enrollmentId: integer(),
		studentId: integer().notNull(),
		asaasSubscriptionId: varchar({ length: 255 }).notNull(),
		asaasCustomerId: varchar({ length: 255 }).notNull(),
		organizationId: varchar({ length: 255 }),
		value: numeric({ precision: 12, scale: 2 }).notNull(),
		cycle: subscriptionCycleEnum().notNull(),
		status: asaasSubscriptionStatusEnum().notNull(),
		description: text(),
		nextDueDate: timestamp({ withTimezone: true }).notNull(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('asaas_subs_enrollment_idx').on(t.enrollmentId),
		index('asaas_subs_student_idx').on(t.studentId),
		index('asaas_subs_org_idx').on(t.organizationId),
		uniqueIndex('asaas_subs_subscription_id_idx').on(t.asaasSubscriptionId),
	],
);

// ── Asaas Sync Logs ──
export const asaasSyncLogs = pgTable(
	'asaas_sync_logs',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		organizationId: varchar({ length: 255 }),
		syncType: asaasSyncTypeEnum().notNull(),
		status: asaasSyncStatusEnum().notNull(),
		startedAt: timestamp({ withTimezone: true }).notNull(),
		completedAt: timestamp({ withTimezone: true }),
		recordsProcessed: integer().notNull().default(0),
		recordsCreated: integer().notNull().default(0),
		recordsUpdated: integer().notNull().default(0),
		recordsFailed: integer().notNull().default(0),
		errors: jsonb().$type<string[]>(),
		lastError: text(),
		filters: jsonb().$type<{ startDate?: string; endDate?: string; status?: string }>(),
		initiatedBy: varchar({ length: 255 }).notNull(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('asaas_sync_org_idx').on(t.organizationId),
		index('asaas_sync_type_idx').on(t.syncType),
		index('asaas_sync_status_idx').on(t.status),
		index('asaas_sync_created_idx').on(t.createdAt),
		index('asaas_sync_initiated_idx').on(t.initiatedBy),
		index('asaas_sync_org_created_idx').on(t.organizationId, t.createdAt),
	],
);

// ── Asaas API Audit ──
export const asaasApiAudit = pgTable(
	'asaas_api_audit',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		endpoint: varchar({ length: 500 }).notNull(),
		method: varchar({ length: 10 }).notNull(),
		statusCode: integer().notNull(),
		responseTime: integer().notNull(),
		userId: varchar({ length: 255 }),
		errorMessage: text(),
		timestamp: timestamp({ withTimezone: true }).notNull(),
	},
	(t) => [
		index('asaas_audit_timestamp_idx').on(t.timestamp),
		index('asaas_audit_endpoint_idx').on(t.endpoint, t.timestamp),
	],
);

// ── Financial Metrics ──
export const financialMetrics = pgTable(
	'financial_metrics',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		organizationId: varchar({ length: 255 }),
		totalReceived: numeric({ precision: 14, scale: 2 }).notNull(),
		totalPending: numeric({ precision: 14, scale: 2 }).notNull(),
		totalOverdue: numeric({ precision: 14, scale: 2 }).notNull(),
		totalValue: numeric({ precision: 14, scale: 2 }).notNull(),
		paymentsCount: integer().notNull(),
		periodStart: varchar({ length: 10 }),
		periodEnd: varchar({ length: 10 }),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [index('financial_metrics_org_idx').on(t.organizationId)],
);

// ── Asaas Conflicts ──
export const asaasConflicts = pgTable(
	'asaas_conflicts',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		conflictType: conflictTypeEnum().notNull(),
		status: conflictStatusEnum().notNull().default('pending'),
		studentId: integer(),
		asaasCustomerId: varchar({ length: 255 }),
		asaasPaymentId: varchar({ length: 255 }),
		asaasSubscriptionId: varchar({ length: 255 }),
		localData: jsonb(),
		remoteData: jsonb(),
		field: varchar({ length: 255 }),
		resolvedAt: timestamp({ withTimezone: true }),
		resolvedBy: varchar({ length: 255 }),
		resolutionNote: text(),
		organizationId: varchar({ length: 255 }),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('asaas_conflicts_status_idx').on(t.status),
		index('asaas_conflicts_type_idx').on(t.conflictType),
		index('asaas_conflicts_org_idx').on(t.organizationId),
		index('asaas_conflicts_student_idx').on(t.studentId),
		index('asaas_conflicts_customer_idx').on(t.asaasCustomerId),
		index('asaas_conflicts_created_idx').on(t.createdAt),
	],
);

// ── Asaas Alerts ──
export const asaasAlerts = pgTable(
	'asaas_alerts',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		alertType: asaasAlertTypeEnum().notNull(),
		severity: severityEnum().notNull(),
		status: alertStatusEnum().notNull().default('active'),
		title: varchar({ length: 500 }).notNull(),
		message: text().notNull(),
		details: jsonb(),
		studentId: integer(),
		paymentId: integer(),
		subscriptionId: integer(),
		syncLogId: integer(),
		count: integer().notNull().default(1),
		resolvedAt: timestamp({ withTimezone: true }),
		resolvedBy: varchar({ length: 255 }),
		resolutionNote: text(),
		suppressedUntil: timestamp({ withTimezone: true }),
		organizationId: varchar({ length: 255 }),
		firstSeenAt: timestamp({ withTimezone: true }).notNull(),
		lastSeenAt: timestamp({ withTimezone: true }).notNull(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('asaas_alerts_status_idx').on(t.status),
		index('asaas_alerts_severity_idx').on(t.severity),
		index('asaas_alerts_type_idx').on(t.alertType),
		index('asaas_alerts_org_idx').on(t.organizationId),
		index('asaas_alerts_org_active_idx').on(t.organizationId, t.status, t.severity),
		index('asaas_alerts_last_seen_idx').on(t.lastSeenAt),
		index('asaas_alerts_suppressed_idx').on(t.suppressedUntil),
	],
);

// ── Organization Asaas API Keys ──
export const organizationAsaasApiKeys = pgTable(
	'organization_asaas_api_keys',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		organizationId: varchar({ length: 255 }).notNull(),
		encryptedApiKey: text().notNull(),
		baseUrl: varchar({ length: 500 }).notNull(),
		environment: asaasEnvironmentEnum().notNull(),
		encryptedWebhookSecret: text(),
		isActive: boolean().notNull().default(true),
		lastTestedAt: timestamp({ withTimezone: true }),
		lastTestResult: boolean(),
		lastTestMessage: text(),
		createdBy: varchar({ length: 255 }).notNull(),
		updatedBy: varchar({ length: 255 }),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('org_asaas_keys_org_idx').on(t.organizationId),
		index('org_asaas_keys_org_active_idx').on(t.organizationId, t.isActive),
	],
);

// ── Rate Limits ──
export const rateLimits = pgTable(
	'rate_limits',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		identifier: varchar({ length: 255 }).notNull(),
		action: varchar({ length: 100 }).notNull(),
		timestamp: timestamp({ withTimezone: true }).notNull(),
	},
	(t) => [
		index('rate_limits_id_action_idx').on(t.identifier, t.action),
		index('rate_limits_timestamp_idx').on(t.timestamp),
	],
);

// ── Evolution API Queue ──
export const evolutionApiQueue = pgTable(
	'evolution_api_queue',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		organizationId: varchar({ length: 255 }).notNull(),
		leadId: integer().notNull(),
		message: text().notNull(),
		status: queueStatusEnum().notNull().default('pending'),
		attempts: integer().notNull().default(0),
		lastAttemptAt: timestamp({ withTimezone: true }),
		scheduledFor: timestamp({ withTimezone: true }).notNull(),
		errorMessage: text(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('evo_queue_org_idx').on(t.organizationId),
		index('evo_queue_status_idx').on(t.status),
		index('evo_queue_scheduled_idx').on(t.scheduledFor),
		index('evo_queue_org_status_idx').on(t.organizationId, t.status),
		index('evo_queue_lead_idx').on(t.leadId),
	],
);

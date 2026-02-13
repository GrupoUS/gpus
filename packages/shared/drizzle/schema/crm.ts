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
	activityTypeEnum,
	entityTypeEnum,
	fieldTypeEnum,
	interestedProductEnum,
	leadSourceEnum,
	leadStageEnum,
	lostReasonEnum,
	mainPainEnum,
	professionEnum,
	temperatureEnum,
} from '../enums';

// ── Leads ──
export const leads = pgTable(
	'leads',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		organizationId: varchar({ length: 255 }),
		name: varchar({ length: 255 }).notNull(),
		email: varchar({ length: 255 }),
		phone: varchar({ length: 50 }),
		source: leadSourceEnum().notNull().default('outro'),
		sourceDetail: varchar({ length: 255 }),
		// UTM Tracking
		utmSource: varchar({ length: 255 }),
		utmCampaign: varchar({ length: 255 }),
		utmMedium: varchar({ length: 255 }),
		utmContent: varchar({ length: 255 }),
		utmTerm: varchar({ length: 255 }),
		// Qualification
		message: text(),
		profession: professionEnum(),
		hasClinic: boolean(),
		clinicName: varchar({ length: 255 }),
		clinicCity: varchar({ length: 255 }),
		yearsInAesthetics: integer(),
		currentRevenue: varchar({ length: 100 }),
		interestedProduct: interestedProductEnum(),
		mainPain: mainPainEnum(),
		mainDesire: text(),
		// CRM State
		stage: leadStageEnum().notNull().default('novo'),
		temperature: temperatureEnum().default('frio'),
		score: integer(),
		lostReason: lostReasonEnum(),
		lostDetails: text(),
		reactivatedAt: timestamp({ withTimezone: true }),
		reactivatedBy: varchar({ length: 255 }),
		previousStage: leadStageEnum(),
		observations: text(),
		assignedTo: varchar({ length: 255 }),
		convertedAt: timestamp({ withTimezone: true }),
		studentId: integer(),
		// LGPD Consent
		lgpdConsent: boolean(),
		whatsappConsent: boolean(),
		consentGrantedAt: timestamp({ withTimezone: true }),
		consentVersion: varchar({ length: 50 }),
		// Referral & Cashback
		referredById: integer(),
		cashbackEarned: numeric({ precision: 12, scale: 2 }),
		cashbackPaidAt: timestamp({ withTimezone: true }),
		// Timestamps
		lastContactAt: timestamp({ withTimezone: true }),
		nextFollowUpAt: timestamp({ withTimezone: true }),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('leads_organization_idx').on(t.organizationId),
		index('leads_stage_idx').on(t.stage),
		index('leads_assigned_idx').on(t.assignedTo),
		index('leads_organization_stage_idx').on(t.organizationId, t.stage),
		index('leads_organization_assigned_idx').on(t.organizationId, t.assignedTo),
		index('leads_organization_created_idx').on(t.organizationId, t.createdAt),
	],
);

// ── Objections (per-lead objection recording) ──
export const objections = pgTable(
	'objections',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		organizationId: varchar({ length: 255 }),
		leadId: integer(),
		objectionText: text().notNull(),
		resolved: boolean().notNull().default(false),
		resolution: text(),
		recordedBy: varchar({ length: 255 }).notNull(),
		recordedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('objections_lead_idx').on(t.leadId),
		index('objections_organization_idx').on(t.organizationId),
		index('objections_resolved_idx').on(t.resolved),
	],
);

// ── Activities ──
export const activities = pgTable(
	'activities',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		organizationId: varchar({ length: 255 }),
		type: activityTypeEnum().notNull(),
		description: text().notNull(),
		leadId: integer(),
		studentId: integer(),
		enrollmentId: integer(),
		conversationId: integer(),
		userId: varchar({ length: 255 }),
		performedBy: varchar({ length: 255 }),
		metadata: jsonb(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('activities_organization_idx').on(t.organizationId),
		index('activities_type_idx').on(t.type),
		index('activities_lead_idx').on(t.leadId),
		index('activities_student_idx').on(t.studentId),
		index('activities_user_idx').on(t.userId),
		index('activities_created_idx').on(t.createdAt),
		index('activities_organization_created_idx').on(t.organizationId, t.createdAt),
	],
);

// ── Tasks ──
export const tasks = pgTable(
	'tasks',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		organizationId: varchar({ length: 255 }),
		title: varchar({ length: 500 }),
		description: text().notNull(),
		status: varchar({ length: 50 }).notNull().default('pending'),
		priority: varchar({ length: 20 }).notNull().default('medium'),
		dueDate: timestamp({ withTimezone: true }),
		completedAt: timestamp({ withTimezone: true }),
		remindedAt: timestamp({ withTimezone: true }),
		assignedTo: varchar({ length: 255 }),
		createdBy: varchar({ length: 255 }).notNull(),
		leadId: integer(),
		studentId: integer(),
		// Recurring
		isRecurring: boolean().default(false),
		recurrencePattern: varchar({ length: 50 }),
		recurrenceEndDate: timestamp({ withTimezone: true }),
		parentTaskId: integer(),
		// Auto-generation
		isAutoGenerated: boolean().default(false),
		autoGenerationType: varchar({ length: 100 }),
		// Mention IDs (denormalized for display, taskMentions is source of truth)
		mentionedUserIds: jsonb().$type<string[]>(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('tasks_organization_idx').on(t.organizationId),
		index('tasks_assigned_idx').on(t.assignedTo),
		index('tasks_status_idx').on(t.status),
		index('tasks_lead_idx').on(t.leadId),
		index('tasks_student_idx').on(t.studentId),
		index('tasks_due_date_idx').on(t.dueDate),
		index('tasks_organization_status_idx').on(t.organizationId, t.status),
		index('tasks_organization_assigned_idx').on(t.organizationId, t.assignedTo),
		index('tasks_created_idx').on(t.createdAt),
	],
);

// ── Task Mentions ──
export const taskMentions = pgTable(
	'task_mentions',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		taskId: integer().notNull(),
		userId: varchar({ length: 255 }).notNull(),
		organizationId: varchar({ length: 255 }),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('task_mentions_task_idx').on(t.taskId),
		index('task_mentions_user_idx').on(t.userId),
		index('task_mentions_organization_idx').on(t.organizationId),
	],
);

// ── Custom Fields ──
export const customFields = pgTable(
	'custom_fields',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		organizationId: varchar({ length: 255 }).notNull(),
		name: varchar({ length: 255 }).notNull(),
		entityType: entityTypeEnum().notNull(),
		label: varchar({ length: 255 }),
		fieldType: fieldTypeEnum().notNull(),
		description: text(),
		options: jsonb().$type<string[]>(),
		isRequired: boolean().default(false),
		active: boolean().notNull().default(true),
		displayOrder: integer(),
		createdBy: varchar({ length: 255 }),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('custom_fields_organization_idx').on(t.organizationId),
		index('custom_fields_entity_type_idx').on(t.entityType),
		index('custom_fields_org_entity_idx').on(t.organizationId, t.entityType),
	],
);

// ── Custom Field Values ──
export const customFieldValues = pgTable(
	'custom_field_values',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		customFieldId: integer().notNull(),
		entityId: varchar({ length: 255 }).notNull(),
		entityType: entityTypeEnum().notNull(),
		value: text(),
		organizationId: varchar({ length: 255 }),
		updatedBy: varchar({ length: 255 }),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('custom_field_values_field_idx').on(t.customFieldId),
		uniqueIndex('custom_field_values_field_entity_idx').on(t.customFieldId, t.entityId),
		index('custom_field_values_entity_idx').on(t.entityType, t.entityId),
		index('custom_field_values_organization_idx').on(t.organizationId),
	],
);

// ── Tags ──
export const tags = pgTable(
	'tags',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		name: varchar({ length: 255 }).notNull(),
		displayName: varchar({ length: 255 }),
		color: varchar({ length: 20 }),
		organizationId: varchar({ length: 255 }).notNull(),
		createdBy: varchar({ length: 255 }).notNull(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('tags_organization_idx').on(t.organizationId),
		uniqueIndex('tags_org_name_idx').on(t.organizationId, t.name),
	],
);

// ── Lead Tags (join table) ──
export const leadTags = pgTable(
	'lead_tags',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		leadId: integer().notNull(),
		tagId: integer().notNull(),
		organizationId: varchar({ length: 255 }).notNull(),
		addedBy: varchar({ length: 255 }).notNull(),
		addedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('lead_tags_lead_idx').on(t.leadId),
		index('lead_tags_tag_idx').on(t.tagId),
		index('lead_tags_organization_idx').on(t.organizationId),
	],
);

// ── Daily Metrics ──
export const dailyMetrics = pgTable(
	'daily_metrics',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		organizationId: varchar({ length: 255 }),
		date: varchar({ length: 10 }).notNull(),
		// Leads
		newLeads: integer().default(0),
		leadsBySource: jsonb(),
		leadsByProduct: jsonb(),
		qualifiedLeads: integer().default(0),
		// Conversions
		conversions: integer().default(0),
		conversionValue: numeric({ precision: 14, scale: 2 }),
		conversionsByProduct: jsonb(),
		closedWon: integer().default(0),
		closedLost: integer().default(0),
		conversionRate: integer(),
		// Messaging
		messagesSent: integer().default(0),
		messagesReceived: integer().default(0),
		avgResponseTime: integer(),
		botResolutionRate: integer(),
		// Per-user metrics
		userMetrics: jsonb(),
		// Drizzle extras
		revenueGenerated: integer().default(0),
		activitiesLogged: integer().default(0),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('daily_metrics_organization_idx').on(t.organizationId),
		index('daily_metrics_date_idx').on(t.date),
		uniqueIndex('daily_metrics_org_date_idx').on(t.organizationId, t.date),
	],
);

// ── Settings (key-value store, Convex-aligned) ──
export const settings = pgTable(
	'settings',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		key: varchar({ length: 255 }).notNull(),
		value: jsonb(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [uniqueIndex('settings_key_idx').on(t.key)],
);

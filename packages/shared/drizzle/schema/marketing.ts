import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	varchar,
} from 'drizzle-orm/pg-core';

import {
	emailCampaignStatusEnum,
	emailEventTypeEnum,
	emailListSourceEnum,
	emailSourceTypeEnum,
	marketingInterestEnum,
	marketingLeadStatusEnum,
	subscriptionStatusEnum,
	syncStatusEnum,
} from '../enums';

// ── Marketing Leads ──
export const marketingLeads = pgTable(
	'marketing_leads',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		name: varchar({ length: 255 }).notNull(),
		email: varchar({ length: 255 }).notNull(),
		phone: varchar({ length: 50 }).notNull(),
		interest: marketingInterestEnum().notNull(),
		message: text(),
		lgpdConsent: boolean().notNull(),
		whatsappConsent: boolean().notNull(),
		utmSource: varchar({ length: 255 }),
		utmCampaign: varchar({ length: 255 }),
		utmMedium: varchar({ length: 255 }),
		utmContent: varchar({ length: 255 }),
		utmTerm: varchar({ length: 255 }),
		status: marketingLeadStatusEnum().notNull().default('new'),
		honeypot: varchar({ length: 255 }),
		company: varchar({ length: 255 }),
		jobRole: varchar({ length: 255 }),
		origin: varchar({ length: 255 }),
		source: varchar({ length: 255 }),
		typebotId: varchar({ length: 255 }),
		resultId: varchar({ length: 255 }),
		externalTimestamp: timestamp({ withTimezone: true }),
		landingPage: varchar({ length: 255 }),
		landingPageUrl: text(),
		organizationId: varchar({ length: 255 }),
		brevoContactId: varchar({ length: 255 }),
		lastSyncedAt: timestamp({ withTimezone: true }),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('marketing_leads_email_idx').on(t.email),
		index('marketing_leads_status_idx').on(t.status),
		index('marketing_leads_created_idx').on(t.createdAt),
		index('marketing_leads_org_idx').on(t.organizationId),
		index('marketing_leads_org_status_idx').on(t.organizationId, t.status),
		index('marketing_leads_org_created_idx').on(t.organizationId, t.createdAt),
		index('marketing_leads_source_idx').on(t.source),
		index('marketing_leads_landing_idx').on(t.landingPage),
		index('marketing_leads_org_landing_idx').on(t.organizationId, t.landingPage),
	],
);

// ── Email Contacts ──
export const emailContacts = pgTable(
	'email_contacts',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		brevoId: varchar({ length: 255 }),
		email: varchar({ length: 255 }).notNull(),
		firstName: varchar({ length: 255 }),
		lastName: varchar({ length: 255 }),
		sourceType: emailSourceTypeEnum().notNull(),
		sourceId: varchar({ length: 255 }),
		leadId: integer(),
		studentId: integer(),
		organizationId: varchar({ length: 255 }).notNull(),
		subscriptionStatus: subscriptionStatusEnum().notNull().default('pending'),
		consentId: integer(),
		listIds: jsonb().$type<number[]>(),
		lastSyncedAt: timestamp({ withTimezone: true }),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('email_contacts_brevo_idx').on(t.brevoId),
		index('email_contacts_email_idx').on(t.email),
		index('email_contacts_org_idx').on(t.organizationId),
		index('email_contacts_source_type_idx').on(t.sourceType),
		index('email_contacts_subscription_idx').on(t.subscriptionStatus),
		index('email_contacts_lead_idx').on(t.leadId),
		index('email_contacts_student_idx').on(t.studentId),
	],
);

// ── Email Lists ──
export const emailLists = pgTable(
	'email_lists',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		brevoListId: integer(),
		name: varchar({ length: 255 }).notNull(),
		description: text(),
		organizationId: varchar({ length: 255 }).notNull(),
		sourceType: emailListSourceEnum(),
		products: jsonb().$type<string[]>(),
		filters: jsonb().$type<{ activeOnly: boolean; qualifiedOnly: boolean }>(),
		contactCount: integer().notNull().default(0),
		isActive: boolean().notNull().default(true),
		syncStatus: syncStatusEnum(),
		lastSyncedAt: timestamp({ withTimezone: true }),
		syncError: text(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('email_lists_brevo_idx').on(t.brevoListId),
		index('email_lists_org_idx').on(t.organizationId),
		index('email_lists_active_idx').on(t.isActive),
	],
);

// ── Email Campaigns ──
export const emailCampaigns = pgTable(
	'email_campaigns',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		brevoCampaignId: integer(),
		name: varchar({ length: 255 }).notNull(),
		subject: varchar({ length: 500 }).notNull(),
		htmlContent: text(),
		templateId: integer(),
		listIds: jsonb().$type<number[]>().notNull(),
		status: emailCampaignStatusEnum().notNull().default('draft'),
		scheduledAt: timestamp({ withTimezone: true }),
		sentAt: timestamp({ withTimezone: true }),
		organizationId: varchar({ length: 255 }).notNull(),
		stats: jsonb().$type<{
			sent: number;
			delivered: number;
			opened: number;
			clicked: number;
			bounced: number;
			unsubscribed: number;
		}>(),
		createdBy: integer().notNull(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('email_campaigns_brevo_idx').on(t.brevoCampaignId),
		index('email_campaigns_org_idx').on(t.organizationId),
		index('email_campaigns_status_idx').on(t.status),
		index('email_campaigns_created_by_idx').on(t.createdBy),
	],
);

// ── Email Templates ──
export const emailTemplates = pgTable(
	'email_templates',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		brevoTemplateId: integer(),
		name: varchar({ length: 255 }).notNull(),
		subject: varchar({ length: 500 }).notNull(),
		htmlContent: text().notNull(),
		design: jsonb(),
		category: varchar({ length: 100 }),
		organizationId: varchar({ length: 255 }).notNull(),
		isActive: boolean().notNull().default(true),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('email_templates_brevo_idx').on(t.brevoTemplateId),
		index('email_templates_org_idx').on(t.organizationId),
		index('email_templates_category_idx').on(t.category),
		index('email_templates_active_idx').on(t.isActive),
	],
);

// ── Email Events ──
export const emailEvents = pgTable(
	'email_events',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		campaignId: integer(),
		contactId: integer(),
		email: varchar({ length: 255 }).notNull(),
		eventType: emailEventTypeEnum().notNull(),
		link: text(),
		bounceType: varchar({ length: 50 }),
		brevoMessageId: varchar({ length: 255 }),
		timestamp: timestamp({ withTimezone: true }).notNull(),
		metadata: jsonb(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('email_events_campaign_idx').on(t.campaignId),
		index('email_events_contact_idx').on(t.contactId),
		index('email_events_type_idx').on(t.eventType),
		index('email_events_email_idx').on(t.email),
		index('email_events_timestamp_idx').on(t.timestamp),
	],
);

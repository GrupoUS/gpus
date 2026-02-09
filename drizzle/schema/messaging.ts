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
	channelEnum,
	contentTypeEnum,
	conversationStatusEnum,
	departmentEnum,
	messageSenderEnum,
	messageStatusEnum,
	notificationChannelEnum,
	notificationStatusEnum,
	notificationTypeEnum,
	recipientTypeEnum,
	templateCategoryEnum,
	templateProductEnum,
} from '../enums';

// ── Conversations ──
export const conversations = pgTable(
	'conversations',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		organizationId: varchar({ length: 255 }),
		leadId: integer(),
		studentId: integer(),
		channel: channelEnum().notNull(),
		externalId: varchar({ length: 255 }),
		department: departmentEnum().default('vendas'),
		status: conversationStatusEnum().notNull().default('aguardando_atendente'),
		assignedTo: varchar({ length: 255 }),
		// Bot/AI fields (from Convex)
		lastBotMessage: text(),
		handoffReason: text(),
		// Performance metrics (from Convex)
		firstResponseAt: timestamp({ withTimezone: true }),
		resolvedAt: timestamp({ withTimezone: true }),
		satisfactionScore: integer(),
		// Existing Drizzle fields
		lastMessageAt: timestamp({ withTimezone: true }),
		unreadCount: integer().default(0),
		closedAt: timestamp({ withTimezone: true }),
		closedBy: varchar({ length: 255 }),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('conversations_organization_idx').on(t.organizationId),
		index('conversations_lead_idx').on(t.leadId),
		index('conversations_student_idx').on(t.studentId),
		index('conversations_channel_idx').on(t.channel),
		index('conversations_status_idx').on(t.status),
		index('conversations_assigned_idx').on(t.assignedTo),
		index('conversations_org_status_idx').on(t.organizationId, t.status),
	],
);

// ── Messages ──
export const messages = pgTable(
	'messages',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		conversationId: integer().notNull(),
		sender: messageSenderEnum().notNull(),
		senderId: varchar({ length: 255 }),
		contentType: contentTypeEnum().notNull().default('text'),
		content: text().notNull(),
		mediaUrl: text(),
		externalId: varchar({ length: 255 }),
		// From Convex
		templateId: integer(),
		aiGenerated: boolean(),
		aiConfidence: integer(),
		detectedIntent: varchar({ length: 100 }),
		// Existing
		status: messageStatusEnum().default('enviado'),
		metadata: jsonb(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('messages_conversation_idx').on(t.conversationId),
		index('messages_sender_idx').on(t.sender),
		index('messages_created_idx').on(t.createdAt),
		index('messages_conv_created_idx').on(t.conversationId, t.createdAt),
	],
);

// ── Message Templates ──
export const messageTemplates = pgTable(
	'message_templates',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		organizationId: varchar({ length: 255 }),
		title: varchar({ length: 255 }).notNull(),
		content: text().notNull(),
		category: templateCategoryEnum().notNull(),
		product: templateProductEnum().default('geral'),
		variables: jsonb().$type<string[]>(),
		usageCount: integer().default(0),
		isActive: boolean().default(true),
		createdBy: varchar({ length: 255 }).notNull(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('message_templates_org_idx').on(t.organizationId),
		index('message_templates_category_idx').on(t.category),
		index('message_templates_product_idx').on(t.product),
	],
);

// ── Notifications ──
export const notifications = pgTable(
	'notifications',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		organizationId: varchar({ length: 255 }),
		type: notificationTypeEnum().notNull(),
		title: varchar({ length: 500 }).notNull(),
		message: text().notNull(),
		recipientId: varchar({ length: 255 }).notNull(),
		recipientType: recipientTypeEnum().notNull(),
		channel: notificationChannelEnum().notNull().default('system'),
		status: notificationStatusEnum().notNull().default('pending'),
		entityId: varchar({ length: 255 }),
		entityType: varchar({ length: 50 }),
		// From Convex
		read: boolean().default(false),
		link: text(),
		// Drizzle timestamps (improvement: track when read/sent)
		readAt: timestamp({ withTimezone: true }),
		sentAt: timestamp({ withTimezone: true }),
		metadata: jsonb(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('notifications_recipient_idx').on(t.recipientId),
		index('notifications_type_idx').on(t.type),
		index('notifications_status_idx').on(t.status),
		index('notifications_org_idx').on(t.organizationId),
		index('notifications_org_recipient_idx').on(t.organizationId, t.recipientId),
		index('notifications_recipient_read_idx').on(t.recipientId, t.read),
	],
);

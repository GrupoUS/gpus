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
	breachTypeEnum,
	lgpdActionTypeEnum,
	lgpdRequestStatusEnum,
	lgpdRequestTypeEnum,
	severityEnum,
} from '../enums';

// ── LGPD Consent (Convex-aligned: per consent type) ──
export const lgpdConsent = pgTable(
	'lgpd_consent',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		studentId: integer().notNull(),
		consentType: varchar({ length: 100 }).notNull(),
		consentVersion: varchar({ length: 50 }).notNull(),
		granted: boolean().notNull(),
		grantedAt: timestamp({ withTimezone: true }).notNull(),
		expiresAt: timestamp({ withTimezone: true }),
		ipAddress: varchar({ length: 45 }),
		userAgent: text(),
		justification: text(),
		dataCategories: jsonb().$type<string[]>().notNull(),
		rightsWithdrawal: boolean().notNull().default(false),
		withdrawalAt: timestamp({ withTimezone: true }),
		withdrawalReason: text(),
		// Drizzle extras (keep for compatibility)
		legalBasis: varchar({ length: 100 }),
		description: text(),
		isActive: boolean().notNull().default(true),
		revokedAt: timestamp({ withTimezone: true }),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('lgpd_consent_student_idx').on(t.studentId),
		index('lgpd_consent_type_idx').on(t.consentType),
		index('lgpd_consent_granted_idx').on(t.granted),
		index('lgpd_consent_expires_idx').on(t.expiresAt),
		index('lgpd_consent_active_idx').on(t.isActive),
		index('lgpd_consent_legal_basis_idx').on(t.legalBasis),
	],
);

// ── LGPD Audit (Convex-aligned) ──
export const lgpdAudit = pgTable(
	'lgpd_audit',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		studentId: integer(),
		actionType: lgpdActionTypeEnum().notNull(),
		actorId: varchar({ length: 255 }).notNull(),
		actorRole: varchar({ length: 50 }),
		dataCategory: varchar({ length: 100 }).notNull(),
		description: text().notNull(),
		ipAddress: varchar({ length: 45 }),
		userAgent: text(),
		processingPurpose: text(),
		legalBasis: varchar({ length: 100 }).notNull(),
		retentionDays: integer(),
		dataDeletedAt: timestamp({ withTimezone: true }),
		metadata: jsonb(),
		// Drizzle extras (keep for compatibility)
		actorType: varchar({ length: 50 }),
		entityType: varchar({ length: 50 }),
		entityId: varchar({ length: 255 }),
		details: text(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('lgpd_audit_student_idx').on(t.studentId),
		index('lgpd_audit_action_type_idx').on(t.actionType),
		index('lgpd_audit_actor_idx').on(t.actorId),
		index('lgpd_audit_data_category_idx').on(t.dataCategory),
		index('lgpd_audit_created_idx').on(t.createdAt),
		index('lgpd_audit_legal_basis_idx').on(t.legalBasis),
	],
);

// ── LGPD Retention ──
export const lgpdRetention = pgTable(
	'lgpd_retention',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		dataCategory: varchar({ length: 100 }).notNull(),
		retentionDays: integer().notNull(),
		legalBasis: varchar({ length: 100 }).notNull(),
		automaticDeletion: boolean().notNull(),
		notificationBeforeDeletion: integer().notNull(),
		requiresExplicitConsent: boolean().notNull(),
		minorAgeRestriction: integer(),
		exceptionalCircumstances: text(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('lgpd_retention_category_idx').on(t.dataCategory),
		index('lgpd_retention_legal_basis_idx').on(t.legalBasis),
	],
);

// ── LGPD Requests ──
export const lgpdRequests = pgTable(
	'lgpd_requests',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		studentId: integer().notNull(),
		requestType: lgpdRequestTypeEnum().notNull(),
		status: lgpdRequestStatusEnum().notNull().default('pending'),
		description: text(),
		identityProof: text(),
		ipAddress: varchar({ length: 45 }).notNull(),
		userAgent: text().notNull(),
		response: text(),
		responseFiles: jsonb().$type<string[]>(),
		completedAt: timestamp({ withTimezone: true }),
		rejectionReason: text(),
		processedBy: varchar({ length: 255 }).notNull(),
		processingNotes: text(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('lgpd_requests_student_idx').on(t.studentId),
		index('lgpd_requests_type_idx').on(t.requestType),
		index('lgpd_requests_status_idx').on(t.status),
		index('lgpd_requests_created_idx').on(t.createdAt),
		index('lgpd_requests_processed_by_idx').on(t.processedBy),
	],
);

// ── LGPD Data Breach ──
export const lgpdDataBreach = pgTable(
	'lgpd_data_breach',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		incidentId: varchar({ length: 255 }).notNull(),
		breachType: breachTypeEnum().notNull(),
		affectedStudents: jsonb().$type<number[]>().notNull(),
		dataCategories: jsonb().$type<string[]>().notNull(),
		severity: severityEnum().notNull(),
		detectedAt: timestamp({ withTimezone: true }).notNull(),
		startedAt: timestamp({ withTimezone: true }).notNull(),
		containedAt: timestamp({ withTimezone: true }),
		reportedToANPD: boolean().notNull(),
		notifiedAffected: boolean().notNull(),
		notificationMethod: text(),
		notificationDeadline: timestamp({ withTimezone: true }).notNull(),
		correctiveActions: jsonb().$type<string[]>().notNull(),
		preventiveMeasures: jsonb().$type<string[]>().notNull(),
		description: text().notNull(),
		externalReporting: boolean().notNull(),
		lawEnforcementNotified: boolean().notNull(),
		detectedBy: varchar({ length: 255 }).notNull(),
		assignedTo: integer(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('lgpd_breach_incident_idx').on(t.incidentId),
		index('lgpd_breach_severity_idx').on(t.severity),
		index('lgpd_breach_detected_idx').on(t.detectedAt),
		index('lgpd_breach_detected_by_idx').on(t.detectedBy),
	],
);

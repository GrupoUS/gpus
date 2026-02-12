import {
	boolean,
	date,
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
	varchar,
} from 'drizzle-orm/pg-core';

import {
	churnRiskEnum,
	enrollmentStatusEnum,
	paymentStatusEnum,
	studentStatusEnum,
} from '../enums';

// ── Students ──
export const students = pgTable(
	'students',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		organizationId: varchar({ length: 255 }),
		leadId: integer(),
		// Basic Info
		name: varchar({ length: 255 }).notNull(),
		email: varchar({ length: 255 }),
		phone: varchar({ length: 50 }),
		cpf: varchar({ length: 14 }),
		birthDate: date(),
		// LGPD Encrypted Fields
		cpfHash: varchar({ length: 255 }),
		encryptedCPF: text(),
		encryptedEmail: text(),
		encryptedPhone: text(),
		// Professional Info
		profession: varchar({ length: 100 }),
		specialization: varchar({ length: 255 }),
		council: varchar({ length: 100 }),
		councilNumber: varchar({ length: 50 }),
		professionalId: varchar({ length: 100 }),
		products: jsonb().$type<string[]>(),
		// Clinic Info
		hasClinic: boolean(),
		clinicName: varchar({ length: 255 }),
		clinicCity: varchar({ length: 255 }),
		// Address (jsonb for Drizzle, individual in Convex)
		address: jsonb().$type<{
			street?: string;
			number?: string;
			complement?: string;
			neighborhood?: string;
			city?: string;
			state?: string;
			zipCode?: string;
			country?: string;
		}>(),
		// CRM State
		status: studentStatusEnum().notNull().default('ativo'),
		churnRisk: churnRiskEnum(),
		assignedCS: varchar({ length: 255 }),
		lastEngagementAt: timestamp({ withTimezone: true }),
		// Asaas Integration
		asaasCustomerId: varchar({ length: 255 }),
		asaasCustomerSyncedAt: timestamp({ withTimezone: true }),
		asaasCustomerSyncError: text(),
		asaasCustomerSyncAttempts: integer().default(0),
		// Sale Info
		saleDate: timestamp({ withTimezone: true }),
		salesperson: varchar({ length: 255 }),
		contractStatus: varchar({ length: 50 }),
		leadSource: varchar({ length: 100 }),
		cohort: varchar({ length: 100 }),
		// LGPD Consent
		lgpdConsent: boolean(),
		dataRetentionUntil: timestamp({ withTimezone: true }),
		consentGrantedAt: timestamp({ withTimezone: true }),
		consentVersion: varchar({ length: 50 }),
		minorConsentRequired: boolean(),
		minorConsentGranted: boolean(),
		// Extras (Drizzle additions)
		notes: text(),
		avatarUrl: text(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('students_organization_idx').on(t.organizationId),
		index('students_email_idx').on(t.email),
		index('students_status_idx').on(t.status),
		index('students_asaas_customer_idx').on(t.asaasCustomerId),
		index('students_organization_status_idx').on(t.organizationId, t.status),
	],
);

// ── Enrollments ──
export const enrollments = pgTable(
	'enrollments',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		studentId: integer().notNull(),
		organizationId: varchar({ length: 255 }),
		product: varchar({ length: 100 }).notNull(),
		cohort: varchar({ length: 100 }),
		status: enrollmentStatusEnum().notNull().default('aguardando_inicio'),
		startDate: timestamp({ withTimezone: true }),
		expectedEndDate: timestamp({ withTimezone: true }),
		actualEndDate: timestamp({ withTimezone: true }),
		endDate: timestamp({ withTimezone: true }),
		paymentStatus: paymentStatusEnum().default('em_dia'),
		totalValue: numeric({ precision: 12, scale: 2 }),
		installments: integer(),
		installmentValue: numeric({ precision: 12, scale: 2 }),
		paidInstallments: integer().default(0),
		progress: integer().default(0),
		completedModules: integer().default(0),
		totalModules: integer(),
		practicalHours: integer().default(0),
		practicesCompleted: integer().default(0),
		certificateUrl: text(),
		certificateIssuedAt: timestamp({ withTimezone: true }),
		isRenewal: boolean().default(false),
		previousEnrollmentId: integer(),
		notes: text(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index('enrollments_student_idx').on(t.studentId),
		index('enrollments_organization_idx').on(t.organizationId),
		index('enrollments_product_idx').on(t.product),
		index('enrollments_status_idx').on(t.status),
		index('enrollments_organization_student_idx').on(t.organizationId, t.studentId),
		index('enrollments_organization_product_idx').on(t.organizationId, t.product),
	],
);

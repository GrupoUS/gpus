/**
 * DOCUMENTATION-ONLY Convex→Neon migration schema.
 *
 * ⚠️  This file is EXCLUDED from tsconfig (lives in docs/) and serves as
 *     a reference for the original Convex schema mapping.
 *
 * ID MAPPING STRATEGY:
 *   Convex uses string _id (e.g. "js7a0g35rn..."). The production Drizzle
 *   schema uses integer().generatedAlwaysAsIdentity() PKs. During import,
 *   a deterministic Convex→integer ID map is built so FK references resolve
 *   correctly. See scripts/import-neon.ts for the implementation.
 *
 * The actual runnable schema is at: drizzle/schema/*.ts
 */

import { relations } from 'drizzle-orm';
import { boolean, integer, jsonb, pgTable, real, text, timestamp } from 'drizzle-orm/pg-core';

// NOTE: Enums are illustrative — actual enums live in drizzle/enums.ts

// ═══════════════════════════════════════════════════════
// USUÁRIOS DO SISTEMA (Time interno)
// ═══════════════════════════════════════════════════════
export const users = pgTable('users', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	clerkId: text('clerk_id').notNull(),
	email: text('email').notNull(),
	name: text('name').notNull(),
	role: text('role').notNull(), // userRoleEnum in production
	isActive: boolean('is_active').notNull().default(true),
	organizationId: text('organization_id'),
	organizationRole: text('organization_role'),
	preferences: jsonb('preferences'),
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
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	name: text('name').notNull(),
	email: text('email'),
	phone: text('phone'),
	source: text('source').notNull(), // leadSourceEnum in production
	sourceDetail: text('source_detail'),
	stage: text('stage').notNull(), // leadStageEnum in production
	temperature: text('temperature'), // temperatureEnum in production
	assignedTo: text('assigned_to'), // FK resolved via ID map
	organizationId: text('organization_id'),
	lgpdConsent: boolean('lgpd_consent'),
	whatsappConsent: boolean('whatsapp_consent'),
	consentGrantedAt: timestamp('consent_granted_at'),
	consentVersion: text('consent_version'),
	referredById: integer('referred_by_id'), // self-referencing FK
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ═══════════════════════════════════════════════════════
// ALUNOS (Clientes convertidos)
// ═══════════════════════════════════════════════════════
export const students = pgTable('students', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	leadId: integer('lead_id'), // FK resolved via ID map
	asaasCustomerId: text('asaas_customer_id'),
	name: text('name').notNull(),
	email: text('email'),
	phone: text('phone'),
	status: text('status').notNull(), // studentStatusEnum in production
	organizationId: text('organization_id'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ═══════════════════════════════════════════════════════
// MATRÍCULAS (Produtos adquiridos)
// ═══════════════════════════════════════════════════════
export const enrollments = pgTable('enrollments', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	studentId: integer('student_id').notNull(), // FK resolved via ID map
	product: text('product').notNull(),
	status: text('status').notNull(), // enrollmentStatusEnum in production
	totalValue: real('total_value'),
	installments: integer('installments'),
	installmentValue: real('installment_value'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ... (Remaining tables follow the same integer PK pattern)

// ═══════════════════════════════════════════════════════
// RELAÇÕES (illustrative — actual relations in drizzle/relations.ts)
// ═══════════════════════════════════════════════════════

export const leadsRelations = relations(leads, ({ one }) => ({
	assignee: one(users, {
		fields: [leads.assignedTo],
		references: [users.id],
	}),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
	lead: one(leads, {
		fields: [students.leadId],
		references: [leads.id],
	}),
	enrollments: many(enrollments),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
	student: one(students, {
		fields: [enrollments.studentId],
		references: [students.id],
	}),
}));

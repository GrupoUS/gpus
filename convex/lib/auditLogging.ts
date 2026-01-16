/**
 * LGPD-Compliant Audit Logging
 *
 * Provides comprehensive audit trail for all data operations
 * as required by LGPD Article 6, VIII (accountability).
 */

import type { Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { getClerkId } from './auth';

/**
 * Valid action types for audit logs (matches schema)
 */
export type AuditActionType =
	| 'data_access'
	| 'data_creation'
	| 'data_modification'
	| 'data_deletion'
	| 'consent_granted'
	| 'consent_withdrawn'
	| 'data_export'
	| 'data_portability'
	| 'security_event'
	| 'data_breach';

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
	actionType: AuditActionType;
	dataCategory: string;
	description: string;
	studentId?: string;
	entityId?: string;
	metadata?: Record<string, unknown>;
	processingPurpose?: string;
	legalBasis?: string;
	retentionDays?: number;
	ipAddress?: string;
	userAgent?: string;
	previous_value?: unknown;
	new_value?: unknown;
}

/**
 * Log levels for different types of operations
 */
export const AUDIT_LEVELS = {
	CRITICAL: 'critical', // Data breaches, mass deletions
	HIGH: 'high', // Individual data deletions, consent changes
	MEDIUM: 'medium', // Data modifications, access requests
	LOW: 'low', // Normal operations, data creation
	INFO: 'info', // System events, configuration changes
} as const;

function calculateRetentionDays(dataCategory: string): number {
	const retentionRules: Record<string, number> = {
		identificacao: 365 * 7, // 7 years for identification data
		academico: 365 * 20, // 20 years for academic records
		financeiro: 365 * 5, // 5 years for financial data
		contato: 365 * 3, // 3 years for contact data
		consentimento: 365 * 5, // 5 years for consent records
		auditoria: 365 * 7, // 7 years for audit logs
	};
	return retentionRules[dataCategory] || 365 * 5; // Default: 5 years
}

async function getActorRole(ctx: MutationCtx, clerkId: string): Promise<string> {
	try {
		const user = await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkId))
			.first();

		return user?.role || 'unknown';
	} catch (_error) {
		return 'unknown';
	}
}

function sanitizeForAuditLog(data: unknown, dataCategory: string): unknown {
	if (!data) return data;

	// Don't log actual sensitive values, just metadata
	const sensitiveCategories = ['identificacao', 'contato', 'financeiro'];
	if (sensitiveCategories.includes(dataCategory)) {
		return '[REDACTED_FOR_PRIVACY]';
	}

	// For non-sensitive data, log normally
	return data;
}

/**
 * Creates audit log entry with all required LGPD fields
 */
export async function createAuditLog(ctx: MutationCtx, entry: AuditLogEntry): Promise<string> {
	try {
		const clerkId = await getClerkId(ctx);
		const timestamp = Date.now();

		// Prepare metadata with potentially merged extra fields
		const auditMetadata = {
			...(entry.metadata || {}),
			...(entry.previous_value !== undefined ? { previous_value: entry.previous_value } : {}),
			...(entry.new_value !== undefined ? { new_value: entry.new_value } : {}),
		};

		// Create comprehensive audit entry
		const auditId = await ctx.db.insert('lgpdAudit', {
			studentId: entry.studentId
				? (ctx.db.normalizeId('students', entry.studentId) as Id<'students'>)
				: undefined,
			actionType: entry.actionType,
			actorId: clerkId,
			actorRole: await getActorRole(ctx, clerkId),
			dataCategory: entry.dataCategory,
			description: entry.description,
			ipAddress: entry.ipAddress || 'unknown',
			userAgent: entry.userAgent || 'unknown',
			processingPurpose: entry.processingPurpose,
			legalBasis: entry.legalBasis || 'consentimento',
			retentionDays: entry.retentionDays || calculateRetentionDays(entry.dataCategory),
			metadata: Object.keys(auditMetadata).length > 0 ? auditMetadata : undefined,
			createdAt: timestamp,
		});

		return auditId;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		throw new Error(`Failed to create audit log: ${errorMessage}`);
	}
}

/**
 * Logs data access operations
 */
export async function logDataAccess(
	ctx: MutationCtx,
	studentId: string,
	dataCategory: string,
	purpose: string,
): Promise<string> {
	return createAuditLog(ctx, {
		actionType: 'data_access',
		dataCategory,
		description: `Acesso a dados de estudante: ${dataCategory}`,
		studentId,
		processingPurpose: purpose,
		legalBasis: 'consentimento',
	});
}

/**
 * Logs data creation operations
 */
export async function logDataCreation(
	ctx: MutationCtx,
	studentId: string,
	dataCategory: string,
	entityType: string,
	entityId: string,
): Promise<string> {
	return createAuditLog(ctx, {
		actionType: 'data_creation',
		dataCategory,
		description: `Criacao de ${entityType} para estudante`,
		studentId,
		entityId,
		processingPurpose: 'gestao academica',
		legalBasis: 'consentimento',
	});
}

/**
 * Logs data modification operations
 */
export async function logDataModification(
	ctx: MutationCtx,
	studentId: string,
	dataCategory: string,
	fieldName: string,
	oldValue: unknown,
	newValue: unknown,
): Promise<string> {
	const sanitizedOldValue = sanitizeForAuditLog(oldValue, dataCategory);
	const sanitizedNewValue = sanitizeForAuditLog(newValue, dataCategory);

	return createAuditLog(ctx, {
		actionType: 'data_modification',
		dataCategory,
		description: `Modificacao de campo ${fieldName} de estudante`,
		studentId,
		metadata: {
			fieldName,
			oldValue: sanitizedOldValue,
			newValue: sanitizedNewValue,
			changeTimestamp: Date.now(),
		},
		processingPurpose: 'gestao academica',
		legalBasis: 'consentimento',
	});
}

/**
 * Logs data deletion operations (critical LGPD requirement)
 */
export async function logDataDeletion(
	ctx: MutationCtx,
	studentId: string,
	dataCategory: string,
	reason: string,
	deletionType: 'soft' | 'hard' = 'soft',
): Promise<string> {
	return createAuditLog(ctx, {
		actionType: 'data_deletion',
		dataCategory,
		description: `Delecao ${deletionType} de dados de estudante: ${reason}`,
		studentId,
		metadata: {
			deletionType,
			reason,
			complianceLevel: 'critical',
		},
		processingPurpose: 'cumprimento LGPD - direito ao esquecimento',
		legalBasis: 'direito do titular de dados',
	});
}

/**
 * Logs consent operations
 */
export async function logConsentOperation(
	ctx: MutationCtx,
	studentId: string,
	consentType: string,
	granted: boolean,
	reason?: string,
): Promise<string> {
	const actionType = granted ? 'consent_granted' : 'consent_withdrawn';

	return createAuditLog(ctx, {
		actionType,
		dataCategory: 'consentimento',
		description: `${granted ? 'Concessao' : 'Retirada'} de consentimento: ${consentType}`,
		studentId,
		metadata: {
			consentType,
			granted,
			reason,
			timestamp: Date.now(),
		},
		processingPurpose: 'cumprimento LGPD',
		legalBasis: 'consentimento explicito',
	});
}

/**
 * Logs data export operations (right to data portability)
 */
export async function logDataExport(
	ctx: MutationCtx,
	studentId: string,
	dataCategories: string[],
	exportFormat: string,
): Promise<string> {
	return createAuditLog(ctx, {
		actionType: 'data_export',
		dataCategory: dataCategories.join(', '),
		description: `Exportacao de dados do estudante: formato ${exportFormat}`,
		studentId,
		metadata: {
			dataCategories,
			exportFormat,
			requestDate: Date.now(),
		},
		processingPurpose: 'cumprimento LGPD - direito a portabilidade',
		legalBasis: 'direito do titular de dados',
	});
}

/**
 * Creates audit log for security events (breaches, unauthorized access)
 */
export async function logSecurityEvent(
	ctx: MutationCtx,
	eventType: 'breach' | 'unauthorized_access' | 'suspicious_activity',
	description: string,
	severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
	affectedUsers?: string[],
): Promise<string> {
	return createAuditLog(ctx, {
		actionType: 'security_event',
		dataCategory: 'seguranca',
		description: `Evento de seguranca: ${eventType} - ${description}`,
		metadata: {
			eventType,
			severity,
			affectedUsers,
			requiresIncidentResponse: severity === 'high' || severity === 'critical',
		},
		processingPurpose: 'resposta a incidentes de seguranca',
		legalBasis: 'obrigacao legal de seguranca',
	});
}

/**
 * Queries audit logs for compliance reporting
 */
export async function getAuditLogs(
	ctx: QueryCtx,
	filters: {
		studentId?: string;
		actionType?: string;
		dataCategory?: string;
		startDate?: number;
		endDate?: number;
		actorId?: string;
	},
) {
	// Start with base query
	let results = await ctx.db.query('lgpdAudit').order('desc').take(1000);

	// Apply filters in memory (Convex doesn't support dynamic chained filters)
	if (filters.studentId) {
		const normalizedId = ctx.db.normalizeId('students', filters.studentId);
		results = results.filter((r) => r.studentId === normalizedId);
	}

	if (filters.actionType) {
		results = results.filter((r) => r.actionType === filters.actionType);
	}

	if (filters.dataCategory) {
		results = results.filter((r) => r.dataCategory === filters.dataCategory);
	}

	if (filters.startDate) {
		results = results.filter((r) => r.createdAt >= filters.startDate!);
	}

	if (filters.endDate) {
		results = results.filter((r) => r.createdAt <= filters.endDate!);
	}

	if (filters.actorId) {
		results = results.filter((r) => r.actorId === filters.actorId);
	}

	return results;
}

/**
 * LGPD-Compliant Audit Logging
 * 
 * Provides comprehensive audit trail for all data operations
 * as required by LGPD Article 6, VIII (accountability).
 */

import type { MutationCtx, QueryCtx } from '../_generated/server'
import { getClerkId } from './auth'
import { validateEncryptionConfig } from './encryption'
import { auditLogSchema } from './lgpd-compliance'

/**
 * Audit log entry interface
 */
interface AuditLogEntry {
	actionType: string
	dataCategory: string
	description: string
	studentId?: string
	entityId?: string
	metadata?: any
	processingPurpose?: string
	legalBasis?: string
	retentionDays?: number
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
} as const

/**
 * Creates audit log entry with all required LGPD fields
 */
export async function createAuditLog(
	ctx: MutationCtx,
	entry: AuditLogEntry
): Promise<string> {
	// Validate encryption is configured
	const encryptionValidation = validateEncryptionConfig()
	if (!encryptionValidation.valid) {
		console.error('Audit logging failed: Encryption not configured', encryptionValidation.message)
		throw new Error('LGPD compliance: Encryption configuration required for audit logging')
	}
	
	try {
		const clerkId = await getClerkId(ctx)
		const timestamp = Date.now()
		
		// Create comprehensive audit entry
		const auditId = await ctx.db.insert('lgpdAudit', {
			studentId: entry.studentId ? ctx.db.normalizeId('students', entry.studentId) as any : undefined,
			actionType: entry.actionType,
			actorId: clerkId,
			actorRole: await getActorRole(ctx, clerkId),
			dataCategory: entry.dataCategory,
			description: entry.description,
			ipAddress: getClientIP(ctx),
			userAgent: ctx.headers['user-agent'],
			processingPurpose: entry.processingPurpose,
			legalBasis: entry.legalBasis || 'consentimento',
			retentionDays: entry.retentionDays || calculateRetentionDays(entry.dataCategory),
			createdAt: timestamp,
		})
		
		// Log to system console for immediate monitoring
		console.log(`[AUDIT] ${entry.actionType}: ${entry.description}`, {
			timestamp: new Date(timestamp).toISOString(),
			actor: clerkId,
			student: entry.studentId,
		})
		
		return auditId
	} catch (error) {
		console.error('Failed to create audit log:', error)
		throw new Error(`LGPD audit logging failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

/**
 * Logs data access operations
 */
export async function logDataAccess(
	ctx: MutationCtx,
	studentId: string,
	dataCategory: string,
	purpose: string
): Promise<string> {
	return createAuditLog(ctx, {
		actionType: 'data_access',
		dataCategory,
		description: `Acesso a dados de estudante: ${dataCategory}`,
		studentId,
		processingPurpose: purpose,
		legalBasis: 'consentimento',
	})
}

/**
 * Logs data creation operations
 */
export async function logDataCreation(
	ctx: MutationCtx,
	studentId: string,
	dataCategory: string,
	entityType: string,
	entityId: string
): Promise<string> {
	return createAuditLog(ctx, {
		actionType: 'data_creation',
		dataCategory,
		description: `Criação de ${entityType} para estudante`,
		studentId,
		entityId,
		processingPurpose: 'gestão acadêmica',
		legalBasis: 'consentimento',
	})
}

/**
 * Logs data modification operations
 */
export async function logDataModification(
	ctx: MutationCtx,
	studentId: string,
	dataCategory: string,
	fieldName: string,
	oldValue: any,
	newValue: any
): Promise<string> {
	const sanitizedOldValue = sanitizeForAuditLog(oldValue, dataCategory)
	const sanitizedNewValue = sanitizeForAuditLog(newValue, dataCategory)
	
	return createAuditLog(ctx, {
		actionType: 'data_modification',
		dataCategory,
		description: `Modificação de campo ${fieldName} de estudante`,
		studentId,
		metadata: {
			fieldName,
			oldValue: sanitizedOldValue,
			newValue: sanitizedNewValue,
			changeTimestamp: Date.now(),
		},
		processingPurpose: 'gestão acadêmica',
		legalBasis: 'consentimento',
	})
}

/**
 * Logs data deletion operations (critical LGPD requirement)
 */
export async function logDataDeletion(
	ctx: MutationCtx,
	studentId: string,
	dataCategory: string,
	reason: string,
	deletionType: 'soft' | 'hard' = 'soft'
): Promise<string> {
	return createAuditLog(ctx, {
		actionType: 'data_deletion',
		dataCategory,
		description: `Deleção ${deletionType} de dados de estudante: ${reason}`,
		studentId,
		metadata: {
			deletionType,
			reason,
			complianceLevel: 'critical',
		},
		processingPurpose: 'cumprimento LGPD - direito ao esquecimento',
		legalBasis: 'direito do titular de dados',
	})
}

/**
 * Logs consent operations
 */
export async function logConsentOperation(
	ctx: MutationCtx,
	studentId: string,
	consentType: string,
	granted: boolean,
	reason?: string
): Promise<string> {
	const actionType = granted ? 'consent_granted' : 'consent_withdrawn'
	
	return createAuditLog(ctx, {
		actionType,
		dataCategory: 'consentimento',
		description: `${granted ? 'Concessão' : 'Retirada'} de consentimento: ${consentType}`,
		studentId,
		metadata: {
			consentType,
			granted,
			reason,
			timestamp: Date.now(),
		},
		processingPurpose: 'cumprimento LGPD',
		legalBasis: 'consentimento explícito',
	})
}

/**
 * Logs data export operations (right to data portability)
 */
export async function logDataExport(
	ctx: MutationCtx,
	studentId: string,
	dataCategories: string[],
	exportFormat: string
): Promise<string> {
	return createAuditLog(ctx, {
		actionType: 'data_export',
		dataCategory: dataCategories.join(', '),
		description: `Exportação de dados do estudante: formato ${exportFormat}`,
		studentId,
		metadata: {
			dataCategories,
			exportFormat,
			requestDate: Date.now(),
		},
		processingPurpose: 'cumprimento LGPD - direito à portabilidade',
		legalBasis: 'direito do titular de dados',
	})
}

/**
 * Gets client IP address from request context
 */
function getClientIP(ctx: MutationCtx | QueryCtx): string {
	// Try various headers for real IP
	const forwardedFor = ctx.headers['x-forwarded-for']
	const realIP = ctx.headers['x-real-ip']
	const cfConnectingIP = ctx.headers['cf-connecting-ip'] // Cloudflare
	
	if (forwardedFor) {
		return forwardedFor.split(',')[0].trim()
	}
	
	if (realIP) {
		return realIP
	}
	
	if (cfConnectingIP) {
		return cfConnectingIP
	}
	
	return '0.0.0.0' // Fallback
}

/**
 * Gets actor role from authentication context
 */
async function getActorRole(ctx: MutationCtx, clerkId: string): Promise<string> {
	try {
		const user = await ctx.db
			.query('users')
			.withIndex('by_clerk_id', q => q.eq('clerkId', clerkId))
			.first()
		
		return user?.role || 'unknown'
	} catch (error) {
		console.error('Failed to get actor role:', error)
		return 'unknown'
	}
}

/**
 * Sanitizes sensitive data for audit logs
 */
function sanitizeForAuditLog(data: any, dataCategory: string): any {
	if (!data) return data
	
	// Don't log actual sensitive values, just metadata
	const sensitiveCategories = ['identificação', 'contato', 'financeiro']
	if (sensitiveCategories.includes(dataCategory)) {
		return '[REDACTED_FOR_PRIVACY]'
	}
	
	// For non-sensitive data, log normally
	return data
}

/**
 * Calculates retention days for audit logs based on data category
 */
function calculateRetentionDays(dataCategory: string): number {
	const retentionRules: Record<string, number> = {
		'identificação': 365 * 7, // 7 years for identification data
		'acadêmico': 365 * 20, // 20 years for academic records
		'financeiro': 365 * 5, // 5 years for financial data
		'contato': 365 * 3, // 3 years for contact data
		'consentimento': 365 * 5, // 5 years for consent records
		'auditoria': 365 * 7, // 7 years for audit logs
	}
	
	return retentionRules[dataCategory] || 365 * 5 // Default: 5 years
}

/**
 * Creates audit log for security events (breaches, unauthorized access)
 */
export async function logSecurityEvent(
	ctx: MutationCtx,
	eventType: 'breach' | 'unauthorized_access' | 'suspicious_activity',
	description: string,
	severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
	affectedUsers?: string[]
): Promise<string> {
	return createAuditLog(ctx, {
		actionType: 'security_event',
		dataCategory: 'segurança',
		description: `Evento de segurança: ${eventType} - ${description}`,
		metadata: {
			eventType,
			severity,
			affectedUsers,
			requiresIncidentResponse: severity === 'high' || severity === 'critical',
		},
		processingPurpose: 'resposta a incidentes de segurança',
		legalBasis: 'obrigação legal de segurança',
	})
}

/**
 * Queries audit logs for compliance reporting
 */
export async function getAuditLogs(
	ctx: QueryCtx,
	filters: {
		studentId?: string
		actionType?: string
		dataCategory?: string
		startDate?: number
		endDate?: number
		actorId?: string
	}
) {
	let query = ctx.db.query('lgpdAudit')
	
	// Apply filters
	if (filters.studentId) {
		query = query.withIndex('by_student', q => 
			q.eq('studentId', ctx.db.normalizeId('students', filters.studentId) as any))
	}
	
	if (filters.actionType) {
		query = query.filter(q => q.eq(q.actionType, filters.actionType))
	}
	
	if (filters.dataCategory) {
		query = query.filter(q => q.eq(q.dataCategory, filters.dataCategory))
	}
	
	if (filters.startDate) {
		query = query.filter(q => q.gte(q.createdAt, filters.startDate))
	}
	
	if (filters.endDate) {
		query = query.filter(q => q.lte(q.createdAt, filters.endDate))
	}
	
	if (filters.actorId) {
		query = query.filter(q => q.eq(q.actorId, filters.actorId))
	}
	
	return await query.order('desc').take(1000).collect()
}

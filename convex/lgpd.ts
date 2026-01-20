import type { Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';

/**
 * Logs an LGPD-related operation to the audit table.
 *
 * @param ctx Mutation context
 * @param params Audit parameters
 */
export async function logAudit(
	ctx: MutationCtx,
	params: {
		studentId?: Id<'students'>;
		actionType:
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
		actorId?: string;
		actorRole?: string;
		dataCategory: string;
		description: string;
		processingPurpose?: string;
		legalBasis: string;
		metadata?: Record<string, unknown>;
	},
) {
	// If no actorId provided, try to get from auth
	let actorId = params.actorId;
	if (!actorId) {
		const identity = await ctx.auth.getUserIdentity();
		actorId = identity?.subject || 'system';
	}

	await ctx.db.insert('lgpdAudit', {
		createdAt: Date.now(),
		studentId: params.studentId,
		actionType: params.actionType,
		actorId,
		actorRole: params.actorRole,
		dataCategory: params.dataCategory,
		description: params.description,
		processingPurpose: params.processingPurpose,
		legalBasis: params.legalBasis,
		metadata: params.metadata,
	});
}

/**
 * Helper to check if we can process data for a student.
 * Returns true if we have adequate legal basis (consent or contract).
 */
export async function checkProcessingBasis(
	ctx: QueryCtx,
	studentId: Id<'students'>,
	purpose: string,
): Promise<boolean> {
	// For now, assume 'contract' (execution of contract) is valid for active students
	// In future, check `lgpdConsent` table
	const student = await ctx.db.get(studentId);
	if (!student) return false;

	// Example logic: Active students have implied contract basis for academic processing
	if (student.status === 'ativo' && purpose === 'academic_processing') {
		return true;
	}

	return false;
}

// type-check enabled

/**
 * Asaas Export Workers
 *
 * Worker functions for exporting students, payments, and subscriptions to Asaas.
 * Each worker handles validation, conflict detection, and API communication.
 *
 * These workers are designed to work with the batch processor for concurrent
 * execution with error isolation.
 */

import { internal } from '../_generated/api';
import type { Doc, Id } from '../_generated/dataModel';
import type { ActionCtx } from '../_generated/server'; // Import ActionCtx
import type { WorkerResult } from './batch_processor';
import type {
	AsaasCustomerPayload,
	AsaasCustomerResponse,
	AsaasPaymentPayload,
	AsaasPaymentResponse,
} from './types';

// ═══════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Validate if student has all required data for Asaas export
 */
function validateStudentForExport(student: Doc<'students'>): {
	valid: boolean;
	reason?: string;
} {
	if (!student.name || student.name.trim() === '') {
		return { valid: false, reason: 'Student name is required' };
	}

	// At least one contact method is required
	if (!(student.phone || student.email)) {
		return {
			valid: false,
			reason: 'At least one contact method (phone or email) is required',
		};
	}

	// CPF is recommended but not required
	// if (!student.cpf) {
	//   return { valid: false, reason: "CPF is recommended for Asaas export" };
	// }

	return { valid: true };
}

// Helper functions (sanitizeForLog) removed - not currently used

// ═══════════════════════════════════════════════════════
// STUDENT EXPORT WORKER
// ═══════════════════════════════════════════════════════

/**
 * Export a single student to Asaas
 *
 * This worker:
 * 1. Validates student data for export
 * 2. Checks if student already has an Asaas customer ID
 * 3. Creates customer in Asaas API
 * 4. Updates student record with Asaas customer ID
 * 5. Handles conflicts and errors
 */
export async function exportStudentWorker(
	ctx: ActionCtx, // Changed to ActionCtx
	student: Doc<'students'>,
	asaasClient: {
		createCustomer: (payload: AsaasCustomerPayload) => Promise<AsaasCustomerResponse>;
	},
): Promise<WorkerResult<{ studentId: Id<'students'>; asaasCustomerId: string }>> {
	// Validation
	const validation = validateStudentForExport(student);
	if (!validation.valid) {
		return {
			success: false,
			skipped: true,
			reason: validation.reason,
		};
	}

	// Check if student already has an Asaas customer ID
	if (student.asaasCustomerId) {
		return {
			success: true,
			skipped: true,
			reason: 'Student already has Asaas customer ID',
			data: {
				studentId: student._id,
				asaasCustomerId: student.asaasCustomerId,
			},
		};
	}

	try {
		// Prepare customer payload for Asaas
		const customerPayload: AsaasCustomerPayload = {
			name: student.name,
			cpfCnpj: student.cpf || undefined,
			email: student.email || undefined,
			phone: student.phone || undefined,
			mobilePhone: student.phone || undefined,
			externalReference: student._id,
			notificationDisabled: false,
		};

		// Add address if available
		if (student.address || student.city || student.state || student.zipCode) {
			customerPayload.address = student.address || '';
			customerPayload.addressNumber = student.addressNumber || '';
			customerPayload.complement = student.complement || '';
			customerPayload.province = student.neighborhood || '';
			customerPayload.city = student.city || '';
			customerPayload.state = student.state || '';
			customerPayload.postalCode = student.zipCode || '';
		}

		// Create customer in Asaas
		const asaasCustomer: AsaasCustomerResponse = await asaasClient.createCustomer(customerPayload);

		// Update student with Asaas customer ID
		// biome-ignore lint/suspicious/noExplicitAny: break deep type instantiation on internal api
		await ctx.runMutation((internal as any).asaas.mutations.updateStudentAsaasId, {
			studentId: student._id,
			asaasCustomerId: asaasCustomer.id,
		});

		return {
			success: true,
			data: {
				studentId: student._id,
				asaasCustomerId: asaasCustomer.id,
			},
			created: true,
		};
	} catch (error: unknown) {
		// Check for duplicate customer error (409 or similar)
		const statusCode = (error as { response?: { status?: number } })?.response?.status;
		const responseData = (error as { response?: { data?: unknown } })?.response?.data;

		if (
			statusCode === 409 ||
			(responseData as { errors?: Array<{ code?: string; description?: string }> })?.errors?.some(
				(e: { code?: string; description?: string }) =>
					e.code?.includes('duplicate') || e.description?.includes('já cadastrado'),
			)
		) {
			// Create conflict record for manual resolution
			// biome-ignore lint/suspicious/noExplicitAny: break deep type instantiation on internal api
			await ctx.runMutation((internal as any).asaas.conflict_resolution.createConflict, {
				conflictType: 'duplicate_customer',
				studentId: student._id,
				localData: {
					name: student.name,
					email: student.email,
					cpf: student.cpf,
				},
				remoteData: responseData,
				organizationId: student.organizationId,
			});

			return {
				success: false,
				skipped: true,
				reason: 'Duplicate customer in Asaas - requires manual resolution',
			};
		}

		return {
			success: false,
			error: (error as Error).message || 'Unknown error',
		};
	}
}

// ═══════════════════════════════════════════════════════
// PAYMENT EXPORT WORKER
// ═══════════════════════════════════════════════════════

/**
 * Export a single payment to Asaas
 *
 * This worker:
 * 1. Validates payment data for export
 * 2. Checks if payment already has an Asaas payment ID
 * 3. Ensures student has Asaas customer ID
 * 4. Creates payment in Asaas API
 * 5. Updates payment record with Asaas payment ID
 */
export async function exportPaymentWorker(
	ctx: ActionCtx, // Changed to ActionCtx
	payment: Doc<'asaasPayments'>,
	asaasClient: { createPayment: (payload: AsaasPaymentPayload) => Promise<AsaasPaymentResponse> },
): Promise<WorkerResult<{ paymentId: Id<'asaasPayments'>; asaasPaymentId: string }>> {
	// Check if payment already has an Asaas payment ID
	if (payment.asaasPaymentId) {
		return {
			success: true,
			skipped: true,
			reason: 'Payment already has Asaas payment ID',
			data: {
				paymentId: payment._id,
				asaasPaymentId: payment.asaasPaymentId,
			},
		};
	}

	try {
		// Get student to ensure they have Asaas customer ID
		// biome-ignore lint/suspicious/noExplicitAny: break deep type instantiation on internal api
		const student = await ctx.runQuery((internal as any).asaas.queries.getStudentById, {
			studentId: payment.studentId,
		});

		if (!student) {
			return {
				success: false,
				skipped: true,
				reason: 'Student not found for this payment',
			};
		}

		if (!student.asaasCustomerId) {
			return {
				success: false,
				skipped: true,
				reason: 'Student must be exported to Asaas before payments',
			};
		}

		// Prepare payment payload
		const paymentPayload: AsaasPaymentPayload = {
			customer: student.asaasCustomerId,
			billingType: payment.billingType,
			value: payment.value,
			dueDate: new Date(payment.dueDate).toISOString().split('T')[0], // YYYY-MM-DD
			description: payment.description,
			externalReference: payment._id,
		};

		// Add installment info if available
		if (payment.installmentNumber && payment.totalInstallments) {
			paymentPayload.installmentCount = payment.totalInstallments;
			// @ts-expect-error: Asaas API supports this but type definition might be outdated
			paymentPayload.installmentNumber = payment.installmentNumber;
		}

		// Create payment in Asaas
		const asaasPayment: AsaasPaymentResponse = await asaasClient.createPayment(paymentPayload);

		// Update payment record with Asaas payment ID
		// biome-ignore lint/suspicious/noExplicitAny: break deep type instantiation on internal api
		await ctx.runMutation((internal as any).asaas.mutations.updatePaymentAsaasId, {
			paymentId: payment._id,
			asaasPaymentId: asaasPayment.id,
			boletoUrl: asaasPayment.bankSlipUrl || payment.boletoUrl,
		});

		return {
			success: true,
			data: {
				paymentId: payment._id,
				asaasPaymentId: asaasPayment.id,
			},
			created: true,
		};
	} catch (error: unknown) {
		return {
			success: false,
			error: (error as Error).message || 'Unknown error',
		};
	}
}

// ═══════════════════════════════════════════════════════
// BATCH PROCESSING HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Create a batch processing function for students
 */
export function createStudentExportBatchProcessor(
	ctx: ActionCtx,
	asaasClient: {
		createCustomer: (payload: AsaasCustomerPayload) => Promise<AsaasCustomerResponse>;
	},
) {
	return (
		student: Doc<'students'>,
	): Promise<WorkerResult<{ studentId: Id<'students'>; asaasCustomerId: string }>> => {
		return exportStudentWorker(ctx, student, asaasClient);
	};
}

/**
 * Create a batch processing function for payments
 */
export function createPaymentExportBatchProcessor(
	ctx: ActionCtx,
	asaasClient: { createPayment: (payload: AsaasPaymentPayload) => Promise<AsaasPaymentResponse> },
) {
	return (
		payment: Doc<'asaasPayments'>,
	): Promise<WorkerResult<{ paymentId: Id<'asaasPayments'>; asaasPaymentId: string }>> => {
		return exportPaymentWorker(ctx, payment, asaasClient);
	};
}

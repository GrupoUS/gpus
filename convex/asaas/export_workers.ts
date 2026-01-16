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
import type { Id } from '../_generated/dataModel';
import type { WorkerResult } from './batch_processor';
import type { AsaasCustomerResponse, AsaasPaymentResponse } from './types';

// ═══════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Validate if student has all required data for Asaas export
 */
function validateStudentForExport(student: any): {
	valid: boolean;
	reason?: string;
} {
	if (!student.name || student.name.trim() === '') {
		return { valid: false, reason: 'Student name is required' };
	}

	// At least one contact method is required
	if (!student.phone && !student.email) {
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

/**
 * Sanitize data for LGPD compliance in logs
 */
function sanitizeForLog(data: { cpf?: string; phone?: string; email?: string }): string {
	const parts: string[] = [];
	if (data.cpf) {
		parts.push(`CPF: ***${data.cpf.slice(-3)}`);
	}
	if (data.phone) {
		parts.push(`Phone: ***${data.phone.slice(-3)}`);
	}
	if (data.email) {
		const [username, domain] = data.email.split('@');
		if (username && domain) {
			parts.push(`Email: ***@${domain}`);
		}
	}
	return parts.join(', ') || '(no sensitive info)';
}

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
	ctx: any,
	student: any & { _id: Id<'students'> },
	asaasClient: any,
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
		const customerPayload: any = {
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
		// @ts-ignore - Deep type instantiation
		await ctx.runMutation(internal.asaas.mutations.updateStudentAsaasId, {
			studentId: student._id,
			asaasCustomerId: asaasCustomer.id,
		});

		console.log(
			`[ExportStudentWorker] Exported student ${student._id} -> Asaas customer ${asaasCustomer.id}`,
		);

		return {
			success: true,
			data: {
				studentId: student._id,
				asaasCustomerId: asaasCustomer.id,
			},
			created: true,
		};
	} catch (error: any) {
		// Check for duplicate customer error (409 or similar)
		const statusCode = error.response?.status;
		const responseData = error.response?.data;

		if (
			statusCode === 409 ||
			responseData?.errors?.some(
				(e: any) => e.code?.includes('duplicate') || e.description?.includes('já cadastrado'),
			)
		) {
			// Create conflict record for manual resolution
			// @ts-ignore - Deep type instantiation
			await ctx.runMutation(internal.asaas.conflictResolution.createConflict, {
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

			console.warn(
				`[ExportStudentWorker] Duplicate customer detected for student ${student._id}:`,
				sanitizeForLog({
					cpf: student.cpf,
					phone: student.phone,
					email: student.email,
				}),
			);

			return {
				success: false,
				skipped: true,
				reason: 'Duplicate customer in Asaas - requires manual resolution',
			};
		}

		console.error(`[ExportStudentWorker] Failed to export student ${student._id}:`, error.message);

		return {
			success: false,
			error: error.message || 'Unknown error',
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
	ctx: any,
	payment: any & { _id: Id<'asaasPayments'> },
	asaasClient: any,
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
		const student = await ctx.db.get(payment.studentId);
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
		const paymentPayload: any = {
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
			paymentPayload.installmentNumber = payment.installmentNumber;
		}

		// Create payment in Asaas
		const asaasPayment: AsaasPaymentResponse = await asaasClient.createPayment(paymentPayload);

		// Update payment record with Asaas payment ID
		await ctx.db.patch(payment._id, {
			asaasPaymentId: asaasPayment.id,
			boletoUrl: asaasPayment.bankSlipUrl || payment.boletoUrl,
			updatedAt: Date.now(),
		});

		console.log(
			`[ExportPaymentWorker] Exported payment ${payment._id} -> Asaas payment ${asaasPayment.id}`,
		);

		return {
			success: true,
			data: {
				paymentId: payment._id,
				asaasPaymentId: asaasPayment.id,
			},
			created: true,
		};
	} catch (error: any) {
		console.error(`[ExportPaymentWorker] Failed to export payment ${payment._id}:`, error.message);

		return {
			success: false,
			error: error.message || 'Unknown error',
		};
	}
}

// ═══════════════════════════════════════════════════════
// BATCH PROCESSING HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Create a batch processing function for students
 */
export function createStudentExportBatchProcessor(ctx: any, asaasClient: any) {
	return async (
		student: any,
	): Promise<WorkerResult<{ studentId: Id<'students'>; asaasCustomerId: string }>> => {
		return exportStudentWorker(ctx, student, asaasClient);
	};
}

/**
 * Create a batch processing function for payments
 */
export function createPaymentExportBatchProcessor(ctx: any, asaasClient: any) {
	return async (
		payment: any,
	): Promise<WorkerResult<{ paymentId: Id<'asaasPayments'>; asaasPaymentId: string }>> => {
		return exportPaymentWorker(ctx, payment, asaasClient);
	};
}

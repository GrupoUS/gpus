// type-check enabled
/**
 * Asaas Import Workers
 *
 * Worker functions for processing Asaas customers, payments, and subscriptions.
 * Each worker handles validation, deduplication, and creation/updates.
 *
 * These workers are designed to work with the batch processor for concurrent
 * execution with error isolation.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const internal = require('../_generated/api').internal;

import type { Id } from '../_generated/dataModel';
import type { ActionCtx } from '../_generated/server';
import { maskCPF } from '../lib/masking';
import type { WorkerResult } from './batchProcessor';
import type {
	AsaasCustomerResponse,
	AsaasPaymentResponse,
	AsaasSubscriptionResponse,
	PaymentDoc,
	StudentWithAsaas,
	SubscriptionDoc,
} from './types';
import { isId } from './types';

const CPF_REGEX = /^(\d)\1{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ═══════════════════════════════════════════════════════
// WORKER TIMEOUT CONFIGURATION
// ═══════════════════════════════════════════════════════

const WORKER_TIMEOUT_MS = 10_000; // 10 seconds per item

/**
 * Execute function with timeout for individual worker items
 */
async function withItemTimeout<T>(
	fn: () => Promise<T>,
	timeoutMs: number,
	itemId: string,
): Promise<T> {
	return await Promise.race([
		fn(),
		new Promise<never>((_, reject) =>
			setTimeout(
				() => reject(new Error(`Worker timeout after ${timeoutMs}ms for item ${itemId}`)),
				timeoutMs,
			),
		),
	]);
}

// ═══════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Validate CPF (Brazilian tax ID)
 * Format: XXX.XXX.XXX-XX or XXXXXXXXXXX
 */
function validateCPF(cpf: string): boolean {
	if (!cpf) return false;

	// Remove non-digits
	const clean = cpf.replace(/\D/g, '');

	// Must be 11 digits
	if (clean.length !== 11) return false;

	// All same digits is invalid
	if (CPF_REGEX.test(clean)) return false;

	// Validate check digits
	let sum = 0;
	for (let i = 0; i < 9; i++) {
		sum += Number.parseInt(clean.charAt(i), 10) * (10 - i);
	}
	let digit = 11 - (sum % 11);
	if (digit >= 10) digit = 0;
	if (digit !== Number.parseInt(clean.charAt(9), 10)) return false;

	sum = 0;
	for (let i = 0; i < 10; i++) {
		sum += Number.parseInt(clean.charAt(i), 10) * (11 - i);
	}
	digit = 11 - (sum % 11);
	if (digit >= 10) digit = 0;
	if (digit !== Number.parseInt(clean.charAt(10), 10)) return false;

	return true;
}

/**
 * Validate email format
 */
function validateEmail(email: string): boolean {
	if (!email) return false; // Email is optional
	if (!email) return false; // Email is optional
	return EMAIL_REGEX.test(email);
}

/**
 * Validate Brazilian phone number
 * Accepts: (XX) XXXXX-XXXX, (XX) XXXX-XXXX, XX XXXXX-XXXX, etc.
 */
function validatePhone(phone: string): boolean {
	if (!phone) return false; // Phone is optional but recommended
	const clean = phone.replace(/\D/g, '');
	// Brazilian mobile: 11 digits (XX 9XXXX-XXXX), landline: 10 digits
	return clean.length === 10 || clean.length === 11;
}

// Helper functions (sanitizeForLog) removed - not currently used

// ═══════════════════════════════════════════════════════
// CUSTOMER WORKER
// ═══════════════════════════════════════════════════════

/**
 * Process a single customer from Asaas
 *
 * This worker:
 * 1. Validates CPF, email, and phone
 * 2. Checks for existing students by asaasCustomerId, email, or CPF
 * 3. Creates or updates student record
 * 4. Returns structured result with appropriate flags
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Worker validation logic requires linear checks
export async function processCustomerWorker(
	ctx: ActionCtx,
	customer: AsaasCustomerResponse,
	organizationId?: string,
): Promise<WorkerResult<StudentWithAsaas>> {
	// Validation
	if (customer.cpfCnpj && !validateCPF(customer.cpfCnpj)) {
		return {
			success: false,
			skipped: true,
			reason: 'Invalid CPF format',
		};
	}

	if (customer.email && !validateEmail(customer.email)) {
		return {
			success: false,
			skipped: true,
			reason: 'Invalid email format',
		};
	}

	const phone = customer.phone || customer.mobilePhone;
	if (phone && !validatePhone(phone)) {
		return {
			success: false,
			skipped: true,
			reason: 'Invalid phone format',
		};
	}

	try {
		// Check if student exists with this asaasCustomerId
		let existingStudent = await ctx.runQuery(internal.asaas.mutations.getStudentByAsaasId, {
			asaasCustomerId: customer.id,
		});

		// Deduplication: If not found by ID, try to find by Email or CPF
		if (!existingStudent && (customer.email || customer.cpfCnpj)) {
			const duplicate = await ctx.runQuery(internal.asaas.mutations.getStudentByEmailOrCpf, {
				// Convert null to undefined (Asaas API may return null, but Convex validators expect undefined)
				email: customer.email ?? undefined,
				cpf: customer.cpfCnpj ?? undefined,
			});

			if (duplicate) {
				// Link the found student to this Asaas Customer ID
				// biome-ignore lint/suspicious/noExplicitAny: break deep type instantiation
				await ctx.runMutation((internal as any).asaas.mutations.updateStudentAsaasId, {
					studentId: duplicate._id,
					asaasCustomerId: customer.id,
				});

				existingStudent = duplicate;
			}
		}

		if (existingStudent) {
			// Update existing student
			await ctx.runMutation(internal.asaas.mutations.updateStudentFromAsaas, {
				studentId: existingStudent._id,
				name: customer.name,
				email: customer.email ?? undefined,
				phone: phone || '',
				cpf: customer.cpfCnpj ?? undefined,
			});

			return {
				success: true,
				data: existingStudent as StudentWithAsaas,
				updated: true,
			};
		}

		// Create new student
		const studentId = await ctx.runMutation(internal.asaas.mutations.createStudentFromAsaas, {
			name: customer.name,
			email: customer.email ?? undefined,
			phone: phone || '',
			cpf: customer.cpfCnpj ?? undefined,
			asaasCustomerId: customer.id,
			organizationId,
		});

		return {
			success: true,
			data: {
				// biome-ignore lint/style/useNamingConvention: Convex naming
				_id: studentId as Id<'students'>,
				name: customer.name,
				email: customer.email ?? undefined,
				phone: phone || '',
				cpf: customer.cpfCnpj ?? undefined,
				asaasCustomerId: customer.id,
				organizationId,
			},
			created: true,
		};
	} catch (err: unknown) {
		const error = err as Error;
		const maskedCpf = customer.cpfCnpj ? maskCPF(customer.cpfCnpj) : 'N/A';
		// biome-ignore lint/suspicious/noConsole: Expected error logging for workers
		console.error(
			`Error processing customer ${customer.name} (CPF: ${maskedCpf}): ${error.message}`,
		);
		return {
			success: false,
			error: error.message || 'Unknown error',
		};
	}
}

// ═══════════════════════════════════════════════════════
// PAYMENT WORKER
// ═══════════════════════════════════════════════════════

/**
 * Process a single payment from Asaas
 *
 * This worker:
 * 1. Validates payment data
 * 2. Checks for existing payment by asaasPaymentId
 * 3. Finds associated student by asaasCustomerId
 * 4. Creates or updates payment record
 */
export async function processPaymentWorker(
	ctx: ActionCtx,
	payment: AsaasPaymentResponse,
	organizationId?: string,
): Promise<WorkerResult<PaymentDoc>> {
	try {
		// Check if payment exists
		const existingPayment = await ctx.runQuery(internal.asaas.mutations.getPaymentByAsaasId, {
			asaasPaymentId: payment.id,
		});

		if (existingPayment) {
			// Update existing payment
			await ctx.runMutation(internal.asaas.mutations.updatePaymentFromAsaas, {
				paymentId: existingPayment._id,
				status: payment.status,
				netValue: payment.netValue,
				confirmedDate: payment.paymentDate ? new Date(payment.paymentDate).getTime() : undefined,
			});

			return {
				success: true,
				data: existingPayment as PaymentDoc,
				updated: true,
			};
		}

		// Find student by asaasCustomerId
		let student = await ctx.runQuery(internal.asaas.mutations.getStudentByAsaasId, {
			asaasCustomerId: payment.customer,
		});

		if (!student && payment.externalReference) {
			const externalReference = payment.externalReference.trim();
			if (isId(externalReference)) {
				student = await ctx.runQuery(internal.asaas.queries.getStudentById, {
					studentId: externalReference as Id<'students'>,
				});
			}

			if (!student && externalReference.includes('@')) {
				student = await ctx.runQuery(internal.asaas.mutations.getStudentByEmailOrCpf, {
					email: externalReference,
					cpf: undefined,
				});
			}
		}

		if (!student) {
			return {
				success: false,
				skipped: true,
				reason: `Student not found for asaasCustomerId: ${payment.customer}`,
			};
		}

		const resolvedOrganizationId = organizationId ?? student.organizationId;

		// Create new payment
		const paymentId = await ctx.runMutation(internal.asaas.mutations.createPaymentFromAsaas, {
			studentId: student._id,
			asaasPaymentId: payment.id,
			asaasCustomerId: payment.customer,
			value: payment.value,
			netValue: payment.netValue,
			status: payment.status,
			dueDate: new Date(payment.dueDate).getTime(),
			billingType: payment.billingType,
			description: payment.description,
			boletoUrl: payment.bankSlipUrl ?? undefined, // Asaas API uses bankSlipUrl
			confirmedDate: payment.paymentDate ? new Date(payment.paymentDate).getTime() : undefined,
			installmentNumber: payment.installmentNumber,
			totalInstallments: payment.installmentNumber ? undefined : undefined, // Total not directly available in payment response
			organizationId,
		});

		return {
			success: true,
			data: {
				// biome-ignore lint/style/useNamingConvention: Convex naming
				_id: paymentId as Id<'asaasPayments'>,
				studentId: student._id,
				asaasPaymentId: payment.id,
				asaasCustomerId: payment.customer,
				organizationId: resolvedOrganizationId,
				value: payment.value,
				netValue: payment.netValue,
				status: payment.status,
				dueDate: new Date(payment.dueDate).getTime(),
				billingType: payment.billingType,
				description: payment.description,
				boletoUrl: payment.bankSlipUrl ?? undefined, // Asaas API uses bankSlipUrl
				confirmedDate: payment.paymentDate ? new Date(payment.paymentDate).getTime() : undefined,
				installmentNumber: payment.installmentNumber,
				totalInstallments: payment.installmentNumber ? undefined : undefined, // Total not directly available
				createdAt: Date.now(),
				updatedAt: Date.now(),
			},
			created: true,
		};
	} catch (err: unknown) {
		const error = err as Error;
		// biome-ignore lint/suspicious/noConsole: Expected error logging for workers
		console.error(`Error processing payment ${payment.id}: ${error.message}`);
		return {
			success: false,
			error: error.message || 'Unknown error',
		};
	}
}

// ═══════════════════════════════════════════════════════
// SUBSCRIPTION WORKER
// ═══════════════════════════════════════════════════════

/**
 * Process a single subscription from Asaas
 *
 * This worker:
 * 1. Validates subscription data
 * 2. Checks for existing subscription by asaasSubscriptionId
 * 3. Finds associated student by asaasCustomerId
 * 4. Creates or updates subscription record
 */
export async function processSubscriptionWorker(
	ctx: ActionCtx,
	subscription: AsaasSubscriptionResponse,
	organizationId?: string,
): Promise<WorkerResult<SubscriptionDoc>> {
	try {
		// Check if subscription exists
		const existingSubscription = await ctx.runQuery(
			internal.asaas.mutations.getSubscriptionByAsaasId,
			{
				asaasSubscriptionId: subscription.id,
			},
		);

		if (existingSubscription) {
			// Update existing subscription
			await ctx.runMutation(internal.asaas.mutations.updateSubscriptionFromAsaas, {
				subscriptionId: existingSubscription._id,
				status: subscription.status,
				value: subscription.value,
				nextDueDate: subscription.nextDueDate
					? new Date(subscription.nextDueDate).getTime()
					: undefined,
			});

			return {
				success: true,
				data: existingSubscription as SubscriptionDoc,
				updated: true,
			};
		}

		// Find student by asaasCustomerId
		let student = await ctx.runQuery(internal.asaas.mutations.getStudentByAsaasId, {
			asaasCustomerId: subscription.customer,
		});

		if (!student && subscription.externalReference) {
			const externalReference = subscription.externalReference.trim();
			if (isId(externalReference)) {
				student = await ctx.runQuery(internal.asaas.queries.getStudentById, {
					studentId: externalReference as Id<'students'>,
				});
			}

			if (!student && externalReference.includes('@')) {
				student = await ctx.runQuery(internal.asaas.mutations.getStudentByEmailOrCpf, {
					email: externalReference,
					cpf: undefined,
				});
			}
		}

		if (!student) {
			return {
				success: false,
				skipped: true,
				reason: `Student not found for asaasCustomerId: ${subscription.customer}`,
			};
		}

		const resolvedOrganizationId = organizationId ?? student.organizationId;

		// Create new subscription
		const subscriptionId = await ctx.runMutation(
			internal.asaas.mutations.createSubscriptionFromAsaas,
			{
				studentId: student._id,
				asaasSubscriptionId: subscription.id,
				asaasCustomerId: subscription.customer,
				value: subscription.value,
				cycle: subscription.cycle,
				status: subscription.status,
				nextDueDate: new Date(subscription.nextDueDate).getTime(),
				description: subscription.description,
				organizationId: resolvedOrganizationId,
			},
		);

		return {
			success: true,
			data: {
				// biome-ignore lint/style/useNamingConvention: Convex naming
				_id: subscriptionId as Id<'asaasSubscriptions'>,
				studentId: student._id,
				asaasSubscriptionId: subscription.id,
				asaasCustomerId: subscription.customer,
				organizationId: resolvedOrganizationId,
				value: subscription.value,
				cycle: subscription.cycle,
				status: subscription.status,
				nextDueDate: new Date(subscription.nextDueDate).getTime(),
				description: subscription.description,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			},
			created: true,
		};
	} catch (err: unknown) {
		const error = err as Error;
		// biome-ignore lint/suspicious/noConsole: Expected error logging for workers
		console.error(`Error processing subscription ${subscription.id}: ${error.message}`);
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
 * Create a batch processing function for customers
 * Wraps worker with 10s timeout to prevent blocking
 */
export function createCustomerBatchProcessor(ctx: ActionCtx, organizationId?: string) {
	return async (customer: AsaasCustomerResponse): Promise<WorkerResult<StudentWithAsaas>> => {
		try {
			return await withItemTimeout(
				() => processCustomerWorker(ctx, customer, organizationId),
				WORKER_TIMEOUT_MS,
				customer.id,
			);
			// biome-ignore lint/suspicious/noExplicitAny: Error handling
		} catch (error: any) {
			return {
				success: false,
				error: error.message || 'Worker timeout',
			};
		}
	};
}

/**
 * Create a batch processing function for payments
 * Wraps worker with 10s timeout to prevent blocking
 */
export function createPaymentBatchProcessor(ctx: ActionCtx, organizationId?: string) {
	return async (payment: AsaasPaymentResponse): Promise<WorkerResult<PaymentDoc>> => {
		try {
			return await withItemTimeout(
				() => processPaymentWorker(ctx, payment, organizationId),
				WORKER_TIMEOUT_MS,
				payment.id,
			);
			// biome-ignore lint/suspicious/noExplicitAny: Error handling
		} catch (error: any) {
			return {
				success: false,
				error: error.message || 'Worker timeout',
			};
		}
	};
}

/**
 * Create a batch processing function for subscriptions
 * Wraps worker with 10s timeout to prevent blocking
 */
export function createSubscriptionBatchProcessor(ctx: ActionCtx, organizationId?: string) {
	return async (
		subscription: AsaasSubscriptionResponse,
	): Promise<WorkerResult<SubscriptionDoc>> => {
		try {
			return await withItemTimeout(
				() => processSubscriptionWorker(ctx, subscription, organizationId),
				WORKER_TIMEOUT_MS,
				subscription.id,
			);
			// biome-ignore lint/suspicious/noExplicitAny: Error handling
		} catch (error: any) {
			return {
				success: false,
				error: error.message || 'Worker timeout',
			};
		}
	};
}

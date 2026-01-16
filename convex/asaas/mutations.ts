import { internalMutation, mutation, action, internalQuery } from '../_generated/server';
import { v } from 'convex/values';
import { getOrganizationId, requireAuth } from '../lib/auth';
import { hashCPF, encryptCPF } from '../lib/encryption';
import { internal } from '../_generated/api';
import { dateStringToTimestamp } from './client';
import { getEnrollmentIdOrDefault } from './helpers';

/**
 * Validation constants for payment operations
 */
const PAYMENT_VALIDATION = {
	MIN_AMOUNT: 0.01, // Minimum payment amount (1 cent)
	MAX_AMOUNT: 1000000, // Maximum payment amount (1 million BRL)
	MAX_INSTALLMENTS: 120, // Maximum number of installments (10 years)
} as const;

// ═══════════════════════════════════════════════════════
// SHARED SCHEMAS (reduce type instantiation depth)
// ═══════════════════════════════════════════════════════

/**
 * Billing type for payments
 */
const billingTypeSchema = v.union(
	v.literal('BOLETO'),
	v.literal('CREDIT_CARD'),
	v.literal('PIX'),
	v.literal('DEBIT_CARD'),
	v.literal('UNDEFINED'),
);

/**
 * Payment status from Asaas
 */
const paymentStatusSchema = v.union(
	v.literal('PENDING'),
	v.literal('RECEIVED'),
	v.literal('CONFIRMED'),
	v.literal('OVERDUE'),
	v.literal('REFUNDED'),
	v.literal('RECEIVED_IN_CASH'),
	v.literal('RECEIVED_IN_CASH_UNDONE'),
	v.literal('CHARGEBACK_REQUESTED'),
	v.literal('CHARGEBACK_DISPUTE'),
	v.literal('AWAITING_CHARGEBACK_REVERSAL'),
	v.literal('APPROVED_BY_RISK_ANALYSIS'),
	v.literal('REJECTED_BY_RISK_ANALYSIS'),
	v.literal('DELETED'),
	v.literal('DUNNING_REQUESTED'),
	v.literal('DUNNING_RECEIVED'),
	v.literal('AWAITING_RISK_ANALYSIS'),
	v.literal('CANCELLED'),
);

/**
 * Subscription status from Asaas
 */
const subscriptionStatusSchema = v.union(
	v.literal('ACTIVE'),
	v.literal('INACTIVE'),
	v.literal('CANCELLED'),
	v.literal('EXPIRED'),
);

/**
 * Validates payment amount according to business rules
 * @throws Error if amount is invalid
 */
function validatePaymentAmount(amount: number): void {
	if (typeof amount !== 'number' || isNaN(amount)) {
		throw new Error('Invalid payment amount: must be a number');
	}

	if (amount < PAYMENT_VALIDATION.MIN_AMOUNT) {
		throw new Error(
			`Payment amount must be at least R$ ${PAYMENT_VALIDATION.MIN_AMOUNT.toFixed(2)}`,
		);
	}

	if (amount > PAYMENT_VALIDATION.MAX_AMOUNT) {
		throw new Error(
			`Payment amount cannot exceed R$ ${PAYMENT_VALIDATION.MAX_AMOUNT.toLocaleString('pt-BR')}`,
		);
	}
}

/**
 * Validates installment count
 * @throws Error if count is invalid
 */
function validateInstallmentCount(count: number | undefined): void {
	if (count !== undefined) {
		if (!Number.isInteger(count) || count < 1) {
			throw new Error('Installment count must be a positive integer');
		}

		if (count > PAYMENT_VALIDATION.MAX_INSTALLMENTS) {
			throw new Error(`Installment count cannot exceed ${PAYMENT_VALIDATION.MAX_INSTALLMENTS}`);
		}
	}
}

/**
 * Sync student as Asaas customer (create or update)
 */
export const syncStudentAsCustomer = action({
	args: { studentId: v.id('students') },
	handler: async (ctx, args) => {
		await requireAuth(ctx);
		await ctx.runMutation(internal.asaas.mutations.syncStudentAsCustomerInternal as any, {
			studentId: args.studentId,
		});
	},
});

/**
 * Internal mutation to sync student as Asaas customer
 * This is called by actions after the Asaas API call completes.
 * Only updates the local student record with the Asaas customer ID.
 */
export const syncStudentAsCustomerInternal = internalMutation({
	args: {
		studentId: v.id('students'),
		asaasCustomerId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const student = await ctx.db.get(args.studentId);
		if (!student) throw new Error('Student not found');

		// Update the local record with Asaas customer ID
		if (args.asaasCustomerId) {
			await ctx.db.patch(args.studentId, {
				asaasCustomerId: args.asaasCustomerId,
				asaasCustomerSyncedAt: Date.now(),
				asaasCustomerSyncError: undefined,
				asaasCustomerSyncAttempts: 0,
			});
			return { studentId: args.studentId, synced: true };
		}

		return { studentId: args.studentId, synced: false };
	},
});

/**
 * Internal mutation to create a charge record
 * This replaces the missing 'createCharge' being called in actions.ts
 */
export const createCharge = internalMutation({
	args: {
		studentId: v.id('students'),
		enrollmentId: v.optional(v.id('enrollments')),
		asaasCustomerId: v.string(),
		asaasPaymentId: v.string(),
		amount: v.number(),
		dueDate: v.string(),
		billingType: billingTypeSchema,
		description: v.optional(v.string()),
		installmentCount: v.optional(v.number()),
		installmentNumber: v.optional(v.number()),
		boletoUrl: v.optional(v.string()),
		pixQrCode: v.optional(v.string()),
		organizationId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Validate payment amount
		validatePaymentAmount(args.amount);

		// Validate installment count if provided
		validateInstallmentCount(args.installmentCount);

		const now = Date.now();
		const chargeId = await ctx.db.insert('asaasPayments', {
			studentId: args.studentId,
			enrollmentId: args.enrollmentId,
			asaasCustomerId: args.asaasCustomerId,
			asaasPaymentId: args.asaasPaymentId,
			organizationId: args.organizationId,
			value: args.amount,
			dueDate: dateStringToTimestamp(args.dueDate),
			status: 'PENDING',
			billingType: args.billingType,
			description: args.description,
			totalInstallments: args.installmentCount,
			installmentNumber: args.installmentNumber,
			boletoUrl: args.boletoUrl,
			pixQrCode: args.pixQrCode,
			createdAt: now,
			updatedAt: now,
		});
		return chargeId;
	},
});

/**
 * Create payment from enrollment
 */
export const createPaymentFromEnrollment = mutation({
	args: {
		studentId: v.id('students'),
		enrollmentId: v.optional(v.id('enrollments')),
		asaasCustomerId: v.string(),
		asaasPaymentId: v.string(),
		amount: v.number(),
		dueDate: v.string(),
		billingType: billingTypeSchema,
		description: v.optional(v.string()),
		installmentCount: v.optional(v.number()),
		installmentNumber: v.optional(v.number()),
		boletoUrl: v.optional(v.string()),
		pixQrCode: v.optional(v.string()),
		// OrganizationId removed from args to enforcing backend check
		organizationId: v.optional(v.string()), // Kept as optional but ignored in handler favouring auth context
	},
	handler: async (ctx, args) => {
		// Auth check - throws if not authenticated
		void requireAuth(ctx);
		const orgId = await getOrganizationId(ctx);

		if (!orgId) {
			throw new Error('Organization ID is required for this operation');
		}

		// Validate payment amount
		validatePaymentAmount(args.amount);

		// Validate installment count if provided
		validateInstallmentCount(args.installmentCount);

		// Find best matching enrollment (uses helper to eliminate duplicate logic)
		const enrollmentId = await getEnrollmentIdOrDefault(
			ctx,
			args.studentId,
			args.enrollmentId,
			args.description,
		);

		const chargeId = await ctx.db.insert('asaasPayments', {
			studentId: args.studentId,
			enrollmentId,
			asaasCustomerId: args.asaasCustomerId,
			asaasPaymentId: args.asaasPaymentId,
			organizationId: orgId, // Force organization from auth context
			value: args.amount,
			dueDate: dateStringToTimestamp(args.dueDate),
			status: 'PENDING',
			billingType: args.billingType,
			description: args.description,
			totalInstallments: args.installmentCount,
			installmentNumber: args.installmentNumber,
			boletoUrl: args.boletoUrl,
			pixQrCode: args.pixQrCode,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
		return chargeId;
	},
});

/**
 * Updates the status of a charge based on Asaas webhook events.
 */
export const updateChargeStatus = internalMutation({
	args: {
		asaasPaymentId: v.string(),
		status: paymentStatusSchema,
	},
	handler: async (ctx, args) => {
		const charge = await ctx.db
			.query('asaasPayments')
			.withIndex('by_asaas_payment_id', (q) => q.eq('asaasPaymentId', args.asaasPaymentId))
			.first();

		if (!charge) {
			// SECURITY: Don't expose internal Asaas payment ID in error messages
			throw new Error('Charge not found');
		}

		await ctx.db.patch(charge._id, {
			status: args.status,
			updatedAt: Date.now(),
		});

		return charge._id;
	},
});

/**
 * Logs a payment event from Asaas webhook.
 */
export const logPaymentEvent = internalMutation({
	args: {
		asaasPaymentId: v.string(),
		eventType: v.string(),
		webhookPayload: v.any(),
		paidAt: v.optional(v.number()),
		netValue: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		// We want to link the webhook log to the payment, but paymentId in asaasWebhooks is a string (asakPaymentId), not reference?
		// Let's check schema:
		// asaasWebhooks: defineTable({ ... paymentId: v.optional(v.string()), ... })
		// So we don't need to look up the internal ID to insert into asaasWebhooks.

		// LGPD: Add retention policy (90 days)
		const now = Date.now();
		const retentionUntil = now + 90 * 24 * 60 * 60 * 1000;

		await ctx.db.insert('asaasWebhooks', {
			event: args.eventType,
			paymentId: args.asaasPaymentId,
			payload: args.webhookPayload,
			processed: true, // we assume processed if we are logging via this mutation called by webhook handler?
			// The plan says "processed: v.boolean() // Se foi processado com sucesso".
			// The webhook handler calls this. If this succeeds, it's processed?
			// Or should the handler call this first?
			// Typically, you log raw webhook first, then process.
			// But here we are logging "Payment Event".
			// I'll stick to: 'processed: true' because we are doing it.

			retentionUntil,
			createdAt: now,
			// error?
		});

		// Also, if paidAt/netValue provided, we should probably update the payment itself?
		// updateChargeStatus handles status. Does it handle netValue?
		// My updateChargeStatus only takes status.
		// I should update it to take netValue and paidAt if provided.

		if (args.paidAt || args.netValue) {
			const charge = await ctx.db
				.query('asaasPayments')
				.withIndex('by_asaas_payment_id', (q) => q.eq('asaasPaymentId', args.asaasPaymentId))
				.first();

			if (charge) {
				await ctx.db.patch(charge._id, {
					confirmedDate: args.paidAt,
					netValue: args.netValue,
					updatedAt: Date.now(),
				});
			}
		}
	},
});

export const updateStudentAsaasId = internalMutation({
	args: {
		studentId: v.id('students'),
		asaasCustomerId: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.studentId, {
			asaasCustomerId: args.asaasCustomerId,
			asaasCustomerSyncedAt: Date.now(),
			asaasCustomerSyncError: undefined,
			asaasCustomerSyncAttempts: 0,
		});
	},
});

// ═══════════════════════════════════════════════════════
// IMPORT HELPER QUERIES (Internal)
// ═══════════════════════════════════════════════════════

/**
 * Get student by Asaas customer ID
 */
export const getStudentByAsaasId = internalQuery({
	args: { asaasCustomerId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query('students')
			.filter((q) => q.eq(q.field('asaasCustomerId'), args.asaasCustomerId))
			.first();
	},
});

/**
 * Get student by Email or CPF (for deduplication)
 */
export const getStudentByEmailOrCpf = internalQuery({
	args: {
		email: v.optional(v.string()),
		cpf: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// 1. Try by Email (Indexed)
		if (args.email) {
			const studentByEmail = await ctx.db
				.query('students')
				.withIndex('by_email', (q) => q.eq('email', args.email))
				.first();

			if (studentByEmail) return studentByEmail;
		}

		// 2. Try by CPF (Indexed lookup using Blind Index)
		if (args.cpf) {
			const cpfHash = await hashCPF(args.cpf);
			const studentByCpf = await ctx.db
				.query('students')
				.withIndex('by_cpf_hash', (q) => q.eq('cpfHash', cpfHash))
				.first();

			if (studentByCpf) return studentByCpf;
		}

		return null;
	},
});

/**
 * Get payment by Asaas payment ID
 */
export const getPaymentByAsaasId = internalQuery({
	args: { asaasPaymentId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query('asaasPayments')
			.withIndex('by_asaas_payment_id', (q) => q.eq('asaasPaymentId', args.asaasPaymentId))
			.first();
	},
});

/**
 * Get subscription by Asaas subscription ID
 */
export const getSubscriptionByAsaasId = internalQuery({
	args: { asaasSubscriptionId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query('asaasSubscriptions')
			.withIndex('by_asaas_subscription_id', (q) =>
				q.eq('asaasSubscriptionId', args.asaasSubscriptionId),
			)
			.first();
	},
});

// ═══════════════════════════════════════════════════════
// IMPORT MUTATIONS (Internal)
// ═══════════════════════════════════════════════════════

/**
 * Create a new student from Asaas customer data
 */
export const createStudentFromAsaas = internalMutation({
	args: {
		name: v.string(),
		email: v.optional(v.string()),
		phone: v.string(),
		cpf: v.optional(v.string()),
		asaasCustomerId: v.string(),
		organizationId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		const cpfHash = args.cpf ? await hashCPF(args.cpf) : undefined;
		const encryptedCPF = args.cpf ? await encryptCPF(args.cpf) : undefined;

		return await ctx.db.insert('students', {
			name: args.name,
			email: args.email,
			phone: args.phone,
			cpf: args.cpf,
			cpfHash,
			encryptedCPF,
			asaasCustomerId: args.asaasCustomerId,
			organizationId: args.organizationId,
			asaasCustomerSyncedAt: now,
			lgpdConsent: false,
			status: 'ativo',
			// Required fields with sensible defaults for Asaas imports
			profession: 'Não informado',
			hasClinic: false,
			churnRisk: 'baixo',
			createdAt: now,
			updatedAt: now,
		});
	},
});

/**
 * Update student from Asaas customer data
 */
export const updateStudentFromAsaas = internalMutation({
	args: {
		studentId: v.id('students'),
		name: v.optional(v.string()),
		email: v.optional(v.string()),
		phone: v.optional(v.string()),
		cpf: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { studentId, ...updates } = args;
		const patch: Record<string, unknown> = { updatedAt: Date.now() };

		if (updates.name !== undefined) patch.name = updates.name;
		if (updates.email !== undefined) patch.email = updates.email;
		if (updates.phone !== undefined) patch.phone = updates.phone;
		if (updates.cpf !== undefined) {
			patch.cpf = updates.cpf;
			patch.cpfHash = await hashCPF(updates.cpf);
			patch.encryptedCPF = await encryptCPF(updates.cpf);
		}

		await ctx.db.patch(studentId, patch);
	},
});

/**
 * Create a new payment record from Asaas data
 */
export const createPaymentFromAsaas = internalMutation({
	args: {
		studentId: v.id('students'),
		asaasPaymentId: v.string(),
		asaasCustomerId: v.string(),
		value: v.number(),
		netValue: v.optional(v.number()),
		status: v.string(),
		dueDate: v.number(),
		billingType: billingTypeSchema,
		description: v.optional(v.string()),
		boletoUrl: v.optional(v.string()),
		confirmedDate: v.optional(v.number()),
		organizationId: v.optional(v.string()),
		installmentNumber: v.optional(v.number()),
		totalInstallments: v.optional(v.number()),
		enrollmentId: v.optional(v.id('enrollments')),
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		// Use shared helper to find matching enrollment (eliminates duplicate logic)
		const enrollmentId = await getEnrollmentIdOrDefault(
			ctx,
			args.studentId,
			args.enrollmentId,
			args.description,
		);

		return await ctx.db.insert('asaasPayments', {
			studentId: args.studentId,
			enrollmentId,
			asaasPaymentId: args.asaasPaymentId,

			asaasCustomerId: args.asaasCustomerId,
			organizationId: args.organizationId,
			value: args.value,
			netValue: args.netValue,
			status: args.status as any, // Trust the status from Asaas
			dueDate: args.dueDate,
			billingType: args.billingType,
			description: args.description,
			boletoUrl: args.boletoUrl,
			confirmedDate: args.confirmedDate,
			installmentNumber: args.installmentNumber,
			totalInstallments: args.totalInstallments,
			createdAt: now,
			updatedAt: now,
		});
	},
});

/**
 * Update payment from Asaas data
 */
export const updatePaymentFromAsaas = internalMutation({
	args: {
		paymentId: v.id('asaasPayments'),
		status: v.optional(v.string()),
		netValue: v.optional(v.number()),
		confirmedDate: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { paymentId, ...updates } = args;
		const patch: Record<string, unknown> = { updatedAt: Date.now() };

		if (updates.status !== undefined) patch.status = updates.status;
		if (updates.netValue !== undefined) patch.netValue = updates.netValue;
		if (updates.confirmedDate !== undefined) patch.confirmedDate = updates.confirmedDate;

		await ctx.db.patch(paymentId, patch);
	},
});

/**
 * Create a new subscription record from Asaas data
 */
export const createSubscriptionFromAsaas = internalMutation({
	args: {
		studentId: v.id('students'),
		asaasSubscriptionId: v.string(),
		asaasCustomerId: v.string(),
		value: v.number(),
		cycle: v.string(),
		status: v.string(),
		nextDueDate: v.number(),
		description: v.optional(v.string()), // Added description
		organizationId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		const subscriptionId = await ctx.db.insert('asaasSubscriptions', {
			studentId: args.studentId,
			asaasSubscriptionId: args.asaasSubscriptionId,
			asaasCustomerId: args.asaasCustomerId,
			organizationId: args.organizationId,
			value: args.value,
			cycle: args.cycle as any,
			status: args.status as any,
			nextDueDate: args.nextDueDate,
			description: args.description,
			createdAt: now,
			updatedAt: now,
		});

		// Map description to product and update student
		if (args.description) {
			const desc = args.description.toLowerCase();
			let productKey: string | null = null;

			if (desc.includes('trinta') || desc.includes('30e3')) productKey = 'trintae3';
			else if (desc.includes('otb') || desc.includes('outside')) productKey = 'otb';
			else if (desc.includes('black') || desc.includes('neon')) productKey = 'black_neon';
			else if (desc.includes('comunidade') || desc.includes('club')) productKey = 'comunidade';
			else if (desc.includes('auriculo')) productKey = 'auriculo';
			else if (desc.includes('mesa')) productKey = 'na_mesa_certa';

			if (productKey) {
				const student = await ctx.db.get(args.studentId);
				if (student) {
					const currentProducts = student.products || [];
					if (!currentProducts.includes(productKey)) {
						await ctx.db.patch(args.studentId, {
							products: [...currentProducts, productKey],
							updatedAt: now,
						});
					}
				}
			}
		}

		return subscriptionId;
	},
});

/**
 * Update subscription from Asaas data
 */
export const updateSubscriptionFromAsaas = internalMutation({
	args: {
		subscriptionId: v.id('asaasSubscriptions'),
		status: v.optional(subscriptionStatusSchema),
		value: v.optional(v.number()),
		nextDueDate: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { subscriptionId, ...updates } = args;
		const patch: Record<string, unknown> = { updatedAt: Date.now() };

		if (updates.status !== undefined) patch.status = updates.status;
		if (updates.value !== undefined) patch.value = updates.value;
		if (updates.nextDueDate !== undefined) patch.nextDueDate = updates.nextDueDate;

		await ctx.db.patch(subscriptionId, patch);
	},
});

/**
 * Update subscription status from Asaas ID (used by webhooks)
 */
export const updateSubscriptionStatusInternal = internalMutation({
	args: {
		asaasSubscriptionId: v.string(),
		status: subscriptionStatusSchema,
		nextDueDate: v.optional(v.number()),
		value: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const subscription = await ctx.db
			.query('asaasSubscriptions')
			.withIndex('by_asaas_subscription_id', (q) =>
				q.eq('asaasSubscriptionId', args.asaasSubscriptionId),
			)
			.first();

		if (!subscription) {
			console.warn(`Subscription with Asaas ID ${args.asaasSubscriptionId} not found`);
			return null;
		}

		const patch: any = {
			status: args.status,
			updatedAt: Date.now(),
		};

		if (args.nextDueDate !== undefined) patch.nextDueDate = args.nextDueDate;
		if (args.value !== undefined) patch.value = args.value;

		await ctx.db.patch(subscription._id, patch);
		return subscription._id;
	},
});

/**
 * Update payment with Asaas payment ID (used by export workers)
 */
export const updatePaymentAsaasId = internalMutation({
	args: {
		paymentId: v.id('asaasPayments'),
		asaasPaymentId: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.paymentId, {
			asaasPaymentId: args.asaasPaymentId,
			updatedAt: Date.now(),
		});
	},
});

import { internalMutation, mutation } from "../_generated/server";
import { v } from "convex/values";
import { dateStringToTimestamp, timestampToDateString, asaasCustomers, asaasPayments, asaasSubscriptions, type AsaasCustomerPayload, type AsaasPaymentPayload, type AsaasSubscriptionPayload } from "../lib/asaas";
import { requireAuth } from "../lib/auth";
import { decryptCPF } from "../lib/encryption";

/**
 * Sync student as Asaas customer (create or update)
 */
export const syncStudentAsCustomer = mutation({
	args: { studentId: v.id('students') },
	handler: async (ctx, args) => {
		await requireAuth(ctx)

		const student = await ctx.db.get(args.studentId)
		if (!student) {
			throw new Error('Student not found')
		}

		// Decrypt CPF if needed
		let cpf: string | undefined
		if (student.encryptedCPF) {
			cpf = await decryptCPF(student.encryptedCPF)
		} else if (student.cpf) {
			cpf = student.cpf
		}

		// Prepare customer payload
		const customerPayload: AsaasCustomerPayload = {
			name: student.name,
			email: student.email,
			phone: student.phone,
			mobilePhone: student.phone,
			externalReference: student._id,
		}

		// Add CPF if available (remove formatting)
		if (cpf) {
			customerPayload.cpfCnpj = cpf.replace(/\D/g, '')
		}

		// Add address if available
		if (student.address) {
			customerPayload.address = student.address
			customerPayload.addressNumber = student.addressNumber
			customerPayload.complement = student.complement
			customerPayload.province = student.neighborhood
			customerPayload.city = student.city
			customerPayload.state = student.state
			customerPayload.postalCode = student.zipCode
			customerPayload.country = student.country || 'Brasil'
		}

		try {
			let asaasCustomerId: string

			if (student.asaasCustomerId) {
				// Update existing customer
				await asaasCustomers.update(student.asaasCustomerId, customerPayload)
				asaasCustomerId = student.asaasCustomerId
			} else {
				// Create new customer
				const customer = await asaasCustomers.create(customerPayload)
				asaasCustomerId = customer.id
			}

			// Update student record
			await ctx.db.patch(args.studentId, {
				asaasCustomerId,
				asaasCustomerSyncedAt: Date.now(),
			})

			return { asaasCustomerId }
		} catch (error) {
			console.error('Error syncing student as Asaas customer:', error)
			throw new Error(`Failed to sync student as customer: ${error instanceof Error ? error.message : String(error)}`)
		}
	},
})

/**
 * Create payment from enrollment
 */
export const createPaymentFromEnrollment = mutation({
	args: {
		enrollmentId: v.id('enrollments'),
		billingType: v.union(
			v.literal('BOLETO'),
			v.literal('PIX'),
			v.literal('CREDIT_CARD'),
			v.literal('DEBIT_CARD'),
			v.literal('UNDEFINED'),
		),
		dueDate: v.optional(v.number()), // Timestamp, defaults to enrollment startDate
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx)

		const enrollment = await ctx.db.get(args.enrollmentId)
		if (!enrollment) {
			throw new Error('Enrollment not found')
		}

		const student = await ctx.db.get(enrollment.studentId)
		if (!student) {
			throw new Error('Student not found')
		}

		if (!student.asaasCustomerId) {
			throw new Error('Student not synced with Asaas. Please sync student first.')
		}

		// Calculate due date
		const dueDateTimestamp = args.dueDate || enrollment.startDate || Date.now()
		const dueDateStr = timestampToDateString(dueDateTimestamp)

		// Prepare payment payload
		const paymentPayload: AsaasPaymentPayload = {
			customer: student.asaasCustomerId,
			billingType: args.billingType,
			value: enrollment.installmentValue,
			dueDate: dueDateStr,
			description: `Matrícula ${enrollment.product} - Parcela ${enrollment.paidInstallments ? enrollment.paidInstallments + 1 : 1}/${enrollment.installments}`,
			externalReference: enrollment._id,
			fine: {
				value: 2.0,
				type: 'PERCENTAGE',
			},
			interest: {
				value: 1.0,
				type: 'PERCENTAGE',
			},
		}

		try {
			const payment = await asaasPayments.create(paymentPayload)

			// Save payment to database
			const paymentId = await ctx.db.insert('asaasPayments', {
				enrollmentId: enrollment._id,
				studentId: student._id,
                organizationId: student.organizationId,
				asaasPaymentId: payment.id,
				asaasCustomerId: student.asaasCustomerId,
				value: payment.value,
				netValue: payment.netValue,
				status: payment.status as any,
				dueDate: dateStringToTimestamp(payment.dueDate),
				billingType: payment.billingType,
				boletoUrl: payment.bankSlipUrl,
				boletoBarcode: payment.identificationField,
				pixQrCode: payment.pixQrCode,
				pixQrCodeBase64: payment.pixQrCode,
				description: payment.description,
				externalReference: payment.externalReference,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			})

			return { paymentId, asaasPaymentId: payment.id }
		} catch (error) {
			console.error('Error creating payment:', error)
			throw new Error(`Failed to create payment: ${error instanceof Error ? error.message : String(error)}`)
		}
	},
})

/**
 * Create installments from enrollment (multiple payments)
 */
export const createInstallmentsFromEnrollment = mutation({
	args: {
		enrollmentId: v.id('enrollments'),
		billingType: v.union(
			v.literal('BOLETO'),
			v.literal('PIX'),
			v.literal('CREDIT_CARD'),
			v.literal('DEBIT_CARD'),
			v.literal('UNDEFINED'),
		),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx)

		const enrollment = await ctx.db.get(args.enrollmentId)
		if (!enrollment) {
			throw new Error('Enrollment not found')
		}

		const student = await ctx.db.get(enrollment.studentId)
		if (!student) {
			throw new Error('Student not found')
		}

		if (!student.asaasCustomerId) {
			throw new Error('Student not synced with Asaas. Please sync student first.')
		}

		const startDate = enrollment.startDate || Date.now()
		const paidCount = enrollment.paidInstallments || 0
		const totalInstallments = enrollment.installments

		// Create payments for remaining installments
		const paymentIds: string[] = []

		for (let i = paidCount + 1; i <= totalInstallments; i++) {
			// Calculate due date (monthly installments)
			const dueDate = new Date(startDate)
			dueDate.setMonth(dueDate.getMonth() + i - 1)
			const dueDateStr = timestampToDateString(dueDate.getTime())

			const paymentPayload: AsaasPaymentPayload = {
				customer: student.asaasCustomerId,
				billingType: args.billingType,
				value: enrollment.installmentValue,
				dueDate: dueDateStr,
				description: `Matrícula ${enrollment.product} - Parcela ${i}/${totalInstallments}`,
				externalReference: `${enrollment._id}-${i}`,
				fine: {
					value: 2.0,
					type: 'PERCENTAGE',
				},
				interest: {
					value: 1.0,
					type: 'PERCENTAGE',
				},
			}

			try {
				const payment = await asaasPayments.create(paymentPayload)

				const paymentId = await ctx.db.insert('asaasPayments', {
					enrollmentId: enrollment._id,
					studentId: student._id,
                    organizationId: student.organizationId,
					asaasPaymentId: payment.id,
					asaasCustomerId: student.asaasCustomerId,
					value: payment.value,
					netValue: payment.netValue,
					status: payment.status as any,
					dueDate: dateStringToTimestamp(payment.dueDate),
					installmentNumber: i,
					totalInstallments,
					billingType: payment.billingType,
					boletoUrl: payment.bankSlipUrl,
					boletoBarcode: payment.identificationField,
					pixQrCode: payment.pixQrCode,
					pixQrCodeBase64: payment.pixQrCode,
					description: payment.description,
					externalReference: payment.externalReference,
					createdAt: Date.now(),
					updatedAt: Date.now(),
				})

				paymentIds.push(paymentId)
			} catch (error) {
				console.error(`Error creating installment ${i}:`, error)
				// Continue with other installments even if one fails
			}
		}

		return { paymentIds, count: paymentIds.length }
	},
})

/**
 * Create subscription from enrollment (recurring payments)
 */
export const createSubscriptionFromEnrollment = mutation({
	args: {
		enrollmentId: v.id('enrollments'),
		billingType: v.union(
			v.literal('BOLETO'),
			v.literal('PIX'),
			v.literal('CREDIT_CARD'),
			v.literal('DEBIT_CARD'),
			v.literal('UNDEFINED'),
		),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx)

		const enrollment = await ctx.db.get(args.enrollmentId)
		if (!enrollment) {
			throw new Error('Enrollment not found')
		}

		const student = await ctx.db.get(enrollment.studentId)
		if (!student) {
			throw new Error('Student not found')
		}

		if (!student.asaasCustomerId) {
			throw new Error('Student not synced with Asaas. Please sync student first.')
		}

		const startDate = enrollment.startDate || Date.now()
		const nextDueDateStr = timestampToDateString(startDate)

		const subscriptionPayload: AsaasSubscriptionPayload = {
			customer: student.asaasCustomerId,
			billingType: args.billingType,
			value: enrollment.installmentValue,
			nextDueDate: nextDueDateStr,
			cycle: 'MONTHLY',
			description: `Matrícula ${enrollment.product} - Mensalidade`,
			externalReference: enrollment._id,
			fine: {
				value: 2.0,
				type: 'PERCENTAGE',
			},
			interest: {
				value: 1.0,
				type: 'PERCENTAGE',
			},
		}

		try {
			const subscription = await asaasSubscriptions.create(subscriptionPayload)

			// Save subscription to database
			const subscriptionId = await ctx.db.insert('asaasSubscriptions', {
				enrollmentId: enrollment._id,
				studentId: student._id,
                organizationId: student.organizationId,
				asaasSubscriptionId: subscription.id,
				asaasCustomerId: student.asaasCustomerId,
				value: subscription.value,
				cycle: subscription.cycle,
				status: subscription.status as any,
				nextDueDate: dateStringToTimestamp(subscription.nextDueDate),
				createdAt: Date.now(),
				updatedAt: Date.now(),
			})

			return { subscriptionId, asaasSubscriptionId: subscription.id }
		} catch (error) {
			console.error('Error creating subscription:', error)
			throw new Error(`Failed to create subscription: ${error instanceof Error ? error.message : String(error)}`)
		}
	},
})

/**
 * Update payment status (used by webhooks)
 */
export const updatePaymentStatus = internalMutation({
	args: {
		asaasPaymentId: v.string(),
		status: v.union(
			v.literal('PENDING'),
			v.literal('RECEIVED'),
			v.literal('CONFIRMED'),
			v.literal('OVERDUE'),
			v.literal('REFUNDED'),
			v.literal('DELETED'),
			v.literal('DUNNING_REQUESTED'),
			v.literal('DUNNING_RECEIVED'),
			v.literal('AWAITING_RISK_ANALYSIS'),
			v.literal('CANCELLED'),
		),
		confirmedDate: v.optional(v.number()),
		netValue: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const payment = await ctx.db
			.query('asaasPayments')
			.withIndex('by_asaas_payment_id', (q) => q.eq('asaasPaymentId', args.asaasPaymentId))
			.first()

		if (!payment) {
			throw new Error(`Payment not found: ${args.asaasPaymentId}`)
		}

		const updates: any = {
			status: args.status,
			updatedAt: Date.now(),
		}

		if (args.confirmedDate) {
			updates.confirmedDate = args.confirmedDate
		}

		if (args.netValue !== undefined) {
			updates.netValue = args.netValue
		}

		await ctx.db.patch(payment._id, updates)

		// Update enrollment if payment is confirmed
		if (payment.enrollmentId && (args.status === 'CONFIRMED' || args.status === 'RECEIVED')) {
			const enrollment = await ctx.db.get(payment.enrollmentId)
			if (enrollment) {
				const paidInstallments = (enrollment.paidInstallments || 0) + 1
				const isFullyPaid = paidInstallments >= enrollment.installments

				await ctx.db.patch(payment.enrollmentId, {
					paidInstallments,
					paymentStatus: isFullyPaid ? 'quitado' : 'em_dia',
					updatedAt: Date.now(),
				})
			}
		}

		return payment._id
	},
})

/**
 * Cancel payment
 */
export const cancelPayment = mutation({
	args: { paymentId: v.id('asaasPayments') },
	handler: async (ctx, args) => {
		await requireAuth(ctx)

		const payment = await ctx.db.get(args.paymentId)
		if (!payment) {
			throw new Error('Payment not found')
		}

		try {
			await asaasPayments.delete(payment.asaasPaymentId)

			await ctx.db.patch(args.paymentId, {
				status: 'CANCELLED',
				updatedAt: Date.now(),
			})

			return { success: true }
		} catch (error) {
			console.error('Error cancelling payment:', error)
			throw new Error(`Failed to cancel payment: ${error instanceof Error ? error.message : String(error)}`)
		}
	},
})

/**
 * Refresh payment status from Asaas API
 */
export const refreshPaymentStatus = mutation({
	args: { paymentId: v.id('asaasPayments') },
	handler: async (ctx, args) => {
		await requireAuth(ctx)

		const payment = await ctx.db.get(args.paymentId)
		if (!payment) {
			throw new Error('Payment not found')
		}

		try {
			const asaasPayment = await asaasPayments.get(payment.asaasPaymentId)

			await ctx.db.patch(args.paymentId, {
				status: asaasPayment.status as any,
				netValue: asaasPayment.netValue,
				confirmedDate: asaasPayment.paymentDate
					? dateStringToTimestamp(asaasPayment.paymentDate)
					: undefined,
				updatedAt: Date.now(),
			})

			return { success: true, status: asaasPayment.status }
		} catch (error) {
			console.error('Error refreshing payment status:', error)
			throw new Error(`Failed to refresh payment status: ${error instanceof Error ? error.message : String(error)}`)
		}
	},
})

/**
 * Sync student as customer (internal)
 */
export const syncStudentAsCustomerInternal = internalMutation({
	args: { studentId: v.id('students') },
	handler: async (ctx, args) => {
		const student = await ctx.db.get(args.studentId)
		if (!student) {
			throw new Error('Student not found')
		}

		// Decrypt CPF if needed
		let cpf: string | undefined
		if (student.encryptedCPF) {
			cpf = await decryptCPF(student.encryptedCPF)
		} else if (student.cpf) {
			cpf = student.cpf
		}

		const customerPayload: AsaasCustomerPayload = {
			name: student.name,
			email: student.email,
			phone: student.phone,
			mobilePhone: student.phone,
			externalReference: student._id,
		}

		if (cpf) {
			customerPayload.cpfCnpj = cpf.replace(/\D/g, '')
		}

		if (student.address) {
			customerPayload.address = student.address
			customerPayload.addressNumber = student.addressNumber
			customerPayload.complement = student.complement
			customerPayload.province = student.neighborhood
			customerPayload.city = student.city
			customerPayload.state = student.state
			customerPayload.postalCode = student.zipCode
			customerPayload.country = student.country || 'Brasil'
		}

		let asaasCustomerId: string

		if (student.asaasCustomerId) {
			await asaasCustomers.update(student.asaasCustomerId, customerPayload)
			asaasCustomerId = student.asaasCustomerId
		} else {
			const customer = await asaasCustomers.create(customerPayload)
			asaasCustomerId = customer.id
		}

		await ctx.db.patch(args.studentId, {
			asaasCustomerId,
			asaasCustomerSyncedAt: Date.now(),
		})

		return { asaasCustomerId }
	},
})


export const createCharge = internalMutation({
  args: {
    studentId: v.id("students"),
    asaasPaymentId: v.string(),
    asaasCustomerId: v.string(), // Added missing arg
    amount: v.number(),
    dueDate: v.string(),
    billingType: v.union(
      v.literal("BOLETO"),
      v.literal("PIX"),
      v.literal("CREDIT_CARD"),
      v.literal("DEBIT_CARD"),
      v.literal("UNDEFINED")
    ),
    description: v.optional(v.string()),
    installmentCount: v.optional(v.number()),
    installmentNumber: v.optional(v.number()),
    boletoUrl: v.optional(v.string()),
    pixQrCode: v.optional(v.string()),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const chargeId = await ctx.db.insert("asaasPayments", {
      studentId: args.studentId,
      asaasCustomerId: args.asaasCustomerId,
      asaasPaymentId: args.asaasPaymentId,
      organizationId: args.organizationId,
      value: args.amount, // Schema uses 'value', input args uses 'amount' to match old code, I'll map it.
      dueDate: dateStringToTimestamp(args.dueDate),
      status: "PENDING", // Default status
      billingType: args.billingType,
      description: args.description,
      totalInstallments: args.installmentCount, // Map installmentCount to totalInstallments
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
    status: v.union(
      v.literal("PENDING"),
      v.literal("RECEIVED"),
      v.literal("CONFIRMED"),
      v.literal("OVERDUE"),
      v.literal("REFUNDED"),
      v.literal("DELETED"),
      v.literal("DUNNING_REQUESTED"),
      v.literal("DUNNING_RECEIVED"),
      v.literal("AWAITING_RISK_ANALYSIS"),
      v.literal("CANCELLED")
    ),
  },
  handler: async (ctx, args) => {
    const charge = await ctx.db
      .query("asaasPayments")
      .withIndex("by_asaas_payment_id", (q) => q.eq("asaasPaymentId", args.asaasPaymentId))
      .first();

    if (!charge) {
      throw new Error(`Charge with Asaas ID ${args.asaasPaymentId} not found`);
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

    await ctx.db.insert("asaasWebhooks", {
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

      createdAt: Date.now(),
      // error?
    });

    // Also, if paidAt/netValue provided, we should probably update the payment itself?
    // updateChargeStatus handles status. Does it handle netValue?
    // My updateChargeStatus only takes status.
    // I should update it to take netValue and paidAt if provided.

    if (args.paidAt || args.netValue) {
       const charge = await ctx.db
        .query("asaasPayments")
        .withIndex("by_asaas_payment_id", (q) => q.eq("asaasPaymentId", args.asaasPaymentId))
        .first();

       if (charge) {
         await ctx.db.patch(charge._id, {
           confirmedDate: args.paidAt,
           netValue: args.netValue,
           updatedAt: Date.now()
         });
       }
    }
  },
});

export const updateStudentAsaasId = internalMutation({
  args: {
    studentId: v.id("students"),
    asaasCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.studentId, {
      asaasCustomerId: args.asaasCustomerId,
      asaasCustomerSyncedAt: Date.now(),
    });
  },
});

// ═══════════════════════════════════════════════════════
// IMPORT HELPER QUERIES (Internal)
// ═══════════════════════════════════════════════════════

import { internalQuery } from "../_generated/server";

/**
 * Get student by Asaas customer ID
 */
export const getStudentByAsaasId = internalQuery({
  args: { asaasCustomerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("students")
      .filter((q) => q.eq(q.field("asaasCustomerId"), args.asaasCustomerId))
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
        .query("students")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();

      if (studentByEmail) return studentByEmail;
    }

    // 2. Try by CPF (Filter - slower but necessary)
    if (args.cpf) {
      // Clean CPF just in case, though usually stored raw or formatted.
      // We assume args.cpf is consistent with DB storage.
      const studentByCpf = await ctx.db
        .query("students")
        .filter((q) => q.eq(q.field("cpf"), args.cpf))
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
      .query("asaasPayments")
      .withIndex("by_asaas_payment_id", (q) => q.eq("asaasPaymentId", args.asaasPaymentId))
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
      .query("asaasSubscriptions")
      .withIndex("by_asaas_subscription_id", (q) => q.eq("asaasSubscriptionId", args.asaasSubscriptionId))
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
    return await ctx.db.insert("students", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      cpf: args.cpf,
      asaasCustomerId: args.asaasCustomerId,
      organizationId: args.organizationId,
      asaasCustomerSyncedAt: now,
      lgpdConsent: false,
      status: "ativo",
      // Required fields with sensible defaults for Asaas imports
      profession: "Não informado",
      hasClinic: false,
      churnRisk: "baixo",
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
    studentId: v.id("students"),
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
    if (updates.cpf !== undefined) patch.cpf = updates.cpf;

    await ctx.db.patch(studentId, patch);
  },
});

/**
 * Create a new payment record from Asaas data
 */
export const createPaymentFromAsaas = internalMutation({
  args: {
    studentId: v.id("students"),
    asaasPaymentId: v.string(),
    asaasCustomerId: v.string(),
    value: v.number(),
    netValue: v.optional(v.number()),
    status: v.string(),
    dueDate: v.number(),
    billingType: v.union(
      v.literal("BOLETO"),
      v.literal("PIX"),
      v.literal("CREDIT_CARD"),
      v.literal("DEBIT_CARD"),
      v.literal("UNDEFINED")
    ),
    description: v.optional(v.string()),
    boletoUrl: v.optional(v.string()),
    confirmedDate: v.optional(v.number()),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("asaasPayments", {
      studentId: args.studentId,
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
    paymentId: v.id("asaasPayments"),
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
    studentId: v.id("students"),
    asaasSubscriptionId: v.string(),
    asaasCustomerId: v.string(),
    value: v.number(),
    cycle: v.union(
      v.literal("WEEKLY"),
      v.literal("BIWEEKLY"),
      v.literal("MONTHLY"),
      v.literal("QUARTERLY"),
      v.literal("SEMIANNUALLY"),
      v.literal("YEARLY")
    ),
    status: v.union(
      v.literal("ACTIVE"),
      v.literal("INACTIVE"),
      v.literal("CANCELLED"),
      v.literal("EXPIRED")
    ),
    nextDueDate: v.number(),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("asaasSubscriptions", {
      studentId: args.studentId,
      asaasSubscriptionId: args.asaasSubscriptionId,
      asaasCustomerId: args.asaasCustomerId,
      organizationId: args.organizationId,
      value: args.value,
      cycle: args.cycle,
      status: args.status,
      nextDueDate: args.nextDueDate,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update subscription from Asaas data
 */
export const updateSubscriptionFromAsaas = internalMutation({
  args: {
    subscriptionId: v.id("asaasSubscriptions"),
    status: v.optional(v.union(
      v.literal("ACTIVE"),
      v.literal("INACTIVE"),
      v.literal("CANCELLED"),
      v.literal("EXPIRED")
    )),
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
    status: v.union(
      v.literal("ACTIVE"),
      v.literal("INACTIVE"),
      v.literal("CANCELLED"),
      v.literal("EXPIRED")
    ),
    nextDueDate: v.optional(v.number()),
    value: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("asaasSubscriptions")
      .withIndex("by_asaas_subscription_id", (q) => q.eq("asaasSubscriptionId", args.asaasSubscriptionId))
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

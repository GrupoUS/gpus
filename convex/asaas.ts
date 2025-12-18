/**
 * Asaas Integration - Convex Functions
 *
 * Queries, mutations, and actions for Asaas payment integration.
 * Handles customer sync, payment creation, webhook processing, and financial reporting.
 */

import { v } from 'convex/values'
import { query, mutation, action, internalMutation, internalQuery } from './_generated/server'
import { internal } from './_generated/api'
import { requireAuth } from './lib/auth'
import {
	asaasCustomers,
	asaasPayments,
	asaasSubscriptions,
	type AsaasCustomerPayload,
	type AsaasPaymentPayload,
	type AsaasSubscriptionPayload,
	dateStringToTimestamp,
	timestampToDateString,
} from './lib/asaas'
import { decryptCPF } from './lib/encryption'

// ═══════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════

/**
 * Get Asaas customer ID for a student
 */
export const getCustomerByStudent = query({
	args: { studentId: v.id('students') },
	handler: async (ctx, args) => {
		await requireAuth(ctx)

		const student = await ctx.db.get(args.studentId)
		if (!student) return null

		return {
			studentId: student._id,
			asaasCustomerId: student.asaasCustomerId,
			syncedAt: student.asaasCustomerSyncedAt,
		}
	},
})

/**
 * Get all payments for an enrollment
 */
export const getPaymentsByEnrollment = query({
	args: { enrollmentId: v.id('enrollments') },
	handler: async (ctx, args) => {
		await requireAuth(ctx)

		const payments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_enrollment', (q) => q.eq('enrollmentId', args.enrollmentId))
			.order('desc')
			.collect()

		return payments
	},
})

/**
 * Get all payments for a student
 */
export const getPaymentsByStudent = query({
	args: { studentId: v.id('students') },
	handler: async (ctx, args) => {
		await requireAuth(ctx)

		const payments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_student', (q) => q.eq('studentId', args.studentId))
			.order('desc')
			.collect()

		return payments
	},
})

/**
 * Get pending payments
 */
export const getPendingPayments = query({
	args: {},
	handler: async (ctx) => {
		await requireAuth(ctx)

		const payments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_status', (q) => q.eq('status', 'PENDING'))
			.order('asc')
			.collect()

		return payments
	},
})

/**
 * Get overdue payments
 */
export const getOverduePayments = query({
	args: {},
	handler: async (ctx) => {
		await requireAuth(ctx)

		const now = Date.now()
		const payments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_status', (q) => q.eq('status', 'OVERDUE'))
			.collect()

		// Also check for PENDING payments past due date
		const pendingPayments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_status', (q) => q.eq('status', 'PENDING'))
			.collect()

		const overduePending = pendingPayments.filter((p) => p.dueDate < now)

		return [...payments, ...overduePending]
	},
})

/**
 * Get financial summary (entradas, saídas, pendentes)
 */
export const getFinancialSummary = query({
	args: {
		startDate: v.optional(v.number()),
		endDate: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx)

		const startDate = args.startDate || 0
		const endDate = args.endDate || Date.now()

		// Get all payments in date range
		const allPayments = await ctx.db.query('asaasPayments').collect()

		const filteredPayments = allPayments.filter((p) => {
			const paymentDate = p.confirmedDate || p.createdAt
			return paymentDate >= startDate && paymentDate <= endDate
		})

		// Calculate entradas (received/confirmed payments)
		const entradas = filteredPayments
			.filter((p) => p.status === 'RECEIVED' || p.status === 'CONFIRMED')
			.reduce((sum, p) => sum + (p.netValue || p.value), 0)

		// Calculate saídas (refunded payments)
		const saidas = filteredPayments
			.filter((p) => p.status === 'REFUNDED')
			.reduce((sum, p) => sum + (p.netValue || p.value), 0)

		// Get pending payments
		const pendingPayments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_status', (q) => q.eq('status', 'PENDING'))
			.collect()

		const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.value, 0)

		// Get overdue payments
		const overduePayments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_status', (q) => q.eq('status', 'OVERDUE'))
			.collect()

		const overdueAmount = overduePayments.reduce((sum, p) => sum + p.value, 0)

		return {
			period: {
				startDate,
				endDate,
			},
			revenue: {
				total: entradas,
				net: entradas - saidas,
			},
			charges: {
				pending: pendingPayments.length,
				pendingAmount,
				overdue: overduePayments.length,
				overdueAmount,
			},
			metrics: {
				defaultRate:
					pendingPayments.length + overduePayments.length > 0
						? (overduePayments.length / (pendingPayments.length + overduePayments.length)) * 100
						: 0,
			},
		}
	},
})

// ═══════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════
// ACTIONS
// ═══════════════════════════════════════════════════════

/**
 * Sync all students as Asaas customers (background job)
 */
export const syncAllStudents = action({
	args: {},
	handler: async (ctx): Promise<{ synced: number; errors: number; total: number }> => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error('Unauthenticated')
		}

		const students = await ctx.runQuery(internal.asaas.listAllStudents)

		let synced = 0
		let errors = 0

		for (const student of students) {
			try {
				await ctx.runMutation(internal.asaas.syncStudentAsCustomerInternal, {
					studentId: student._id,
				})
				synced++
			} catch (error) {
				console.error(`Error syncing student ${student._id}:`, error)
				errors++
			}
		}

		return { synced, errors, total: students.length }
	},
})

// ═══════════════════════════════════════════════════════
// INTERNAL FUNCTIONS
// ═══════════════════════════════════════════════════════

/**
 * List all students (internal)
 */
export const listAllStudents = internalQuery({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query('students').collect()
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

/**
 * Process webhook event (internal)
 */
export const processWebhook = internalMutation({
	args: {
		event: v.string(),
		paymentId: v.optional(v.string()),
		payload: v.any(),
	},
	handler: async (ctx, args) => {
		// Log webhook event
		const webhookId = await ctx.db.insert('asaasWebhooks', {
			event: args.event,
			paymentId: args.paymentId,
			payload: args.payload,
			processed: false,
			createdAt: Date.now(),
		})

		if (!args.paymentId) {
			await ctx.db.patch(webhookId, {
				processed: true,
				error: 'No payment ID in webhook',
			})
			return { processed: false, reason: 'No payment ID' }
		}

		try {
			const payment = args.payload.payment as any

			// Map Asaas status to our status
			const statusMap: Record<string, any> = {
				PENDING: 'PENDING',
				RECEIVED: 'RECEIVED',
				CONFIRMED: 'CONFIRMED',
				OVERDUE: 'OVERDUE',
				REFUNDED: 'REFUNDED',
				DELETED: 'DELETED',
				CANCELLED: 'CANCELLED',
			}

			const status = statusMap[payment.status] || 'PENDING'
			const confirmedDate = payment.paymentDate
				? dateStringToTimestamp(payment.paymentDate)
				: undefined

			// Update payment status
			await ctx.runMutation(internal.asaas.updatePaymentStatus, {
				asaasPaymentId: args.paymentId,
				status,
				confirmedDate,
				netValue: payment.netValue,
			})

			// Mark webhook as processed
			await ctx.db.patch(webhookId, {
				processed: true,
			})

			return { processed: true }
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			await ctx.db.patch(webhookId, {
				processed: true,
				error: errorMessage,
			})
			throw error
		}
	},
})

/**
 * Asaas Integration - Queries
 *
 * Queries for Asaas payment integration.
 */

import { v } from 'convex/values'
import { internalQuery, query } from '../_generated/server'
import { requireAuth } from '../lib/auth'

/**
 * List all students (internal)
 */
export const listAllStudents = internalQuery({
	args: {},
	returns: v.array(v.any()),
	handler: async (ctx) => {
		return await ctx.db.query('students').collect()
	},
})

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

/**
 * Get monthly financial summary with breakdown
 * Uses indexed queries for performance at scale
 */
export const getMonthlyFinancialSummary = query({
	args: {
		month: v.number(), // 0-11
		year: v.number(),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx)

		const startOfMonth = new Date(args.year, args.month, 1).getTime()
		const endOfMonth = new Date(args.year, args.month + 1, 0, 23, 59, 59, 999).getTime()
		const now = Date.now()

		// Use indexed query for payments in date range
		const monthPayments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_due_date', (q) => q.gte('dueDate', startOfMonth).lte('dueDate', endOfMonth))
			.collect()

		// Pending this month: PENDING + dueDate in current month
		const pendingThisMonth = monthPayments.filter((p) => p.status === 'PENDING')

		// Use status index for paid payments, then filter by confirmedDate
		const paidPayments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_status', (q) => q.eq('status', 'RECEIVED'))
			.collect()
		const confirmedPayments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_status', (q) => q.eq('status', 'CONFIRMED'))
			.collect()

		const paidThisMonth = [...paidPayments, ...confirmedPayments].filter(
			(p) => p.confirmedDate && p.confirmedDate >= startOfMonth && p.confirmedDate <= endOfMonth,
		)

		// Overdue: OVERDUE status OR (PENDING + dueDate < now)
		const overdueByStatus = await ctx.db
			.query('asaasPayments')
			.withIndex('by_status', (q) => q.eq('status', 'OVERDUE'))
			.collect()
		const pendingPayments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_status', (q) => q.eq('status', 'PENDING'))
			.collect()
		const overduePending = pendingPayments.filter((p) => p.dueDate < now)
		const overdue = [...overdueByStatus, ...overduePending]

		// Future projection: PENDING payments for next 3 months using indexed query
		const futureMonths = await Promise.all([1, 2, 3].map(async (offset) => {
			const futureStart = new Date(args.year, args.month + offset, 1).getTime()
			const futureEnd = new Date(args.year, args.month + offset + 1, 0, 23, 59, 59, 999).getTime()

			const futurePayments = await ctx.db
				.query('asaasPayments')
				.withIndex('by_due_date', (q) => q.gte('dueDate', futureStart).lte('dueDate', futureEnd))
				.collect()

			const pendingFuture = futurePayments.filter((p) => p.status === 'PENDING')

			const monthDate = new Date(args.year, args.month + offset, 1)
			return {
				month: monthDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
				amount: pendingFuture.reduce((sum, p) => sum + p.value, 0),
				count: pendingFuture.length,
			}
		}))

		return {
			pendingThisMonth: pendingThisMonth.reduce((sum, p) => sum + p.value, 0),
			pendingCount: pendingThisMonth.length,
			paidThisMonth: paidThisMonth.reduce((sum, p) => sum + (p.netValue || p.value), 0),
			paidCount: paidThisMonth.length,
			overdueTotal: overdue.reduce((sum, p) => sum + p.value, 0),
			overdueCount: overdue.length,
			futureProjection: futureMonths,
		}
	},
})

/**
 * Get payments by date range with optional status filter
 * Uses indexed queries for performance at scale
 */
export const getPaymentsByDateRange = query({
	args: {
		startDate: v.number(),
		endDate: v.number(),
		status: v.optional(v.string()),
		limit: v.optional(v.number()),
		offset: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx)

		// Use indexed query bounded by date range
		let payments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_due_date', (q) => q.gte('dueDate', args.startDate).lte('dueDate', args.endDate))
			.order('asc')
			.collect()

		// Filter by status if provided (post-index filter)
		if (args.status) {
			payments = payments.filter((p) => p.status === args.status)
		}

		// Apply pagination
		const limit = args.limit || 50
		const offset = args.offset || 0
		const paginated = payments.slice(offset, offset + limit)

		return {
			payments: paginated,
			total: payments.length,
			hasMore: offset + limit < payments.length,
		}
	},
})

/**
 * Get payments grouped by due date for calendar view
 * Uses indexed queries for performance at scale
 */
export const getPaymentsDueDates = query({
	args: {
		month: v.number(),
		year: v.number(),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx)

		const startOfMonth = new Date(args.year, args.month, 1).getTime()
		const endOfMonth = new Date(args.year, args.month + 1, 0, 23, 59, 59, 999).getTime()

		// Use indexed query bounded by date range
		const monthPayments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_due_date', (q) => q.gte('dueDate', startOfMonth).lte('dueDate', endOfMonth))
			.collect()

		// Group by date
		const grouped: Record<string, typeof monthPayments> = {}
		for (const payment of monthPayments) {
			const dateKey = new Date(payment.dueDate).toISOString().split('T')[0]
			if (!grouped[dateKey]) grouped[dateKey] = []
			grouped[dateKey].push(payment)
		}

		return Object.entries(grouped).map(([date, datePayments]) => ({
			date,
			payments: datePayments,
			totals: {
				pending: datePayments
					.filter((p) => p.status === 'PENDING')
					.reduce((s, p) => s + p.value, 0),
				paid: datePayments
					.filter((p) => p.status === 'RECEIVED' || p.status === 'CONFIRMED')
					.reduce((s, p) => s + p.value, 0),
				overdue: datePayments
					.filter((p) => p.status === 'OVERDUE')
					.reduce((s, p) => s + p.value, 0),
			},
		}))
	},
})

/**
 * Asaas Integration - Queries
 *
 * Queries for Asaas payment integration.
 */

import { v } from 'convex/values';

import type { Doc } from '../_generated/dataModel';
import { internalQuery, query } from '../_generated/server';
import { getOrganizationId, requireAuth, requireOrgRole } from '../lib/auth';
import { getConfigurationStatus } from './config';

// ═══════════════════════════════════════════════════════
// INTERNAL QUERIES (for workers and actions)
// ═══════════════════════════════════════════════════════

/**
 * Get a student by ID (internal query for export workers)
 */
export const getStudentById = internalQuery({
	args: {
		studentId: v.id('students'),
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.studentId);
	},
});

/**
 * Get pending export payments (payments without Asaas payment ID)
 * Internal query for export workers
 */
export const getPendingExportPayments = internalQuery({
	args: {
		organizationId: v.string(),
		startDate: v.optional(v.number()), // Timestamp
		endDate: v.optional(v.number()), // Timestamp
	},
	handler: async (ctx, args) => {
		return await getPendingExportPaymentsLogic(ctx, args.organizationId, args);
	},
});

/**
 * Get pending export payments (Public for Admin UI)
 */
export const getPendingExportPaymentsPublic = query({
	args: {
		startDate: v.optional(v.number()), // Timestamp
		endDate: v.optional(v.number()), // Timestamp
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);
		const orgId = await getOrganizationId(ctx);
		return await getPendingExportPaymentsLogic(ctx, orgId, args);
	},
});

async function getPendingExportPaymentsLogic(ctx: any, orgId: string, args: any) {
	// Get all payments
	let payments = await ctx.db
		.query('asaasPayments')
		.withIndex('by_organization', (q: any) => q.eq('organizationId', orgId))
		.order('desc')
		.take(1000);

	// Post-index filters
	if (args.startDate !== undefined) {
		payments = payments.filter((p: any) => p.dueDate >= args.startDate!);
	}
	if (args.endDate !== undefined) {
		payments = payments.filter((p: any) => p.dueDate <= args.endDate!);
	}

	// Filter for payments without Asaas payment ID
	return payments.filter((p: any) => !p.asaasPaymentId);
}

/**
 * Get a payment by ID (internal query for export workers)
 */
export const getPaymentById = internalQuery({
	args: {
		paymentId: v.id('asaasPayments'),
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.paymentId);
	},
});

/**
 * Get stale webhooks (unprocessed webhooks older than threshold)
 * Internal query for alert checking
 */
export const getStaleWebhooks = internalQuery({
	args: {
		olderThan: v.number(), // Timestamp
	},
	handler: async (ctx, args) => {
		const webhooks = await ctx.db
			.query('asaasWebhooks')
			.withIndex('by_processed', (q) => q.eq('processed', false))
			.collect();

		// Filter by age
		return webhooks.filter((w) => w.createdAt < args.olderThan);
	},
});

/**
 * Get pending webhook events (admin only)
 */
export const getPendingWebhookEvents = query({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, args) => {
		await requireOrgRole(ctx, ['org:admin', 'admin']);
		const limit = args.limit ?? 50;
		return await ctx.db
			.query('asaasWebhooks')
			.withIndex('by_status', (q) => q.eq('status', 'pending'))
			.order('desc')
			.take(limit);
	},
});

/**
 * Get failed webhook events (admin only)
 */
export const getFailedWebhookEvents = query({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, args) => {
		await requireOrgRole(ctx, ['org:admin', 'admin']);
		const limit = args.limit ?? 50;
		return await ctx.db
			.query('asaasWebhooks')
			.withIndex('by_status', (q) => q.eq('status', 'failed'))
			.order('desc')
			.take(limit);
	},
});

/**
 * Get webhook health metrics (admin only)
 */
export const getWebhookHealth = query({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, args) => {
		await requireOrgRole(ctx, ['org:admin', 'admin']);
		const limit = args.limit ?? 200;

		const recent = await ctx.db
			.query('asaasWebhooks')
			.withIndex('by_created')
			.order('desc')
			.take(limit);

		const stats = {
			total: recent.length,
			pending: 0,
			processing: 0,
			done: 0,
			failed: 0,
			unknown: 0,
			oldestPendingAt: undefined as number | undefined,
			oldestProcessingAt: undefined as number | undefined,
		};

		for (const webhook of recent) {
			switch (webhook.status) {
				case 'pending':
					stats.pending++;
					stats.oldestPendingAt =
						stats.oldestPendingAt === undefined
							? webhook.createdAt
							: Math.min(stats.oldestPendingAt, webhook.createdAt);
					break;
				case 'processing':
					stats.processing++;
					stats.oldestProcessingAt =
						stats.oldestProcessingAt === undefined
							? webhook.createdAt
							: Math.min(stats.oldestProcessingAt, webhook.createdAt);
					break;
				case 'done':
					stats.done++;
					break;
				case 'failed':
					stats.failed++;
					break;
				default:
					stats.unknown++;
					break;
			}
		}

		return stats;
	},
});

/**
 * Get current webhook queue depth (admin only)
 */
export const getQueueDepth = query({
	args: {},
	handler: async (ctx) => {
		await requireOrgRole(ctx, ['org:admin', 'admin']);

		const pending = await ctx.db
			.query('asaasWebhooks')
			.withIndex('by_status', (q) => q.eq('status', 'pending'))
			.collect();

		const processing = await ctx.db
			.query('asaasWebhooks')
			.withIndex('by_status', (q) => q.eq('status', 'processing'))
			.collect();

		return {
			pending: pending.length,
			processing: processing.length,
			total: pending.length + processing.length,
		};
	},
});

/**
 * Get recent audit logs (for alert checking)
 */
export const getRecentAuditLogs = internalQuery({
	args: {
		since: v.number(), // Timestamp
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query('asaasApiAudit')
			.withIndex('by_timestamp', (q) => q.gte('timestamp', args.since))
			.order('desc')
			.take(1000);
	},
});

/**
 * List all students (internal)
 */
export const listAllStudents = internalQuery({
	args: { organizationId: v.optional(v.string()) },
	returns: v.array(v.any()),
	handler: async (ctx, args) => {
		if (args.organizationId) {
			return await ctx.db
				.query('students')
				.withIndex('by_organization', (q) => q.eq('organizationId', args.organizationId))
				.collect();
		}

		return await ctx.db.query('students').collect();
	},
});

/**
 * Get Asaas customer ID for a student
 */
export const getCustomerByStudent = query({
	args: { studentId: v.id('students') },
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		const student = await ctx.db.get(args.studentId);
		if (!student) return null;

		return {
			studentId: student._id,
			asaasCustomerId: student.asaasCustomerId,
			syncedAt: student.asaasCustomerSyncedAt,
		};
	},
});

/**
 * Get all payments for an enrollment
 */
export const getPaymentsByEnrollment = query({
	args: { enrollmentId: v.id('enrollments') },
	handler: async (ctx, args) => {
		await requireAuth(ctx);
		const orgId = await getOrganizationId(ctx);

		const payments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_organization_enrollment', (q) =>
				q.eq('organizationId', orgId).eq('enrollmentId', args.enrollmentId),
			)
			.order('desc')
			.collect();

		return payments;
	},
});

/**
 * Get all payments for a student
 */
export const getPaymentsByStudent = query({
	args: { studentId: v.id('students') },
	handler: async (ctx, args) => {
		await requireAuth(ctx);
		const orgId = await getOrganizationId(ctx);

		const payments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_organization_student', (q) =>
				q.eq('organizationId', orgId).eq('studentId', args.studentId),
			)
			.order('desc')
			.collect();

		return payments;
	},
});

/**
 * Get sync statistics for all sync types (Internal)
 */
export const getSyncStatisticsInternal = internalQuery({
	args: {},
	handler: async (ctx) => {
		return await calculateSyncStatistics(ctx);
	},
});

/**
 * Get sync statistics for all sync types (Public)
 */
export const getSyncStatistics = query({
	args: {},
	handler: async (ctx) => {
		await requireAuth(ctx);
		return await calculateSyncStatistics(ctx);
	},
});

async function calculateSyncStatistics(ctx: any) {
	// Get all sync logs
	const logs = await ctx.db.query('asaasSyncLogs').withIndex('by_created').order('desc').take(100);

	// Group by sync type
	const byType: Record<string, Doc<'asaasSyncLogs'>[]> = {};
	for (const log of logs) {
		if (!byType[log.syncType]) {
			byType[log.syncType] = [];
		}
		byType[log.syncType].push(log);
	}

	// Calculate statistics per type
	const stats: Record<
		string,
		{
			lastSync?: Doc<'asaasSyncLogs'>;
			totalSyncs: number;
			successful: number;
			failed: number;
			running: number;
			totalRecordsProcessed: number;
			avgRecordsPerSync: number;
		}
	> = {};

	const syncTypes = ['customers', 'payments', 'subscriptions', 'financial'] as const;

	for (const syncType of syncTypes) {
		const typeLogs = byType[syncType] || [];
		const successful = typeLogs.filter((l: any) => l.status === 'completed');
		const failed = typeLogs.filter((l: any) => l.status === 'failed');
		const running = typeLogs.filter((l: any) => l.status === 'running');
		const totalRecords = typeLogs.reduce((sum: number, l: any) => sum + l.recordsProcessed, 0);
		const avgRecords = typeLogs.length > 0 ? totalRecords / typeLogs.length : 0;

		stats[syncType] = {
			lastSync: typeLogs[0],
			totalSyncs: typeLogs.length,
			successful: successful.length,
			failed: failed.length,
			running: running.length,
			totalRecordsProcessed: totalRecords,
			avgRecordsPerSync: Math.round(avgRecords),
		};
	}

	return stats;
}

/**
 * Get overdue payments
 */
export const getOverduePayments = query({
	args: {},
	handler: async (ctx) => {
		await requireAuth(ctx);
		const orgId = await getOrganizationId(ctx);

		const now = Date.now();

		// Get overdue by status
		const payments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_organization_status', (q) =>
				q.eq('organizationId', orgId).eq('status', 'OVERDUE'),
			)
			.collect();

		// Also check for PENDING payments past due date
		const pendingPayments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_organization_status', (q) =>
				q.eq('organizationId', orgId).eq('status', 'PENDING'),
			)
			.collect();

		const overduePending = pendingPayments.filter((p) => p.dueDate < now);

		return [...payments, ...overduePending];
	},
});

/**
 * Get financial summary (entradas, saídas, pendentes)
 */
export const getFinancialSummary = query({
	args: {
		startDate: v.optional(v.number()),
		endDate: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);
		const orgId = await getOrganizationId(ctx);

		const startDate = args.startDate || 0;
		const endDate = args.endDate || Date.now();

		// Get all payments for organization (optimized with index)
		const allPayments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_organization', (q) => q.eq('organizationId', orgId))
			.collect();

		const filteredPayments = allPayments.filter((p) => {
			const paymentDate = p.confirmedDate || p.createdAt;
			return paymentDate >= startDate && paymentDate <= endDate;
		});

		// Calculate entradas (received/confirmed payments)
		const entradas = filteredPayments
			.filter(
				(p) =>
					p.status === 'RECEIVED' || p.status === 'CONFIRMED' || p.status === 'RECEIVED_IN_CASH',
			)
			.reduce((sum, p) => sum + (p.netValue || p.value), 0);

		// Calculate saídas (refunded payments)
		const saidas = filteredPayments
			.filter((p) => p.status === 'REFUNDED')
			.reduce((sum, p) => sum + (p.netValue || p.value), 0);

		// Get pending payments for org
		const pendingPayments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_organization_status', (q) =>
				q.eq('organizationId', orgId).eq('status', 'PENDING'),
			)
			.collect();

		const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.value, 0);

		// Get overdue payments for org
		const overduePayments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_organization_status', (q) =>
				q.eq('organizationId', orgId).eq('status', 'OVERDUE'),
			)
			.collect();

		const overdueAmount = overduePayments.reduce((sum, p) => sum + p.value, 0);

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
		};
	},
});

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
		await requireAuth(ctx);
		const orgId = await getOrganizationId(ctx);

		const startOfMonth = new Date(args.year, args.month, 1).getTime();
		const endOfMonth = new Date(args.year, args.month + 1, 0, 23, 59, 59, 999).getTime();
		const now = Date.now();

		// Use indexed query for payments in date range filtered by organization
		const monthPayments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_organization_due_date', (q) =>
				q.eq('organizationId', orgId).gte('dueDate', startOfMonth).lte('dueDate', endOfMonth),
			)
			.collect();

		// Pending this month: PENDING + dueDate in current month
		const pendingThisMonth = monthPayments.filter((p) => p.status === 'PENDING');

		// Use status index for paid payments, then filter by confirmedDate
		const paidPayments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_organization_status', (q) =>
				q.eq('organizationId', orgId).eq('status', 'RECEIVED'),
			)
			.collect();
		const confirmedPayments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_organization_status', (q) =>
				q.eq('organizationId', orgId).eq('status', 'CONFIRMED'),
			)
			.collect();
		const cashPayments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_organization_status', (q) =>
				q.eq('organizationId', orgId).eq('status', 'RECEIVED_IN_CASH'),
			)
			.collect();

		const paidThisMonth = [...paidPayments, ...confirmedPayments, ...cashPayments].filter(
			(p) => p.confirmedDate && p.confirmedDate >= startOfMonth && p.confirmedDate <= endOfMonth,
		);

		// Overdue: OVERDUE status OR (PENDING + dueDate < now)
		const overdueByStatus = await ctx.db
			.query('asaasPayments')
			.withIndex('by_organization_status', (q) =>
				q.eq('organizationId', orgId).eq('status', 'OVERDUE'),
			)
			.collect();
		const pendingPayments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_organization_status', (q) =>
				q.eq('organizationId', orgId).eq('status', 'PENDING'),
			)
			.collect();
		const overduePending = pendingPayments.filter((p) => p.dueDate < now);
		const overdue = [...overdueByStatus, ...overduePending];

		// Future projection: PENDING payments for next 3 months using indexed query
		const futureMonths = await Promise.all(
			[1, 2, 3].map(async (offset) => {
				const futureStart = new Date(args.year, args.month + offset, 1).getTime();
				const futureEnd = new Date(
					args.year,
					args.month + offset + 1,
					0,
					23,
					59,
					59,
					999,
				).getTime();

				const futurePayments = await ctx.db
					.query('asaasPayments')
					.withIndex('by_organization_due_date', (q) =>
						q.eq('organizationId', orgId).gte('dueDate', futureStart).lte('dueDate', futureEnd),
					)
					.collect();

				const pendingFuture = futurePayments.filter((p) => p.status === 'PENDING');

				const monthDate = new Date(args.year, args.month + offset, 1);
				return {
					month: monthDate.toLocaleDateString('pt-BR', {
						month: 'short',
						year: 'numeric',
					}),
					amount: pendingFuture.reduce((sum, p) => sum + p.value, 0),
					count: pendingFuture.length,
				};
			}),
		);

		return {
			pendingThisMonth: pendingThisMonth.reduce((sum, p) => sum + p.value, 0),
			pendingCount: pendingThisMonth.length,
			paidThisMonth: paidThisMonth.reduce((sum, p) => sum + (p.netValue || p.value), 0),
			paidCount: paidThisMonth.length,
			overdueTotal: overdue.reduce((sum, p) => sum + p.value, 0),
			overdueCount: overdue.length,
			futureProjection: futureMonths,
		};
	},
});

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
		await requireAuth(ctx);
		const orgId = await getOrganizationId(ctx);

		// Use indexed query bounded by date range and organization
		let payments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_organization_due_date', (q) =>
				q.eq('organizationId', orgId).gte('dueDate', args.startDate).lte('dueDate', args.endDate),
			)
			.order('asc')
			.collect();

		// Filter by status if provided (post-index filter)
		if (args.status) {
			payments = payments.filter((p) => p.status === args.status);
		}

		// Apply pagination
		const limit = args.limit || 50;
		const offset = args.offset || 0;
		const paginated = payments.slice(offset, offset + limit);

		return {
			payments: paginated,
			total: payments.length,
			hasMore: offset + limit < payments.length,
		};
	},
});

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
		await requireAuth(ctx);
		const orgId = await getOrganizationId(ctx);

		const startOfMonth = new Date(args.year, args.month, 1).getTime();
		const endOfMonth = new Date(args.year, args.month + 1, 0, 23, 59, 59, 999).getTime();

		// Use indexed query bounded by date range and organization
		const monthPayments = await ctx.db
			.query('asaasPayments')
			.withIndex('by_organization_due_date', (q) =>
				q.eq('organizationId', orgId).gte('dueDate', startOfMonth).lte('dueDate', endOfMonth),
			)
			.collect();

		// Group by date
		const grouped: Record<string, typeof monthPayments> = {};
		for (const payment of monthPayments) {
			const dateKey = new Date(payment.dueDate).toISOString().split('T')[0];
			if (!grouped[dateKey]) grouped[dateKey] = [];
			grouped[dateKey].push(payment);
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
		}));
	},
});

/**
 * Get all payments with comprehensive filters and pagination
 * Supports filtering by status, billingType, studentId, date range
 */
export const getAllPayments = query({
	args: {
		status: v.optional(v.string()),
		billingType: v.optional(v.string()),
		studentId: v.optional(v.id('students')),
		startDate: v.optional(v.number()),
		endDate: v.optional(v.number()),
		limit: v.optional(v.number()),
		offset: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);
		const orgId = await getOrganizationId(ctx);

		const limit = args.limit || 50;
		const offset = args.offset || 0;

		// Build query using appropriate index
		let payments: Doc<'asaasPayments'>[];

		if (args.status) {
			// Use organization_status index
			// biome-ignore lint/suspicious/noExplicitAny: Status string needs casting for index query
			payments = await ctx.db
				.query('asaasPayments')
				.withIndex('by_organization_status', (q) =>
					q.eq('organizationId', orgId).eq('status', args.status as any),
				)
				.order('desc')
				.collect();
		} else if (args.studentId) {
			// Use organization_student index
			payments = await ctx.db
				.query('asaasPayments')
				.withIndex('by_organization_student', (q) =>
					q.eq('organizationId', orgId).eq('studentId', args.studentId!),
				)
				.order('desc')
				.collect();
		} else if (args.startDate && args.endDate) {
			// Use organization_due_date index for date range queries
			payments = await ctx.db
				.query('asaasPayments')
				.withIndex('by_organization_due_date', (q) =>
					q
						.eq('organizationId', orgId)
						.gte('dueDate', args.startDate!)
						.lte('dueDate', args.endDate!),
				)
				.order('desc')
				.collect();
		} else {
			// Default: get all payments for organization
			payments = await ctx.db
				.query('asaasPayments')
				.withIndex('by_organization', (q) => q.eq('organizationId', orgId))
				.order('desc')
				.collect();
		}

		// Apply post-index filters for non-indexed fields
		let filtered = payments;

		if (args.billingType) {
			filtered = filtered.filter((p) => p.billingType === args.billingType);
		}

		// Apply date filters if not already applied via index
		if (args.startDate && !args.status && !args.studentId) {
			// Already applied via index
		} else if (args.startDate) {
			filtered = filtered.filter((p) => p.dueDate >= args.startDate!);
		}

		if (args.endDate && !args.status && !args.studentId) {
			// Already applied via index
		} else if (args.endDate) {
			filtered = filtered.filter((p) => p.dueDate <= args.endDate!);
		}

		// Get total before pagination
		const total = filtered.length;

		// Apply pagination
		const paginated = filtered.slice(offset, offset + limit);

		return {
			payments: paginated,
			total,
			hasMore: offset + limit < total,
		};
	},
});

/**
 * Get API usage statistics for security monitoring and auditing
 * Provides metrics on Asaas API usage including error rates and response times
 */
export const getApiUsageStats = query({
	args: { hours: v.number() },
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		const since = Date.now() - args.hours * 60 * 60 * 1000;
		const logs = await ctx.db
			.query('asaasApiAudit')
			.withIndex('by_timestamp', (q) => q.gte('timestamp', since))
			.collect();

		if (logs.length === 0) {
			return {
				totalRequests: 0,
				errorRate: 0,
				avgResponseTime: 0,
				topEndpoints: [],
				errorsByEndpoint: [],
			};
		}

		const errorLogs = logs.filter((l) => l.statusCode >= 400);
		const avgResponseTime = logs.reduce((sum, l) => sum + l.responseTime, 0) / logs.length;

		// Aggregate by endpoint
		const endpointStats: Record<string, { count: number; errors: number; totalTime: number }> = {};
		for (const log of logs) {
			if (!endpointStats[log.endpoint]) {
				endpointStats[log.endpoint] = { count: 0, errors: 0, totalTime: 0 };
			}
			endpointStats[log.endpoint].count++;
			endpointStats[log.endpoint].totalTime += log.responseTime;
			if (log.statusCode >= 400) {
				endpointStats[log.endpoint].errors++;
			}
		}

		const topEndpoints = Object.entries(endpointStats)
			.map(([endpoint, stats]) => ({
				endpoint,
				count: stats.count,
				avgTime: Math.round(stats.totalTime / stats.count),
				errorRate: Math.round((stats.errors / stats.count) * 100),
			}))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);

		const errorsByEndpoint = Object.entries(endpointStats)
			.filter(([, stats]) => stats.errors > 0)
			.map(([endpoint, stats]) => ({
				endpoint,
				errors: stats.errors,
				errorRate: Math.round((stats.errors / stats.count) * 100),
			}))
			.sort((a, b) => b.errors - a.errors);

		return {
			totalRequests: logs.length,
			errorRate: Math.round((errorLogs.length / logs.length) * 100),
			avgResponseTime: Math.round(avgResponseTime),
			topEndpoints,
			errorsByEndpoint,
		};
	},
});

// ═══════════════════════════════════════════════════════
// CONFIGURATION STATUS
// ═══════════════════════════════════════════════════════

/**
 * Get Asaas configuration status for diagnostics
 * Returns detailed information about API key sources and validation
 */
export const getConfigStatus = query({
	args: {},
	handler: async (ctx) => {
		await requireAuth(ctx);

		return await getConfigurationStatus(ctx);
	},
});

/**
 * Get comprehensive validation report
 *
 * Aggregates:
 * - Sync statistics (last sync, success rate)
 * - API usage stats (error rate, response time)
 * - Webhook health (pending, failed, queue depth)
 * - Circuit breaker status
 * - Recent alerts
 *
 * Returns health score (0-100) and recommendations
 */
export const getValidationReport = query({
	args: {},
	handler: async (ctx) => {
		await requireAuth(ctx);

		// 1. Sync Statistics
		const syncStats = await calculateSyncStatistics(ctx);

		// 2. API Usage (last 24h) - inline calculation to avoid circular type
		const since = Date.now() - 24 * 60 * 60 * 1000;
		const logs = await ctx.db
			.query('asaasApiAudit')
			.withIndex('by_timestamp', (q) => q.gte('timestamp', since))
			.collect();

		const errorLogs = logs.filter((l) => l.statusCode >= 400);
		const apiUsage = {
			totalRequests: logs.length,
			errorRate: logs.length > 0 ? Math.round((errorLogs.length / logs.length) * 100) : 0,
			avgResponseTime:
				logs.length > 0
					? Math.round(logs.reduce((sum, l) => sum + l.responseTime, 0) / logs.length)
					: 0,
		};

		// 3. Webhook Health - inline calculation to avoid circular type
		const recentWebhooks = await ctx.db
			.query('asaasWebhooks')
			.withIndex('by_created')
			.order('desc')
			.take(200);

		const webhookHealth = {
			total: recentWebhooks.length,
			pending: recentWebhooks.filter((w) => w.status === 'pending').length,
			failed: recentWebhooks.filter((w) => w.status === 'failed').length,
		};

		const pendingQueue = await ctx.db
			.query('asaasWebhooks')
			.withIndex('by_status', (q) => q.eq('status', 'pending'))
			.collect();
		const processingQueue = await ctx.db
			.query('asaasWebhooks')
			.withIndex('by_status', (q) => q.eq('status', 'processing'))
			.collect();
		const queueDepth = { total: pendingQueue.length + processingQueue.length };

		// 4. Circuit Breaker Status
		const { getCircuitBreakerState } = await import('../lib/asaas');
		const circuitBreaker = getCircuitBreakerState();

		// 5. Recent Alerts (last 7 days) - using by_status index since we filter by active status
		// Note: asaasAlerts uses 'status' field with values: active, acknowledged, resolved, suppressed
		const alerts = await ctx.db
			.query('asaasAlerts')
			.withIndex('by_status', (q) => q.eq('status', 'active'))
			.order('desc')
			.take(50);

		// Calculate health score (0-100)
		let healthScore = 100;
		const issues: string[] = [];

		// Deduct points for issues
		if (circuitBreaker.state !== 'closed') {
			healthScore -= 30;
			issues.push(`Circuit breaker is ${circuitBreaker.state}`);
		}

		if (apiUsage.errorRate > 10) {
			healthScore -= 20;
			issues.push(`High API error rate: ${apiUsage.errorRate}%`);
		}

		if (webhookHealth.failed > 10) {
			healthScore -= 15;
			issues.push(`${webhookHealth.failed} failed webhooks`);
		}

		if (queueDepth.total > 100) {
			healthScore -= 10;
			issues.push(`High webhook queue depth: ${queueDepth.total}`);
		}

		if (alerts.length > 5) {
			healthScore -= 10;
			issues.push(`${alerts.length} unresolved alerts`);
		}

		// Recommendations
		const recommendations: string[] = [];

		if (circuitBreaker.state === 'open') {
			recommendations.push('Circuit breaker is open. Check API connectivity and credentials.');
		}

		if (webhookHealth.failed > 0) {
			recommendations.push(
				`Retry ${webhookHealth.failed} failed webhooks via api.asaas.retryFailedWebhooks`,
			);
		}

		if (queueDepth.total > 50) {
			recommendations.push(
				'High webhook queue. Consider scaling or investigating processing delays.',
			);
		}

		return {
			healthScore: Math.max(0, healthScore),
			status: healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'degraded' : 'critical',
			timestamp: Date.now(),

			syncStats: {
				lastSync: syncStats.customers?.lastSync,
				totalSyncs: Object.values(syncStats).reduce((sum, s) => sum + s.totalSyncs, 0),
				successRate:
					(Object.values(syncStats).reduce((sum, s) => sum + s.successful, 0) /
						Math.max(
							1,
							Object.values(syncStats).reduce((sum, s) => sum + s.totalSyncs, 0),
						)) *
					100,
			},

			apiUsage: {
				totalRequests: apiUsage.totalRequests,
				errorRate: apiUsage.errorRate,
				avgResponseTime: apiUsage.avgResponseTime,
			},

			webhookHealth: {
				total: webhookHealth.total,
				pending: webhookHealth.pending,
				failed: webhookHealth.failed,
				queueDepth: queueDepth.total,
			},

			circuitBreaker: {
				state: circuitBreaker.state,
				failureCount: circuitBreaker.failureCount,
				isHealthy: circuitBreaker.state === 'closed',
			},

			alerts: {
				total: alerts.length,
				critical: alerts.filter((a) => a.severity === 'critical').length,
				high: alerts.filter((a) => a.severity === 'high').length,
			},

			issues,
			recommendations,
		};
	},
});

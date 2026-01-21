import { v } from 'convex/values';

import type { Doc, Id } from './_generated/dataModel';
import { internalMutation, query } from './_generated/server';
import { getOrganizationId } from './lib/auth';

/**
 * Aggregates financial data from Asaas payments and updates the financialMetrics table.
 */
export const calculateFinancialMetrics = internalMutation({
	args: { organizationId: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const now = Date.now();

		// Aggregation logic using indexed queries where possible
		const allPayments = await ctx.db.query('asaasPayments').collect();

		const totalReceived = allPayments
			.filter((p) => p.status === 'RECEIVED' || p.status === 'CONFIRMED')
			.reduce((sum, p) => sum + p.value, 0);

		const totalPending = allPayments
			.filter((p) => p.status === 'PENDING')
			.reduce((sum, p) => sum + p.value, 0);

		const totalOverdue = allPayments
			.filter((p) => p.status === 'OVERDUE')
			.reduce((sum, p) => sum + p.value, 0);

		const totalValue = totalReceived + totalPending + totalOverdue;

		const data = {
			totalReceived,
			totalPending,
			totalOverdue,
			totalValue,
			paymentsCount: allPayments.length,
			organizationId: args.organizationId,
			updatedAt: now,
		};

		const existing = await ctx.db
			.query('financialMetrics')
			.withIndex('by_organization', (q) => q.eq('organizationId', args.organizationId))
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, data);
		} else {
			await ctx.db.insert('financialMetrics', data);
		}

		return data;
	},
});

export const getDashboard = query({
	args: {
		period: v.union(
			v.literal('7d'),
			v.literal('30d'),
			v.literal('90d'),
			v.literal('year'),
			v.literal('all'),
		),
		userId: v.optional(v.id('users')),
	},
	returns: v.any(),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const organizationId = await getOrganizationId(ctx);
		if (!organizationId) return null;

		const now = Date.now();
		const periodDays = { '7d': 7, '30d': 30, '90d': 90, year: 365 } as const;
		const getPeriodRange = () => {
			if (args.period === 'all') {
				return { startDate: 0, previousStartDate: 0 };
			}
			const days = periodDays[args.period];
			const computedStartDate = now - days * 24 * 60 * 60 * 1000;
			return {
				startDate: computedStartDate,
				previousStartDate: computedStartDate - days * 24 * 60 * 60 * 1000,
			};
		};
		const { startDate, previousStartDate } = getPeriodRange();

		// Role-based filtering logic - SECURITY: User record must exist
		const currentUser = await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
			.unique();

		// SECURITY: Treat missing user record as auth failure - never fall back to org-wide queries
		if (!currentUser) {
			return null;
		}

		const resolveEffectiveUserId = (
			user: Doc<'users'>,
			requestedUserId?: Id<'users'>,
		): Id<'users'> | undefined => {
			const role = user.role;
			if (role === 'member' || role === 'sdr') {
				return user._id;
			}
			if (['manager', 'admin', 'owner'].includes(role)) {
				return requestedUserId;
			}
			return undefined;
		};

		const effectiveUserId = resolveEffectiveUserId(currentUser, args.userId);

		const createLeadsQuery = () => {
			if (effectiveUserId) {
				const userId = effectiveUserId;
				return ctx.db
					.query('leads')
					.withIndex('by_organization_assigned_to', (q) =>
						q.eq('organizationId', organizationId).eq('assignedTo', userId),
					);
			}
			return ctx.db
				.query('leads')
				.withIndex('by_organization', (q) => q.eq('organizationId', organizationId));
		};

		const filterByPeriod = <T extends { createdAt: number }>(
			items: T[],
			start: number,
			end?: number,
		): T[] =>
			items.filter(
				(item) => item.createdAt >= start && (end === undefined || item.createdAt < end),
			);

		const collectLeads = async () => createLeadsQuery().collect();

		const currentLeads =
			args.period === 'all'
				? await collectLeads()
				: filterByPeriod(await collectLeads(), startDate);

		const previousLeads =
			args.period === 'all'
				? []
				: filterByPeriod(await collectLeads(), previousStartDate, startDate);

		const totalLeads = currentLeads.length;
		const previousTotalLeads = previousLeads.length;

		// Explicitly 0 trend for 'all'
		const calculateTrend = (current: number, previous: number) =>
			args.period !== 'all' && previous > 0 ? ((current - previous) / previous) * 100 : 0;

		const leadsTrend = calculateTrend(totalLeads, previousTotalLeads);

		// leadsThisMonth (specific for reports)
		const startOfMonth = new Date();
		startOfMonth.setDate(1);
		startOfMonth.setHours(0, 0, 0, 0);
		const startOfMonthIds = filterByPeriod(await collectLeads(), startOfMonth.getTime());
		const leadsThisMonth = startOfMonthIds.length;

		// Conversion Rate (stage = 'fechado_ganho')
		const currentConversions = currentLeads.filter((l) => l.stage === 'fechado_ganho').length;
		const previousConversions = previousLeads.filter((l) => l.stage === 'fechado_ganho').length;

		const conversionRate = totalLeads > 0 ? (currentConversions / totalLeads) * 100 : 0;
		const previousConversionRate =
			previousTotalLeads > 0 ? (previousConversions / previousTotalLeads) * 100 : 0;

		const conversionTrend = calculateTrend(conversionRate, previousConversionRate);

		// 2. Revenue & Financial Summary (scoped when vendor filtering is active)
		const financialMetrics = await ctx.db
			.query('financialMetrics')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
			.first();

		// For vendor views, revenue is computed from scoped enrollments below, not org-wide metrics
		// This ensures headline revenue matches vendor-specific trend

		// Collect all leads once to get their IDs for enrollment scoping
		const allCurrentLeads = await collectLeads();

		// For revenue scoping: find students from scoped leads
		let scopedStudentIds: Set<string> | null = null;
		if (effectiveUserId) {
			const scopedLeadIds = new Set(allCurrentLeads.map((l) => l._id));
			const allStudents = await ctx.db.query('students').collect();
			const matchingStudents = allStudents.filter((s) => s.leadId && scopedLeadIds.has(s.leadId));
			scopedStudentIds = new Set(matchingStudents.map((s) => s._id));
		}

		// Use currentEnrollments for trend calculation, scoped to effectiveUserId leads via students
		const collectEnrollments = async () => {
			const enrollments = await ctx.db.query('enrollments').collect();
			// If effectiveUserId is set, filter to enrollments linked to those students
			const studentFilter = scopedStudentIds;
			if (studentFilter) {
				return enrollments.filter((e) => studentFilter.has(e.studentId));
			}
			return enrollments;
		};
		const currentEnrollments =
			args.period === 'all'
				? await collectEnrollments()
				: filterByPeriod(await collectEnrollments(), startDate);
		const previousEnrollments =
			args.period === 'all'
				? []
				: filterByPeriod(await collectEnrollments(), previousStartDate, startDate);

		const currentEnrollmentRevenue = currentEnrollments.reduce((sum, e) => sum + e.totalValue, 0);
		const previousRevenue = previousEnrollments.reduce((sum, e) => sum + e.totalValue, 0);

		const revenueTrend = calculateTrend(currentEnrollmentRevenue, previousRevenue);

		// 3. Messages & Response Time (scoped by vendor if effectiveUserId is set)
		// Get lead IDs for scoping messages/conversations
		const scopedLeadIds = new Set(allCurrentLeads.map((l) => l._id));

		const collectMessages = async () => {
			const allMessages = await ctx.db.query('messages').collect();
			// If effectiveUserId is set, filter to messages belonging to conversations linked to scoped leads
			if (effectiveUserId) {
				const allConversations = await ctx.db.query('conversations').collect();
				const scopedConversationIds = new Set(
					allConversations.filter((c) => c.leadId && scopedLeadIds.has(c.leadId)).map((c) => c._id),
				);
				return allMessages.filter((m) => scopedConversationIds.has(m.conversationId));
			}
			return allMessages;
		};
		const currentMessages =
			args.period === 'all'
				? await collectMessages()
				: filterByPeriod(await collectMessages(), startDate);

		const totalMessages = currentMessages.length;

		// Avg Response Time (from Conversations, scoped by vendor)
		const collectConversations = async () => {
			const allConversations = await ctx.db
				.query('conversations')
				.filter((c) => c.neq(c.field('firstResponseAt'), undefined))
				.collect();
			// If effectiveUserId is set, filter to conversations linked to scoped leads
			if (effectiveUserId) {
				return allConversations.filter((c) => c.leadId && scopedLeadIds.has(c.leadId));
			}
			return allConversations;
		};

		const currentConversations =
			args.period === 'all'
				? await collectConversations()
				: filterByPeriod(await collectConversations(), startDate);

		const previousConversations =
			args.period === 'all'
				? []
				: filterByPeriod(await collectConversations(), previousStartDate, startDate);

		const conversationsCount = currentConversations.length;

		const calculateAvgResponseTime = (convs: typeof currentConversations) => {
			if (convs.length === 0) return 0;
			const totalTime = convs.reduce((sum, c) => sum + ((c.firstResponseAt || 0) - c.createdAt), 0);
			return Math.round(totalTime / convs.length / 60_000); // in minutes
		};

		const avgResponseTime = calculateAvgResponseTime(currentConversations);
		const previousAvgResponseTime = calculateAvgResponseTime(previousConversations);

		const responseTimeTrend = calculateTrend(avgResponseTime, previousAvgResponseTime);

		// 4. Funnel
		const funnel = {
			novo: currentLeads.filter((l) => l.stage === 'novo').length,
			primeiro_contato: currentLeads.filter((l) => l.stage === 'primeiro_contato').length,
			qualificado: currentLeads.filter((l) => l.stage === 'qualificado').length,
			proposta: currentLeads.filter((l) => l.stage === 'proposta').length,
			negociacao: currentLeads.filter((l) => l.stage === 'negociacao').length,
			fechado_ganho: currentLeads.filter((l) => l.stage === 'fechado_ganho').length,
		};

		// 5. Leads By Product
		const leadsByProduct: Record<string, number> = {};
		currentLeads.forEach((l) => {
			const prod = l.interestedProduct || 'indefinido';
			leadsByProduct[prod] = (leadsByProduct[prod] || 0) + 1;
		});

		// 6. Daily Metrics for Charts (scoped by vendor if effectiveUserId is set)
		const dailyMetricsData = await ctx.db.query('dailyMetrics').collect();
		// If effectiveUserId is set, filter daily metrics to those with matching userId (if field exists)
		// Otherwise fall back to org-wide metrics. Note: dailyMetrics may not have userId field,
		// in which case we return empty array for vendor views to maintain consistency.
		let filteredDailyMetrics = dailyMetricsData;
		if (effectiveUserId) {
			// Check if dailyMetrics supports userId filtering
			filteredDailyMetrics = dailyMetricsData.filter(
				(m) => 'userId' in m && m.userId === effectiveUserId,
			);
		}
		const dailyMetrics = filteredDailyMetrics
			.filter((m) => (args.period === 'all' ? true : new Date(m.date).getTime() >= startDate))
			.sort((a, b) => a.date.localeCompare(b.date));

		// Round trend values to one decimal place for readability
		const roundTrend = (value: number) => Math.round(value * 10) / 10;

		// Compute scoped revenue: use enrollment revenue when vendor filtering is active
		// Otherwise use org-wide financial metrics
		const scopedRevenue = effectiveUserId
			? currentEnrollmentRevenue
			: financialMetrics?.totalReceived || 0;

		// Financial summary: null for vendor views since it's org-wide data
		let scopedFinancialSummary: {
			totalReceived: number;
			totalPending: number;
			totalOverdue: number;
			totalValue: number;
			lastSync: number;
		} | null = null;

		if (!effectiveUserId && financialMetrics) {
			scopedFinancialSummary = {
				totalReceived: financialMetrics.totalReceived,
				totalPending: financialMetrics.totalPending,
				totalOverdue: financialMetrics.totalOverdue,
				totalValue: financialMetrics.totalValue,
				lastSync: financialMetrics.updatedAt,
			};
		}

		return {
			totalLeads,
			leadsTrend: roundTrend(leadsTrend),
			leadsThisMonth,
			conversionRate,
			conversionTrend: roundTrend(conversionTrend),
			revenue: scopedRevenue,
			revenueTrend: roundTrend(revenueTrend),
			financialSummary: scopedFinancialSummary,
			totalMessages,
			conversationsCount,
			avgResponseTime,
			responseTimeTrend: roundTrend(responseTimeTrend),
			funnel,
			leadsByStage: funnel,
			leadsByProduct,
			dailyMetrics,
			messagesCount: totalMessages,
		};
	},
});

export const getTeamPerformance = query({
	args: {
		period: v.union(v.literal('7d'), v.literal('30d'), v.literal('90d'), v.literal('year')),
	},
	returns: v.array(
		v.object({
			id: v.id('users'),
			name: v.string(),
			role: v.union(
				v.literal('owner'),
				v.literal('admin'),
				v.literal('manager'),
				v.literal('member'),
				v.literal('sdr'),
				v.literal('cs'),
				v.literal('support'),
			),
			metric: v.number(),
			metricLabel: v.string(),
			period: v.string(),
		}),
	),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];

		const organizationId = await getOrganizationId(ctx);
		if (!organizationId) return [];

		// Metric: "Conversions in the selected period" based on lead.updatedAt for 'fechado_ganho' leads.
		const periodDays = { '7d': 7, '30d': 30, '90d': 90, year: 365 };
		const days = periodDays[args.period];
		const startDate = Date.now() - days * 24 * 60 * 60 * 1000;

		const leads = await ctx.db
			.query('leads')
			.withIndex('by_organization_stage', (q) =>
				q.eq('organizationId', organizationId).eq('stage', 'fechado_ganho'),
			)
			.collect();

		// Ensure we only count leads updated to won within the period
		const leadsInPeriod = leads.filter((l) => l.updatedAt >= startDate);

		// Group by assignedTo
		const performance = new Map<string, number>();
		for (const lead of leadsInPeriod) {
			if (lead.assignedTo) {
				performance.set(lead.assignedTo, (performance.get(lead.assignedTo) || 0) + 1);
			}
		}

		const users = await ctx.db
			.query('users')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
			.collect();

		const result = users.map((u) => ({
			id: u._id,
			name: u.name,
			role: u.role,
			metric: performance.get(u._id) || 0,
			metricLabel: 'Conversões',
			period: args.period,
		}));

		return result.sort((a, b) => b.metric - a.metric).slice(0, 5);
	},
});

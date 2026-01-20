/**
 * Asaas Monitoring Queries
 *
 * Queries for API health metrics, sync statistics, and alert monitoring.
 * Provides real-time visibility into Asaas integration status.
 */

import { v } from 'convex/values';

import type { Doc } from '../_generated/dataModel';
import { internalQuery, type QueryCtx, query } from '../_generated/server';
import { getOrganizationId, requireAuth } from '../lib/auth';

// ═══════════════════════════════════════════════════════
// API HEALTH METRICS - HELPER
// ═══════════════════════════════════════════════════════

/**
 * Shared helper function for calculating API health metrics
 */
async function calculateApiHealthMetrics(ctx: QueryCtx, hours: number) {
	const since = Date.now() - hours * 60 * 60 * 1000;

	// Get API audit logs
	const logs = await ctx.db
		.query('asaasApiAudit')
		// biome-ignore lint/suspicious/noExplicitAny: break deep type instantiation on internal api
		.withIndex('by_timestamp', (q: any) => q.gte('timestamp', since))
		.collect();

	if (logs.length === 0) {
		return {
			totalRequests: 0,
			errorRate: 0,
			avgResponseTime: 0,
			successRate: 100,
			endpoints: {},
			errors: [],
		};
	}

	// Calculate metrics
	const errorLogs = logs.filter((l) => l.statusCode >= 400);

	const errorRate = logs.length > 0 ? (errorLogs.length / logs.length) * 100 : 0;
	const successRate = 100 - errorRate;

	const totalResponseTime = logs.reduce((sum: number, l) => sum + l.responseTime, 0);
	const avgResponseTime = logs.length > 0 ? totalResponseTime / logs.length : 0;

	// Aggregate by endpoint
	const endpointStats: Record<
		string,
		{
			count: number;
			errors: number;
			avgTime: number;
		}
	> = {};

	for (const log of logs) {
		if (!endpointStats[log.endpoint]) {
			endpointStats[log.endpoint] = { count: 0, errors: 0, avgTime: 0 };
		}
		endpointStats[log.endpoint].count++;
		endpointStats[log.endpoint].avgTime += log.responseTime;
		if (log.statusCode >= 400) {
			endpointStats[log.endpoint].errors++;
		}
	}

	// Calculate average time per endpoint
	const endpoints: Record<string, { count: number; errorRate: number; avgTime: number }> = {};

	for (const [endpoint, stats] of Object.entries(endpointStats)) {
		endpoints[endpoint] = {
			count: stats.count,
			errorRate: stats.count > 0 ? (stats.errors / stats.count) * 100 : 0,
			avgTime: Math.round(stats.avgTime / stats.count),
		};
	}

	// Get unique errors
	const uniqueErrors = Array.from(
		new Set(errorLogs.map((l) => l.errorMessage).filter(Boolean)),
	).slice(0, 10);

	return {
		totalRequests: logs.length,
		errorRate: Math.round(errorRate * 10) / 10,
		successRate: Math.round(successRate * 10) / 10,
		avgResponseTime: Math.round(avgResponseTime),
		endpoints,
		errors: uniqueErrors,
	};
}

// ═══════════════════════════════════════════════════════
// API HEALTH METRICS - QUERIES
// ═══════════════════════════════════════════════════════

/**
 * Get API health metrics for the specified time period (INTERNAL)
 * Does NOT require authentication - for use by internal actions
 */
export const getApiHealthMetricsInternal = internalQuery({
	args: {
		hours: v.optional(v.number()), // Default: 24 hours
	},
	handler: async (ctx, args) => {
		const hours = args.hours ?? 24;
		return await calculateApiHealthMetrics(ctx, hours);
	},
});

/**
 * Get API health metrics for the specified time period (PUBLIC)
 * Returns error rate, average response time, and endpoint statistics
 */
export const getApiHealthMetrics = query({
	args: {
		hours: v.optional(v.number()), // Default: 24 hours
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);
		const hours = args.hours ?? 24;
		return await calculateApiHealthMetrics(ctx, hours);
	},
});

// ═══════════════════════════════════════════════════════
// SYNC STATISTICS
// ═══════════════════════════════════════════════════════
// Note: getSyncStatistics is exported from queries.ts

// ═══════════════════════════════════════════════════════
// ALERT QUERIES - HELPER
// ═══════════════════════════════════════════════════════

/**
 * Shared helper function for getting alerts by type
 */
async function getAlertsByTypeHelper(
	ctx: QueryCtx,
	alertType: string,
	organizationId: string | undefined,
	limit: number,
) {
	// Use index for type lookup
	let alerts = await ctx.db
		.query('asaasAlerts')
		// biome-ignore lint/suspicious/noExplicitAny: break deep type instantiation on internal api
		.withIndex('by_type', (q: any) => q.eq('alertType', alertType))
		.order('desc')
		.take(limit * 2);

	// Post-index filters
	if (organizationId) {
		alerts = alerts.filter((a) => a.organizationId === organizationId);
	}

	return alerts.slice(0, limit);
}

// ═══════════════════════════════════════════════════════
// ALERT QUERIES
// ═══════════════════════════════════════════════════════

/**
 * Get active alerts for an organization
 */
export const getActiveAlerts = query({
	args: {
		organizationId: v.optional(v.string()),
		severity: v.optional(
			v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('critical')),
		),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		const orgId = args.organizationId ?? (await getOrganizationId(ctx));
		const limit = args.limit ?? 50;

		// Get active alerts (not suppressed)
		const now = Date.now();
		const alertsQuery = ctx.db.query('asaasAlerts');
		let alerts: Doc<'asaasAlerts'>[] = [];

		if (orgId) {
			const severity = args.severity;
			if (severity) {
				alerts = await alertsQuery
					.withIndex('by_organization_active', (q) =>
						q
							.eq('organizationId', orgId)
							.eq('status', 'active')
							.eq('severity', args.severity as 'low' | 'medium' | 'high' | 'critical'),
					)
					.order('desc')
					.take(limit * 2);
			} else {
				alerts = await alertsQuery
					.withIndex('by_organization_active', (q) =>
						q.eq('organizationId', orgId).eq('status', 'active'),
					)
					.order('desc')
					.take(limit * 2);
			}
		} else {
			// Fallback if no organization context (using status index)
			alerts = await alertsQuery
				.withIndex('by_status', (q) => q.eq('status', 'active'))
				.order('desc')
				.take(limit * 2);
		}

		// Filter out suppressed alerts
		alerts = alerts.filter((a) => !a.suppressedUntil || a.suppressedUntil < now);

		// Post-index filters
		if (orgId) {
			alerts = alerts.filter((a) => a.organizationId === orgId);
		}
		if (args.severity) {
			alerts = alerts.filter((a) => a.severity === args.severity);
		}

		// Sort by severity priority (critical > high > medium > low) and last seen
		const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
		alerts.sort((a, b) => {
			const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
			if (severityDiff !== 0) return severityDiff;
			return b.lastSeenAt - a.lastSeenAt;
		});

		return alerts.slice(0, limit);
	},
});

/**
 * Get alert statistics for an organization
 */
export const getAlertStatistics = query({
	args: {
		organizationId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		const orgId = args.organizationId ?? (await getOrganizationId(ctx));
		const now = Date.now();

		// Get all alerts for organization
		let alerts = await ctx.db
			.query('asaasAlerts')
			.withIndex('by_organization', (q) => q.eq('organizationId', orgId))
			.collect();

		// Filter out suppressed alerts
		alerts = alerts.filter((a) => !a.suppressedUntil || a.suppressedUntil < now);

		// Group by status
		const byStatus: Record<string, number> = {};
		const bySeverity: Record<string, number> = {};
		const byType: Record<string, number> = {};

		for (const alert of alerts) {
			byStatus[alert.status] = (byStatus[alert.status] || 0) + 1;
			bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
			byType[alert.alertType] = (byType[alert.alertType] || 0) + 1;
		}

		// Get recent alerts (last 24 hours)
		const dayAgo = now - 24 * 60 * 60 * 1000;
		const recentAlerts = alerts.filter((a) => a.createdAt >= dayAgo);

		// Get most common alert types
		const topAlertTypes = Object.entries(byType)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([type, count]) => ({ type, count }));

		return {
			total: alerts.length,
			active: byStatus.active || 0,
			acknowledged: byStatus.acknowledged || 0,
			resolved: byStatus.resolved || 0,
			critical: bySeverity.critical || 0,
			high: bySeverity.high || 0,
			medium: bySeverity.medium || 0,
			low: bySeverity.low || 0,
			recent24h: recentAlerts.length,
			topAlertTypes,
		};
	},
});

/**
 * Get alerts by type (INTERNAL)
 * Does NOT require authentication - for use by internal mutations/actions
 */
export const getAlertsByTypeInternal = internalQuery({
	args: {
		alertType: v.union(
			v.literal('api_error'),
			v.literal('sync_failure'),
			v.literal('rate_limit'),
			v.literal('webhook_timeout'),
			v.literal('duplicate_detection'),
			v.literal('data_integrity'),
		),
		organizationId: v.optional(v.string()),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const limit = args.limit ?? 50;
		return await getAlertsByTypeHelper(ctx, args.alertType, args.organizationId, limit);
	},
});

/**
 * Get alerts by type (PUBLIC)
 */
export const getAlertsByType = query({
	args: {
		alertType: v.union(
			v.literal('api_error'),
			v.literal('sync_failure'),
			v.literal('rate_limit'),
			v.literal('webhook_timeout'),
			v.literal('duplicate_detection'),
			v.literal('data_integrity'),
		),
		organizationId: v.optional(v.string()),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		const orgId = args.organizationId ?? (await getOrganizationId(ctx));
		const limit = args.limit ?? 50;

		return await getAlertsByTypeHelper(ctx, args.alertType, orgId, limit);
	},
});

// ═══════════════════════════════════════════════════════
// DASHBOARD SUMMARY
// ═══════════════════════════════════════════════════════

/**
 * Get dashboard summary for Asaas integration
 * Combines sync stats, alerts, and API health into one query
 */
export const getDashboardSummary = query({
	args: {},
	handler: async (ctx) => {
		await requireAuth(ctx);
		const orgId = await getOrganizationId(ctx);
		const now = Date.now();

		// Get sync statistics
		const recentSyncLogs = await ctx.db
			.query('asaasSyncLogs')
			.withIndex('by_created')
			.order('desc')
			.take(10);

		// If not, we fallback to by_status or empty?
		// Note from plan: "by_active" was renamed to "by_organization_active".
		// So the fallback "by_active" above is invalid.
		// Use by_status for fallback.

		let orgActiveAlerts: Doc<'asaasAlerts'>[] = [];
		if (orgId) {
			orgActiveAlerts = await ctx.db
				.query('asaasAlerts')
				.withIndex('by_organization_active', (q) =>
					q.eq('organizationId', orgId).eq('status', 'active'),
				)
				.collect();

			// Apply suppression filter
			orgActiveAlerts = orgActiveAlerts.filter(
				(a) => !a.suppressedUntil || a.suppressedUntil < now,
			);
		} else {
			// Fallback if no orgId
			const all = await ctx.db
				.query('asaasAlerts')
				.withIndex('by_status', (q) => q.eq('status', 'active'))
				.collect();
			orgActiveAlerts = all.filter((a) => !a.suppressedUntil || a.suppressedUntil < now);
		}

		// Get API metrics (last hour)
		const hourAgo = now - 60 * 60 * 1000;
		const recentApiLogs = await ctx.db
			.query('asaasApiAudit')
			.withIndex('by_timestamp', (q) => q.gte('timestamp', hourAgo))
			.collect();

		const apiErrors = recentApiLogs.filter((l) => l.statusCode >= 400);
		const apiErrorRate =
			recentApiLogs.length > 0 ? (apiErrors.length / recentApiLogs.length) * 100 : 0;

		// Count conflicts
		const pendingConflicts = await ctx.db
			.query('asaasConflicts')
			.withIndex('by_status', (q) => q.eq('status', 'pending'))
			.collect();

		const orgConflicts = orgId
			? pendingConflicts.filter((c) => c.organizationId === orgId)
			: pendingConflicts;

		return {
			sync: {
				lastSync: recentSyncLogs[0] || null,
				totalSyncs: recentSyncLogs.length,
				successful: recentSyncLogs.filter((l) => l.status === 'completed').length,
				failed: recentSyncLogs.filter((l) => l.status === 'failed').length,
			},
			alerts: {
				activeCount: orgActiveAlerts.length,
				criticalCount: orgActiveAlerts.filter((a) => a.severity === 'critical').length,
				highCount: orgActiveAlerts.filter((a) => a.severity === 'high').length,
			},
			api: {
				errorRate: Math.round(apiErrorRate * 10) / 10,
				totalRequests: recentApiLogs.length,
				avgResponseTime:
					recentApiLogs.length > 0
						? Math.round(
								recentApiLogs.reduce((sum, l) => sum + l.responseTime, 0) / recentApiLogs.length,
							)
						: 0,
			},
			conflicts: {
				pendingCount: orgConflicts.length,
			},
		};
	},
});

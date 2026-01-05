/**
 * Asaas Sync Management
 *
 * Mutations and queries for managing Asaas sync logs and settings.
 */

import { v } from 'convex/values'
import { internalMutation, mutation, query } from '../_generated/server'
import { api } from '../_generated/api'
import type { Doc } from '../_generated/dataModel'
import { requirePermission } from '../lib/auth'
import { PERMISSIONS } from '../lib/permissions'

// ═══════════════════════════════════════════════════════
// INTERNAL MUTATIONS (Called by actions)
// ═══════════════════════════════════════════════════════

/**
 * Create a new sync log entry
 */
export const createSyncLog = internalMutation({
	args: {
		syncType: v.union(
			v.literal('customers'),
			v.literal('payments'),
			v.literal('subscriptions'),
			v.literal('financial')
		),
		initiatedBy: v.string(),
		filters: v.optional(v.object({
			startDate: v.optional(v.string()),
			endDate: v.optional(v.string()),
			status: v.optional(v.string()),
		})),
	},
	handler: async (ctx, args) => {
		const now = Date.now()
		return await ctx.db.insert('asaasSyncLogs', {
			syncType: args.syncType,
			status: 'running',
			startedAt: now,
			recordsProcessed: 0,
			recordsCreated: 0,
			recordsUpdated: 0,
			recordsFailed: 0,
			filters: args.filters,
			initiatedBy: args.initiatedBy,
			createdAt: now,
		})
	},
})

/**
 * Update sync log with progress
 */
export const updateSyncLog = internalMutation({
	args: {
		logId: v.id('asaasSyncLogs'),
		status: v.optional(v.union(
			v.literal('pending'),
			v.literal('running'),
			v.literal('completed'),
			v.literal('failed')
		)),
		recordsProcessed: v.optional(v.number()),
		recordsCreated: v.optional(v.number()),
		recordsUpdated: v.optional(v.number()),
		recordsFailed: v.optional(v.number()),
		errors: v.optional(v.array(v.string())),
		lastError: v.optional(v.string()), // JSON stringified error details with stack trace
		completedAt: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { logId, ...updates } = args
		const existing = await ctx.db.get(logId)
		if (!existing) throw new Error('Sync log not found')

		// Only include defined fields
		const patch: Partial<Doc<'asaasSyncLogs'>> = {}
		if (updates.status !== undefined) patch.status = updates.status
		if (updates.recordsProcessed !== undefined) patch.recordsProcessed = updates.recordsProcessed
		if (updates.recordsCreated !== undefined) patch.recordsCreated = updates.recordsCreated
		if (updates.recordsUpdated !== undefined) patch.recordsUpdated = updates.recordsUpdated
		if (updates.recordsFailed !== undefined) patch.recordsFailed = updates.recordsFailed
		if (updates.errors !== undefined) patch.errors = updates.errors
		if (updates.lastError !== undefined) patch.lastError = updates.lastError
		if (updates.completedAt !== undefined) patch.completedAt = updates.completedAt

		await ctx.db.patch(logId, patch)
	},
})

/**
 * Update sync log with progress (for checkpointing during batch processing)
 * This is a simplified version of updateSyncLog specifically for progress updates
 */
export const updateSyncLogProgress = internalMutation({
	args: {
		logId: v.id('asaasSyncLogs'),
		recordsProcessed: v.number(),
		recordsCreated: v.optional(v.number()),
		recordsUpdated: v.optional(v.number()),
		recordsFailed: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { logId, ...updates } = args
		const existing = await ctx.db.get(logId)
		if (!existing) throw new Error('Sync log not found')

		// Patch with the provided updates
		await ctx.db.patch(logId, updates)
	},
})

// ═══════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════

/**
 * Get the last sync status for each sync type
 */
export const getLastSyncStatus = query({
	args: {},
	handler: async (ctx) => {
		const syncTypes = ['customers', 'payments', 'subscriptions', 'financial'] as const

		const result: Record<string, Doc<'asaasSyncLogs'> | null> = {}

		for (const syncType of syncTypes) {
			const latestSync = await ctx.db
				.query('asaasSyncLogs')
				.withIndex('by_sync_type', (q) => q.eq('syncType', syncType))
				.order('desc')
				.first()

			result[syncType] = latestSync
		}

		return result
	},
})

/**
 * Get sync logs with optional filtering
 */
export const getSyncLogs = query({
	args: {
		syncType: v.optional(v.union(
			v.literal('customers'),
			v.literal('payments'),
			v.literal('subscriptions'),
			v.literal('financial')
		)),
		status: v.optional(v.union(
			v.literal('pending'),
			v.literal('running'),
			v.literal('completed'),
			v.literal('failed')
		)),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const limit = args.limit ?? 20

		// If both syncType and status are specified
		if (args.syncType && args.status) {
			// Use by_sync_type index with filter for status
			return await ctx.db
				.query('asaasSyncLogs')
				.withIndex('by_sync_type', (q) => q.eq('syncType', args.syncType!))
				.filter((q) => q.eq(q.field('status'), args.status!))
				.order('desc')
				.take(limit)
		}

		// If only status is specified, use the by_status index
		if (args.status) {
			return await ctx.db
				.query('asaasSyncLogs')
				.withIndex('by_status', (q) => q.eq('status', args.status!))
				.order('desc')
				.take(limit)
		}

		// If only syncType is specified (existing behavior)
		if (args.syncType) {
			return await ctx.db
				.query('asaasSyncLogs')
				.withIndex('by_sync_type', (q) => q.eq('syncType', args.syncType!))
				.order('desc')
				.take(limit)
		}

		// No filters, return all ordered by creation time
		return await ctx.db
			.query('asaasSyncLogs')
			.order('desc')
			.take(limit)
	},
})

/**
 * Get recent sync logs (simplified query for SyncHistory component)
 */
export const getRecentSyncLogs = query({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, args): Promise<Doc<'asaasSyncLogs'>[]> => {
		const limit = args.limit || 10
		return await ctx.db
			.query('asaasSyncLogs')
			.withIndex('by_created')
			.order('desc')
			.take(limit)
	},
})

/**
 * Get a specific sync log by ID
 */
export const getSyncLog = query({
	args: { logId: v.id('asaasSyncLogs') },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.logId)
	},
})

/**
 * Check if there's a sync currently running for a type
 */
export const isSyncRunning = query({
	args: {
		syncType: v.union(
			v.literal('customers'),
			v.literal('payments'),
			v.literal('subscriptions'),
			v.literal('financial')
		),
	},
	handler: async (ctx, args) => {
		const runningSync = await ctx.db
			.query('asaasSyncLogs')
			.withIndex('by_status', (q) => q.eq('status', 'running'))
			.filter((q) => q.eq(q.field('syncType'), args.syncType))
			.first()

		return runningSync !== null
	},
})

/**
 * Get detailed information about failed syncs for debugging
 */
export const getFailedSyncDetails = query({
	args: {
		syncType: v.optional(v.union(
			v.literal('customers'),
			v.literal('payments'),
			v.literal('subscriptions'),
			v.literal('financial')
		)),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		// Require admin/reports permission for viewing failed sync details
		await requirePermission(ctx, PERMISSIONS.SETTINGS_WRITE)

		const limit = args.limit ?? 10

		let failedSyncs = await ctx.db
			.query('asaasSyncLogs')
			.withIndex('by_status', (q) => q.eq('status', 'failed'))
			.order('desc')
			.take(limit * 2) // Get more to filter

		// Filter by syncType if specified
		if (args.syncType) {
			failedSyncs = failedSyncs.filter((sync) => sync.syncType === args.syncType)
		}

		// Take only the requested limit
		failedSyncs = failedSyncs.slice(0, limit)

		return failedSyncs.map((sync) => {
			let parsedLastError = null
			if (sync.lastError) {
				try {
					parsedLastError = JSON.parse(sync.lastError)
				} catch {
					parsedLastError = { message: sync.lastError }
				}
			}

			return {
				_id: sync._id,
				syncType: sync.syncType,
				startedAt: sync.startedAt,
				completedAt: sync.completedAt,
				duration: sync.completedAt ? sync.completedAt - sync.startedAt : null,
				recordsProcessed: sync.recordsProcessed,
				recordsFailed: sync.recordsFailed,
				errors: sync.errors,
				lastError: parsedLastError,
				initiatedBy: sync.initiatedBy,
				filters: sync.filters,
			}
		})
	},
})

/**
 * Get circuit breaker state for monitoring (public query)
 */
export const getCircuitBreakerStatus = query({
	args: {},
	handler: async () => {
		const { getCircuitBreakerState } = await import('../lib/asaas')
		const state = getCircuitBreakerState()

		return {
			state: state.state,
			failureCount: state.failureCount,
			lastFailureTime: state.lastFailureTime,
			nextAttemptTime: state.nextAttemptTime,
			isBlocking: state.state === 'open',
			timeUntilRetry: state.state === 'open'
				? Math.max(0, state.nextAttemptTime - Date.now())
				: 0,
		}
	},
})

// ═══════════════════════════════════════════════════════
// SYNC CONFIGURATION
// ═══════════════════════════════════════════════════════

/**
 * Get auto sync configuration
 */
export const getAutoSyncConfig = query({
	args: {},
	handler: async (ctx) => {
		// Require auth to view config
		await requirePermission(ctx, PERMISSIONS.SETTINGS_WRITE)

		const config = await ctx.db
			.query('settings')
			.withIndex('by_key', (q) => q.eq('key', 'asaas_auto_sync_config'))
			.first()

		return (
			config?.value || {
				enabled: false,
				intervalHours: 1,
				updateExisting: true,
			}
		)
	},
})

/**
 * Save auto sync configuration (public mutation for frontend)
 */
export const saveAutoSyncConfig = mutation({
	args: {
		enabled: v.boolean(),
		intervalHours: v.number(),
		updateExisting: v.boolean(),
	},
	handler: async (ctx, args) => {
		// Require settings write permission to change config
		await requirePermission(ctx, PERMISSIONS.SETTINGS_WRITE)

		const existing = await ctx.db
			.query('settings')
			.withIndex('by_key', (q) => q.eq('key', 'asaas_auto_sync_config'))
			.first()

		const value = {
			enabled: args.enabled,
			intervalHours: Math.max(1, args.intervalHours), // Minimum 1 hour
			updateExisting: args.updateExisting,
		}

		if (existing) {
			await ctx.db.patch(existing._id, {
				value,
				updatedAt: Date.now(),
			})
		} else {
			await ctx.db.insert('settings', {
				key: 'asaas_auto_sync_config',
				value,
				updatedAt: Date.now(),
			})
		}

		return value
	},
})

import { internalAction, internalQuery } from '../_generated/server'

/**
 * Get circuit breaker state for operational diagnostics
 */
export const getCircuitBreakerState = internalQuery({
	args: {},
	handler: async () => {
		const { getCircuitBreakerState } = await import('../lib/asaas')
		return getCircuitBreakerState()
	},
})

/**
 * Run auto sync (called by cron)
 */
export const runAutoSyncCustomersAction = internalAction({
	args: {},
	handler: async (ctx) => {
		// @ts-ignore - Deep type instantiation error
		const config = await ctx.runQuery(api.asaas.sync.getAutoSyncConfig)

		if (!config.enabled) {
			console.log('Asaas auto-sync is disabled, skipping.')
			return { skipped: true }
		}

		console.log('Starting Asaas auto-sync...')

		// 2. Call import action
		await ctx.runAction(api.asaas.actions.importCustomersFromAsaas, {
			initiatedBy: 'system_auto_sync',
		})

		return { success: true }
	},
})

/**
 * Run auto sync payments (called by cron)
 */
export const runAutoSyncPaymentsAction = internalAction({
	args: {},
	handler: async (ctx) => {
		// @ts-ignore - Deep type instantiation error
		const config = await ctx.runQuery(api.asaas.sync.getAutoSyncConfig)

		if (!config.enabled) {
			console.log('Asaas payments auto-sync is disabled, skipping.')
			return { skipped: true }
		}

		console.log('Starting Asaas payments auto-sync...')

		await ctx.runAction(api.asaas.actions.importPaymentsFromAsaas, {
			initiatedBy: 'cron_auto_sync',
		})

		return { success: true }
	},
})

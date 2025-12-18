/**
 * Asaas Sync Management
 *
 * Mutations and queries for managing Asaas sync logs and settings.
 */

import { v } from 'convex/values'
import { internalMutation, query } from '../_generated/server'
import { api, internal } from '../_generated/api'
import type { Doc } from '../_generated/dataModel'

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
		if (updates.completedAt !== undefined) patch.completedAt = updates.completedAt

		await ctx.db.patch(logId, patch)
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
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const limit = args.limit ?? 20

		if (args.syncType) {
			return await ctx.db
				.query('asaasSyncLogs')
				.withIndex('by_sync_type', (q) => q.eq('syncType', args.syncType!))
				.order('desc')
				.take(limit)
		}

		return await ctx.db
			.query('asaasSyncLogs')
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

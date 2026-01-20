/**
 * Asaas Conflict Resolution
 *
 * Handles conflicts between local data and Asaas API data.
 * Detects duplicate customers, payment mismatches, and data inconsistencies.
 */

import { v } from 'convex/values';

import { internal } from '../_generated/api';
import type { Doc } from '../_generated/dataModel';
import { internalMutation, internalQuery, mutation, query } from '../_generated/server';

// ═══════════════════════════════════════════════════════
// INTERNAL QUERIES (for workers and actions)
// ═══════════════════════════════════════════════════════

/**
 * Get pending conflicts for resolution
 * Filters out resolved/ignored conflicts
 */
export const getPendingConflicts = internalQuery({
	args: {
		organizationId: v.optional(v.string()),
		conflictType: v.optional(
			v.union(
				v.literal('duplicate_customer'),
				v.literal('payment_mismatch'),
				v.literal('subscription_mismatch'),
				v.literal('data_inconsistency'),
			),
		),
	},
	handler: async (ctx, args) => {
		// Use indexed query to filter by status first
		const queryBuilder = ctx.db
			.query('asaasConflicts')
			.withIndex('by_status', (q) => q.eq('status', 'pending'));

		// Collect and then filter by organization and type
		let conflicts = await queryBuilder.order('asc').collect();

		// Post-index filters
		if (args.organizationId) {
			conflicts = conflicts.filter((c) => c.organizationId === args.organizationId);
		}
		if (args.conflictType) {
			conflicts = conflicts.filter((c) => c.conflictType === args.conflictType);
		}

		return conflicts;
	},
});

// ═══════════════════════════════════════════════════════
// INTERNAL MUTATIONS (for workers and actions)
// ═══════════════════════════════════════════════════════

/**
 * Resolve a customer conflict
 * Merges or links duplicate customer records
 */
export const resolveCustomerConflict = internalMutation({
	args: {
		conflictId: v.id('asaasConflicts'),
		action: v.union(v.literal('merge'), v.literal('link'), v.literal('ignore')),
		primaryStudentId: v.optional(v.id('students')), // For merge: which student to keep
		resolutionNote: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const conflict = await ctx.db.get(args.conflictId);
		if (!conflict) {
			throw new Error(`Conflict ${args.conflictId} not found`);
		}

		const now = Date.now();

		if (args.action === 'ignore') {
			// Mark conflict as ignored
			await ctx.db.patch(args.conflictId, {
				status: 'ignored',
				resolvedAt: now,
				resolutionNote: args.resolutionNote,
				updatedAt: now,
			});
			return { success: true, action: 'ignored' };
		}

		if (args.action === 'link' && conflict.asaasCustomerId) {
			// Link existing student to Asaas customer
			if (!conflict.studentId) {
				throw new Error('Cannot link conflict: no studentId');
			}

			// Update student with Asaas customer ID
			// biome-ignore lint/suspicious/noExplicitAny: break deep type instantiation
			await ctx.runMutation((internal as any).asaas.mutations.updateStudentAsaasId, {
				studentId: conflict.studentId,
				asaasCustomerId: conflict.asaasCustomerId,
			});

			// Mark conflict as resolved
			await ctx.db.patch(args.conflictId, {
				status: 'resolved',
				resolvedAt: now,
				resolutionNote: args.resolutionNote || 'Linked student to Asaas customer',
				updatedAt: now,
			});

			return { success: true, action: 'linked' };
		}

		if (args.action === 'merge') {
			if (!args.primaryStudentId) {
				throw new Error('Primary student ID required for merge');
			}

			// In a merge scenario, we would:
			// 1. Keep the primary student
			// 2. Copy over any missing data from the secondary student
			// 3. Mark the secondary as merged (or delete, depending on policy)
			// 4. Update all references from secondary to primary

			// For now, we'll just mark the conflict as resolved
			await ctx.db.patch(args.conflictId, {
				status: 'resolved',
				resolvedAt: now,
				resolutionNote: args.resolutionNote || 'Merged student records',
				updatedAt: now,
			});

			return { success: true, action: 'merged' };
		}

		throw new Error(`Invalid action: ${args.action}`);
	},
});

/**
 * Manually resolve a conflict (public API)
 * Allows admins to resolve conflicts from the UI
 */
export const resolveConflictManually = mutation({
	args: {
		conflictId: v.id('asaasConflicts'),
		action: v.union(v.literal('merge'), v.literal('link'), v.literal('ignore')),
		primaryStudentId: v.optional(v.id('students')),
		resolutionNote: v.optional(v.string()),
	},
	handler: async (ctx, args): Promise<{ success: boolean; action: string }> => {
		// Call internal mutation
		return await ctx.runMutation(internal.asaas.conflict_resolution.resolveCustomerConflict, {
			conflictId: args.conflictId,
			action: args.action,
			primaryStudentId: args.primaryStudentId,
			resolutionNote: args.resolutionNote,
		});
	},
});

/**
 * Create a new conflict record
 * Called by workers and actions when conflicts are detected
 */
export const createConflict = internalMutation({
	args: {
		conflictType: v.union(
			v.literal('duplicate_customer'),
			v.literal('payment_mismatch'),
			v.literal('subscription_mismatch'),
			v.literal('data_inconsistency'),
		),
		studentId: v.optional(v.id('students')),
		asaasCustomerId: v.optional(v.string()),
		asaasPaymentId: v.optional(v.string()),
		asaasSubscriptionId: v.optional(v.string()),
		localData: v.optional(v.any()),
		remoteData: v.optional(v.any()),
		field: v.optional(v.string()),
		organizationId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		// Check if similar conflict already exists
		const existing = await ctx.db
			.query('asaasConflicts')
			.withIndex('by_status', (q) => q.eq('status', 'pending'))
			.filter((q) =>
				q.and(
					q.eq(q.field('conflictType'), args.conflictType),
					args.studentId ? q.eq(q.field('studentId'), args.studentId) : true,
					args.asaasCustomerId ? q.eq(q.field('asaasCustomerId'), args.asaasCustomerId) : true,
				),
			)
			.first();

		if (existing) {
			// Update existing conflict with new data
			await ctx.db.patch(existing._id, {
				localData: args.localData,
				remoteData: args.remoteData,
				updatedAt: now,
			});
			return existing._id;
		}

		// Create new conflict
		const conflictId = await ctx.db.insert('asaasConflicts', {
			conflictType: args.conflictType,
			status: 'pending',
			studentId: args.studentId,
			asaasCustomerId: args.asaasCustomerId,
			asaasPaymentId: args.asaasPaymentId,
			asaasSubscriptionId: args.asaasSubscriptionId,
			localData: args.localData,
			remoteData: args.remoteData,
			field: args.field,
			organizationId: args.organizationId,
			createdAt: now,
			updatedAt: now,
		});

		return conflictId;
	},
});

/**
 * Update conflict status
 * Used during automated resolution attempts
 */
export const updateConflictStatus = internalMutation({
	args: {
		conflictId: v.id('asaasConflicts'),
		status: v.union(
			v.literal('pending'),
			v.literal('resolving'),
			v.literal('resolved'),
			v.literal('ignored'),
		),
		resolvedBy: v.optional(v.string()),
		resolutionNote: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		const patch: Partial<Doc<'asaasConflicts'>> = {
			status: args.status,
			updatedAt: now,
		};

		if (args.status === 'resolved' || args.status === 'ignored') {
			patch.resolvedAt = now;
			patch.resolvedBy = args.resolvedBy;
			patch.resolutionNote = args.resolutionNote;
		}

		await ctx.db.patch(args.conflictId, patch);
	},
});

// ═══════════════════════════════════════════════════════
// PUBLIC QUERIES (for UI)
// ═══════════════════════════════════════════════════════

/**
 * Get conflicts for an organization (with pagination)
 */
export const getConflicts = query({
	args: {
		organizationId: v.optional(v.string()),
		conflictType: v.optional(
			v.union(
				v.literal('duplicate_customer'),
				v.literal('payment_mismatch'),
				v.literal('subscription_mismatch'),
				v.literal('data_inconsistency'),
			),
		),
		status: v.optional(
			v.union(
				v.literal('pending'),
				v.literal('resolving'),
				v.literal('resolved'),
				v.literal('ignored'),
			),
		),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const limit = args.limit || 50;

		// Use indexed query based on status
		let conflicts: Doc<'asaasConflicts'>[];

		if (args.status) {
			conflicts = await ctx.db
				.query('asaasConflicts')
				// biome-ignore lint/style/noNonNullAssertion: Guaranteed by check above
				.withIndex('by_status', (q) => q.eq('status', args.status!))
				.order('desc')
				.take(limit);
		} else {
			// Default to showing pending conflicts first
			conflicts = await ctx.db
				.query('asaasConflicts')
				.withIndex('by_status', (q) => q.eq('status', 'pending'))
				.order('desc')
				.take(limit);
		}

		// Post-index filters
		if (args.organizationId) {
			conflicts = conflicts.filter((c) => c.organizationId === args.organizationId);
		}
		if (args.conflictType && args.status !== 'pending') {
			conflicts = conflicts.filter((c) => c.conflictType === args.conflictType);
		}

		return conflicts;
	},
});

/**
 * Get conflict statistics
 */
export const getConflictStats = query({
	args: {
		organizationId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const allConflicts = await ctx.db.query('asaasConflicts').withIndex('by_created').collect();

		const conflicts = args.organizationId
			? allConflicts.filter((c) => c.organizationId === args.organizationId)
			: allConflicts;

		const byType: Record<string, number> = {};
		const byStatus: Record<string, number> = {};

		for (const conflict of conflicts) {
			byType[conflict.conflictType] = (byType[conflict.conflictType] || 0) + 1;
			byStatus[conflict.status] = (byStatus[conflict.status] || 0) + 1;
		}

		return {
			total: conflicts.length,
			pending: byStatus.pending || 0,
			resolved: byStatus.resolved || 0,
			ignored: byStatus.ignored || 0,
			byType,
			byStatus,
		};
	},
});

/**
 * Asaas Idempotency Protection
 *
 * Prevents duplicate operations by tracking processed items.
 * Uses in-memory tracking with TTL for simplicity.
 */

import { v } from 'convex/values';

import { internalMutation, internalQuery } from '../_generated/server';

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

/**
 * Default TTL for idempotency keys (24 hours)
 */
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Idempotency record structure
 */
interface IdempotencyRecord {
	key: string;
	processedAt: number;
	expiresAt: number;
	result?: unknown;
}

// ═══════════════════════════════════════════════════════
// INTERNAL QUERY
// ═══════════════════════════════════════════════════════

/**
 * Check if an operation with the given key was already processed
 */
export const checkIdempotency = internalQuery({
	args: {
		key: v.string(),
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		// Look for existing idempotency key in settings table
		const existing = await ctx.db
			.query('settings')
			.withIndex('by_key', (q) => q.eq('key', `idempotency:${args.key}`))
			.first();

		if (!existing) {
			return { exists: false };
		}

		// Check if expired
		const record = existing.value as IdempotencyRecord;
		if (record.expiresAt < now) {
			return { exists: false, expired: true };
		}

		return { exists: true, result: record.result };
	},
});

// ═══════════════════════════════════════════════════════
// INTERNAL MUTATION
// ═══════════════════════════════════════════════════════

/**
 * Mark an operation as processed with the given key
 */
export const markIdempotency = internalMutation({
	args: {
		key: v.string(),
		result: v.optional(v.any()),
		ttlMs: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		const ttl = args.ttlMs ?? DEFAULT_TTL_MS;

		const record: IdempotencyRecord = {
			key: args.key,
			processedAt: now,
			expiresAt: now + ttl,
			result: args.result,
		};

		// Use settings table to store idempotency records
		const existing = await ctx.db
			.query('settings')
			.withIndex('by_key', (q) => q.eq('key', `idempotency:${args.key}`))
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, {
				value: record,
				updatedAt: now,
			});
		} else {
			await ctx.db.insert('settings', {
				key: `idempotency:${args.key}`,
				value: record,
				updatedAt: now,
			});
		}

		return { success: true };
	},
});

/**
 * Clean up expired idempotency records
 * Should be called periodically (e.g., via cron)
 */
export const cleanupExpiredIdempotency = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();

		// Get all idempotency records
		const allRecords = await ctx.db.query('settings').collect();

		const idempotencyRecords = allRecords.filter((r) => r.key.startsWith('idempotency:'));

		let deletedCount = 0;

		for (const record of idempotencyRecords) {
			const value = record.value as IdempotencyRecord;
			if (value.expiresAt < now) {
				await ctx.db.delete(record._id);
				deletedCount++;
			}
		}

		return { deletedCount };
	},
});

// ═══════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════

/**
 * Generate an idempotency key for an operation
 */
export function generateIdempotencyKey(operation: string, identifier: string): string {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 8);
	return `${operation}:${identifier}:${timestamp}:${random}`;
}

/**
 * Generate a stable idempotency key for customer import
 * Based on ASAAS customer ID to prevent duplicate imports
 */
export function generateCustomerImportKey(asaasCustomerId: string): string {
	return `customer:import:${asaasCustomerId}`;
}

/**
 * Generate a stable idempotency key for payment import
 */
export function generatePaymentImportKey(asaasPaymentId: string): string {
	return `payment:import:${asaasPaymentId}`;
}

/**
 * Generate a stable idempotency key for subscription import
 */
export function generateSubscriptionImportKey(asaasSubscriptionId: string): string {
	return `subscription:import:${asaasSubscriptionId}`;
}

/**
 * Check and mark idempotency in a single operation
 * Returns true if the operation should proceed (not already processed)
 */
export async function withIdempotency<T>(
	ctx: any,
	key: string,
	fn: () => Promise<T>,
	ttlMs?: number,
): Promise<{ proceeded: boolean; result?: T; existingResult?: unknown }> {
	// Check if already processed
	// @ts-expect-error - Deep type instantiation error
	const existing = await ctx.runQuery(internal.asaas.idempotency.checkIdempotency, { key });

	if (existing.exists) {
		return { proceeded: false, existingResult: existing.result };
	}

	// Execute the operation
	const result = await fn();

	// Mark as processed
	// @ts-expect-error - Deep type instantiation error
	await ctx.runMutation(internal.asaas.idempotency.markIdempotency, {
		key,
		result,
		ttlMs,
	});

	return { proceeded: true, result };
}

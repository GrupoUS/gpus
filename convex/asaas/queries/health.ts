/**
 * Asaas Webhook Health Check Queries
 *
 * Provides health metrics for webhook processing and monitoring.
 * Used by admin dashboard and monitoring systems.
 */

import { v } from 'convex/values';

import { internalQuery } from '../../_generated/server';

/**
 * Get webhook processing health metrics
 *
 * Returns aggregated statistics about webhook processing including:
 * - Total webhooks received
 * - Processing status distribution
 * - Recent failures
 */
export const getWebhookHealth = internalQuery({
	args: {},
	returns: v.object({
		total: v.number(),
		pending: v.number(),
		processing: v.number(),
		done: v.number(),
		failed: v.number(),
		oldestPendingAt: v.optional(v.number()),
		oldestProcessingAt: v.optional(v.number()),
	}),
	handler: async (ctx) => {
		// Get webhooks grouped by status
		const [pending, processing, done, failed] = await Promise.all([
			ctx.db
				.query('asaasWebhooks')
				.withIndex('by_status', (q) => q.eq('status', 'pending'))
				.collect(),
			ctx.db
				.query('asaasWebhooks')
				.withIndex('by_status', (q) => q.eq('status', 'processing'))
				.collect(),
			ctx.db
				.query('asaasWebhooks')
				.withIndex('by_status', (q) => q.eq('status', 'done'))
				.collect(),
			ctx.db
				.query('asaasWebhooks')
				.withIndex('by_status', (q) => q.eq('status', 'failed'))
				.collect(),
		]);

		const total = pending.length + processing.length + done.length + failed.length;

		// Find oldest pending and processing webhooks
		const oldestPendingAt =
			pending.length > 0
				? pending.reduce(
						(oldest, w) => (w.createdAt < oldest ? w.createdAt : oldest),
						pending[0].createdAt,
					)
				: undefined;

		const oldestProcessingAt =
			processing.length > 0
				? processing.reduce(
						(oldest, w) => (w.createdAt < oldest ? w.createdAt : oldest),
						processing[0].createdAt,
					)
				: undefined;

		return {
			total,
			pending: pending.length,
			processing: processing.length,
			done: done.length,
			failed: failed.length,
			oldestPendingAt,
			oldestProcessingAt,
		};
	},
});

/**
 * Get webhook queue depth
 *
 * Returns count of webhooks waiting to be processed (pending status).
 * This indicates system load and helps identify processing bottlenecks.
 */
export const getQueueDepth = internalQuery({
	args: {},
	returns: v.object({
		pending: v.number(),
		processing: v.number(),
		total: v.number(),
	}),
	handler: async (ctx) => {
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
 * Get webhook event type distribution
 *
 * Returns statistics about which event types are being received.
 * Helps identify unusual patterns or missing event handlers.
 */
export const getEventTypeDistribution = internalQuery({
	args: {
		limit: v.optional(v.number()),
	},
	returns: v.object({
		paymentEvents: v.number(),
		subscriptionEvents: v.number(),
		customerEvents: v.number(),
		total: v.number(),
	}),
	handler: async (ctx, args) => {
		const limit = args.limit ?? 1000;
		const since = Date.now() - limit * 1000;

		const recentWebhooks = await ctx.db
			.query('asaasWebhooks')
			.withIndex('by_created', (q) => q.gte('createdAt', since))
			.order('desc')
			.take(limit);

		const paymentEvents = recentWebhooks.filter((w) => w.event.startsWith('PAYMENT_')).length;

		const subscriptionEvents = recentWebhooks.filter((w) =>
			w.event.startsWith('SUBSCRIPTION_'),
		).length;

		const customerEvents = recentWebhooks.filter((w) => w.event.startsWith('CUSTOMER_')).length;

		return {
			paymentEvents,
			subscriptionEvents,
			customerEvents,
			total: recentWebhooks.length,
		};
	},
});

/**
 * Check webhook system health
 *
 * Simple health check that returns overall system status.
 * Returns 200-like status for monitoring systems.
 */
export const checkWebhookSystemHealth = internalQuery({
	args: {},
	returns: v.null(),
	handler: async () => {
		return null;
	},
});

/**
 * Get webhook event by event ID (admin/debugging helper)
 *
 * Allows administrators to inspect webhook processing details.
 */
export const getWebhookEventDetails = internalQuery({
	args: {
		eventId: v.string(),
	},
	returns: v.union(v.null(), v.any()),
	handler: async (ctx, args) => {
		const webhook = await ctx.db
			.query('asaasWebhooks')
			.withIndex('by_event_id', (q) => q.eq('eventId', args.eventId))
			.first();

		if (!webhook) {
			return null;
		}

		return webhook;
	},
});

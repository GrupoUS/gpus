/**
 * Asaas Integration - Webhooks
 *
 * Internal mutations and actions for processing Asaas webhook events.
 *
 * LGPD COMPLIANCE:
 * - Webhook payloads are encrypted before storage to protect PII
 * - Automatic 90-day retention policy for webhook logs
 */
import type { FunctionReference, SchedulableFunctionReference } from 'convex/server';
import { v } from 'convex/values';

import { internalAction, internalMutation, internalQuery } from '../_generated/server';
import { decrypt, encrypt } from '../lib/encryption';
import {
	processCustomerWorker,
	processPaymentWorker,
	processSubscriptionWorker,
} from './importWorkers';
import type {
	AsaasCustomerResponse,
	AsaasPaymentResponse,
	AsaasSubscriptionResponse,
} from './types';

/**
 * Webhook retention period (90 days as per ANPD guidelines)
 */
const WEBHOOK_RETENTION_DAYS = 90;
const WEBHOOK_RETENTION_MS = WEBHOOK_RETENTION_DAYS * 24 * 60 * 60 * 1000;

const MAX_WEBHOOK_RETRIES = 5;
const RETRY_BASE_DELAY_MS = 60_000;
const RETRY_JITTER_MS = 5000;
const RETRY_MAX_DELAY_MS = 30 * 60 * 1000;

type WebhookResult =
	| { processed: true; webhookId: string; reason?: string }
	| { processed: false; reason: string; webhookId?: string };

interface InternalApi {
	asaas: {
		webhooks: {
			getWebhookByEventId: FunctionReference<'query', 'internal'>;
			getWebhookById: FunctionReference<'query', 'internal'>;
			createWebhookEvent: FunctionReference<'mutation', 'internal'>;
			updateWebhookStatus: FunctionReference<'mutation', 'internal'>;
			getFailedWebhooks: FunctionReference<'query', 'internal'>;
			processWebhookEvent: SchedulableFunctionReference;
		};
		alerts: {
			createAlert: FunctionReference<'mutation', 'internal'>;
		};
		mutations: {
			getPaymentByAsaasId: FunctionReference<'query', 'internal'>;
		};
	};
	notifications: {
		sendPaymentConfirmed: SchedulableFunctionReference;
		sendPaymentReceived: SchedulableFunctionReference;
		sendPaymentOverdue: SchedulableFunctionReference;
	};
}

const getInternalApi = (): InternalApi => {
	const apiModule = require('../_generated/api') as unknown;
	return (apiModule as { internal: InternalApi }).internal;
};

function calculateRetryDelay(attempt: number): number {
	const exponent = Math.max(0, attempt - 1);
	const delay = RETRY_BASE_DELAY_MS * 2 ** exponent;
	const jitter = Math.floor(Math.random() * RETRY_JITTER_MS);
	return Math.min(delay + jitter, RETRY_MAX_DELAY_MS);
}

/**
 * Get webhook event by Asaas event ID (idempotency)
 */
export const getWebhookByEventId = internalQuery({
	args: { eventId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query('asaasWebhooks')
			.withIndex('by_event_id', (q) => q.eq('eventId', args.eventId))
			.first();
	},
});

/**
 * Get webhook event by internal ID
 */
export const getWebhookById = internalQuery({
	args: { id: v.id('asaasWebhooks') },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

/**
 * Create webhook event log entry (internal)
 */
export const createWebhookEvent = internalMutation({
	args: {
		eventId: v.string(),
		eventType: v.string(),
		paymentId: v.optional(v.string()),
		subscriptionId: v.optional(v.string()),
		customerId: v.optional(v.string()),
		payload: v.any(),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		const retentionUntil = now + WEBHOOK_RETENTION_MS;

		let encryptedPayload: string | undefined;
		try {
			encryptedPayload = await encrypt(JSON.stringify(args.payload));
		} catch (_error) {
			// Store without encrypted payload when encryption fails.
		}

		const webhookId = await ctx.db.insert('asaasWebhooks', {
			eventId: args.eventId,
			event: args.eventType,
			paymentId: args.paymentId,
			subscriptionId: args.subscriptionId,
			customerId: args.customerId,
			payload: encryptedPayload,
			processed: false,
			status: 'pending',
			retryCount: 0,
			createdAt: now,
			retentionUntil,
		});

		return { webhookId, storedPayload: Boolean(encryptedPayload) };
	},
});

/**
 * Update webhook event status (internal)
 */
export const updateWebhookStatus = internalMutation({
	args: {
		id: v.id('asaasWebhooks'),
		status: v.optional(
			v.union(
				v.literal('pending'),
				v.literal('processing'),
				v.literal('done'),
				v.literal('failed'),
			),
		),
		processed: v.optional(v.boolean()),
		retryCount: v.optional(v.number()),
		lastAttemptAt: v.optional(v.number()),
		processedAt: v.optional(v.number()),
		error: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		const patch: Record<string, unknown> = {};

		if (updates.status !== undefined) patch.status = updates.status;
		if (updates.processed !== undefined) patch.processed = updates.processed;
		if (updates.retryCount !== undefined) patch.retryCount = updates.retryCount;
		if (updates.lastAttemptAt !== undefined) patch.lastAttemptAt = updates.lastAttemptAt;
		if (updates.processedAt !== undefined) patch.processedAt = updates.processedAt;
		if ('error' in updates) patch.error = updates.error;

		if (Object.keys(patch).length > 0) {
			await ctx.db.patch(id, patch);
		}
	},
});

/**
 * Process webhook event idempotently (internal)
 */
export const processWebhookIdempotent = internalAction({
	args: {
		eventId: v.string(),
		eventType: v.string(),
		paymentId: v.optional(v.string()),
		subscriptionId: v.optional(v.string()),
		customerId: v.optional(v.string()),
		payload: v.any(),
	},
	handler: async (ctx, args): Promise<WebhookResult> => {
		const internalApi = getInternalApi();
		const existing = await ctx.runQuery(internalApi.asaas.webhooks.getWebhookByEventId, {
			eventId: args.eventId,
		});

		if (existing) {
			return { processed: false, reason: 'Already received', webhookId: existing._id };
		}

		const created = await ctx.runMutation(internalApi.asaas.webhooks.createWebhookEvent, {
			eventId: args.eventId,
			eventType: args.eventType,
			paymentId: args.paymentId,
			subscriptionId: args.subscriptionId,
			customerId: args.customerId,
			payload: args.payload,
		});

		await ctx.scheduler.runAfter(0, internalApi.asaas.webhooks.processWebhookEvent, {
			webhookId: created.webhookId,
			rawPayload: created.storedPayload ? undefined : args.payload,
		});

		return { processed: true, webhookId: created.webhookId };
	},
});

/**
 * Process webhook event (internal action)
 */
export const processWebhookEvent = internalAction({
	args: {
		webhookId: v.id('asaasWebhooks'),
		rawPayload: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		const internalApi = getInternalApi();
		const webhook = await ctx.runQuery(internalApi.asaas.webhooks.getWebhookById, {
			id: args.webhookId,
		});

		if (!webhook) {
			return { processed: false, reason: 'Webhook not found' };
		}

		if (webhook.status === 'processing' || webhook.status === 'done') {
			return { processed: false, reason: 'Already processing or completed' };
		}

		const retryCount = (webhook.retryCount ?? 0) + 1;
		await ctx.runMutation(internalApi.asaas.webhooks.updateWebhookStatus, {
			id: args.webhookId,
			status: 'processing',
			processed: false,
			retryCount,
			lastAttemptAt: Date.now(),
			error: undefined,
		});

		const markFailed = async (message: string): Promise<WebhookResult> => {
			await ctx.runMutation(internalApi.asaas.webhooks.updateWebhookStatus, {
				id: args.webhookId,
				status: 'failed',
				processed: true,
				error: message,
			});
			return { processed: false, reason: message };
		};

		const markDone = async (reason?: string): Promise<WebhookResult> => {
			await ctx.runMutation(internalApi.asaas.webhooks.updateWebhookStatus, {
				id: args.webhookId,
				status: 'done',
				processed: true,
				processedAt: Date.now(),
				error: undefined,
			});
			return reason
				? { processed: true, webhookId: args.webhookId, reason }
				: { processed: true, webhookId: args.webhookId };
		};

		const resolvePayload = async (): Promise<unknown> => {
			if (args.rawPayload) return args.rawPayload;
			if (!webhook.payload) return undefined;
			const decrypted = await decrypt(webhook.payload);
			return JSON.parse(decrypted) as unknown;
		};

		const createWebhookAlert = async (alert: {
			severity: 'low' | 'medium';
			title: string;
			message: string;
			details: Record<string, unknown>;
		}) =>
			ctx.runMutation(internalApi.asaas.alerts.createAlert, {
				alertType: 'data_integrity',
				severity: alert.severity,
				title: alert.title,
				message: alert.message,
				details: alert.details,
			});

		const payload = await resolvePayload();
		if (!payload || typeof payload !== 'object') {
			return markFailed('Missing webhook payload');
		}

		const eventType =
			typeof (payload as { event?: unknown }).event === 'string'
				? (payload as { event: string }).event
				: webhook.event;

		const handlePaymentEvent = async (
			payment: AsaasPaymentResponse,
		): Promise<WebhookResult> => {
			const result = await processPaymentWorker(ctx, payment, undefined);
			if (!result.success) {
				const reason = result.error || result.reason || 'Payment processing failed';
				await createWebhookAlert({
					severity: 'medium',
					title: 'Webhook payment processing failed',
					message: reason,
					details: {
						eventType,
						eventId: webhook.eventId,
						paymentId: payment.id,
					},
				});
				throw new Error(reason);
			}

			const paymentRecord = await ctx.runQuery(internalApi.asaas.mutations.getPaymentByAsaasId, {
				asaasPaymentId: payment.id,
			});

			if (!paymentRecord?.studentId) {
				return markDone();
			}

			if (payment.status === 'CONFIRMED') {
				await ctx.scheduler.runAfter(0, internalApi.notifications.sendPaymentConfirmed, {
					paymentId: paymentRecord._id,
					studentId: paymentRecord.studentId,
				});
				return markDone();
			}

			if (payment.status === 'RECEIVED' || payment.status === 'RECEIVED_IN_CASH') {
				await ctx.scheduler.runAfter(0, internalApi.notifications.sendPaymentReceived, {
					paymentId: paymentRecord._id,
					studentId: paymentRecord.studentId,
				});
				return markDone();
			}

			if (payment.status === 'OVERDUE') {
				await ctx.scheduler.runAfter(0, internalApi.notifications.sendPaymentOverdue, {
					paymentId: paymentRecord._id,
					studentId: paymentRecord.studentId,
				});
			}

			return markDone();
		};
		const handleSubscriptionEvent = async (
			subscription: AsaasSubscriptionResponse,
		): Promise<WebhookResult> => {
			const result = await processSubscriptionWorker(ctx, subscription, undefined);
			if (!result.success) {
				const reason = result.error || result.reason || 'Subscription processing failed';
				await createWebhookAlert({
					severity: 'medium',
					title: 'Webhook subscription processing failed',
					message: reason,
					details: {
						eventType,
						eventId: webhook.eventId,
						subscriptionId: subscription.id,
					},
				});
				throw new Error(reason);
			}

			return markDone();
		};

		const handleCustomerEvent = async (
			customer: AsaasCustomerResponse,
		): Promise<WebhookResult> => {
			const result = await processCustomerWorker(ctx, customer, undefined);
			if (!result.success) {
				const reason = result.error || result.reason || 'Customer processing failed';
				await createWebhookAlert({
					severity: 'low',
					title: 'Webhook customer processing failed',
					message: reason,
					details: {
						eventType,
						eventId: webhook.eventId,
						customerId: customer.id,
					},
				});
				throw new Error(reason);
			}

			return markDone();
		};

		const handlers = [
			{
				match: (type: string) => type.startsWith('PAYMENT_'),
				handler: (): Promise<WebhookResult> => {
					const payment = (payload as { payment?: AsaasPaymentResponse }).payment;
					if (!payment || typeof payment.id !== 'string') {
						throw new Error('Missing payment data in webhook payload');
					}

					return handlePaymentEvent(payment);
				},
			},
			{
				match: (type: string) => type.startsWith('SUBSCRIPTION_'),
				handler: (): Promise<WebhookResult> => {
					const subscription = (payload as { subscription?: AsaasSubscriptionResponse })
						.subscription;
					if (!subscription || typeof subscription.id !== 'string') {
						throw new Error('Missing subscription data in webhook payload');
					}

					return handleSubscriptionEvent(subscription);
				},
			},
			{
				match: (type: string) => type.startsWith('CUSTOMER_'),
				handler: (): Promise<WebhookResult> => {
					const customer = (payload as { customer?: AsaasCustomerResponse }).customer;
					if (!customer || typeof customer.id !== 'string') {
						throw new Error('Missing customer data in webhook payload');
					}

					return handleCustomerEvent(customer);
				},
			},
		];

		try {
			const matched = handlers.find((item) => item.match(eventType));
			return matched ? await matched.handler() : await markDone('Ignored event type');
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown webhook processing error';
			return markFailed(errorMessage);
		}
	},
});

/**
 * Retry failed webhooks (internal)
 */
export const retryFailedWebhooks = internalAction({
	args: {
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const limit = args.limit ?? 50;
		const internalApi = getInternalApi();

		const failed = await ctx.runQuery(internalApi.asaas.webhooks.getFailedWebhooks, {
			limit,
		});

		let queued = 0;
		for (const webhook of failed) {
			if ((webhook.retryCount ?? 0) >= MAX_WEBHOOK_RETRIES) {
				await ctx.runMutation(internalApi.asaas.alerts.createAlert, {
					alertType: 'webhook_timeout',
					severity: 'high',
					title: 'Webhook permanently failed',
					message: `Webhook ${webhook.eventId || webhook._id} exceeded retry limit`,
					details: {
						eventId: webhook.eventId,
						status: webhook.status,
						retryCount: webhook.retryCount,
					},
				});
				continue;
			}

			const delay = calculateRetryDelay(webhook.retryCount ?? 0);
			await ctx.scheduler.runAfter(delay, internalApi.asaas.webhooks.processWebhookEvent, {
				webhookId: webhook._id,
			});
			queued++;
		}

		return { queued };
	},
});

/**
 * List failed webhooks for retry (internal)
 */
export const getFailedWebhooks = internalQuery({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const limit = args.limit ?? 50;
		return await ctx.db
			.query('asaasWebhooks')
			.withIndex('by_status', (q) => q.eq('status', 'failed'))
			.order('desc')
			.take(limit);
	},
});

/**
 * Clean up expired deduplication entries (internal)
 * Call this periodically to prevent database bloat
 */
export const cleanupExpiredDeduplicationEntries = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const expired = await ctx.db
			.query('asaasWebhookDeduplication')
			.withIndex('by_expires_at', (q) => q.lt('expiresAt', now))
			.collect();

		// Delete expired entries
		for (const entry of expired) {
			await ctx.db.delete(entry._id);
		}

		return { deleted: expired.length };
	},
});

/**
 * Clean up expired webhook entries (LGPD compliance)
 * Deletes webhooks older than retention period (90 days)
 *
 * Call this periodically (e.g., daily) via cron job
 */
export const cleanupExpiredWebhooks = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const expired = await ctx.db
			.query('asaasWebhooks')
			.withIndex('by_retention_until', (q) => q.lt('retentionUntil', now))
			.collect();

		// Delete expired webhook logs
		for (const webhook of expired) {
			await ctx.db.delete(webhook._id);
		}

		return { deleted: expired.length };
	},
});

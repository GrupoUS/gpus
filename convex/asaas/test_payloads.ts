/**
 * Asaas Test Payloads - Fase 4: Teste e Validação da Sincronização
 *
 * Comprehensive test webhook payloads for validation of Asaas sync integration.
 * Includes realistic payloads for each webhook event type.
 *
 * @module convex/asaas/test_payloads
 */

import { v } from 'convex/values';

import { internal } from '../_generated/api';
import { action } from '../_generated/server';
import { requireOrgRole } from '../lib/auth';

// ═══════════════════════════════════════════════════════
// TEST PAYLOAD TEMPLATES
// ═══════════════════════════════════════════════════════

/**
 * Generate a unique test event ID
 */
function generateTestEventId(prefix: string): string {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 8);
	return `TEST_${prefix}_${timestamp}_${random}`;
}

/**
 * Test Payload Templates for all Asaas Webhook Event Types
 * These are factory functions that generate unique IDs each time
 */
export const TEST_PAYLOADS = {
	// ───────────────────────────────────────────────────
	// PAYMENT EVENTS
	// ───────────────────────────────────────────────────
	PAYMENT_CREATED: (customerId?: string) => ({
		id: generateTestEventId('PAYMENT_CREATED'),
		event: 'PAYMENT_CREATED',
		payment: {
			id: `pay_test_${Date.now()}`,
			customer: customerId || 'cus_test_000',
			value: 150.0,
			netValue: 147.0,
			billingType: 'PIX' as const,
			status: 'PENDING' as const,
			dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
			description: 'Test Payment - Mensalidade Curso',
			externalReference: `ref_test_${Date.now()}`,
			dateCreated: new Date().toISOString().split('T')[0],
		},
	}),

	PAYMENT_CONFIRMED: {
		id: 'evt_test_payment_confirmed',
		event: 'PAYMENT_CONFIRMED',
		payment: {
			id: 'pay_test_123',
			customer: 'cus_test_123',
			value: 100.0,
			netValue: 97.5,
			status: 'CONFIRMED',
			billingType: 'BOLETO',
			dueDate: '2025-01-15',
			paymentDate: '2025-01-15',
			confirmedDate: '2025-01-15',
		},
	},

	PAYMENT_RECEIVED: (paymentId?: string) => ({
		id: generateTestEventId('PAYMENT_RECEIVED'),
		event: 'PAYMENT_RECEIVED',
		payment: {
			id: paymentId || `pay_test_${Date.now()}`,
			customer: 'cus_test_000',
			value: 200.0,
			netValue: 195.0,
			status: 'RECEIVED' as const,
			billingType: 'PIX' as const,
			dueDate: new Date().toISOString().split('T')[0],
			paymentDate: new Date().toISOString().split('T')[0],
			confirmedDate: new Date().toISOString().split('T')[0],
		},
	}),

	PAYMENT_OVERDUE: (paymentId?: string) => ({
		id: generateTestEventId('PAYMENT_OVERDUE'),
		event: 'PAYMENT_OVERDUE',
		payment: {
			id: paymentId || `pay_test_${Date.now()}`,
			customer: 'cus_test_000',
			value: 150.0,
			netValue: 147.0,
			status: 'OVERDUE' as const,
			billingType: 'BOLETO' as const,
			dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
			description: 'Test Payment - Overdue',
		},
	}),

	PAYMENT_REFUNDED: (paymentId?: string) => ({
		id: generateTestEventId('PAYMENT_REFUNDED'),
		event: 'PAYMENT_REFUNDED',
		payment: {
			id: paymentId || `pay_test_${Date.now()}`,
			customer: 'cus_test_000',
			value: 150.0,
			refundedValue: 150.0,
			status: 'REFUNDED' as const,
			refundedDate: new Date().toISOString().split('T')[0],
			description: 'Test Payment - Refunded',
		},
	}),

	// ───────────────────────────────────────────────────
	// SUBSCRIPTION EVENTS
	// ───────────────────────────────────────────────────
	SUBSCRIPTION_CREATED: (customerId?: string) => ({
		id: generateTestEventId('SUBSCRIPTION_CREATED'),
		event: 'SUBSCRIPTION_CREATED',
		subscription: {
			id: `sub_test_${Date.now()}`,
			customer: customerId || 'cus_test_000',
			value: 299.0,
			cycle: 'MONTHLY' as const,
			billingType: 'CREDIT_CARD' as const,
			status: 'ACTIVE' as const,
			nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
			description: 'Test Subscription - Plano Mensal',
		},
	}),

	SUBSCRIPTION_UPDATED: (subscriptionId?: string) => ({
		id: generateTestEventId('SUBSCRIPTION_UPDATED'),
		event: 'SUBSCRIPTION_UPDATED',
		subscription: {
			id: subscriptionId || `sub_test_${Date.now()}`,
			customer: 'cus_test_000',
			value: 349.0,
			cycle: 'MONTHLY' as const,
			status: 'ACTIVE' as const,
			description: 'Test Subscription - Updated Value',
		},
	}),

	SUBSCRIPTION_DELETED: (subscriptionId?: string) => ({
		id: generateTestEventId('SUBSCRIPTION_DELETED'),
		event: 'SUBSCRIPTION_DELETED',
		subscription: {
			id: subscriptionId || `sub_test_${Date.now()}`,
			customer: 'cus_test_000',
			status: 'INACTIVE' as const,
			description: 'Test Subscription - Cancelled',
		},
	}),

	// ───────────────────────────────────────────────────
	// CUSTOMER EVENTS
	// ───────────────────────────────────────────────────
	CUSTOMER_CREATED: () => ({
		id: generateTestEventId('CUSTOMER_CREATED'),
		event: 'CUSTOMER_CREATED',
		customer: {
			id: `cus_test_${Date.now()}`,
			name: 'Test Customer - Portal Grupo US',
			email: `test_${Date.now()}@example.com`,
			cpfCnpj: '52998224725', // Valid CPF for testing
			phone: '11999999999',
			mobilePhone: '11999999999',
			externalReference: `ref_student_${Date.now()}`,
			dateCreated: new Date().toISOString().split('T')[0],
		},
	}),

	CUSTOMER_UPDATED: (customerId?: string) => ({
		id: generateTestEventId('CUSTOMER_UPDATED'),
		event: 'CUSTOMER_UPDATED',
		customer: {
			id: customerId || `cus_test_${Date.now()}`,
			name: 'Test Customer - Updated Name',
			email: `updated_${Date.now()}@example.com`,
			phone: '11988888888',
		},
	}),

	// ───────────────────────────────────────────────────
	// ERROR SCENARIOS FOR TESTING
	// ───────────────────────────────────────────────────
	INVALID_PAYLOAD: () => ({
		id: generateTestEventId('INVALID'),
		event: 'PAYMENT_CREATED',
		// Missing required fields to trigger validation error
		payment: {
			id: `pay_invalid_${Date.now()}`,
			// Missing customer - should fail validation
			value: 100.0,
		},
	}),

	DUPLICATE_EVENT: (eventId: string) => ({
		id: eventId, // Same event ID to test idempotency
		event: 'PAYMENT_CREATED',
		payment: {
			id: `pay_dup_${Date.now()}`,
			customer: 'cus_test_000',
			value: 150.0,
			status: 'PENDING' as const,
		},
	}),
};

// ═══════════════════════════════════════════════════════
// WEBHOOK EVENT TYPES
// ═══════════════════════════════════════════════════════

export const WEBHOOK_EVENT_TYPES = [
	'PAYMENT_CREATED',
	'PAYMENT_UPDATED',
	'PAYMENT_CONFIRMED',
	'PAYMENT_RECEIVED',
	'PAYMENT_OVERDUE',
	'PAYMENT_REFUNDED',
	'PAYMENT_DELETED',
	'PAYMENT_RESTORED',
	'SUBSCRIPTION_CREATED',
	'SUBSCRIPTION_UPDATED',
	'SUBSCRIPTION_DELETED',
	'CUSTOMER_CREATED',
	'CUSTOMER_UPDATED',
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

// ═══════════════════════════════════════════════════════
// TEST WEBHOOK ACTIONS
// ═══════════════════════════════════════════════════════

/**
 * Send a test webhook to validate webhook processing
 * Admin-only action for testing purposes
 */
export const sendTestWebhook = action({
	args: {
		eventType: v.string(),
		customPayload: v.optional(v.any()),
		customerId: v.optional(v.string()),
		paymentId: v.optional(v.string()),
		subscriptionId: v.optional(v.string()),
	},
	handler: async (ctx, args): Promise<any> => {
		// Require admin role for testing
		await requireOrgRole(ctx, ['org:admin', 'admin']);

		const startTime = Date.now();

		// Get payload from template or use custom
		let payload: Record<string, unknown>;

		if (args.customPayload) {
			payload = args.customPayload;
		} else {
			// Get template based on event type
			const template = TEST_PAYLOADS[args.eventType as keyof typeof TEST_PAYLOADS];

			if (!template) {
				throw new Error(
					`Unknown event type: ${args.eventType}. Available: ${Object.keys(TEST_PAYLOADS).join(', ')}`,
				);
			}

			// Generate payload (handle both static objects and factory functions)
			if (typeof template === 'function') {
				// Factory function - call with appropriate argument (all factory functions accept optional string)
				switch (args.eventType) {
					case 'PAYMENT_CREATED':
					case 'SUBSCRIPTION_CREATED':
					case 'CUSTOMER_UPDATED':
						payload = (template as (id?: string) => Record<string, unknown>)(args.customerId);
						break;
					case 'PAYMENT_RECEIVED':
					case 'PAYMENT_OVERDUE':
					case 'PAYMENT_REFUNDED':
						payload = (template as (id?: string) => Record<string, unknown>)(args.paymentId);
						break;
					case 'SUBSCRIPTION_UPDATED':
					case 'SUBSCRIPTION_DELETED':
						payload = (template as (id?: string) => Record<string, unknown>)(args.subscriptionId);
						break;
					case 'CUSTOMER_CREATED':
					case 'INVALID_PAYLOAD':
						// These factory functions take no arguments
						payload = (template as () => Record<string, unknown>)();
						break;
					default:
						// For DUPLICATE_EVENT which requires eventId
						payload = (template as (id: string) => Record<string, unknown>)(
							`test_dup_${Date.now()}`,
						);
				}
			} else {
				payload = template as Record<string, unknown>;
			}
		}

		try {
			// Call internal webhook processor
			const result = await ctx.runAction(internal.asaas.webhooks.processWebhookIdempotent, {
				eventId: (payload.id as string) || `test_${Date.now()}`,
				eventType: (payload.event as string) || args.eventType,
				paymentId: (payload as any).payment?.id,
				subscriptionId: (payload as any).subscription?.id,
				customerId:
					(payload as any).payment?.customer ||
					(payload as any).subscription?.customer ||
					(payload as any).customer?.id,
				payload,
			});

			const processingTime = Date.now() - startTime;

			return {
				success: true,
				eventId: payload.id,
				eventType: args.eventType,
				result,
				processingTime,
				message: `Test webhook ${args.eventType} processed successfully`,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';

			return {
				success: false,
				eventId: payload.id,
				eventType: args.eventType,
				error: errorMessage,
				processingTime: Date.now() - startTime,
			};
		}
	},
});

/**
 * Generate batch of test webhooks for load testing
 * Admin-only action with safety limits
 */
export const generateTestWebhookBatch = action({
	args: {
		eventType: v.union(
			v.literal('PAYMENT_CREATED'),
			v.literal('PAYMENT_RECEIVED'),
			v.literal('CUSTOMER_CREATED'),
		),
		count: v.number(), // Number of webhooks to generate (max 100)
	},
	handler: async (ctx, args) => {
		await requireOrgRole(ctx, ['org:admin', 'admin']);

		const startTime = Date.now();
		const maxCount = Math.min(args.count, 100); // Safety limit

		const results: Array<{
			success: boolean;
			eventId: string;
			processingTime: number;
			error?: string;
		}> = [];

		for (let i = 0; i < maxCount; i++) {
			const itemStart = Date.now();
			const eventId = generateTestEventId(`${args.eventType}_BATCH_${i}`);

			// Generate payload
			const template = TEST_PAYLOADS[args.eventType];
			const payload: Record<string, unknown> =
				typeof template === 'function'
					? (template as () => Record<string, unknown>)()
					: { ...(template as Record<string, unknown>) };

			// Override event ID for tracking
			(payload as any).id = eventId;

			try {
				await ctx.runAction(internal.asaas.webhooks.processWebhookIdempotent, {
					eventId,
					eventType: args.eventType,
					paymentId: (payload as any).payment?.id,
					subscriptionId: (payload as any).subscription?.id,
					customerId:
						(payload as any).payment?.customer ||
						(payload as any).subscription?.customer ||
						(payload as any).customer?.id,
					payload,
				});

				results.push({
					success: true,
					eventId,
					processingTime: Date.now() - itemStart,
				});
			} catch (error) {
				results.push({
					success: false,
					eventId,
					processingTime: Date.now() - itemStart,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}

			// Small delay to prevent overwhelming the system (rate limiting)
			if (i % 10 === 9 && i < maxCount - 1) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		}

		const successCount = results.filter((r) => r.success).length;
		const failedCount = results.filter((r) => !r.success).length;
		const totalTime = Date.now() - startTime;
		const avgTime = totalTime / maxCount;

		return {
			success: failedCount === 0,
			summary: {
				total: maxCount,
				successful: successCount,
				failed: failedCount,
				totalTimeMs: totalTime,
				avgTimePerWebhookMs: Math.round(avgTime),
				throughputPerSecond: Math.round((maxCount / totalTime) * 1000),
			},
			results,
		};
	},
});

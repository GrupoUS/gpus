import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import type { Context as HonoContext } from 'hono';

import {
	asaasPayments,
	asaasSubscriptions,
	asaasWebhookDeduplication,
	asaasWebhooks,
} from '../../drizzle/schema';
import { db } from '../db';

interface AsaasWebhookPayload {
	id?: string;
	event: string;
	payment?: {
		id: string;
		status: string;
		confirmedDate?: string;
		netValue?: number;
	};
	subscription?: {
		id: string;
		status: string;
	};
}

/**
 * Handle incoming ASAAS webhook events.
 *
 * Flow:
 * 1. Parse + validate payload
 * 2. Deduplicate via idempotency key
 * 3. Log event to asaas_webhooks
 * 4. Upsert payment or subscription status
 */
export async function handleAsaasWebhook(c: HonoContext) {
	const accessToken = c.req.header('asaas-access-token');
	const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

	if (expectedToken && accessToken !== expectedToken) {
		return c.json({ error: 'Unauthorized' }, 401);
	}

	let payload: AsaasWebhookPayload;
	try {
		payload = await c.req.json<AsaasWebhookPayload>();
	} catch {
		return c.json({ error: 'Invalid JSON' }, 400);
	}

	if (!payload.event) {
		return c.json({ error: 'Missing event type' }, 400);
	}

	const idempotencyKey = `${payload.event}:${payload.id ?? payload.payment?.id ?? payload.subscription?.id ?? randomUUID()}`;

	// ── Deduplication ──
	const [existing] = await db
		.select()
		.from(asaasWebhookDeduplication)
		.where(eq(asaasWebhookDeduplication.idempotencyKey, idempotencyKey))
		.limit(1);

	if (existing) {
		return c.json({ status: 'duplicate', message: 'Event already processed' });
	}

	// ── Log the webhook ──
	const retentionDays = 90;
	const retentionUntil = new Date();
	retentionUntil.setDate(retentionUntil.getDate() + retentionDays);

	await db.insert(asaasWebhooks).values({
		eventId: payload.id ?? null,
		event: payload.event,
		paymentId: payload.payment?.id ?? null,
		subscriptionId: payload.subscription?.id ?? null,
		payload: JSON.stringify(payload),
		processed: false,
		status: 'pending',
		retryCount: 0,
		retentionUntil,
	});

	// ── Process event ──
	try {
		if (payload.event.startsWith('PAYMENT_') && payload.payment) {
			await db
				.update(asaasPayments)
				.set({
					status: payload.payment.status as typeof asaasPayments.$inferSelect.status,
					confirmedDate: payload.payment.confirmedDate
						? new Date(payload.payment.confirmedDate)
						: undefined,
					netValue: payload.payment.netValue?.toString(),
					updatedAt: new Date(),
				})
				.where(eq(asaasPayments.asaasPaymentId, payload.payment.id));
		}

		if (payload.event.startsWith('SUBSCRIPTION_') && payload.subscription) {
			await db
				.update(asaasSubscriptions)
				.set({
					status: payload.subscription.status as typeof asaasSubscriptions.$inferSelect.status,
					updatedAt: new Date(),
				})
				.where(eq(asaasSubscriptions.asaasSubscriptionId, payload.subscription.id));
		}

		// ── Mark processed + record dedup key ──
		await db.insert(asaasWebhookDeduplication).values({
			idempotencyKey,
			processedAt: new Date(),
			expiresAt: retentionUntil,
		});

		// Update webhook log status
		if (payload.id) {
			await db
				.update(asaasWebhooks)
				.set({ processed: true, status: 'done', processedAt: new Date() })
				.where(eq(asaasWebhooks.eventId, payload.id));
		}

		return c.json({ status: 'processed' });
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';

		if (payload.id) {
			await db
				.update(asaasWebhooks)
				.set({ status: 'failed', error: errorMessage, lastAttemptAt: new Date() })
				.where(eq(asaasWebhooks.eventId, payload.id));
		}

		return c.json({ status: 'error', message: errorMessage }, 500);
	}
}

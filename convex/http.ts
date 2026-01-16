/**
 * Convex HTTP Router - Handles external webhook endpoints
 *
 * This file defines HTTP endpoints that can be called by external services.
 * Currently supports:
 * - POST /brevo/webhook - Brevo email event webhooks
 * - POST /messaging/webhook - Messaging provider webhooks
 */

import { httpRouter } from 'convex/server';

import { internal } from './_generated/api';
import { type ActionCtx, httpAction } from './_generated/server';
import { type BrevoWebhookPayload, normalizeEventType, validateWebhookSecret } from './lib/brevo';
import {
	type MessagingWebhookPayload,
	normalizeMessageStatus,
	validateMessagingWebhookSecret,
} from './lib/messaging';

const http = httpRouter();

/**
 * Brevo Webhook Endpoint
 *
 * Receives email events from Brevo (delivery, opens, clicks, bounces, etc.)
 * and records them in the emailEvents table.
 *
 * POST /brevo/webhook
 *
 * Headers:
 * - X-Brevo-Secret: Webhook secret for authentication
 *
 * Body: BrevoWebhookPayload (JSON)
 */
http.route({
	path: '/brevo/webhook',
	method: 'POST',
	handler: httpAction(async (ctx, request) => {
		// 1. Validate webhook secret
		const url = new URL(request.url);
		const secret = request.headers.get('X-Brevo-Secret') ?? url.searchParams.get('secret');
		if (!validateWebhookSecret(secret)) {
			return new Response('Unauthorized', { status: 401 });
		}

		// 2. Parse payload
		let payload: BrevoWebhookPayload;
		try {
			payload = (await request.json()) as BrevoWebhookPayload;
		} catch {
			return new Response('Bad Request: Invalid JSON', { status: 400 });
		}

		// 3. Validate required fields
		if (!(payload.event && payload.email)) {
			return new Response('Bad Request: Missing required fields (event, email)', { status: 400 });
		}

		// 4. Normalize event type to our internal format
		const eventType = normalizeEventType(payload.event);

		// 5. Find contact by email (if exists)
		// @ts-expect-error - Deep type instantiation error with internal queries
		const contact = await ctx.runQuery(internal.emailMarketing.getContactByEmailInternal, {
			email: payload.email,
		});

		// 6. Extract timestamp (prefer epoch, fallback to ts, then current time)
		const timestamp = payload.ts_epoch ?? payload.ts ?? Date.now();

		// 7. Record the event
		await ctx.runMutation(internal.emailMarketing.recordEmailEvent, {
			email: payload.email,
			contactId: contact?._id,
			campaignId: undefined, // Campaign ID not available in webhook payload
			eventType,
			link: payload.link,
			bounceType: payload.reason,
			brevoMessageId: payload['message-id'],
			timestamp,
			metadata: payload,
		});

		// 8. Handle unsubscribe and hard bounce events - update subscription status
		const unsubscribeEvents = ['unsubscribed', 'hard_bounce', 'invalid_email'];
		if (unsubscribeEvents.includes(payload.event)) {
			await ctx.runMutation(internal.emailMarketing.updateContactSubscriptionInternal, {
				email: payload.email,
				subscriptionStatus: 'unsubscribed',
			});
		}

		return new Response('OK', { status: 200 });
	}),
});

/**
 * Messaging Webhook Endpoint
 *
 * Receives message status updates from messaging providers (WhatsApp, SMS, etc.)
 * and updates the message status in the database.
 *
 * POST /messaging/webhook
 *
 * Headers:
 * - X-Messaging-Secret: Webhook secret for authentication
 *
 * Body: MessagingWebhookPayload (JSON)
 */
http.route({
	path: '/messaging/webhook',
	method: 'POST',
	handler: httpAction(async (ctx, request) => {
		// 1. Validate webhook secret
		const secret = request.headers.get('X-Messaging-Secret');
		if (!validateMessagingWebhookSecret(secret)) {
			return new Response('Unauthorized', { status: 401 });
		}

		// 2. Parse payload
		let payload: MessagingWebhookPayload;
		try {
			payload = (await request.json()) as MessagingWebhookPayload;
		} catch {
			return new Response('Bad Request: Invalid JSON', { status: 400 });
		}

		// 3. Validate required fields
		if (!(payload.messageId && payload.status)) {
			return new Response('Bad Request: Missing required fields (messageId, status)', {
				status: 400,
			});
		}

		// 4. Normalize status to internal format
		const normalizedStatus = normalizeMessageStatus(payload.status);

		// 5. Update message status via internal mutation
		try {
			await ctx.runMutation(internal.messages.updateStatusInternal, {
				// biome-ignore lint/suspicious/noExplicitAny: ID from external provider doesn't match internal Id type
				messageId: payload.messageId as any,
				status: normalizedStatus,
			});
		} catch (_error) {
			return new Response('Internal Server Error', { status: 500 });
		}

		return new Response('OK', { status: 200 });
	}),
});

// biome-ignore lint/suspicious/useAwait: Async required by httpAction signature
export const asaas = httpAction(async (_ctx: ActionCtx, _request: Request) => {
	// Placeholder for Asaas webhook handling
	return new Response('OK', { status: 200 });
});

/**
 * Timing-safe string comparison to prevent timing attacks
 * Compares two strings in constant time regardless of their content
 */
function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) {
		return false;
	}

	let result = 0;
	for (let i = 0; i < a.length; i++) {
		// biome-ignore lint: Bitwise operations required for constant-time comparison
		result |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}

	return result === 0;
}

/**
 * Verify HMAC SHA256 signature for Asaas webhooks
 * Asaas sends signature in 'asaas_signature' header
 */
async function verifyAsaasSignature(
	payload: string,
	signature: string | null,
	secret: string | undefined,
): Promise<boolean> {
	if (!(signature && secret)) {
		return false;
	}

	try {
		// Encode payload and secret
		const encoder = new TextEncoder();
		const keyData = encoder.encode(secret);

		// Import secret key for HMAC
		const key = await crypto.subtle.importKey(
			'raw',
			keyData,
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['sign'],
		);

		// Generate HMAC signature
		const payloadBuffer = encoder.encode(payload);
		const signatureBuffer = await crypto.subtle.sign('HMAC', key, payloadBuffer);

		// Convert to hex
		const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');

		// Use timing-safe comparison
		return timingSafeEqual(signature, expectedSignature);
	} catch (_error) {
		return false;
	}
}

// Mark as used for future Asaas webhook implementation
void verifyAsaasSignature;

/**
 * Simple in-memory rate limiter for webhook endpoints
 * Prevents abuse by limiting requests per IP
 */
class WebhookRateLimiter {
	private readonly requests: Map<string, number[]> = new Map();
	private readonly maxRequests: number;
	private readonly windowMs: number;

	constructor(maxRequests = 100, windowMs = 60_000) {
		this.maxRequests = maxRequests;
		this.windowMs = windowMs;
	}

	isAllowed(ip: string): boolean {
		const now = Date.now();
		const windowStart = now - this.windowMs;

		// Get existing requests for this IP
		let ipRequests = this.requests.get(ip) || [];

		// Filter out old requests outside the time window
		ipRequests = ipRequests.filter((timestamp) => timestamp > windowStart);

		// Check if limit exceeded
		if (ipRequests.length >= this.maxRequests) {
			return false;
		}

		// Add current request
		ipRequests.push(now);
		this.requests.set(ip, ipRequests);

		return true;
	}

	// Cleanup old entries to prevent memory leak
	cleanup(): void {
		const now = Date.now();
		const windowStart = now - this.windowMs;

		for (const [ip, requests] of this.requests.entries()) {
			const validRequests = requests.filter((t) => t > windowStart);
			if (validRequests.length === 0) {
				this.requests.delete(ip);
			} else {
				this.requests.set(ip, validRequests);
			}
		}
	}
}

// Create rate limiter instance (100 requests per minute per IP)
const webhookRateLimiter = new WebhookRateLimiter(100, 60_000);

// Cleanup rate limiter every 5 minutes
setInterval(() => webhookRateLimiter.cleanup(), 5 * 60 * 1000);

export default http;

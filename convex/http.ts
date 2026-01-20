// @ts-nocheck
/**
 * Convex HTTP Router - Handles external webhook endpoints
 *
 * This file defines HTTP endpoints that can be called by external services.
 * Currently supports:
 * - POST /brevo/webhook - Brevo email event webhooks
 * - POST /messaging/webhook - Messaging provider webhooks
 */

import { httpRouter } from 'convex/server';

import { api, internal } from './_generated/api';
import { type ActionCtx, httpAction } from './_generated/server';
import { type BrevoWebhookPayload, normalizeEventType, validateWebhookSecret } from './lib/brevo';
import {
	type MessagingWebhookPayload,
	normalizeMessageStatus,
	validateMessagingWebhookSecret,
} from './lib/messaging';
import {
	formatTypebotPhone,
	mapTypebotInterest,
	validateTypebotWebhookSecret,
} from './lib/typebot';

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
		// Break type inference chain to avoid "Type instantiation is excessively deep" error
		// biome-ignore lint/suspicious/noExplicitAny: Required to break type inference chain
		const getContactFn = (internal as any).emailMarketing.getContactByEmailInternal;
		const contact = await ctx.runQuery(getContactFn, {
			email: payload.email,
		});

		// 6. Extract timestamp (prefer epoch, fallback to ts, then current time)
		const timestamp = payload.ts_epoch ?? payload.ts ?? Date.now();

		// 7. Record the event
		// biome-ignore lint/suspicious/noExplicitAny: avoid circular type instantiation
		await ctx.runMutation((internal as any).emailMarketing.recordEmailEvent, {
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
			// biome-ignore lint/suspicious/noExplicitAny: avoid circular type instantiation
			await ctx.runMutation((internal as any).emailMarketing.updateContactSubscriptionInternal, {
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
			// biome-ignore lint/suspicious/noExplicitAny: avoid circular type instantiation
			await ctx.runMutation((internal as any).messages.updateStatusInternal, {
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

/**
 * Helper function to extract user IP from request headers
 */
function extractUserIp(request: Request): string {
	const ipHeader =
		request.headers.get('x-forwarded-for') ||
		request.headers.get('x-real-ip') ||
		request.headers.get('cf-connecting-ip') ||
		'unknown';
	return ipHeader.split(',')[0].trim();
}

/**
 * Helper function to map Typebot body to CRM args
 */
// biome-ignore lint/suspicious/noExplicitAny: External payload structure is flexible
function mapTypebotBodyToArgs(body: any, userIp: string) {
	const baseArgs = {
		name: body.nome || body.name || 'Nome não fornecido',
		email: body.email || body.email_contato || '',
		phone: formatTypebotPhone(body.telefone || body.phone || body.whatsapp || ''),
		interest: mapTypebotInterest(body.interesse || body.interest),
		message: body.mensagem || body.message || body.notes || '',
		lgpdConsent: body.lgpdConsent !== false,
		whatsappConsent: body.whatsappConsent !== false,
		utmSource: body.utmSource || body.utm_source,
		utmCampaign: body.utmCampaign || body.utm_campaign,
		utmMedium: body.utmMedium || body.utm_medium,
		utmContent: body.utmContent || body.utm_content,
		utmTerm: body.utmTerm || body.utm_term,
	};

	return {
		...baseArgs,
		userIp,
		company: body.empresa || body.company,
		jobRole: body.cargo || body.jobRole || body.role,
		origin: body.origem || body.source || body.origin,
		typebotId: body.typebot_id || body.typebotId,
		resultId: body.result_id || body.resultId,
		externalTimestamp: typeof body.timestamp === 'number' ? body.timestamp : undefined,
	};
}

/**
 * Helper function to determine HTTP status from error message
 */
function getStatusFromError(errorMsg: string): number {
	if (errorMsg.includes('Validation failed') || errorMsg.includes('Invalid submission')) {
		return 400;
	}
	if (
		errorMsg.includes('Rate limit exceeded') ||
		errorMsg.includes('Limite de submissões excedido')
	) {
		return 429;
	}
	return 500;
}

/**
 * Typebot Webhook Endpoint
 *
 * Receives lead data from Typebot HTTP Request blocks after form completion.
 *
 * POST /typebot/webhook
 *
 * Headers:
 * - X-Typebot-Secret: Webhook secret for authentication
 *
 * Body: JSON with lead fields (nome, email, telefone, etc.)
 */
http.route({
	path: '/typebot/webhook',
	method: 'POST',
	handler: httpAction(async (ctx, request) => {
		// 1. Validate webhook secret
		const secret = request.headers.get('X-Typebot-Secret');
		if (!validateTypebotWebhookSecret(secret)) {
			return new Response('Unauthorized', { status: 401 });
		}

		// 2. Parse payload
		// biome-ignore lint/suspicious/noExplicitAny: External payload structure is flexible
		let body: any;
		try {
			body = await request.json();
		} catch {
			return new Response('Bad Request: Invalid JSON', { status: 400 });
		}

		// 3. Extract user IP
		const userIp = extractUserIp(request);

		// 4. Map Typebot variables to CRM arguments
		const args = mapTypebotBodyToArgs(body, userIp);

		// 5. Trigger creation mutation
		try {
			// biome-ignore lint/suspicious/noExplicitAny: break type inference chain
			const leadId = await ctx.runMutation((api as any).marketingLeads.create as any, args);

			return new Response(JSON.stringify({ success: true, leadId }), {
				status: 201,
				headers: { 'Content-Type': 'application/json' },
			});
			// biome-ignore lint/suspicious/noExplicitAny: error type
		} catch (error: any) {
			const errorMsg = error.message || '';
			const status = getStatusFromError(errorMsg);

			return new Response(JSON.stringify({ success: false, error: errorMsg }), {
				status,
				headers: { 'Content-Type': 'application/json' },
			});
		}
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
		// biome-ignore lint/suspicious/noBitwiseOperators: constant-time comparison needed for security
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
// Note: setInterval is used here for in-memory cleanup, though in serverless
// environments like Convex global state may be reset frequently.
if (typeof setInterval !== 'undefined') {
	setInterval(() => webhookRateLimiter.cleanup(), 5 * 60 * 1000);
}

/**
 * Leads Webhook Endpoint (WordPress/External)
 *
 * Receives lead data from landing pages/WordPress.
 * Mapping: email, name, phone, interest, source, utm params.
 *
 * POST /webhook/leads
 * Headers: X-Webhook-Secret
 */
http.route({
	path: '/webhook/leads',
	method: 'POST',
	handler: httpAction(async (ctx, request) => {
		// 1. Validate Secret
		const webhookSecret = process.env.WEBHOOK_SECRET;
		const providedSecret = request.headers.get('X-Webhook-Secret');

		if (!webhookSecret || providedSecret !== webhookSecret) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// 2. Parse Body
		// biome-ignore lint/suspicious/noExplicitAny: External payload
		let body: any;
		try {
			body = await request.json();
		} catch (_e) {
			return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// 3. Validation Summary
		if (!(body.email && body.source)) {
			return new Response(JSON.stringify({ error: 'Missing required fields: email, source' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// 4. Extract IP
		const ipAddress = request.headers.get('X-Forwarded-For') || 'unknown';
		const userAgent = request.headers.get('User-Agent') || 'unknown';

		// 5. Call Internal Mutation
		try {
			// biome-ignore lint/suspicious/noExplicitAny: prevent deep instantiation
			const result = await ctx.runMutation((internal as any).marketingLeads.createFromWebhook, {
				email: body.email,
				source: body.source,
				name: body.name,
				phone: body.phone,
				interest: body.interest,
				message: body.message,
				utmSource: body.utm_source || body.utmSource,
				utmCampaign: body.utm_campaign || body.utmCampaign,
				utmMedium: body.utm_medium || body.utmMedium,
				utmContent: body.utm_content || body.utmContent,
				utmTerm: body.utm_term || body.utmTerm,
				ipAddress: ipAddress.split(',')[0].trim(),
				userAgent,
				customFields: body.custom_fields,
			});

			return new Response(JSON.stringify({ success: true, ...result }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return new Response(
				JSON.stringify({ error: 'Internal Server Error', details: errorMessage }),
				{ status: 500, headers: { 'Content-Type': 'application/json' } },
			);
		}
	}),
});

// Configure CORS for webhooks (optional but good practice)
http.route({
	path: '/webhook/leads',
	method: 'OPTIONS',
	handler: httpAction(async () => {
		return await Promise.resolve(
			new Response(null, {
				status: 204,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'POST, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, X-Webhook-Secret',
				},
			}),
		);
	}),
});

export default http;

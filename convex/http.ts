/**
 * Convex HTTP Router - Handles external webhook endpoints
 *
 * This file defines HTTP endpoints that can be called by external services.
 * Currently supports:
 * - POST /brevo/webhook - Brevo email event webhooks
 */

import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { internal } from './_generated/api'
import {
	type BrevoWebhookPayload,
	normalizeEventType,
	validateWebhookSecret,
} from './lib/brevo'

const http = httpRouter()

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
		const secret = request.headers.get('X-Brevo-Secret')
		if (!validateWebhookSecret(secret)) {
			console.error('Brevo webhook: Invalid secret')
			return new Response('Unauthorized', { status: 401 })
		}

		// 2. Parse payload
		let payload: BrevoWebhookPayload
		try {
			payload = (await request.json()) as BrevoWebhookPayload
		} catch {
			console.error('Brevo webhook: Invalid JSON payload')
			return new Response('Bad Request', { status: 400 })
		}

		// 3. Validate required fields
		if (!payload.event || !payload.email) {
			console.error('Brevo webhook: Missing required fields (event, email)')
			return new Response('Bad Request: Missing required fields', {
				status: 400,
			})
		}

		// 4. Normalize event type to our internal format
		const eventType = normalizeEventType(payload.event)

		// 5. Find contact by email (if exists)
		const contact = await ctx.runQuery(
			internal.emailMarketing.getContactByEmailInternal,
			{
				email: payload.email,
			},
		)

		// 6. Extract timestamp (prefer epoch, fallback to ts, then current time)
		const timestamp = payload.ts_epoch ?? payload.ts ?? Date.now()

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
		})

		// 8. Handle unsubscribe and hard bounce events - update subscription status
		const unsubscribeEvents = ['unsubscribed', 'hard_bounce', 'invalid_email']
		if (unsubscribeEvents.includes(payload.event)) {
			await ctx.runMutation(
				internal.emailMarketing.updateContactSubscriptionInternal,
				{
					email: payload.email,
					subscriptionStatus: 'unsubscribed',
				},
			)
			console.log(
				`Brevo webhook: Updated subscription status to unsubscribed for ${payload.email}`,
			)
		}

		console.log(`Brevo webhook: Processed ${payload.event} for ${payload.email}`)
		return new Response('OK', { status: 200 })
	}),
})

export default http

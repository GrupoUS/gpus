/**
 * Asaas Integration - Webhooks
 *
 * Internal mutations for processing Asaas webhook events.
 */

import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'
import { internal } from '../_generated/api'
import { dateStringToTimestamp } from '../lib/asaas'

/**
 * Process webhook event (internal)
 */
export const processWebhook = internalMutation({
	args: {
		event: v.string(),
		paymentId: v.optional(v.string()),
		payload: v.any(),
	},
	handler: async (ctx, args) => {
		// Log webhook event
		const webhookId = await ctx.db.insert('asaasWebhooks', {
			event: args.event,
			paymentId: args.paymentId,
			payload: args.payload,
			processed: false,
			createdAt: Date.now(),
		})

		if (!args.paymentId) {
			await ctx.db.patch(webhookId, {
				processed: true,
				error: 'No payment ID in webhook',
			})
			return { processed: false, reason: 'No payment ID' }
		}

		try {
			// 1. Handle Subscription Events
			if (args.event.startsWith('SUBSCRIPTION_')) {
				const subscription = args.payload.subscription as any
				if (subscription && subscription.id) {
					// @ts-ignore
					await ctx.runMutation(internal.asaas.mutations.updateSubscriptionStatusInternal, {
						asaasSubscriptionId: subscription.id,
						status: subscription.status,
						nextDueDate: subscription.nextDueDate ? dateStringToTimestamp(subscription.nextDueDate) : undefined,
						value: subscription.value,
					})
				}

				await ctx.db.patch(webhookId, { processed: true })
				return { processed: true }
			}

			// 2. Handle Payment Events
			const payment = args.payload.payment as any
			if (!payment || !args.paymentId) {
				await ctx.db.patch(webhookId, {
					processed: true,
					error: 'No payment data in webhook',
				})
				return { processed: false, reason: 'No payment data' }
			}

			// Map Asaas status to our status
			const statusMap: Record<string, any> = {
				PENDING: 'PENDING',
				RECEIVED: 'RECEIVED',
				CONFIRMED: 'CONFIRMED',
				OVERDUE: 'OVERDUE',
				REFUNDED: 'REFUNDED',
				DELETED: 'DELETED',
				CANCELLED: 'CANCELLED',
			}

			const status = statusMap[payment.status] || 'PENDING'
			const confirmedDate = payment.paymentDate
				? dateStringToTimestamp(payment.paymentDate)
				: undefined

			// Update payment status
			// @ts-ignore
			await ctx.runMutation(internal.asaas.mutations.updatePaymentStatus, {
				asaasPaymentId: args.paymentId,
				status,
				confirmedDate,
				netValue: payment.netValue,
			})

			// Mark webhook as processed
			await ctx.db.patch(webhookId, {
				processed: true,
			})

			return { processed: true }
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			await ctx.db.patch(webhookId, {
				processed: true,
				error: errorMessage,
			})
			throw error
		}
	},
})

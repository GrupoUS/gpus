import axios from 'axios';
import { v } from 'convex/values';

import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { action, internalMutation, internalQuery } from './_generated/server';

// Top-level regex for URL normalization (performance optimization)
const TRAILING_SLASH_REGEX = /\/$/;

// ============================================================================
// PUBLIC ACTIONS
// ============================================================================

export const sendWhatsAppMessage = action({
	args: {
		leadId: v.id('leads'),
		message: v.string(),
	},
	handler: async (ctx, args) => {
		// 1. Fetch Request Context & Configuration
		// biome-ignore lint/suspicious/noExplicitAny: internal api typing
		const lead: any = await ctx.runQuery((internal as any).whatsapp.getLeadOrganization, {
			leadId: args.leadId,
		});
		if (!lead?.organizationId) {
			throw new Error('Lead not found or missing organizationId.');
		}
		const organizationId: string = lead.organizationId;

		// biome-ignore lint/suspicious/noExplicitAny: internal api typing
		const config: any = await ctx.runQuery(internal.settings.internalGetIntegrationConfig, {
			integrationName: 'evolution',
		});

		if (!(config?.base_url && config?.api_key && config?.instance)) {
			throw new Error('Evolution API not configured.');
		}

		const { base_url, api_key, instance } = config;

		// 2. Check Rate Limits
		const rateLimitStatus = await ctx.runQuery((internal as any).whatsapp.getRateLimitStatus, {
			organizationId,
		});

		if (!rateLimitStatus.allowed) {
			// Queue message if limit exceeded
			const queueId: any = await ctx.runMutation((internal as any).whatsapp.queueWhatsAppMessage, {
				organizationId,
				leadId: args.leadId,
				message: args.message,
			});
			return {
				success: false,
				queued: true,
				queueId,
				message: 'Rate limit exceeded. Message queued.',
			};
		}

		// 3. Prepare Request
		const phone = lead.phone;
		if (!phone) {
			return { success: false, message: 'Lead has no phone number.' };
		}

		// Normalize URL
		const baseUrl = base_url.replace(TRAILING_SLASH_REGEX, '');
		const url = `${baseUrl}/message/sendText/${instance}`;

		// 4. Execute with Retry Logic
		let attempt = 0;
		const maxAttempts = 3;
		const baseDelay = 1000; // 1 second

		while (attempt < maxAttempts) {
			try {
				const response: any = await axios.post(
					url,
					{ number: phone, text: args.message },
					{
						headers: {
							apikey: api_key,
							'Content-Type': 'application/json',
						},
						timeout: 10_000,
					},
				);

				// 5. Handle Success
				await ctx.runMutation((internal as any).whatsapp.createMessageWithActivity, {
					leadId: args.leadId,
					content: args.message,
					status: 'enviado',
					externalId: response.data?.key?.id || response.data?.id,
					organizationId,
				});

				return { success: true, externalId: response.data?.key?.id };
			} catch (error: any) {
				attempt++;

				// Log failure on final attempt
				if (attempt >= maxAttempts) {
					const errorMessage = error.response?.data
						? JSON.stringify(error.response.data)
						: error.message;

					await ctx.runMutation((internal as any).whatsapp.logFailureActivity, {
						leadId: args.leadId,
						content: args.message,
						error: errorMessage,
						organizationId,
					});

					// Error details based on HTTP status
					let details = 'Unknown Error';
					if (error.response?.status === 401) {
						details = 'Auth Error';
					} else if (error.response?.status === 429) {
						details = 'Rate Limited';
					}

					return {
						success: false,
						error: errorMessage,
						details,
					};
				}

				// Exponential backoff
				const delay = baseDelay * 2 ** (attempt - 1);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	},
});

export const sendWhatsAppMessageFromQueue = action({
	args: {
		queueId: v.id('evolutionApiQueue'),
	},
	handler: async (ctx, args) => {
		// 1. Fetch Request Context from Queue
		const queueItem = await ctx.runQuery((internal as any).whatsapp.getQueueItem, {
			queueId: args.queueId,
		});
		if (!queueItem) return; // Already processed or deleted

		const { leadId, message, organizationId } = queueItem;

		const config: any = await ctx.runQuery(internal.settings.internalGetIntegrationConfig, {
			integrationName: 'evolution',
		});

		if (!(config?.base_url && config?.api_key && config?.instance)) {
			await ctx.runMutation((internal as any).whatsapp.updateQueueStatus, {
				queueId: args.queueId,
				status: 'failed',
				errorMessage: 'Configuration missing',
			});
			return;
		}

		// 2. Prepare Request (Similar logic to main action but simpler)
		const lead = await ctx.runQuery((internal as any).whatsapp.getLeadOrganization, { leadId });
		if (!lead) {
			await ctx.runMutation((internal as any).whatsapp.updateQueueStatus, {
				queueId: args.queueId,
				status: 'failed',
				errorMessage: 'Lead not found',
			});
			return;
		}

		const { base_url, api_key, instance } = config;
		const baseUrl = base_url.replace(TRAILING_SLASH_REGEX, '');
		const url = `${baseUrl}/message/sendText/${instance}`;

		try {
			const response: any = await axios.post(
				url,
				{ number: lead.phone, text: message },
				{ headers: { apikey: api_key, 'Content-Type': 'application/json' }, timeout: 10_000 },
			);

			// Success
			await ctx.runMutation((internal as any).whatsapp.createMessageWithActivity, {
				leadId,
				content: message,
				status: 'enviado',
				externalId: response.data?.key?.id,
				organizationId,
			});

			await ctx.runMutation((internal as any).whatsapp.updateQueueStatus, {
				queueId: args.queueId,
				status: 'sent',
			});
		} catch (error: any) {
			const errorMessage = error.response?.data
				? JSON.stringify(error.response.data)
				: error.message;

			// Update queue item to retain error or retry state if implemented
			// Here we mark as failed after one try from queue for simplicity, or could implement retries
			await ctx.runMutation((internal as any).whatsapp.updateQueueStatus, {
				queueId: args.queueId,
				status: 'failed',
				errorMessage,
			});
		}
	},
});

// ============================================================================
// INTERNAL QUERIES & MUTATIONS (Helpers)
// ============================================================================

export const getLeadOrganization = internalQuery({
	args: { leadId: v.id('leads') },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.leadId);
	},
});

export const getQueueItem = internalQuery({
	args: { queueId: v.id('evolutionApiQueue') },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.queueId);
	},
});

export const getRateLimitStatus = internalQuery({
	args: { organizationId: v.string() },
	handler: async (ctx, args) => {
		const limit = 100;
		const windowMs = 3_600_000; // 1 hour
		const now = Date.now();
		const startTime = now - windowMs;

		const recentActions = await ctx.db
			.query('rateLimits')
			.withIndex('by_identifier_action', (q) =>
				q.eq('identifier', args.organizationId).eq('action', 'whatsapp_send'),
			)
			.filter((q) => q.gte(q.field('timestamp'), startTime))
			.collect();

		const count = recentActions.length;

		// Find when the oldest record in the window expires to set resetAt
		// But for queueing logic, we usually just need "allowed"
		return {
			count,
			limit,
			allowed: count < limit,
			resetAt: count > 0 ? recentActions[0].timestamp + windowMs : now,
		};
	},
});

export const createMessageWithActivity = internalMutation({
	args: {
		leadId: v.id('leads'),
		content: v.string(),
		status: v.union(
			v.literal('enviando'),
			v.literal('enviado'),
			v.literal('entregue'),
			v.literal('lido'),
			v.literal('falhou'),
		),
		externalId: v.optional(v.string()),
		organizationId: v.string(),
	},
	handler: async (ctx, args) => {
		// 1. Find or Create Conversation
		const conversation = await ctx.db
			.query('conversations')
			.withIndex('by_lead', (q) => q.eq('leadId', args.leadId))
			.filter((q) => q.eq(q.field('channel'), 'whatsapp'))
			.first();

		let conversationId: Id<'conversations'>;

		if (conversation) {
			conversationId = conversation._id;
			await ctx.db.patch(conversationId, {
				lastMessageAt: Date.now(),
				updatedAt: Date.now(),
			});
		} else {
			conversationId = await ctx.db.insert('conversations', {
				leadId: args.leadId,
				channel: 'whatsapp',
				department: 'vendas',
				status: 'aguardando_cliente',
				updatedAt: Date.now(),
				createdAt: Date.now(),
				lastMessageAt: Date.now(),
				// Multi-tenant inferred possibly? Or need to fetch lead?
				// We passed organizationId
			});
			// Small patch: db schema might require organizationId?
			// Checking schema provided: conversations doesn't seem to strictly require orgId in definedTable but good to have context.
			// Wait, viewing schema earlier: conversations DOES NOT have organizationId in defineTable visible rows 379-419.
			// But it has leadId which links to org.
		}

		// 2. Insert Message
		await ctx.db.insert('messages', {
			conversationId,
			sender: 'agent',
			content: args.content,
			contentType: 'text',
			status: args.status,
			externalId: args.externalId,
			createdAt: Date.now(),
		});

		// 3. Log Activity
		await ctx.db.insert('activities', {
			leadId: args.leadId,
			conversationId,
			organizationId: args.organizationId,
			type: 'whatsapp_sent',
			description: 'Mensagem WhatsApp enviada',
			metadata: { status: args.status, externalId: args.externalId },
			performedBy: 'system', // or passed user ID if available
			createdAt: Date.now(),
		});

		// 4. Record Rate Limit
		await ctx.db.insert('rateLimits', {
			identifier: args.organizationId,
			action: 'whatsapp_send',
			timestamp: Date.now(),
		});

		// 5. Update Lead Timestamp
		await ctx.db.patch(args.leadId, {
			updatedAt: Date.now(),
		});
	},
});

export const logFailureActivity = internalMutation({
	args: {
		leadId: v.id('leads'),
		content: v.string(),
		error: v.string(),
		organizationId: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.insert('activities', {
			leadId: args.leadId,
			organizationId: args.organizationId,
			type: 'whatsapp_sent',
			description: 'Falha no envio de mensagem WhatsApp',
			metadata: { status: 'falhou', error: args.error },
			performedBy: 'system',
			createdAt: Date.now(),
		});
	},
});

export const queueWhatsAppMessage = internalMutation({
	args: {
		organizationId: v.string(),
		leadId: v.id('leads'),
		message: v.string(),
	},
	handler: async (ctx, args) => {
		// Calculate next slot based on logic: find oldest rate limit record in window, add 1h
		const windowMs = 3_600_000;
		const now = Date.now();

		// Ideally we'd find the exact time the window clears, but for simplicity/robustness:
		// If we are rate limited now, schedule for 1 hour from the oldest call in the window
		// OR just schedule for 5-10 mins later and let the cron retry loop handle it (simpler)
		// The plan says: "Calculate next available slot: ... find oldest timestamp, add 1 hour"

		const oldestAction = await ctx.db
			.query('rateLimits')
			.withIndex('by_identifier_action', (q) =>
				q.eq('identifier', args.organizationId).eq('action', 'whatsapp_send'),
			)
			.order('asc')
			.first();

		const scheduledFor = oldestAction ? oldestAction.timestamp + windowMs : now + 60_000;

		return await ctx.db.insert('evolutionApiQueue', {
			organizationId: args.organizationId,
			leadId: args.leadId,
			message: args.message,
			status: 'pending',
			attempts: 0,
			scheduledFor,
			createdAt: Date.now(),
		});
	},
});

export const updateQueueStatus = internalMutation({
	args: {
		queueId: v.id('evolutionApiQueue'),
		status: v.union(
			v.literal('pending'),
			v.literal('processing'),
			v.literal('sent'),
			v.literal('failed'),
		),
		errorMessage: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.queueId, {
			status: args.status,
			errorMessage: args.errorMessage,
			lastAttemptAt: Date.now(),
			attempts: (await ctx.db.get(args.queueId))!.attempts + 1,
		});
	},
});

export const processQueuedMessages = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const batchSize = 50;

		// Get pending messages due for sending
		const pendingMessages = await ctx.db
			.query('evolutionApiQueue')
			.withIndex('by_status', (q) => q.eq('status', 'pending'))
			.filter((q) => q.lte(q.field('scheduledFor'), now))
			.take(batchSize);

		let processed = 0;
		const failed = 0;

		for (const msg of pendingMessages) {
			// Check rate limit again inside the batch loop
			// Note: This is a bit expensive inside a loop but necessary to respect strict limits
			// Could optimize by checking count once and decrementing available slots
			const limitStatus = await ctx.db
				.query('rateLimits')
				.withIndex('by_identifier_action', (q) =>
					q.eq('identifier', msg.organizationId).eq('action', 'whatsapp_send'),
				)
				.filter((q) => q.gte(q.field('timestamp'), now - 3_600_000))
				.collect(); // Length check

			if (limitStatus.length < 100) {
				// Schedule the send action
				await ctx.scheduler.runAfter(0, (internal as any).whatsapp.sendWhatsAppMessageFromQueue, {
					queueId: msg._id,
				});

				// Mark as processing
				await ctx.db.patch(msg._id, { status: 'processing', attempts: msg.attempts + 1 });
				processed++;
			} else {
				// Reschedule for later (e.g., +10 mins)
				await ctx.db.patch(msg._id, { scheduledFor: now + 600_000 });
			}
		}

		// Cleanup old rate limit records (> 24h)
		// To avoid table bloat, let's delete some old ones
		// NOTE: Deleting in loop might be slow, limits to small batch?
		// Using a separate cron for cleanup is better usually.
		// Plan said: "Clean up old rate limit records (>24 hours) during queue processing"
		const cutoff = now - 86_400_000;
		const oldLimits = await ctx.db
			.query('rateLimits')
			.withIndex('by_timestamp')
			.filter((q) => q.lt(q.field('timestamp'), cutoff))
			.take(100);

		for (const limit of oldLimits) {
			await ctx.db.delete(limit._id);
		}

		return { processed, failed };
	},
});

/**
 * Clerk User Webhook Handler
 *
 * Handles Clerk user lifecycle events (created, updated, deleted) for Convex sync.
 */

import type { WebhookEvent } from '@clerk/backend';
import { v } from 'convex/values';
import { Webhook } from 'svix';

import { internalMutation } from './_generated/server';

/**
 * Upsert user from Clerk webhook data
 */
export const upsertFromWebhook = internalMutation({
	args: {
		clerkId: v.string(),
		email: v.string(),
		name: v.optional(v.string()),
		avatar: v.optional(v.string()),
		organizationId: v.optional(v.string()),
		role: v.optional(
			v.union(
				v.literal('owner'),
				v.literal('admin'),
				v.literal('manager'),
				v.literal('member'),
				v.literal('sdr'),
				v.literal('cs'),
				v.literal('support'),
			),
		),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
			.unique();

		if (existing) {
			// Update existing user
			await ctx.db.patch(existing._id, {
				email: args.email,
				name: args.name || existing.name,
				avatar: args.avatar || existing.avatar,
				organizationId: args.organizationId || existing.organizationId,
				role: args.role || existing.role,
				updatedAt: Date.now(),
			});
			return existing._id;
		}

		// Create new user with defaults
		const userId = await ctx.db.insert('users', {
			clerkId: args.clerkId,
			email: args.email,
			name: args.name || 'User',
			avatar: args.avatar,
			organizationId: args.organizationId || 'default',
			role: args.role || 'member',
			isActive: true,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		return userId;
	},
});

/**
 * Delete user triggered by Clerk webhook
 */
export const deleteFromWebhook = internalMutation({
	args: {
		clerkId: v.string(),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
			.unique();

		if (existing) {
			// Soft delete - mark as inactive
			await ctx.db.patch(existing._id, {
				isActive: false,
				updatedAt: Date.now(),
			});
		}
	},
});

/**
 * Verify Clerk webhook signature using Svix
 */
export function verifyClerkWebhook(
	payload: string,
	headers: {
		'svix-id'?: string | null;
		'svix-timestamp'?: string | null;
		'svix-signature'?: string | null;
	},
): WebhookEvent | null {
	const secret = process.env.CLERK_WEBHOOK_SECRET;
	if (!secret) {
		// biome-ignore lint/suspicious/noConsole: Logging webhook config error
		console.error('CLERK_WEBHOOK_SECRET not configured');
		return null;
	}

	const svixId = headers['svix-id'];
	const svixTimestamp = headers['svix-timestamp'];
	const svixSignature = headers['svix-signature'];

	if (!(svixId && svixTimestamp && svixSignature)) {
		// biome-ignore lint/suspicious/noConsole: Logging webhook validation error
		console.error('Missing Svix headers');
		return null;
	}

	try {
		const wh = new Webhook(secret);
		return wh.verify(payload, {
			'svix-id': svixId,
			'svix-timestamp': svixTimestamp,
			'svix-signature': svixSignature,
		}) as WebhookEvent;
	} catch (err) {
		// biome-ignore lint/suspicious/noConsole: Logging webhook verification error
		console.error('Webhook verification failed:', err);
		return null;
	}
}

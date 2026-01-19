import { v } from 'convex/values';

import { internal } from '../_generated/api';
import { action, internalMutation } from '../_generated/server';

export const sync = action({
	args: {
		cursor: v.optional(v.string()),
		dryRun: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const clerkSecretKey = process.env.CLERK_SECRET_KEY;
		if (!clerkSecretKey) {
			throw new Error('CLERK_SECRET_KEY is not defined in environment variables');
		}

		const limit = 100;
		const url = new URL('https://api.clerk.com/v1/users');
		url.searchParams.append('limit', limit.toString());
		if (args.cursor) {
			url.searchParams.append('offset', args.cursor);
		}
		const response = await fetch(url.toString(), {
			headers: {
				Authorization: `Bearer ${clerkSecretKey}`,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch users from Clerk: ${response.statusText}`);
		}

		const users = await response.json();

		const stats = {
			total: users.length,
			created: 0,
			updated: 0,
			skipped: 0,
			errors: 0,
		};

		for (const user of users) {
			try {
				const clerkId = user.id;
				const email = user.email_addresses[0]?.email_address;
				const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
				const pictureUrl = user.image_url;
				const organizationId = user.public_metadata?.organization_id || 'default';
				const role = user.public_metadata?.role || 'sdr';

				if (!email) {
					stats.skipped++;
					continue;
				}

				if (args.dryRun) {
					continue;
				}

				// Updated reference to internal.scripts.syncUsers
				const result = await ctx.runMutation((internal as any).scripts.syncUsers.syncUserInternal, {
					clerkId,
					email,
					name,
					pictureUrl,
					organizationId: organizationId as string,
					role: role as any,
				});

				if (result === 'created') stats.created++;
				else if (result === 'updated') stats.updated++;
				else stats.skipped++;
			} catch (_err) {
				stats.errors++;
			}
		}

		return stats;
	},
});

export const syncUserInternal = internalMutation({
	args: {
		clerkId: v.string(),
		email: v.string(),
		name: v.string(),
		pictureUrl: v.optional(v.string()),
		organizationId: v.string(),
		role: v.string(),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
			.unique();

		if (existing) {
			return 'exists';
		}

		await ctx.db.insert('users', {
			clerkId: args.clerkId,
			name: args.name || 'Usuário',
			email: args.email,
			avatar: args.pictureUrl,
			organizationId: args.organizationId,
			role: (['admin', 'sdr', 'cs', 'support'].includes(args.role) ? args.role : 'sdr') as any,
			isActive: true,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		// No activity log here to avoid complexity with performedBy in migration context

		return 'created';
	},
});

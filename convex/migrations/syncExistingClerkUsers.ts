import { v } from 'convex/values';
import { action, internalMutation } from '../_generated/server';
import { internal } from '../_generated/api';

/**
 * Script de migração para sincronizar usuários existentes do Clerk para o Convex
 *
 * Este script busca todos os usuários do Clerk via API e cria registros
 * correspondentes na tabela `users` do Convex para usuários que ainda não existem.
 *
 * SECURITY: Requer CLERK_SECRET_KEY configurado no ambiente do Convex
 *
 * Uso:
 *   bunx convex run migrations/syncExistingClerkUsers:sync --dryRun true
 *   bunx convex run migrations/syncExistingClerkUsers:sync
 */
export const sync = action({
	args: {
		dryRun: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const clerkSecretKey = process.env.CLERK_SECRET_KEY;
		if (!clerkSecretKey) {
			throw new Error('CLERK_SECRET_KEY is not defined in environment variables');
		}

		const limit = 100;
		let offset = 0;
		let hasMore = true;
		let totalFetched = 0;

		const stats = {
			total: 0,
			created: 0,
			alreadyExists: 0,
			errors: 0,
			skipped: 0,
		};

		console.log('Starting migration: Syncing Clerk users to Convex...');

		while (hasMore) {
			const url = new URL('https://api.clerk.com/v1/users');
			url.searchParams.append('limit', limit.toString());
			url.searchParams.append('offset', offset.toString());

			console.log(`Fetching users from Clerk (offset: ${offset})...`);
			const response = await fetch(url.toString(), {
				headers: {
					Authorization: `Bearer ${clerkSecretKey}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Failed to fetch users from Clerk: ${response.status} ${errorText}`);
			}

			const users = await response.json();
			const usersArray = Array.isArray(users) ? users : users.data || [];

			if (usersArray.length === 0) {
				hasMore = false;
				break;
			}

			totalFetched += usersArray.length;
			stats.total += usersArray.length;

			for (const user of usersArray) {
				try {
					const clerkId = user.id;
					const email = user.email_addresses?.[0]?.email_address;
					const firstName = user.first_name || '';
					const lastName = user.last_name || '';
					const name = `${firstName} ${lastName}`.trim() || email || 'Usuário';
					const pictureUrl = user.image_url;

					if (!email) {
						console.warn(`User ${clerkId} has no email, skipping`);
						stats.skipped++;
						continue;
					}

					if (args.dryRun) {
						console.log(`[DRY RUN] Would sync user: ${email} (${clerkId})`);
						continue;
					}

					// Use internal mutation to create user
					// biome-ignore lint/suspicious/noExplicitAny: Type definitions for subdirectories may not be available
					const result = await ctx.runMutation(
						(internal as any).migrations.syncExistingClerkUsers.syncUserInternal,
						{
							clerkId,
							email,
							name,
							pictureUrl,
						},
					);

					if (result === 'created') {
						stats.created++;
						console.log(`✓ Created user: ${email} (${clerkId})`);
					} else if (result === 'exists') {
						stats.alreadyExists++;
						console.log(`- User already exists: ${email} (${clerkId})`);
					}
				} catch (err) {
					console.error(`Error syncing user ${user.id}:`, err);
					stats.errors++;
				}
			}

			// Check if there are more users to fetch
			hasMore = usersArray.length === limit;
			offset += limit;
		}

		console.log('\n=== Migration Summary ===');
		console.log(`Total users fetched from Clerk: ${stats.total}`);
		console.log(`Users created: ${stats.created}`);
		console.log(`Users already exist: ${stats.alreadyExists}`);
		console.log(`Users skipped (no email): ${stats.skipped}`);
		console.log(`Errors: ${stats.errors}`);

		return stats;
	},
});

/**
 * Internal mutation to create a user record
 * Uses same logic as ensureUser but without requiring authentication
 */
export const syncUserInternal = internalMutation({
	args: {
		clerkId: v.string(),
		email: v.string(),
		name: v.string(),
		pictureUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Check if user already exists
		const existing = await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
			.unique();

		if (existing) {
			return 'exists';
		}

		// Determine organizationId - use clerkId as fallback (personal organization)
		const organizationId = args.clerkId; // Default to personal org

		// Default role is 'sdr' as per requirements
		const role = 'sdr';

		const userId = await ctx.db.insert('users', {
			clerkId: args.clerkId,
			name: args.name,
			email: args.email,
			avatar: args.pictureUrl || '',
			organizationId,
			role,
			isActive: true,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		// Log activity (optional, can be skipped if activities table has issues)
		try {
			await ctx.db.insert('activities', {
				type: 'user_created',
				description: `User ${args.name} created via migration script`,
				userId: userId,
				metadata: { externalId: args.clerkId, reason: 'migration' },
				organizationId,
				performedBy: args.clerkId, // Use the user's own clerkId
				createdAt: Date.now(),
			});
		} catch (activityError) {
			// Don't fail migration if activity logging fails
			console.warn('Failed to log activity for user creation:', activityError);
		}

		return 'created';
	},
});

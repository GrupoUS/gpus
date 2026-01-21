import { v } from 'convex/values';

import type { FunctionReference } from 'convex/server';

import { action, internalMutation } from '../_generated/server';

interface InternalMigrationsApi {
	syncExistingClerkUsers: {
		syncUserInternal: FunctionReference<'mutation', 'internal'>;
	};
}

interface InternalApi {
	migrations: InternalMigrationsApi;
}

const getInternalApi = (): InternalApi => {
	const apiModule = require('../_generated/api') as unknown;
	return (apiModule as { internal: InternalApi }).internal;
};

const internalMigrations = getInternalApi().migrations;

type ClerkUser = {
	id: string;
	email_addresses?: Array<{ email_address?: string }>;
	first_name?: string;
	last_name?: string;
	image_url?: string;
};

type ClerkUserPage = ClerkUser[] | { data?: ClerkUser[] };

type SyncStats = {
	total: number;
	created: number;
	alreadyExists: number;
	errors: number;
	skipped: number;
};

const buildClerkUsersUrl = (limit: number, offset: number): URL => {
	const url = new URL('https://api.clerk.com/v1/users');
	url.searchParams.append('limit', limit.toString());
	url.searchParams.append('offset', offset.toString());
	return url;
};

const getUsersArray = (payload: ClerkUserPage): ClerkUser[] =>
	Array.isArray(payload) ? payload : payload.data || [];

const normalizeClerkUser = (user: ClerkUser) => {
	const email = user.email_addresses?.[0]?.email_address;
	if (!email) return null;

	const firstName = user.first_name || '';
	const lastName = user.last_name || '';
	const name = `${firstName} ${lastName}`.trim() || email || 'Usuário';

	return {
		clerkId: user.id,
		email,
		name,
		pictureUrl: user.image_url,
	};
};

const updateStatsFromResult = (stats: SyncStats, result: 'created' | 'exists') => {
	if (result === 'created') {
		stats.created++;
	} else if (result === 'exists') {
		stats.alreadyExists++;
	}
};

const fetchClerkUsersPage = async (
	limit: number,
	offset: number,
	clerkSecretKey: string,
): Promise<ClerkUser[]> => {
	const url = buildClerkUsersUrl(limit, offset);
	const response = await fetch(url.toString(), {
		headers: {
			authorization: `Bearer ${clerkSecretKey}`,
			'Content-Type': 'application/json',
		},
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to fetch users from Clerk: ${response.status} ${errorText}`);
	}

	const payload = (await response.json()) as ClerkUserPage;
	return getUsersArray(payload);
};

const syncClerkUser = async (
	ctx: Parameters<typeof action>[0],
	user: ClerkUser,
	dryRun: boolean,
	stats: SyncStats,
): Promise<void> => {
	const normalized = normalizeClerkUser(user);
	if (!normalized) {
		stats.skipped++;
		return;
	}

	if (dryRun) return;

	const result: 'created' | 'exists' = await ctx.runMutation(
		internalMigrations.syncExistingClerkUsers.syncUserInternal,
		normalized,
	);

	updateStatsFromResult(stats, result);
};

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

		const stats = {
			total: 0,
			created: 0,
			alreadyExists: 0,
			errors: 0,
			skipped: 0,
		};

		while (hasMore) {
			const usersArray = await fetchClerkUsersPage(limit, offset, clerkSecretKey);
			if (usersArray.length === 0) {
				hasMore = false;
				break;
			}

			stats.total += usersArray.length;

			for (const user of usersArray) {
				try {
					await syncClerkUser(ctx, user, args.dryRun ?? false, stats);
				} catch (_err) {
					stats.errors++;
				}
			}

			hasMore = usersArray.length === limit;
			offset += limit;
		}

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
				userId,
				metadata: { externalId: args.clerkId, reason: 'migration' },
				organizationId,
				performedBy: args.clerkId, // Use the user's own clerkId
				createdAt: Date.now(),
			});
		} catch (_activityError) {
			// Ignore activity logging failures for migration.
		}

		return 'created';
	},
});

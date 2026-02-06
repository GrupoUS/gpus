import { v } from 'convex/values';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const internal = require('./_generated/api').internal;

import { mutation } from './_generated/server';
import { requireAuth } from './lib/auth';

/**
 * Temporary public mutation to trigger student organizationId migration
 * This calls internal.migrations.migrateStudentOrganizationId
 */
export const triggerStudentMigration = mutation({
	args: { limit: v.optional(v.number()) },
	handler: async (
		ctx,
		args,
	): Promise<{
		processed: number;
		updated: number;
		remaining: number;
	}> => {
		// Only authenticated users can execute migration
		await requireAuth(ctx);

		// Call internal mutation
		const result = await ctx.runMutation(internal.migrations.migrateStudentOrganizationId, args);

		return result;
	},
});

/**
 * Temporary public mutation to trigger backfill of CPF hashes for blind indexing
 */
export const triggerBackfillCpfHash = mutation({
	args: { limit: v.optional(v.number()) },
	handler: async (
		ctx,
		args,
	): Promise<{
		processed: number;
		updated: number;
		remaining: number;
	}> => {
		await requireAuth(ctx);

		const result = await ctx.runMutation(internal.migrations.backfillCpfHash, args);

		return result;
	},
});

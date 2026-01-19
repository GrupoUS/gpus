import { v } from 'convex/values';

import { internalMutation } from '../_generated/server';

/**
 * Migration: Update Roles
 *
 * Maps legacy roles to new roles if needed, or ensures all users have valid roles.
 *
 * Mapping:
 * - sdr -> member (with sales permissions via other means? or keep sdr as legacy)
 * - cs -> manager (?)
 * - support -> member
 *
 * Actually, the plan says:
 * "Map old roles to new roles (sdr -> member, cs -> manager, support -> member)"
 */
export const run = internalMutation({
	args: {
		dryRun: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const users = await ctx.db.query('users').collect();
		const updates = [];

		for (const user of users) {
			let newRole = user.role;
			if (user.role === 'sdr') newRole = 'member';
			else if (user.role === 'cs') newRole = 'manager';
			else if (user.role === 'support') newRole = 'member';

			if (newRole !== user.role) {
				updates.push({ id: user._id, old: user.role, new: newRole });
				if (!args.dryRun) {
					// We can keep specific permissions if model allows, but here we just map role
					await ctx.db.patch(user._id, { role: newRole as any });
				}
			}
		}

		return {
			total: users.length,
			updated: updates.length,
			updates,
		};
	},
});

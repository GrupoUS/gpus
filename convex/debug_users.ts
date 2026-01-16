import { internalMutation } from './_generated/server';

export const listAll = internalMutation({
	args: {},
	handler: async (ctx) => {
		const users = await ctx.db.query('users').take(20);
		return users.map((u) => ({
			id: u._id,
			name: u.name,
			email: u.email,
			role: u.role,
			clerkId: u.clerkId,
		}));
	},
});

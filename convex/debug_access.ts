import { internalMutation } from './_generated/server';

export const listUnauthorized = internalMutation({
	args: {},
	handler: async (ctx) => {
		// List recent security events (last 10)
		const events = await ctx.db
			.query('lgpdAudit')
			.withIndex('by_action_type', (q) => q.eq('actionType', 'security_event'))
			.order('desc')
			.take(20);

		return events.map((e) => ({
			actorId: e.actorId,
			description: e.description,
			time: new Date(e.createdAt).toISOString(),
		}));
	},
});

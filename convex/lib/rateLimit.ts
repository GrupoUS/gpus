import { v } from 'convex/values';

import { internalMutation, internalQuery } from './../_generated/server';

// Rate limit configuration
const RATE_LIMITS = {
	submit_form: { max: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
};

export const checkRateLimit = internalQuery({
	args: {
		identifier: v.string(), // IP or User ID
		action: v.string(),
	},
	handler: async (ctx, args) => {
		const limitParams = RATE_LIMITS[args.action as keyof typeof RATE_LIMITS];
		if (!limitParams) return { allowed: true };

		const now = Date.now();
		const windowStart = now - limitParams.windowMs;

		// Count attempts in the window
		const attempts = await ctx.db
			.query('rateLimits')
			.withIndex('by_identifier_action', (q) =>
				q.eq('identifier', args.identifier).eq('action', args.action),
			)
			.filter((q) => q.gte(q.field('timestamp'), windowStart))
			.collect();

		if (attempts.length >= limitParams.max) {
			return {
				allowed: false,
				retryAfter: windowStart + limitParams.windowMs - now,
			};
		}

		return { allowed: true };
	},
});

export const reportRateLimit = internalMutation({
	args: {
		identifier: v.string(),
		action: v.string(),
	},
	handler: async (ctx, args) => {
		// Cleanup old entries periodically could be done here or via cron
		// For now, just insert
		await ctx.db.insert('rateLimits', {
			identifier: args.identifier,
			action: args.action,
			timestamp: Date.now(),
		});
	},
});

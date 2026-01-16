import { internalMutation } from '../_generated/server';
import { v } from 'convex/values';

export const logApiUsage = internalMutation({
	args: {
		endpoint: v.string(),
		method: v.string(),
		statusCode: v.number(),
		responseTime: v.number(),
		userId: v.optional(v.string()),
		errorMessage: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		await ctx.db.insert('asaasApiAudit', {
			...args,
			timestamp: Date.now(),
		});
	},
});

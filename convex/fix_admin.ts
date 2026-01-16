import { internalMutation } from './_generated/server';
import { v } from 'convex/values';

import { logSecurityEvent } from './lib/auditLogging';

export const addAdmin = internalMutation({
	args: {
		clerkId: v.string(),
		email: v.string(),
		name: v.string(),
	},
	returns: v.string(),
	handler: async (ctx, args) => {
		if (process.env.ADMIN_BOOTSTRAP_ENABLED !== 'true') {
			throw new Error('Operação desabilitada. Defina ADMIN_BOOTSTRAP_ENABLED=true para habilitar.');
		}

		const existing = await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
			.unique();

		const message = existing
			? `User ${existing.email} updated to admin`
			: `User ${args.email} created as admin`;

		if (existing) {
			await ctx.db.patch(existing._id, {
				role: 'admin',
				isActive: true,
				updatedAt: Date.now(),
			});
		} else {
			await ctx.db.insert('users', {
				clerkId: args.clerkId,
				email: args.email,
				name: args.name,
				role: 'admin',
				isActive: true,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		}

		// Log security event - handle unauthenticated context for bootstrap
		try {
			await logSecurityEvent(
				ctx,
				'suspicious_activity',
				`Admin role granted via internal fix_admin.addAdmin for ${args.clerkId}`,
				'critical',
				[args.clerkId],
			);
		} catch (error) {
			// If audit logging fails (e.g., unauthenticated context), log to console but don't fail
			console.warn('Audit logging failed for admin bootstrap:', error);
		}

		return message;
	},
});

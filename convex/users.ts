import { createClerkClient } from '@clerk/backend';
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';

import { internal } from './_generated/api';
import { action, internalMutation, internalQuery, mutation, query } from './_generated/server';
import { createAuditLog } from './lib/auditLogging';
import { getOrganizationId, requireAuth, requirePermission } from './lib/auth';
import { PERMISSIONS } from './lib/permissions';

const clerkClient = createClerkClient({
	secretKey: process.env.CLERK_SECRET_KEY,
	publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
});

/**
 * Get current user from Clerk auth
 */
export const current = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		return await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
			.unique();
	},
});

/**
 * List all users in organization
 * SECURITY: Requires authentication
 */
export const list = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];

		const organizationId = await getOrganizationId(ctx);
		if (!organizationId) return [];

		return await ctx.db
			.query('users')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
			.collect();
	},
});

/**
 * List CS (Customer Success) users for dropdowns
 * SECURITY: Requires authentication but NOT admin role
 * Returns minimal data (LGPD compliance): only _id, name, email
 */
export const listCSUsers = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];

		const organizationId = await getOrganizationId(ctx);
		if (!organizationId) return [];

		// Use index for role lookup, then filter isActive in memory
		const csUsers = await ctx.db
			.query('users')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
			.collect();

		// Filter by role and activity in memory
		const activeCSUsers = csUsers.filter((u) => u.role === 'cs' && u.isActive);

		// Return minimal data for LGPD compliance
		return activeCSUsers.map((user) => ({
			// biome-ignore lint/style/useNamingConvention: Convex convention uses _id
			_id: user._id,
			name: user.name,
			email: user.email,
		}));
	},
});

/**
 * Ensure user exists in Convex (sync from Clerk)
 * SECURITY: Requires authentication
 */
export const ensureUser = mutation({
	args: {},
	handler: async (ctx) => {
		try {
			const identity = await requireAuth(ctx);

			// Check if user already exists
			const existing = await ctx.db
				.query('users')
				.withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
				.unique();

			if (existing) {
				return existing._id;
			}

			// Create new user
			const organizationId = (await getOrganizationId(ctx)) || 'default';

			// Default role 'sdr' unless specified in org permissions (logic can be enhanced)
			// For now, we respect the requirement: role standard 'sdr'
			const role = 'sdr';

			const userId = await ctx.db.insert('users', {
				clerkId: identity.subject,
				name: identity.name || 'Usuario',
				email: identity.email || '',
				avatar: identity.pictureUrl || '',
				organizationId,
				role,
				isActive: true,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});

			// Log activity
			try {
				await ctx.db.insert('activities', {
					type: 'user_created',
					description: `User ${identity.name || 'Usuario'} created automatically via sync`,
					userId,
					metadata: { externalId: identity.subject },
					organizationId,
					performedBy: identity.subject,
					createdAt: Date.now(),
				});
			} catch (_activityError) {
				// Activity logging failure should not block user creation
			}

			return userId;
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`ensureUser failed: ${errorMessage}`);
		}
	},
});

/**
 * Create or sync user from Clerk identity
 */
export const syncUser = internalMutation({
	args: {
		clerkId: v.string(),
		email: v.string(),
		name: v.optional(v.string()),
		pictureUrl: v.optional(v.string()),
		organizationId: v.optional(v.string()),
		role: v.optional(
			v.union(v.literal('admin'), v.literal('sdr'), v.literal('cs'), v.literal('support')),
		),
	},
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex auth logic required here
	handler: async (ctx, args) => {
		// Additional security: Ensure this is only used for legitimate user sync operations
		// This prevents abuse of the internal mutation for creating unauthorized admin users
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Internal operation requires authentication');
		}

		const existing = await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
			.unique();

		if (existing) {
			// Only allow role changes for existing users if the caller has appropriate permissions
			if (args.role && args.role !== existing.role) {
				const caller = await ctx.db
					.query('users')
					.withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
					.unique();

				if (!caller || caller.role !== 'admin') {
					throw new Error('Only admins can change user roles');
				}
			}

			await ctx.db.patch(existing._id, {
				name: args.name || existing.name,
				email: args.email,
				avatar: args.pictureUrl || existing.avatar,
				// Only update org if provided
				...(args.organizationId ? { organizationId: args.organizationId } : {}),
				...(args.role ? { role: args.role } : {}),
			});
			return existing._id;
		}

		// For new users, enforce stricter validation
		if (args.role === 'admin') {
			const caller = await ctx.db
				.query('users')
				.withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
				.unique();

			if (!caller || caller.role !== 'admin') {
				throw new Error('Only admins can create admin users');
			}
		}

		return await ctx.db.insert('users', {
			clerkId: args.clerkId,
			name: args.name || 'Usuario',
			email: args.email,
			avatar: args.pictureUrl,
			organizationId: args.organizationId || 'default',
			role: args.role || 'sdr',
			isActive: true,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

export const updateUser = mutation({
	args: {
		userId: v.id('users'),
		patch: v.object({
			name: v.optional(v.string()),
			role: v.optional(
				v.union(v.literal('admin'), v.literal('sdr'), v.literal('cs'), v.literal('support')),
			),
			isActive: v.optional(v.boolean()),
		}),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error('Unauthenticated');

		const user = await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
			.unique();

		if (!user || user.role !== 'admin') {
			throw new Error('Only admins can update users');
		}

		await ctx.db.patch(args.userId, {
			...args.patch,
			updatedAt: Date.now(),
		});
	},
});

export const deleteUser = mutation({
	args: { userId: v.id('users') },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error('Unauthenticated');

		const user = await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
			.unique();

		if (!user || user.role !== 'admin') {
			throw new Error('Only admins can delete users');
		}

		// Soft delete
		await ctx.db.patch(args.userId, {
			isActive: false,
			updatedAt: Date.now(),
		});
	},
});

// Update own profile
export const updateProfile = mutation({
	args: {
		name: v.optional(v.string()),
		avatar: v.optional(v.string()),
		email: v.optional(v.string()), // Usually managed by Clerk, but good to have sync
		preferences: v.optional(v.any()), // JSON object for notifications, etc.
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error('Unauthenticated');

		const user = await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
			.unique();

		if (!user) {
			throw new Error('User not found');
		}

		await ctx.db.patch(user._id, {
			...(args.name ? { name: args.name } : {}),
			...(args.avatar ? { avatar: args.avatar } : {}),
			...(args.email ? { email: args.email } : {}),
			...(args.preferences ? { preferences: args.preferences } : {}),
			updatedAt: Date.now(),
		});
	},
});

/**
 * Diagnostic query to check synchronization between Clerk and database roles.
 * SECURITY: Admin only.
 * Returns users with their DB roles and the caller's JWT role/permissions.
 */
export const checkRoleSync = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error('Unauthenticated');

		const user = await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
			.unique();

		if (!user || user.role !== 'admin') {
			throw new Error('Only admins can access diagnostic role sync data');
		}

		const organizationId = await getOrganizationId(ctx);
		if (!organizationId) throw new Error('No organization context found');

		const users = await ctx.db
			.query('users')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
			.collect();

		return {
			users: users.map((u) => ({
				clerkId: u.clerkId,
				dbRole: u.role,
			})),
			currentUser: {
				clerkId: identity.subject,
				orgRole: identity.org_role,
				orgPermissions: identity.org_permissions,
			},
		};
	},
});

/**
 * Internal Audit Logger for Actions
 */
export const internalLogAudit = internalMutation({
	args: {
		actionType: v.string(),
		description: v.string(),
		dataCategory: v.string(),
		metadata: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		await createAuditLog(ctx, {
			// biome-ignore lint/suspicious/noExplicitAny: actionType from string arg doesn't match strict union
			actionType: args.actionType as any,
			description: args.description,
			dataCategory: args.dataCategory,
			metadata: args.metadata,
		});
	},
});

/**
 * Get Caller Role for Actions (Security Check)
 */
export const getCallerData = internalQuery({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;
		return await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
			.unique();
	},
});

/**
 * Invite User (Action)
 */
export const inviteTeamMember = action({
	args: {
		email: v.string(),
		role: v.string(),
		redirectUrl: v.string(),
	},
	handler: async (ctx, args) => {
		// Security Check
		const identity = await requirePermission(ctx, PERMISSIONS.TEAM_MANAGE);

		// Additional check for role assignment safety (only admins/owners can assign admin/manager?)
		// Basic requirement is TEAM_MANAGE.

		try {
			const invitation = await clerkClient.invitations.createInvitation({
				emailAddress: args.email,
				redirectUrl: args.redirectUrl,
				publicMetadata: { role: args.role },
			});

			// Create pending user record for team visibility
			// We need organizationId. Actions don't have direct access to `getOrganizationId` helper easily without `ctx.runQuery`.
			// But `requirePermission` returns identity which has `org_id`.
			const organizationId = identity.org_id || identity.subject; // Fallback to personal org

			await ctx.runMutation(internal.users.createPendingUser, {
				email: args.email,
				role: args.role,
				invitedAt: Date.now(),
				organizationId,
			});

			await ctx.runMutation(internal.users.internalLogAudit, {
				actionType: 'data_creation',
				description: `Invited user ${args.email} as ${args.role}`,
				dataCategory: 'identificacao',
				metadata: { email: args.email, role: args.role, invitedBy: identity.subject },
			});

			return invitation;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to invite user';
			throw new Error(message);
		}
	},
});

/**
 * Internal mutation to create pending user
 */
export const createPendingUser = internalMutation({
	args: {
		email: v.string(),
		role: v.string(),
		invitedAt: v.number(),
		organizationId: v.string(),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query('users')
			.withIndex('by_email', (q) => q.eq('email', args.email))
			.unique();
		if (existing) {
			// If existing user, maybe update role? For now, do nothing if already exists.
			if (existing.inviteStatus === 'pending') {
				await ctx.db.patch(existing._id, {
					// biome-ignore lint/suspicious/noExplicitAny: role string arg doesn't match strict union
					role: args.role as any,
					invitedAt: args.invitedAt,
					updatedAt: Date.now(),
				});
			}
			return;
		}

		await ctx.db.insert('users', {
			clerkId: `pending_${crypto.randomUUID()}`, // Placeholder ID
			email: args.email,
			name: args.email.split('@')[0], // Placeholder name
			// biome-ignore lint/suspicious/noExplicitAny: role string arg doesn't match strict union
			role: args.role as any,
			organizationId: args.organizationId,
			isActive: false, // Pending
			inviteStatus: 'pending',
			invitedAt: args.invitedAt,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

/**
 * Update Team Member Role (Action)
 */
export const updateTeamMemberRole = action({
	args: {
		userId: v.string(), // Clerk User ID
		newRole: v.string(),
		reason: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Security check
		const identity = await requirePermission(ctx, PERMISSIONS.TEAM_MANAGE);

		// Validate role
		const ALLOWED_ROLES = ['admin', 'manager', 'member'];
		if (!ALLOWED_ROLES.includes(args.newRole)) {
			throw new Error(`Invalid role. Allowed: ${ALLOWED_ROLES.join(', ')}`);
		}

		if (args.userId === identity.subject) {
			throw new Error('Cannot update your own role');
		}

		// Safety: Check target user role before update (prevent modifying OWNER)
		const targetUser = await ctx.runQuery(internal.users.getUserByClerkIdInternal, {
			clerkId: args.userId,
		});

		if (targetUser && targetUser.role === 'owner') {
			throw new Error('Cannot modify the Owner role.');
		}

		try {
			await clerkClient.users.updateUserMetadata(args.userId, {
				publicMetadata: { role: args.newRole },
			});

			await ctx.runMutation(internal.users.syncUserRole, {
				clerkId: args.userId,
				role: args.newRole,
			});

			await ctx.runMutation(internal.users.internalLogAudit, {
				actionType: 'data_modification',
				description: `Updated role for ${args.userId} to ${args.newRole}`,
				dataCategory: 'identificacao',
				metadata: {
					userId: args.userId,
					previous_value: targetUser?.role || 'unknown',
					new_value: args.newRole,
					reason: args.reason,
					ip_address: 'client_action', // Placeholder as we don't have IP here easily
				},
			});

			return { success: true };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to update role';
			throw new Error(message);
		}
	},
});

/**
 * Remove Team Member (Action)
 */
export const removeTeamMember = action({
	args: {
		userId: v.string(), // Clerk User ID
		reason: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await requirePermission(ctx, PERMISSIONS.TEAM_MANAGE);

		if (args.userId === identity.subject) {
			throw new Error('Cannot remove yourself');
		}

		const targetUser = await ctx.runQuery(internal.users.getUserByClerkIdInternal, {
			clerkId: args.userId,
		});

		if (targetUser && targetUser.role === 'owner') {
			throw new Error('Cannot remove the Owner.');
		}

		try {
			await clerkClient.users.updateUserMetadata(args.userId, {
				publicMetadata: { isActive: false },
			});

			await ctx.runMutation(internal.users.softDeleteUserByClerkId, { clerkId: args.userId });

			await ctx.runMutation(internal.users.internalLogAudit, {
				actionType: 'data_deletion',
				description: `Removed user ${args.userId}`,
				dataCategory: 'identificacao',
				metadata: {
					userId: args.userId,
					reason: args.reason,
					previous_value: 'active',
					new_value: 'inactive',
					ip_address: 'client_action',
				},
			});

			return { success: true };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to remove user';
			throw new Error(message);
		}
	},
});

/**
 * Internal Mutation to Sync Role by Clerk ID
 */
export const syncUserRole = internalMutation({
	args: { clerkId: v.string(), role: v.string() },
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
			.unique();
		if (user) {
			// biome-ignore lint/suspicious/noExplicitAny: role string arg doesn't match strict union
			await ctx.db.patch(user._id, { role: args.role as any });
		}
	},
});

/**
 * Internal Mutation to Soft Delete by Clerk ID
 */
export const softDeleteUserByClerkId = internalMutation({
	args: { clerkId: v.string() },
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
			.unique();
		if (user) {
			await ctx.db.patch(user._id, { isActive: false, updatedAt: Date.now() });
		}
	},
});

/**
 * Search Team Members (Query)
 */
export const searchTeamMembers = query({
	args: {
		query: v.optional(v.string()),
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		// Security Check
		await requirePermission(ctx, PERMISSIONS.TEAM_READ);
		const identity = await requireAuth(ctx);
		const organizationId = identity.org_id || identity.subject;

		// Search Logic with Index
		if (args.query) {
			const searchQuery = args.query;
			return await ctx.db
				.query('users')
				.withSearchIndex('search_name', (q) =>
					q.search('name', searchQuery).eq('organizationId', organizationId),
				)
				.paginate(args.paginationOpts);
		}

		// Default Listing
		return await ctx.db
			.query('users')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
			.paginate(args.paginationOpts);
	},
});

/**
 * Internal Query to get user by Clerk ID
 */
export const getUserByClerkIdInternal = internalQuery({
	args: { clerkId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
			.unique();
	},
});

export const listVendors = query({
	// SECURITY: No organizationId argument - always scope to caller's organization
	// to prevent cross-organization vendor enumeration
	args: {},
	returns: v.array(
		v.object({
			id: v.id('users'),
			name: v.string(),
			email: v.string(),
			role: v.string(),
		}),
	),
	handler: async (ctx) => {
		// Auth check
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];

		// SECURITY: Always use caller's organization from auth context
		const orgId = await getOrganizationId(ctx);
		if (!orgId) return [];

		// Get current user to check role
		const currentUser = await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
			.unique();

		// Only managers/admins/owners can see vendor list to filter
		if (!(currentUser && ['manager', 'admin', 'owner'].includes(currentUser.role))) {
			return [];
		}

		// Get all active users scoped to the caller's organization
		const users = await ctx.db
			.query('users')
			.withIndex('by_organization', (q) => q.eq('organizationId', orgId))
			.collect();

		// Filter for vendor roles only (member, sdr) - exclude management roles from dropdown
		return users
			.filter((u) => u.isActive && ['member', 'sdr'].includes(u.role))
			.map((u) => ({
				id: u._id,
				name: u.name,
				email: u.email,
				role: u.role,
			}));
	},
});

/**
 * TEMPORARY: Fix specific SDR users who can't access CRM
 * Run via: bunx convex run users:fixSdrUsers
 * DELETE after fixing users
 */
export const fixSdrUsers = internalMutation({
	args: {},
	handler: async (ctx) => {
		const clerkIds = [
			'user_38J04ndpzs8cDCEx0prhmXgfKdG', // Lucas
			'user_39FYiwwX6W5JUWWQSb0CLXAxscX', // Erica
		];

		const results: { clerkId: string; status: string; details?: unknown }[] = [];

		for (const clerkId of clerkIds) {
			const user = await ctx.db
				.query('users')
				.withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkId))
				.unique();

			if (!user) {
				results.push({ clerkId, status: 'NOT_FOUND' });
				continue;
			}

			// Fix: ensure role is 'sdr' and user is active
			await ctx.db.patch(user._id, {
				role: 'sdr',
				isActive: true,
				updatedAt: Date.now(),
			});

			results.push({
				clerkId,
				status: 'FIXED',
				details: {
					name: user.name,
					previousRole: user.role,
					previousIsActive: user.isActive,
					organizationId: user.organizationId,
				},
			});
		}

		return results;
	},
});

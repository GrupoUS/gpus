import { v } from 'convex/values'
import { action, internalMutation, mutation, query, internalQuery } from './_generated/server'
import { internal } from './_generated/api'
import { createClerkClient } from '@clerk/backend'
import { createAuditLog } from './lib/auditLogging'
import { getOrganizationId, requireAuth } from './lib/auth'

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
})

/**
 * Get current user from Clerk auth
 */
export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    return await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
  },
})

/**
 * List all users in organization
 * SECURITY: Requires authentication
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const organizationId = await getOrganizationId(ctx)
    if (!organizationId) return []

    return await ctx.db
      .query('users')
      .withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
      .collect()
  },
})

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
      .collect()

    // Filter by role and activity in memory
    const activeCSUsers = csUsers.filter(u => u.role === 'cs' && u.isActive)

    // Return minimal data for LGPD compliance
    return activeCSUsers.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
    }))
  },
})

/**
 * Ensure user exists in Convex (sync from Clerk)
 * SECURITY: Requires authentication
 */
export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
        try {
            const identity = await requireAuth(ctx)

        // Check if user already exists

        const existing = await ctx.db
          .query('users')
          .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
          .unique()

        if (existing) {
          return existing._id
        }

        // Create new user
        const organizationId = await getOrganizationId(ctx) || 'default'


        // Default role 'sdr' unless specified in org permissions (logic can be enhanced)
        // For now, we respect the requirement: role standard 'sdr'
        const role = 'sdr'

        const userId = await ctx.db.insert('users', {
          clerkId: identity.subject,
          name: identity.name || 'Usuário',
          email: identity.email || '',
          avatar: identity.pictureUrl || '',
          organizationId,
          role,
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        // Log activity
        try {

          await ctx.db.insert('activities', {
            type: 'user_created',
            description: `User ${identity.name || 'Usuário'} created automatically via sync`,
            userId: userId,
            metadata: { externalId: identity.subject },
            organizationId,
            performedBy: identity.subject,
            createdAt: Date.now(),
          })
        } catch (activityError) {
          // Log activity creation error but don't fail the user creation
          console.error('Failed to log user creation activity:', activityError)
        }

        return userId
    } catch (error: any) {
        console.error("ensureUser: Failed", error.message || error)
        console.error("ensureUser: Stack", error.stack)
        throw error
    }


  },
})

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
    role: v.optional(v.union(v.literal('admin'), v.literal('sdr'), v.literal('cs'), v.literal('support'))),
  },
  handler: async (ctx, args) => {
    // Additional security: Ensure this is only used for legitimate user sync operations
    // This prevents abuse of the internal mutation for creating unauthorized admin users
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Internal operation requires authentication')
    }

    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique()

    if (existing) {
      // Only allow role changes for existing users if the caller has appropriate permissions
      if (args.role && args.role !== existing.role) {
        const caller = await ctx.db
          .query('users')
          .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
          .unique()

        if (!caller || caller.role !== 'admin') {
          throw new Error('Only admins can change user roles')
        }
      }

      await ctx.db.patch(existing._id, {
        name: args.name || existing.name,
        email: args.email,
        avatar: args.pictureUrl || existing.avatar,
        // Only update org if provided
        ...(args.organizationId ? { organizationId: args.organizationId } : {}),
        ...(args.role ? { role: args.role } : {}),
      })
      return existing._id
    }

    // For new users, enforce stricter validation
    if (args.role === 'admin') {
      const caller = await ctx.db
        .query('users')
        .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
        .unique()

      if (!caller || caller.role !== 'admin') {
        throw new Error('Only admins can create admin users')
      }
    }

    return await ctx.db.insert('users', {
      clerkId: args.clerkId,
      name: args.name || 'Usuário',
      email: args.email,
      avatar: args.pictureUrl,
      organizationId: args.organizationId || 'default',
      role: args.role || 'sdr',
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
})

export const updateUser = mutation({
  args: {
    userId: v.id('users'),
    patch: v.object({
      name: v.optional(v.string()),
      role: v.optional(v.union(v.literal('admin'), v.literal('sdr'), v.literal('cs'), v.literal('support'))),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can update users')
    }

    await ctx.db.patch(args.userId, {
      ...args.patch,
      updatedAt: Date.now(),
    })
  },
})

export const deleteUser = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can delete users')
    }

    // Soft delete
    await ctx.db.patch(args.userId, {
      isActive: false,
      updatedAt: Date.now(),
    })
  },
})

// Update own profile
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    email: v.optional(v.string()), // Usually managed by Clerk, but good to have sync
    preferences: v.optional(v.any()), // JSON object for notifications, etc.
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user) {
      throw new Error('User not found')
    }

    await ctx.db.patch(user._id, {
      ...(args.name ? { name: args.name } : {}),
      ...(args.avatar ? { avatar: args.avatar } : {}),
      ...(args.email ? { email: args.email } : {}),
      ...(args.preferences ? { preferences: args.preferences } : {}),
      updatedAt: Date.now(),
    })
  },
})

/**
 * Diagnostic query to check synchronization between Clerk and database roles.
 * SECURITY: Admin only.
 * Returns users with their DB roles and the caller's JWT role/permissions.
 */
export const checkRoleSync = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can access diagnostic role sync data')
    }

    const organizationId = await getOrganizationId(ctx)
    if (!organizationId) throw new Error('No organization context found')

    const users = await ctx.db
      .query('users')
      .withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
      .collect()

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
    }
  },
})

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
      actionType: args.actionType as any,
      description: args.description,
      dataCategory: args.dataCategory,
      metadata: args.metadata,
    })
  }
})

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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const caller = await ctx.runQuery((internal as any).users.getCallerData);
    if (!caller || (caller.role !== 'admin' && caller.role !== 'owner')) {
       throw new Error("Only admins can invite members");
    }

    try {
      const invitation = await clerkClient.invitations.createInvitation({
        emailAddress: args.email,
        redirectUrl: args.redirectUrl,
        publicMetadata: { role: args.role },
      });

      await ctx.runMutation(internal.users.internalLogAudit, {
        actionType: 'data_creation',
        description: `Invited user ${args.email} as ${args.role}`,
        dataCategory: 'identificação',
        metadata: { email: args.email, role: args.role, invitedBy: caller._id },
      });

      return invitation;
    } catch (error: any) {
      console.error("Invite Error", error);
      throw new Error(error.message || "Failed to invite user");
    }
  },
});

/**
 * Update Team Member Role (Action)
 */
export const updateTeamMemberRole = action({
  args: {
    userId: v.string(), // Clerk User ID
    newRole: v.string(),
    reason: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const caller = await ctx.runQuery(internal.users.getCallerData as any);
    if (!caller || (caller.role !== 'admin' && caller.role !== 'owner')) {
      throw new Error("Only admins can update roles");
    }

    if (args.userId === identity.subject) {
        throw new Error("Cannot update your own role");
    }

    try {
       await clerkClient.users.updateUserMetadata(args.userId, {
         publicMetadata: { role: args.newRole },
       });

       await ctx.runMutation(internal.users.syncUserRole, { clerkId: args.userId, role: args.newRole });

       await ctx.runMutation(internal.users.internalLogAudit, {
          actionType: 'data_modification',
          description: `Updated role for ${args.userId} to ${args.newRole}: ${args.reason || 'No reason'}`,
          dataCategory: 'identificação',
          metadata: { userId: args.userId, newRole: args.newRole, reason: args.reason },
       });

       return { success: true };
    } catch (error: any) {
       console.error("Update Role Error", error);
       throw new Error(error.message || "Failed to update role");
    }
  }
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const caller = await ctx.runQuery(internal.users.getCallerData as any);
    if (!caller || (caller.role !== 'admin' && caller.role !== 'owner')) {
      throw new Error("Only admins can remove members");
    }

    if (args.userId === identity.subject) {
        throw new Error("Cannot remove yourself");
    }

    try {
        await clerkClient.users.updateUserMetadata(args.userId, {
          publicMetadata: { isActive: false },
        });

        await ctx.runMutation(internal.users.softDeleteUserByClerkId, { clerkId: args.userId });

        await ctx.runMutation(internal.users.internalLogAudit, {
            actionType: 'data_deletion',
            description: `Removed user ${args.userId}. Reason: ${args.reason}`,
            dataCategory: 'identificação',
            metadata: { userId: args.userId, reason: args.reason },
        });

        return { success: true };
    } catch(error: any) {
        console.error("Remove Error", error);
        throw new Error(error.message || "Failed to remove user");
    }
  }
});

/**
 * Internal Mutation to Sync Role by Clerk ID
 */
export const syncUserRole = internalMutation({
    args: { clerkId: v.string(), role: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db.query('users').withIndex('by_clerk_id', q => q.eq('clerkId', args.clerkId)).unique();
        if (user) {
            await ctx.db.patch(user._id, { role: args.role as any });
        }
    }
});

/**
 * Internal Mutation to Soft Delete by Clerk ID
 */
export const softDeleteUserByClerkId = internalMutation({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db.query('users').withIndex('by_clerk_id', q => q.eq('clerkId', args.clerkId)).unique();
        if (user) {
            await ctx.db.patch(user._id, { isActive: false, updatedAt: Date.now() });
        }
    }
});

/**
 * Search Team Members (Query)
 */
export const searchTeamMembers = query({
  args: {
    query: v.optional(v.string()),
    paginationOpts: v.any(),
  },
  handler: async (ctx, args) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return { page: [], isDone: true, continueCursor: '' };

      let q: any = ctx.db.query('users');

      const organizationId = await getOrganizationId(ctx);
      if (organizationId) {
         q = q.withIndex('by_organization', (qi: any) => qi.eq('organizationId', organizationId));
      }

      // Basic pagination
      const result = await q.paginate(args.paginationOpts);

      // In-memory filter if query exists
      if (args.query && result.page.length > 0) {
          const lowerQ = args.query.toLowerCase();
          result.page = result.page.filter((u: any) =>
             (u.name && u.name.toLowerCase().includes(lowerQ)) ||
             (u.email && u.email.toLowerCase().includes(lowerQ))
          );
      }

      return result;
  }
});

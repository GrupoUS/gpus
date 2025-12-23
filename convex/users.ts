import { v } from 'convex/values'
import { internalMutation, mutation, query } from './_generated/server'
import { getOrganizationId, requireAuth } from './lib/auth'

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

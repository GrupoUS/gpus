import { v } from 'convex/values'
import { internalMutation, mutation, query } from './_generated/server'
import { getOrganizationId } from './lib/auth'

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
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name || existing.name,
        email: args.email,
        avatar: args.pictureUrl || existing.avatar,
        // Only update org if provided
        ...(args.organizationId ? { organizationId: args.organizationId } : {}),
      })
      return existing._id
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

import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

/**
 * Get current user from Clerk auth
 */
export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    return user
  },
})

/**
 * List all users (for dropdowns, assignments, etc.)
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('users').collect()
  },
})

/**
 * Create or update a user (sync from Clerk)
 */
export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
    role: v.optional(v.union(
      v.literal('admin'),
      v.literal('sdr'),
      v.literal('cs'),
      v.literal('support')
    )),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique()

    if (existingUser) {
      const patches: any = {
        email: args.email,
        name: args.name,
        updatedAt: Date.now(),
      }
      if (args.avatar) patches.avatar = args.avatar
      // Only update role if provided and different? Or assume Clerk/Admin manages roles?
      // For now, let's allow role updates if passed explicitly.
      if (args.role) patches.role = args.role

      await ctx.db.patch(existingUser._id, patches)
      return existingUser._id
    }

    // New User Default Role: SDR (or restrict signup? for now default to sdr)
    const newUserId = await ctx.db.insert('users', {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      avatar: args.avatar,
      role: args.role ?? 'sdr', // Default role
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    return newUserId
  },
})

export const updateUser = mutation({
  args: {
    userId: v.id('users'),
    patch: v.object({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      role: v.optional(v.union(
        v.literal('admin'),
        v.literal('sdr'),
        v.literal('cs'),
        v.literal('support')
      )),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')
    
    await ctx.db.patch(args.userId, {
      ...args.patch,
      updatedAt: Date.now(),
    })
  },
})

export const deleteUser = mutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')
    
    // Soft delete by setting isActive to false
    await ctx.db.patch(args.userId, {
      isActive: false,
      updatedAt: Date.now(),
    })
  },
})

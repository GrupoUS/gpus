import { internalMutation, mutation } from './_generated/server'
import { v } from 'convex/values'

export const addAdmin = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        role: 'admin',
        isActive: true, // ensure active
      })
      return `User ${existing.email} updated to admin`
    } else {
      await ctx.db.insert('users', {
        clerkId: args.clerkId,
        email: args.email,
        name: args.name,
        role: 'admin',
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      return `User ${args.email} created as admin`
    }
  },
})

export const promoteMe = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        role: 'admin',
        isActive: true,
      })
      return `User ${existing.email} updated to admin`
    } else {
      await ctx.db.insert('users', {
        clerkId: identity.subject,
        email: identity.email || 'unknown',
        name: identity.name || 'Admin',
        role: 'admin',
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      return `User ${identity.email} created as admin`
    }
  },
})

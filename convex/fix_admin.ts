import { internalMutation } from './_generated/server'
import { v } from 'convex/values'

export const addAdmin = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        role: 'admin',
        isActive: true,
      })
      return `User ${existing.email} updated to admin`
    }

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
  },
})

import { internalMutation } from './_generated/server'

export const initializeUserRoles = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect()
    let updatedCount = 0

    for (const user of users) {
      if (!user.role) {
        // Default to SDR if no role assigned
        await ctx.db.patch(user._id, {
          role: 'sdr',
          updatedAt: Date.now(),
        })
        updatedCount++
      }
    }

    return { total: users.length, updated: updatedCount }
  },
})

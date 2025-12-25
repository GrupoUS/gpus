import { mutation, internalMutation } from './_generated/server'
import { v } from 'convex/values'

// Public mutation to execute organizationId migration
// This calls the internal mutation after permission check
export const executeStudentMigration = mutation({
  args: { organizationId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // This can only be called by admin users
    // Use the internal mutation to do the actual migration
    const result = await ctx.runMutation(
      internal.migrations.migrateStudentOrganizationId,
      args
    )
    return result
  },
})

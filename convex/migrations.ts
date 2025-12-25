import { internalMutation } from './_generated/server'
import { v } from 'convex/values'

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

// Internal mutation to migrate existing students without organizationId
// This fixes the bug where XLSX import didn't set organizationId
export const migrateStudentOrganizationId = internalMutation({
  args: { organizationId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Get organizationId from args or determine from first user
    let orgId = args.organizationId
    if (!orgId) {
      const firstUser = await ctx.db.query('users').first()
      if (!firstUser) {
        throw new Error('No users found to determine organizationId')
      }
      orgId = firstUser.organizationId || firstUser.clerkId
    }

    // Find all students without organizationId
    const allStudents = await ctx.db.query('students').collect()
    const studentsWithoutOrg = allStudents.filter((s) => !s.organizationId)

    if (studentsWithoutOrg.length === 0) {
      return { migrated: 0, message: 'No students to migrate', organizationId: orgId }
    }

    // Update each student with organizationId
    for (const student of studentsWithoutOrg) {
      await ctx.db.patch(student._id, { organizationId: orgId })
    }

    console.log(`[Migration] Updated ${studentsWithoutOrg.length} students with organizationId: ${orgId}`)

    return {
      migrated: studentsWithoutOrg.length,
      organizationId: orgId,
      message: `Successfully migrated ${studentsWithoutOrg.length} students`,
    }
  },
})

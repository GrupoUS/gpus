import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const getByStudent = query({
  args: { studentId: v.id('students') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('enrollments')
      .withIndex('by_student', (q) => q.eq('studentId', args.studentId))
      .order('desc')
      .collect()
  },
})

export const create = mutation({
  args: {
    studentId: v.id('students'),
    product: v.string(),
    cohort: v.optional(v.string()),
    status: v.string(),
    startDate: v.optional(v.number()), // Plan says optionals, using number for timestamp
    expectedEndDate: v.optional(v.number()),
    totalValue: v.number(),
    installments: v.number(),
    installmentValue: v.number(),
    paymentStatus: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    const enrollmentId = await ctx.db.insert('enrollments', {
      ...args,
      progress: 0,
      modulesCompleted: 0,
      paidInstallments: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      practicesCompleted: 0, // Assuming schema requires this or good default
    })

    return enrollmentId
  },
})

export const update = mutation({
  args: {
    enrollmentId: v.id('enrollments'),
    patch: v.object({
      status: v.optional(v.string()),
      progress: v.optional(v.number()),
      modulesCompleted: v.optional(v.number()),
      practicesCompleted: v.optional(v.number()),
      paidInstallments: v.optional(v.number()),
      paymentStatus: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    await ctx.db.patch(args.enrollmentId, {
      ...args.patch,
      updatedAt: Date.now(),
    })
  },
})

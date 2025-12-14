import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const listEnrollments = query({
  args: {
    studentId: v.optional(v.id('students')),
    product: v.optional(v.string()),
    status: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let enrollments = await ctx.db
      .query('enrollments')
      .order('desc')
      .collect()

    if (args.studentId) {
      enrollments = enrollments.filter(e => e.studentId === args.studentId)
    }

    if (args.product) {
      enrollments = enrollments.filter(e => e.product === args.product)
    }

    if (args.status && args.status !== 'all') {
      enrollments = enrollments.filter(e => e.status === args.status)
    }

    if (args.paymentStatus) {
      enrollments = enrollments.filter(e => e.paymentStatus === args.paymentStatus)
    }

    return enrollments
  },
})

export const getEnrollment = query({
  args: { enrollmentId: v.id('enrollments') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.enrollmentId)
  },
})

export const createEnrollment = mutation({
  args: {
    studentId: v.id('students'),
    product: v.union(
      v.literal('trintae3'),
      v.literal('otb'),
      v.literal('black_neon'),
      v.literal('comunidade'),
      v.literal('auriculo'),
      v.literal('na_mesa_certa')
    ),
    cohort: v.optional(v.string()),
    startDate: v.optional(v.number()),
    expectedEndDate: v.optional(v.number()),
    totalValue: v.number(),
    installments: v.number(),
    installmentValue: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    const now = Date.now()

    return await ctx.db.insert('enrollments', {
      ...args,
      status: 'aguardando_inicio',
      paymentStatus: 'em_dia',
      paidInstallments: 0,
      progress: 0,
      modulesCompleted: 0,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const updateEnrollment = mutation({
  args: {
    enrollmentId: v.id('enrollments'),
    patch: v.object({
      status: v.optional(v.union(
        v.literal('ativo'),
        v.literal('concluido'),
        v.literal('cancelado'),
        v.literal('pausado'),
        v.literal('aguardando_inicio')
      )),
      paymentStatus: v.optional(v.union(
        v.literal('em_dia'),
        v.literal('atrasado'),
        v.literal('quitado'),
        v.literal('cancelado')
      )),
      progress: v.optional(v.number()),
      modulesCompleted: v.optional(v.number()),
      paidInstallments: v.optional(v.number()),
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

export const updateProgress = mutation({
  args: {
    enrollmentId: v.id('enrollments'),
    progress: v.number(),
    modulesCompleted: v.number(),
  },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId)
    if (!enrollment) throw new Error('Enrollment not found')

    const updates: Record<string, number | string> = {
      progress: args.progress,
      modulesCompleted: args.modulesCompleted,
      updatedAt: Date.now(),
    }

    // Auto-complete if 100%
    if (args.progress === 100) {
      updates.status = 'concluido'
      updates.actualEndDate = Date.now()
    }

    await ctx.db.patch(args.enrollmentId, updates)
  },
})

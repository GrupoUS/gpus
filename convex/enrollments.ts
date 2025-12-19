import { v } from 'convex/values'
import { mutation, query, type MutationCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { api } from './_generated/api'
import { requireAuth } from './lib/auth'

export const create = mutation({
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
    status: v.union(
      v.literal('ativo'),
      v.literal('concluido'),
      v.literal('cancelado'),
      v.literal('pausado'),
      v.literal('aguardando_inicio')
    ),
    startDate: v.optional(v.number()),
    expectedEndDate: v.optional(v.number()),
    totalValue: v.number(),
    installments: v.number(),
    installmentValue: v.number(),
    paymentStatus: v.union(
      v.literal('em_dia'),
      v.literal('atrasado'),
      v.literal('quitado'),
      v.literal('cancelado')
    ),
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
    })

    // Update student's denormalized products list
    await updateStudentProducts(ctx, args.studentId)

    return enrollmentId
  },
})

async function updateStudentProducts(ctx: MutationCtx, studentId: Id<'students'>) {
  const enrollments = await ctx.db
    .query('enrollments')
    .withIndex('by_student', (q) => q.eq('studentId', studentId))
    .filter((q) => q.eq(q.field('status'), 'ativo'))
    .collect()

  const products = Array.from(new Set(enrollments.map((e) => e.product)))
  await ctx.db.patch(studentId, { products: products as any })
}

export const update = mutation({
  args: {
    enrollmentId: v.id('enrollments'),
    patch: v.object({
      status: v.optional(
        v.union(
          v.literal('ativo'),
          v.literal('concluido'),
          v.literal('cancelado'),
          v.literal('pausado'),
          v.literal('aguardando_inicio')
        )
      ),
      progress: v.optional(v.number()),
      modulesCompleted: v.optional(v.number()),
      totalModules: v.optional(v.number()),
      practicesCompleted: v.optional(v.number()),
      paidInstallments: v.optional(v.number()),
      paymentStatus: v.optional(
        v.union(
          v.literal('em_dia'),
          v.literal('atrasado'),
          v.literal('quitado'),
          v.literal('cancelado')
        )
      ),
      startDate: v.optional(v.number()),
      expectedEndDate: v.optional(v.number()),
      actualEndDate: v.optional(v.number()),
      cohort: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    await ctx.db.patch(args.enrollmentId, {
      ...args.patch,
      updatedAt: Date.now(),
    })

    if (args.patch.status) {
      const enrollment = await ctx.db.get(args.enrollmentId)
      if (enrollment) {
        await updateStudentProducts(ctx, enrollment.studentId)
      }
    }
  },
})

export const getByStudent = query({
  args: { studentId: v.id('students') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')
    
    return await ctx.db
      .query('enrollments')
      .withIndex('by_student', (q) => q.eq('studentId', args.studentId))
      .collect()
  },
})

/**
 * Generate Asaas payments for an enrollment
 * Creates payments (installments) in Asaas for the enrollment
 */
export const generateAsaasPayments = mutation({
	args: {
		enrollmentId: v.id('enrollments'),
		billingType: v.union(
			v.literal('BOLETO'),
			v.literal('PIX'),
			v.literal('CREDIT_CARD'),
			v.literal('DEBIT_CARD'),
			v.literal('UNDEFINED'),
		),
	},
	handler: async (ctx, args): Promise<{ paymentIds: string[]; count: number }> => {
		await requireAuth(ctx)

		// Use the existing mutation from asaas.ts
		// @ts-ignore - TypeScript has issues with deep type inference in Convex mutations
		const result = (await ctx.runMutation(api.asaas.createInstallmentsFromEnrollment, {
			enrollmentId: args.enrollmentId,
			billingType: args.billingType,
		})) as { paymentIds: string[]; count: number };
		return result;
	},
})

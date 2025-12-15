import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

// Queries
export const list = query({
  args: {
    search: v.optional(v.string()),
    product: v.optional(v.string()),
    status: v.optional(v.string()),
    churnRisk: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let students = await ctx.db.query('students').order('desc').collect()

    // Apply filters
    if (args.status) {
      students = students.filter((s) => s.status === args.status)
    }
    if (args.churnRisk) {
      students = students.filter((s) => s.churnRisk === args.churnRisk)
    }
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      students = students.filter(
        (s) =>
          s.name.toLowerCase().includes(searchLower) ||
          s.email.toLowerCase().includes(searchLower) ||
          s.phone.includes(searchLower)
      )
    }

    // Enrich with mainProduct from enrollments and filter by product if needed
    const enrichedStudents = await Promise.all(
      students.map(async (student) => {
        const enrollment = await ctx.db
          .query('enrollments')
          .withIndex('by_student', (q) => q.eq('studentId', student._id))
          .order('desc')
          .first()

        // Filter by product if requested
        if (args.product && enrollment?.product !== args.product) {
          return null
        }

        return {
          ...student,
          mainProduct: enrollment?.product,
        }
      })
    )

    return enrichedStudents.filter((s) => s !== null)
  },
})

export const getById = query({
  args: { id: v.id('students') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const getChurnAlerts = query({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db
      .query('students')
      .filter(q => 
        q.or(
          q.eq(q.field('churnRisk'), 'alto'),
          q.eq(q.field('churnRisk'), 'medio')
        )
      )
      .collect()

    const alerts: Array<{ _id: any, studentName: string, reason: string, risk: 'alto' | 'medio' }> = []

    for (const student of students) {
      // Verificar pagamento atrasado
      const enrollments = await ctx.db
        .query('enrollments')
        .withIndex('by_student', q => q.eq('studentId', student._id))
        .collect()
      
      const hasLatePayment = enrollments.some(e => e.paymentStatus === 'atrasado')
      if (hasLatePayment) {
        alerts.push({
          _id: student._id,
          studentName: student.name,
          reason: 'Pagamento atrasado',
          risk: (student.churnRisk === 'baixo' ? 'medio' : student.churnRisk) as 'alto' | 'medio',
        })
        continue
      }

      // Verificar engajamento (últimos 30 dias)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
      if (student.lastEngagementAt && student.lastEngagementAt < thirtyDaysAgo) {
        alerts.push({
          _id: student._id,
          studentName: student.name,
          reason: 'Sem engajamento',
          risk: (student.churnRisk === 'baixo' ? 'medio' : student.churnRisk) as 'alto' | 'medio',
        })
      }
    }

    // Ordenar por risco (alto primeiro) e limitar a 5
    return alerts
      .sort((a, b) => {
        if (a.risk === 'alto' && b.risk !== 'alto') return -1
        if (a.risk !== 'alto' && b.risk === 'alto') return 1
        return 0
      })
      .slice(0, 5)
  },
})

// Mutations
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    cpf: v.optional(v.string()),
    profession: v.string(),
    professionalId: v.optional(v.string()),
    hasClinic: v.boolean(),
    clinicName: v.optional(v.string()),
    clinicCity: v.optional(v.string()),
    status: v.union(
      v.literal('ativo'),
      v.literal('inativo'),
      v.literal('pausado'),
      v.literal('formado')
    ),
    assignedCS: v.optional(v.id('users')),
    leadId: v.optional(v.id('leads')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    const studentId = await ctx.db.insert('students', {
      ...args,
      churnRisk: 'baixo',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    return studentId
  },
})

export const update = mutation({
  args: {
    studentId: v.id('students'),
    patch: v.object({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      cpf: v.optional(v.string()),
      profession: v.optional(v.string()),
      professionalId: v.optional(v.string()),
      hasClinic: v.optional(v.boolean()),
      clinicName: v.optional(v.string()),
      clinicCity: v.optional(v.string()),
      status: v.optional(
        v.union(
          v.literal('ativo'),
          v.literal('inativo'),
          v.literal('pausado'),
          v.literal('formado')
        )
      ),
      assignedCS: v.optional(v.id('users')),
      churnRisk: v.optional(
        v.union(v.literal('baixo'), v.literal('medio'), v.literal('alto'))
      ),
      lastEngagementAt: v.optional(v.number()),
      leadId: v.optional(v.id('leads')),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    await ctx.db.patch(args.studentId, {
      ...args.patch,
      updatedAt: Date.now(),
    })
  },
})

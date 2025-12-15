import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const list = query({
  args: {
    search: v.optional(v.string()),
    product: v.optional(v.string()),
    status: v.optional(v.string()),
    churnRisk: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const students = await ctx.db.query('students').order('desc').collect()

    const filteredStudents = await Promise.all(
      students.map(async (student) => {
        // Fetch "mainProduct" explicitly requested in plan
        // Strategy: Get most recent enrollment for this student
        const lastEnrollment = await ctx.db
          .query('enrollments')
          .withIndex('by_student', (q) => q.eq('studentId', student._id))
          .order('desc')
          .first()

        const mainProduct = lastEnrollment?.product

        // Apply filters
        if (args.status && student.status !== args.status) return null
        if (args.churnRisk && student.churnRisk !== args.churnRisk) return null
        if (args.product && mainProduct !== args.product) return null

        if (args.search) {
          const searchLower = args.search.toLowerCase()
          const matches =
            student.name.toLowerCase().includes(searchLower) ||
            student.email.toLowerCase().includes(searchLower) ||
            (student.phone && student.phone.includes(searchLower))

          if (!matches) return null
        }

        return { ...student, mainProduct }
      })
    )

    return filteredStudents.filter((s) => s !== null)
  },
})

export const getById = query({
  args: { id: v.id('students') },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.id)
    if (!student) return null

    // Also fetch mainProduct for consistency if useful, though not explicitly requested for getById, 
    // usually getById returns the raw doc or enriched doc. 
    // The plan says "Retorna ctx.db.get(args.id)", so I will strictly follow that.
    return student
  },
})

export const getChurnAlerts = query({
  handler: async (ctx) => {
    const students = await ctx.db
      .query('students')
      .withIndex('by_churn_risk', (q) => q.eq('churnRisk', 'alto'))
      // Plan says "order by lastEngagementAt (oldest first)". 
      // Assuming 'asc' order is oldest first for timestamps (smaller number = older).
      // However, if the index doesn't include lastEngagementAt, we might need to sort in memory.
      // The schema description says "indexes appropriate for all frequent queries".
      // I'll assume standard sort or in-memory if index isn't composed.
      // Since I don't see the schema, I'll filter by index and sort in memory to be safe and precise.
      .collect()

    const sorted = students.sort((a, b) => (a.lastEngagementAt || 0) - (b.lastEngagementAt || 0))
    const limited = sorted.slice(0, 10)

    const withEnrollment = await Promise.all(
      limited.map(async (student) => {
        const enrollment = await ctx.db
          .query('enrollments')
          .withIndex('by_student', (q) => q.eq('studentId', student._id))
          .filter((q) => q.eq(q.field('status'), 'active'))
          .first()
        return { ...student, activeEnrollment: enrollment }
      })
    )

    return withEnrollment
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    cpf: v.optional(v.string()),
    profession: v.optional(v.string()),
    professionalId: v.optional(v.string()),
    hasClinic: v.optional(v.boolean()),
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

    // Schema requires profession (string) but args has optional. Default to 'outro' if not provided.
    // Schema requires churnRisk as union.
    const studentId = await ctx.db.insert('students', {
      ...args,
      phone: args.phone || '', 
      profession: args.profession || 'outro',
      hasClinic: args.hasClinic ?? false,
      churnRisk: 'baixo',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      // status is passed in args
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
      status: v.optional(v.union(
        v.literal('ativo'),
        v.literal('inativo'),
        v.literal('pausado'),
        v.literal('formado')
      )),
      churnRisk: v.optional(v.union(
        v.literal('baixo'),
        v.literal('medio'),
        v.literal('alto')
      )),
      // Allow other fields as per schema if needed, but plan implies partial update.
      // Using v.any() for patch is dangerous, but plan says "patch: v.object({ ... })".
      // I should duplicate the optional fields allowed.
      // For brevity and following "Permitir atualização parcial de campos", I'll include common fields matching create.
      cpf: v.optional(v.string()),
      profession: v.optional(v.string()),
      professionalId: v.optional(v.string()),
      hasClinic: v.optional(v.boolean()),
      clinicName: v.optional(v.string()),
      clinicCity: v.optional(v.string()),
      assignedCS: v.optional(v.id('users')),
      
      // Also potentially lastEngagementAt if that's updated manually
      lastEngagementAt: v.optional(v.number()),
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

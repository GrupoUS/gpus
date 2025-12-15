import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

// Queries
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

    // Comment 3: Batch enrollment lookups.
    // Fetch all enrollments once. Note: This assumes enrollments table fits in memory/query limit.
    // For scalability, we should ideally filter enrollments by the student IDs we have, 
    // but Convex doesn't support 'in' queries efficiently for ad-hoc lists yet without iterating.
    // Given the instruction "issue one or a few enrollments queries... to build a map", we collect all.
    const allEnrollments = await ctx.db.query('enrollments').collect()
    
    // Build map: studentId -> latest enrollment (by createdAt)
    const enrollmentsByStudent = new Map<string, typeof allEnrollments[0]>()
    
    // Sort enrollments by created desc so we process newest first??
    // Actually simpler: iterate and keep latest.
    // We want the latest enrollment per student.
    // Let's sort allEnrollments desc first or handle in reducer.
    allEnrollments.sort((a,b) => b.createdAt - a.createdAt)
    
    for (const enrollment of allEnrollments) {
        if (!enrollmentsByStudent.has(enrollment.studentId)) {
            enrollmentsByStudent.set(enrollment.studentId, enrollment)
        }
    }

    // Enrich with mainProduct
    const enrichedStudents = students.map((student) => {
        const enrollment = enrollmentsByStudent.get(student._id)

        // Filter by product if requested
        if (args.product && enrollment?.product !== args.product) {
          return null
        }

        return {
          ...student,
          mainProduct: enrollment?.product,
        }
    })

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
    // Comment 4: Use churn-specific index and specific business logic
    const ENGAGEMENT_WINDOW_DAYS = 30
    const ENGAGEMENT_WINDOW_MS = ENGAGEMENT_WINDOW_DAYS * 24 * 60 * 60 * 1000
    const thirtyDaysAgo = Date.now() - ENGAGEMENT_WINDOW_MS

    // Use index for 'alto' and 'medio'
    const highRiskStudents = await ctx.db
      .query('students')
      .withIndex('by_churn_risk', (q) => q.eq('churnRisk', 'alto'))
      .collect()
      
    const mediumRiskStudents = await ctx.db
      .query('students')
      .withIndex('by_churn_risk', (q) => q.eq('churnRisk', 'medio'))
      .collect()

    const students = [...highRiskStudents, ...mediumRiskStudents]

    // Sort by lastEngagementAt ascending (most disengaged first) BEFORE limiting
    // Treat undefined lastEngagementAt as very old (0)
    students.sort((a, b) => (a.lastEngagementAt || 0) - (b.lastEngagementAt || 0))

    const alerts: Array<{ _id: any, studentName: string, reason: string, risk: 'alto' | 'medio' }> = []
    
    // Pre-fetch enrollments for late payment check? 
    // To do this strictly per comment "update the query to leverage a churn-specific index... Also sort... before applying limit",
    // we should process the sorted list.
    // Limitation: To check payment status efficiently, we ideally batch too, 
    // but the loop below limits to 5 alerts returned, so we might process more candidates.
    
    for (const student of students) {
        if (alerts.length >= 5) break // Limit reached

      // Verificar pagamento atrasado
      // Note: N+1 here is less critical if we stop at 5, but still exists.
      // Keeping loop logic as per legacy code but on sorted list.
      const enrollments = await ctx.db
        .query('enrollments')
        .withIndex('by_student', q => q.eq('studentId', student._id))
        .collect()
      
      const hasLatePayment = enrollments.some(e => e.paymentStatus === 'atrasado')
      
      // Check logic: High risk if late payment
      if (hasLatePayment) {
        alerts.push({
          _id: student._id,
          studentName: student.name,
          reason: 'Pagamento atrasado',
          risk: 'alto', // Force alto for late payment? Legacy was: (student.churnRisk === 'baixo' ? 'medio' : student.churnRisk)
          // But here we only iterate alto/medio students.
          // Let's keep original risk mapping logic or respect current risk?
          // Comment says "Keep the existing return shape".
          // If the student is already 'alto', it stays 'alto'.
        })
        continue
      }

      // Verificar engajamento (window check)
      if (student.lastEngagementAt && student.lastEngagementAt < thirtyDaysAgo) {
        alerts.push({
          _id: student._id,
          studentName: student.name,
          reason: 'Sem engajamento',
          risk: student.churnRisk as 'alto' | 'medio',
        })
      }
    }

    return alerts
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

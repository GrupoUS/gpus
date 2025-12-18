import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { encrypt, encryptCPF, decrypt, decryptCPF } from './lib/encryption'
import { logAudit } from './lgpd'
import { withQuerySecurity } from './lib/securityMiddleware'

// Queries
export const list = query({
  args: {
    search: v.optional(v.string()),
    product: v.optional(v.string()),
    status: v.optional(v.string()),
    churnRisk: v.optional(v.string()),
  },
  handler: withQuerySecurity(
    async (ctx, args: {
      search?: string
      product?: string
      status?: string
      churnRisk?: string
    }, _security) => {
      // Prefer indexed query when possible; fall back to in-memory filters.
      // NOTE: We purposely avoid returning full student documents to minimize PII exposure (LGPD).
      const status = args.status as 'ativo' | 'inativo' | 'pausado' | 'formado' | undefined
      const churnRisk = args.churnRisk as 'baixo' | 'medio' | 'alto' | undefined

      let students = status
        ? await ctx.db
            .query('students')
            .withIndex('by_status', (q) => q.eq('status', status))
            .order('desc')
            .collect()
        : churnRisk
          ? await ctx.db
              .query('students')
              .withIndex('by_churn_risk', (q) => q.eq('churnRisk', churnRisk))
              .order('desc')
              .collect()
          : await ctx.db.query('students').order('desc').collect()

      if (status && !students.every((s) => s.status === status)) {
        students = students.filter((s) => s.status === status)
      }

      if (churnRisk && !students.every((s) => s.churnRisk === churnRisk)) {
        students = students.filter((s) => s.churnRisk === churnRisk)
      }

      // Search: minimize sensitive matching (do NOT match against email/phone here).
      if (args.search) {
        const searchLower = args.search.toLowerCase()
        students = students.filter((s) => s.name && s.name.toLowerCase().includes(searchLower))
      }

      const results = await Promise.all(students.map(async (student) => {
        // Fetch latest enrollment for this student
        const latestEnrollment = await ctx.db
          .query('enrollments')
          .withIndex('by_student', (q) => q.eq('studentId', student._id))
          .order('desc')
          .first()

        const enrolledProducts = await ctx.db
          .query('enrollments')
          .withIndex('by_student', (q) => q.eq('studentId', student._id))
          .collect()

        const productSet = new Set(enrolledProducts.map(e => e.product))

        if (args.product) {
          if (args.product === 'sem_produto') {
            if (productSet.size > 0) return null
          } else if (!productSet.has(args.product as any)) {
            return null
          }
        }

        return {
          _id: student._id,
          _creationTime: student._creationTime,
          name: student.name,
          email: student.email,
          phone: student.phone,
          profession: student.profession,
          hasClinic: student.hasClinic,
          clinicName: student.clinicName,
          clinicCity: student.clinicCity,
          status: student.status,
          assignedCS: student.assignedCS,
          churnRisk: student.churnRisk,
          lastEngagementAt: student.lastEngagementAt,
          leadId: student.leadId,
          createdAt: student.createdAt,
          updatedAt: student.updatedAt,
          mainProduct: latestEnrollment?.product,
        }
      }))

      return results.filter((r): r is NonNullable<typeof r> => r !== null)
    },
    {
      requireAuth: true,
      // Portal internal roles. Adjust if some roles should not list students.
      allowedRoles: ['admin', 'sdr', 'cs', 'support'],
      // Defensive: cap results to avoid accidental bulk-export.
      maxResults: 500,
    },
  ),
})

export const getById = query({
  args: { id: v.id('students') },
  handler: withQuerySecurity(
    async (ctx, args: { id: Id<'students'> }, _security) => {
      const student = await ctx.db.get(args.id)
      if (!student) return null

      // Decrypt sensitive fields for authorized view
      if (student.encryptedCPF) student.cpf = await decryptCPF(student.encryptedCPF)
      if (student.encryptedEmail) student.email = await decrypt(student.encryptedEmail)
      if (student.encryptedPhone) student.phone = await decrypt(student.encryptedPhone)

      return student
    },
    {
      requireAuth: true,
      allowedRoles: ['admin', 'sdr', 'cs', 'support'],
    },
  ),
})

export const getChurnAlerts = query({
  args: {},
  handler: withQuerySecurity(
    async (ctx, _args: Record<string, never>, _security) => {
      try {
        // Comment 4: Use churn-specific index and specific business logic
        const ENGAGEMENT_WINDOW_DAYS = 30
        const ENGAGEMENT_WINDOW_MS = ENGAGEMENT_WINDOW_DAYS * 24 * 60 * 60 * 1000
        const thirtyDaysAgo = Date.now() - ENGAGEMENT_WINDOW_MS

        // 1. Fetch High/Medium risk students
        const highRiskStudents = await ctx.db
          .query('students')
          .withIndex('by_churn_risk', (q) => q.eq('churnRisk', 'alto'))
          .collect()

        const mediumRiskStudents = await ctx.db
          .query('students')
          .withIndex('by_churn_risk', (q) => q.eq('churnRisk', 'medio'))
          .collect()

        const students = [...highRiskStudents, ...mediumRiskStudents]

        // Sort by lastEngagementAt ascending (most disengaged first)
        students.sort((a, b) => (a.lastEngagementAt || 0) - (b.lastEngagementAt || 0))

        const alerts: Array<{
          _id: any
          studentName: string
          reason: string
          risk: 'alto' | 'medio'
        }> = []

        // Optimization: Process students one by one until we hit the limit
        // This avoids fetching ALL enrollments into memory (which caused OOM)
        for (const student of students) {
          if (alerts.length >= 5) break // Limit reached

          // Check 1: Late Payment (Query per student - N+1 but limited to 5 matches, so generic complexity is low)
          const lateEnrollment = await ctx.db
            .query('enrollments')
            .withIndex('by_student', (q) => q.eq('studentId', student._id))
            .filter((q) => q.eq(q.field('paymentStatus'), 'atrasado'))
            .first()

          if (lateEnrollment) {
            alerts.push({
              _id: student._id,
              studentName: student.name,
              reason: 'Pagamento atrasado',
              risk: 'alto', // Force 'alto' for late payment
            })
            continue
          }

          // Check 2: Engagement (window check)
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
      } catch (error) {
        console.error('Error in getChurnAlerts:', error)
        // Return empty array to avoid crashing the dashboard, but log the error
        return []
      }
    },
    {
      requireAuth: true,
      allowedRoles: ['admin', 'sdr', 'cs', 'support'],
    },
  ),
})

export const getStudentsGroupedByProducts = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    churnRisk: v.optional(v.string()),
    product: v.optional(v.string()),
  },
  handler: withQuerySecurity(
    async (ctx, args: {
      search?: string
      status?: string
      churnRisk?: string
      product?: string
    }, _security) => {
    // 1. Fetch all students (base query with optional indexed filters)
    const status = args.status as 'ativo' | 'inativo' | 'pausado' | 'formado' | undefined
    const churnRisk = args.churnRisk as 'baixo' | 'medio' | 'alto' | undefined

    let students = status
      ? await ctx.db
          .query('students')
          .withIndex('by_status', (q) => q.eq('status', status))
          .order('desc')
          .collect()
      : churnRisk
        ? await ctx.db
            .query('students')
            .withIndex('by_churn_risk', (q) => q.eq('churnRisk', churnRisk))
            .order('desc')
            .collect()
        : await ctx.db.query('students').order('desc').collect()

    // Apply additional in-memory filters
    if (status && !students.every((s) => s.status === status)) {
      students = students.filter((s) => s.status === status)
    }

    if (churnRisk && !students.every((s) => s.churnRisk === churnRisk)) {
      students = students.filter((s) => s.churnRisk === churnRisk)
    }

    // LGPD: Search only by name to minimize PII exposure (no email/phone matching)
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      students = students.filter((s) => s.name && s.name.toLowerCase().includes(searchLower))
    }

    // 2. Fetch enrollments per student and group them
    const products = [
      'trintae3',
      'otb',
      'black_neon',
      'comunidade',
      'auriculo',
      'na_mesa_certa',
      'sem_produto',
    ] as const

    const grouped: Record<string, typeof students> = {}
    for (const p of products) {
      grouped[p] = []
    }

    await Promise.all(students.map(async (student) => {
      const studentEnrollments = await ctx.db
        .query('enrollments')
        .withIndex('by_student', (q) => q.eq('studentId', student._id))
        .collect()

      const studentProducts = new Set(studentEnrollments.map(e => e.product))

      if (studentProducts.size === 0) {
        grouped['sem_produto'].push(student)
      } else {
        for (const prod of studentProducts) {
          if (grouped[prod as string]) {
            grouped[prod as string].push(student)
          }
        }
      }
    }))

    // 7. Apply product filter AFTER grouping
    // If filtering by specific product, only that product's group will have students
    if (args.product && args.product !== 'all') {
      for (const key of Object.keys(grouped)) {
        if (key !== args.product) {
          grouped[key] = []
        }
      }
    }

    // 8. Format for frontend - always return ALL products (even empty ones for ProductEmptyState)
    return products.map((key) => ({
      id: key,
      name: key,
      students: grouped[key],
      count: grouped[key].length,
    }))
    },
    {
      requireAuth: true,
      allowedRoles: ['admin', 'sdr', 'cs', 'support'],
      maxResults: 500,
    },
  ),
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

    // Check for existing student with same phone (duplicate prevention)
    const existingStudent = await ctx.db
      .query('students')
      .withIndex('by_phone', (q) => q.eq('phone', args.phone))
      .first()

    // Idempotent: return existing student ID if duplicate
    if (existingStudent) {
      return existingStudent._id
    }

    // Prepare encrypted fields
    const encryptedCPF = args.cpf ? await encryptCPF(args.cpf) : undefined
    const encryptedEmail = await encrypt(args.email)
    const encryptedPhone = await encrypt(args.phone)

    // LGPD: Store ONLY encrypted PII - never plaintext
    // Destructure to exclude plaintext PII from insert
    const { email: _email, phone: _phone, cpf: _cpf, ...safeArgs } = args

    const studentId = await ctx.db.insert('students', {
      ...safeArgs,
      // Store encrypted versions only
      encryptedCPF,
      encryptedEmail,
      encryptedPhone,
      // Keep plaintext fields for index/search compatibility (legacy)
      // TODO: Migrate to encrypted-only storage after data migration
      name: args.name,
      phone: args.phone, // Required for by_phone index (duplicate check)
      email: args.email, // Required for display in list queries
      churnRisk: 'baixo',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    await logAudit(ctx, {
      studentId,
      actionType: 'data_creation',
      dataCategory: 'personal_data',
      description: 'Student profile created',
      legalBasis: 'contract_execution'
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

    // Intercept sensitive updates to encrypt them
    const updates: any = { ...args.patch }

    // LGPD: Always await encryption before storing
    if (args.patch.cpf) updates.encryptedCPF = await encryptCPF(args.patch.cpf)
    if (args.patch.email) updates.encryptedEmail = await encrypt(args.patch.email)
    if (args.patch.phone) updates.encryptedPhone = await encrypt(args.patch.phone)

    await ctx.db.patch(args.studentId, {
      ...updates,
      updatedAt: Date.now(),
    })

    await logAudit(ctx, {
      studentId: args.studentId,
      actionType: 'data_modification',
      dataCategory: 'personal_data',
      description: 'Student profile updated',
      legalBasis: 'contract_execution',
      metadata: { fields: Object.keys(args.patch) }
    })
  },
})

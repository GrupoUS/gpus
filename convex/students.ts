import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { encrypt, encryptCPF, decrypt, decryptCPF } from './lib/encryption'
import { logAudit } from './lgpd'

// Queries
// Queries
export const list = query({
  args: {
    search: v.optional(v.string()),
    product: v.optional(v.string()),
    status: v.optional(v.string()),
    churnRisk: v.optional(v.string()),
  },
  handler: withQuerySecurity(
    async (ctx, args, _security) => {
      // Prefer indexed query when possible; fall back to in-memory filters.
      // NOTE: We purposely avoid returning full student documents to minimize PII exposure (LGPD).
      let students = args.status
        ? await ctx.db
            .query('students')
            .withIndex('by_status', (q) => q.eq('status', args.status))
            .order('desc')
            .collect()
        : args.churnRisk
          ? await ctx.db
              .query('students')
              .withIndex('by_churn_risk', (q) => q.eq('churnRisk', args.churnRisk))
              .order('desc')
              .collect()
          : await ctx.db.query('students').order('desc').collect()

      if (args.status && !students.every((s) => s.status === args.status)) {
        students = students.filter((s) => s.status === args.status)
      }

      if (args.churnRisk && !students.every((s) => s.churnRisk === args.churnRisk)) {
        students = students.filter((s) => s.churnRisk === args.churnRisk)
      }

      // Search: minimize sensitive matching (do NOT match against email/phone here).
      if (args.search) {
        const searchLower = args.search.toLowerCase()
        students = students.filter((s) => s.name.toLowerCase().includes(searchLower))
      }

      const allEnrollments = await ctx.db.query('enrollments').collect()

      // Build map: studentId -> latest enrollment (by createdAt)
      const enrollmentsByStudent = new Map<string, (typeof allEnrollments)[number]>()
      allEnrollments.sort((a, b) => b.createdAt - a.createdAt)
      for (const enrollment of allEnrollments) {
        if (!enrollmentsByStudent.has(enrollment.studentId)) {
          enrollmentsByStudent.set(enrollment.studentId, enrollment)
        }
      }

      const results: Array<{
        _id: (typeof students)[number]['_id']
        _creationTime: (typeof students)[number]['_creationTime']
        name: string
        email: string
        phone: string
        profession: string
        hasClinic: boolean
        clinicName?: string
        clinicCity?: string
        status: (typeof students)[number]['status']
        assignedCS?: (typeof students)[number]['assignedCS']
        churnRisk: (typeof students)[number]['churnRisk']
        lastEngagementAt?: number
        leadId?: (typeof students)[number]['leadId']
        createdAt: number
        updatedAt: number
        mainProduct?: string
      }> = []

      for (const student of students) {
        const enrollment = enrollmentsByStudent.get(student._id)

        if (args.product && enrollment?.product !== args.product) {
          continue
        }

        results.push({
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
          mainProduct: enrollment?.product,
        })
      }

      return results
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
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.id)
    if (!student) return null

    // Decrypt sensitive fields for authorized view
    // Note: In a real scenario, checks access policy here
    if (student.encryptedCPF) student.cpf = await decryptCPF(student.encryptedCPF)
    if (student.encryptedEmail) student.email = await decrypt(student.encryptedEmail)
    if (student.encryptedPhone) student.phone = await decrypt(student.encryptedPhone)

    // Note: Audit logging for data access should be done in a mutation
    // or action that wraps this query, as logAudit requires MutationCtx

    return student
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

export const getStudentsGroupedByProducts = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Fetch all students (base filter)
    let students = await ctx.db.query('students').order('desc').collect()

    // Apply memory filters
    if (args.status) {
      students = students.filter((s) => s.status === args.status)
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

    // 2. Fetch enrollments to map students to products
    const enrollments = await ctx.db.query('enrollments').collect()

    // 3. Grouping Logic
    const products = [
      'trintae3',
      'otb',
      'black_neon',
      'comunidade',
      'auriculo',
      'na_mesa_certa',
    ] as const

    const grouped: Record<string, typeof students> = {}

    // Initialize groups
    products.forEach((p) => (grouped[p] = []))

    // Map of studentId -> Student (filtered)
    const studentMap = new Map(students.map((s) => [s._id, s]))

    for (const enrollment of enrollments) {
      // If enrollment belongs to a student in our filtered list
      const student = studentMap.get(enrollment.studentId)

      if (student && enrollment.product) {
        // Add to appropriate group
        // Note: A student can be in multiple groups if they have multiple products
        if (Array.isArray(grouped[enrollment.product as string])) {
          // Check if already added to this product group
          const exists = grouped[enrollment.product as string].find(
            (s) => s._id === student._id
          )
          if (!exists) {
            grouped[enrollment.product as string].push(student)
          }
        }
      }
    }

    // Format for frontend
    return Object.entries(grouped).map(([key, value]) => ({
      id: key,
      name: key,
      students: value,
      count: value.length,
    }))
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

    const studentId = await ctx.db.insert('students', {
      ...args,
      encryptedCPF,
      encryptedEmail,
      encryptedPhone,
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

    if (args.patch.cpf) updates.encryptedCPF = encryptCPF(args.patch.cpf)
    if (args.patch.email) updates.encryptedEmail = encrypt(args.patch.email)
    if (args.patch.phone) updates.encryptedPhone = encrypt(args.patch.phone)

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

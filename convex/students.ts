import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { internal } from './_generated/api'
import { encrypt, encryptCPF, decrypt, decryptCPF } from './lib/encryption'
import { logAudit } from './lgpd'
import { getOrganizationId, requirePermission } from './lib/auth'
import { PERMISSIONS } from './lib/permissions'

// Queries
export const list = query({
  args: {
    search: v.optional(v.string()),
    product: v.optional(v.string()),
    status: v.optional(v.string()),
    churnRisk: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, PERMISSIONS.STUDENTS_READ)
    const organizationId = await getOrganizationId(ctx)

    const status = args.status as 'ativo' | 'inativo' | 'pausado' | 'formado' | undefined
    const churnRisk = args.churnRisk as 'baixo' | 'medio' | 'alto' | undefined

    let query = ctx.db.query('students')
      .withIndex('by_organization', q => q.eq('organizationId', organizationId));

    if (status) {
      query = ctx.db.query('students')
        .withIndex('by_status', q => q.eq('status', status))
        .filter(q => q.eq(q.field('organizationId'), organizationId));
    } else if (churnRisk) {
      query = ctx.db.query('students')
        .withIndex('by_churn_risk', q => q.eq('churnRisk', churnRisk))
        .filter(q => q.eq(q.field('organizationId'), organizationId));
    }

    const students = await query.order('desc').take(args.limit ?? 100);

    if (args.search) {
      const searchLower = args.search.toLowerCase()
      // Note: Substring search still filtered in memory for now
      return students.filter((s) => s.name && s.name.toLowerCase().includes(searchLower))
    }

    return students;
  },
})

export const getById = query({
  args: { id: v.id('students') },
  handler: async (ctx, args) => {
    await requirePermission(ctx, PERMISSIONS.STUDENTS_READ)

    const student = await ctx.db.get(args.id)
    if (!student) return null

    // Decrypt sensitive fields for authorized view
    if (student.encryptedCPF) student.cpf = await decryptCPF(student.encryptedCPF)
    if (student.encryptedEmail) student.email = await decrypt(student.encryptedEmail)
    if (student.encryptedPhone) student.phone = await decrypt(student.encryptedPhone)

    return student
  },
})

export const getChurnAlerts = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, PERMISSIONS.STUDENTS_READ)

    try {
      const ENGAGEMENT_WINDOW_DAYS = 30
      const ENGAGEMENT_WINDOW_MS = ENGAGEMENT_WINDOW_DAYS * 24 * 60 * 60 * 1000
      const thirtyDaysAgo = Date.now() - ENGAGEMENT_WINDOW_MS

      const highRiskStudents = await ctx.db
        .query('students')
        .withIndex('by_churn_risk', (q) => q.eq('churnRisk', 'alto'))
        .collect()

      const mediumRiskStudents = await ctx.db
        .query('students')
        .withIndex('by_churn_risk', (q) => q.eq('churnRisk', 'medio'))
        .collect()

      const students = [...highRiskStudents, ...mediumRiskStudents]

      students.sort((a, b) => (a.lastEngagementAt || 0) - (b.lastEngagementAt || 0))

      const alerts: Array<{
        _id: any
        studentName: string
        reason: string
        risk: 'alto' | 'medio'
      }> = []

      for (const student of students) {
        if (alerts.length >= 5) break

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
            risk: 'alto',
          })
          continue
        }

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
      return []
    }
  },
})

export const getStudentsGroupedByProducts = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    churnRisk: v.optional(v.string()),
    product: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, PERMISSIONS.STUDENTS_READ)
    const organizationId = await getOrganizationId(ctx)

    const status = args.status as 'ativo' | 'inativo' | 'pausado' | 'formado' | undefined
    const churnRisk = args.churnRisk as 'baixo' | 'medio' | 'alto' | undefined

    let query = ctx.db.query('students')
      .withIndex('by_organization', q => q.eq('organizationId', organizationId));

    if (status) {
      query = ctx.db.query('students')
        .withIndex('by_status', q => q.eq('status', status))
        .filter(q => q.eq(q.field('organizationId'), organizationId));
    } else if (churnRisk) {
      query = ctx.db.query('students')
        .withIndex('by_churn_risk', q => q.eq('churnRisk', churnRisk))
        .filter(q => q.eq(q.field('organizationId'), organizationId));
    }

    // Safety limit to prevent O(n) memory issues
    const students = await query.order('desc').take(500);

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

    for (const student of students) {
      // Filter by search in memory
      if (args.search) {
        const searchLower = args.search.toLowerCase()
        if (!student.name || !student.name.toLowerCase().includes(searchLower)) {
          continue
        }
      }

      const studentProducts = student.products || []

      if (studentProducts.length === 0) {
        grouped['sem_produto'].push(student)
      } else {
        for (const prod of studentProducts) {
          if (grouped[prod]) {
            grouped[prod].push(student)
          }
        }
      }
    }

    if (args.product && args.product !== 'all') {
      for (const key of Object.keys(grouped)) {
        if (key !== args.product) {
          grouped[key] = []
        }
      }
    }

    return products.map((key) => ({
      id: key,
      name: key,
      students: grouped[key],
      count: grouped[key].length,
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
    lgpdConsent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, PERMISSIONS.STUDENTS_WRITE)
    const organizationId = await getOrganizationId(ctx)

    // Check for existing student with same phone (duplicate prevention)
    const existingStudent = await ctx.db
      .query('students')
      .withIndex('by_phone', (q) => q.eq('phone', args.phone))
      .first()

    if (existingStudent) {
      return existingStudent._id
    }

    const encryptedCPF = args.cpf ? await encryptCPF(args.cpf) : undefined
    const encryptedEmail = await encrypt(args.email)
    const encryptedPhone = await encrypt(args.phone)

    const { email: _email, phone: _phone, cpf: _cpf, lgpdConsent, ...safeArgs } = args

    const studentId = await ctx.db.insert('students', {
      ...safeArgs,
      organizationId,
      encryptedCPF,
      encryptedEmail,
      encryptedPhone,
      lgpdConsent,
      name: args.name,
      phone: args.phone,
      email: args.email,
      churnRisk: 'baixo',
      consentGrantedAt: lgpdConsent ? Date.now() : undefined,
      consentVersion: lgpdConsent ? 'v1.0' : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })


    await logAudit(ctx, {
      studentId,
      actionType: lgpdConsent ? 'consent_granted' : 'data_creation',
      dataCategory: 'personal_data',
      description: lgpdConsent ? 'Student profile created with explicit consent' : 'Student profile created',
      legalBasis: lgpdConsent ? 'consentimento' : 'contract_execution'
    })

    // Auto-sync with Asaas (async, don't wait)
    try {
      await ctx.scheduler.runAfter(0, internal.asaas.syncStudentAsCustomerInternal, {
        studentId,
      })
    } catch (error) {
      // Log but don't fail student creation if Asaas sync fails
      console.error('Failed to schedule Asaas customer sync:', error)
    }

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
    await requirePermission(ctx, PERMISSIONS.STUDENTS_WRITE)

    const updates: any = { ...args.patch }

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

    // Auto-sync with Asaas if CPF/email/phone changed
    const shouldSync = args.patch.cpf || args.patch.email || args.patch.phone
    if (shouldSync) {
      try {
        await ctx.scheduler.runAfter(0, internal.asaas.syncStudentAsCustomerInternal, {
          studentId: args.studentId,
        })
      } catch (error) {
        // Log but don't fail update if Asaas sync fails
        console.error('Failed to schedule Asaas customer sync:', error)
      }
    }
  },
})


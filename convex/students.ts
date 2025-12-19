import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { internal } from './_generated/api'
import { encrypt, encryptCPF, decrypt, decryptCPF } from './lib/encryption'
import { logAudit } from './lgpd'
import { requirePermission } from './lib/auth'
import { PERMISSIONS } from './lib/permissions'


// Queries
export const list = query({
  args: {
    search: v.optional(v.string()),
    product: v.optional(v.string()),
    status: v.optional(v.string()),
    churnRisk: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, PERMISSIONS.STUDENTS_READ)

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

    if (args.search) {
      const searchLower = args.search.toLowerCase()
      students = students.filter((s) => s.name && s.name.toLowerCase().includes(searchLower))
    }

    const results = await Promise.all(students.map(async (student) => {
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

    if (args.search) {
      const searchLower = args.search.toLowerCase()
      students = students.filter((s) => s.name && s.name.toLowerCase().includes(searchLower))
    }

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
      encryptedCPF,
      encryptedEmail,
      encryptedPhone,
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


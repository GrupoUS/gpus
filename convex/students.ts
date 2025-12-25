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

// Diagnostic query for fixing organizationId bug
export const diagnoseOrganizationId = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, PERMISSIONS.STUDENTS_READ)
    const organizationId = await getOrganizationId(ctx)

    // Count students without organizationId
    const allStudents = await ctx.db.query('students').collect()
    const studentsWithoutOrg = allStudents.filter((s) => !s.organizationId)

    // Count students matching current user's organizationId
    const studentsMatchingOrg = allStudents.filter((s) => s.organizationId === organizationId)

    return {
      currentOrganizationId: organizationId,
      totalStudents: allStudents.length,
      studentsWithoutOrganizationId: studentsWithoutOrg.length,
      studentsMatchingCurrentOrg: studentsMatchingOrg.length,
      sampleStudentsWithoutOrg: studentsWithoutOrg.slice(0, 5).map((s) => ({
        _id: s._id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        organizationId: s.organizationId,
      })),
    }
  },
})

export const getChurnAlerts = query({
  args: {},
  handler: async (ctx) => {
    try {
      await requirePermission(ctx, PERMISSIONS.STUDENTS_READ)
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
	args: {},
	handler: async (ctx) => {
		await requirePermission(ctx, PERMISSIONS.STUDENTS_READ)
		const organizationId = await getOrganizationId(ctx)

		// Get students with organization filter
		const studentsQuery = ctx.db.query('students')
			.withIndex('by_organization', q => q.eq('organizationId', organizationId))

		const students = await studentsQuery.collect()

		// Get all enrollments for these students to determine their products
		const enrollments = await ctx.db.query('enrollments').collect()
		const studentEnrollments = new Map<string, string[]>()

		for (const enrollment of enrollments) {
			const studentId = String(enrollment.studentId)
			const products = studentEnrollments.get(studentId) || []
			products.push(enrollment.product)
			studentEnrollments.set(studentId, products)
		}

		// Define all product types
		const allProducts = ['trintae3', 'otb', 'black_neon', 'comunidade', 'auriculo', 'na_mesa_certa', 'sem_produto'] as const
		type ProductType = typeof allProducts[number]

		// Group students by their products (a student can appear in multiple groups)
		const groups: Array<{ id: ProductType; count: number; students: typeof students }> = allProducts.map(productId => ({
			id: productId,
			count: 0,
			students: [] as typeof students,
		}))

		for (const student of students) {
			const studentProducts = studentEnrollments.get(String(student._id)) || []

			if (studentProducts.length === 0) {
				// Student has no enrollments - add to 'sem_produto'
				const noProductGroup = groups.find(g => g.id === 'sem_produto')!
				noProductGroup.count++
				noProductGroup.students.push(student)
			} else {
				// Add student to each product group they're enrolled in
				for (const productId of studentProducts) {
					const group = groups.find(g => g.id === productId)
					if (group) {
						group.count++
						group.students.push(student)
					}
				}
			}
		}

		return groups
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
      await ctx.scheduler.runAfter(0, internal.asaas.mutations.syncStudentAsCustomerInternal as any, {
        studentId,
      })
    } catch (error: any) {
      // Criar notificação para o usuário
      await ctx.db.insert('notifications', {
        recipientId: studentId,
        recipientType: 'student',
        type: 'system', // Using 'system' as 'error' is not in schema union
        title: 'Falha na sincronização com Asaas',
        message: `Não foi possível sincronizar ${args.name} com Asaas. Motivo: ${error.message}`,
        channel: 'system',
        status: 'pending',
        // read: false, // Removed as it's not in schema
        createdAt: Date.now(),
      });
      
      // Update student with error
      await ctx.db.patch(studentId, {
        asaasCustomerSyncError: error.message,
        asaasCustomerSyncAttempts: 1,
      });

      console.error('Asaas sync failed:', { studentId, error: error.message });
    }

    // Auto-sync to email marketing (if student has email)
    if (args.email) {
      try {
        await ctx.scheduler.runAfter(0, internal.emailMarketing.syncStudentAsContactInternal, {
          studentId,
          organizationId,
        })
      } catch (error) {
        // Log but don't fail student creation if email sync fails
        console.error('Failed to schedule email marketing sync:', error)
      }
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

    // biome-ignore lint/suspicious/noExplicitAny: dynamic patch object
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
        await ctx.scheduler.runAfter(0, internal.asaas.mutations.syncStudentAsCustomerInternal as any, {
          studentId: args.studentId,
        })
      } catch (error: any) {
         // Criar notificação para o usuário
         await ctx.db.insert('notifications', {
            recipientId: args.studentId,
            recipientType: 'student',
            type: 'system',
            title: 'Falha na sincronização com Asaas',
            message: `Não foi possível sincronizar o aluno com Asaas. Motivo: ${error.message}`,
            channel: 'system',
            status: 'pending',
            createdAt: Date.now(),
          });
          
          // Update student with error
          await ctx.db.patch(args.studentId, {
            asaasCustomerSyncError: error.message,
            // Increment attempts if exists, else 1
            // We can't easily increment atomically without reading, but this is inside mutation so we can read?
            // But we are in the catch block of scheduling?
            // No, scheduling `runAfter` rarely fails unless the function doesn't exist.
            // The ERROR happens inside the scheduled function usually.
            // BUT `runAfter` validates arguments.
            // If `syncStudentAsCustomerInternal` throws, `runAfter` doesn't catch it here, it fails asynchronously.
            // The `try-catch` here only catches scheduling errors.
            // TO HANDLE ASYNC FAILURES, we need to handle them INSIDE `syncStudentAsCustomerInternal`.
            // The plan says: "Modificar mutation create ... Substituir try-catch silencioso".
            // But `runAfter` is non-blocking. The error won't be caught here if it happens during execution.
            // It will only be caught here if scheduling fails.
            // However, `syncStudentAsCustomerInternal` (now an action) can catch its own errors and update the student/notify.
            // I already added try-catch inside `syncStudentAsCustomerInternal` in `convex/asaas/mutations.ts`.
            // So I should probably rely on that?
            // But the plan explicitly says to modify `convex/students.ts`.
            // Maybe the plan assumes `await syncStudentAsCustomerInternal` is awaited directly?
            // But it uses `ctx.scheduler.runAfter`.
            // If I want to notify on failure, `syncStudentAsCustomerInternal` must do it.
            // I will update `syncStudentAsCustomerInternal` to handle the error recording and notification.
            // And here I will just keep the scheduling safe.
            // Wait, if I change `syncStudentAsCustomerInternal` to handle errors, I don't need to change `students.ts` much,
            // except maybe to ensure we are passing the right args.
            // Let's look at `syncStudentAsCustomerInternal` again.
            // I added a try-catch block there.
            // I should add the DB update (syncError) and notification THERE.
            // Because `runAfter` returns immediately.
            // So the changes in `students.ts` proposed by the plan ("Substituir try-catch silencioso") might be based on a misunderstanding of `runAfter`,
            // OR the plan implies we should await it? No, "await ctx.scheduler.runAfter" just awaits the scheduling ID.
            // I will implement the error handling INSIDE `syncStudentAsCustomerInternal` (which I converted to an action).
            // But since it's an action, it needs to call a mutation to update the DB/notify.
            // I'll create `reportSyncFailure` mutation.
      }
    }
  },
})

/**
 * Fix students without organizationId (retroactive fix)
 * This mutation can be run from the Convex Dashboard to fix students
 * that were imported before the organizationId bug was fixed.
 */
export const fixOrganizationId = mutation({
  args: {
    targetOrganizationId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, PERMISSIONS.STUDENTS_WRITE)

    // Buscar todos os alunos sem organizationId
    const studentsWithoutOrg = await ctx.db
      .query('students')
      .filter((q) => q.eq(q.field('organizationId'), undefined))
      .collect()

    // Atualizar cada aluno com o organizationId fornecido
    const updates = []
    for (const student of studentsWithoutOrg) {
      updates.push(
        ctx.db.patch(student._id, {
          organizationId: args.targetOrganizationId,
          updatedAt: Date.now(),
        })
      )
    }

    await Promise.all(updates)

    return {
      updatedCount: studentsWithoutOrg.length,
      organizationId: args.targetOrganizationId,
    }
  },
})

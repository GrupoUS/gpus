import { v } from 'convex/values';

import { internal } from './_generated/api';
import { mutation, query } from './_generated/server';
import { logAudit } from './lgpd';
import { getOrganizationId, requirePermission } from './lib/auth';
import { decrypt, decryptCPF, encrypt, encryptCPF } from './lib/encryption';
import { PERMISSIONS } from './lib/permissions';

// Queries
export const list = query({
	args: {
		search: v.optional(v.string()),
		product: v.optional(v.string()),
		status: v.optional(v.string()),
		churnRisk: v.optional(v.string()),
		limit: v.optional(v.number()),
	},
	returns: v.array(v.any()),
	handler: async (ctx, args) => {
		await requirePermission(ctx, PERMISSIONS.STUDENTS_READ);
		const organizationId = await getOrganizationId(ctx);

		const status = args.status as 'ativo' | 'inativo' | 'pausado' | 'formado' | undefined;
		const churnRisk = args.churnRisk as 'baixo' | 'medio' | 'alto' | undefined;

		let query = ctx.db
			.query('students')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId));

		if (status) {
			query = ctx.db
				.query('students')
				.withIndex('by_status', (q) => q.eq('status', status))
				.filter((q) => q.eq(q.field('organizationId'), organizationId));
		} else if (churnRisk) {
			query = ctx.db
				.query('students')
				.withIndex('by_churn_risk', (q) => q.eq('churnRisk', churnRisk))
				.filter((q) => q.eq(q.field('organizationId'), organizationId));
		}

		const students = await query.order('desc').take(args.limit ?? 100);

		if (args.search) {
			const searchLower = args.search.toLowerCase();
			// Note: Substring search still filtered in memory for now
			return students.filter((s) => s.name?.toLowerCase().includes(searchLower));
		}

		return students;
	},
});

export const getById = query({
	args: { id: v.id('students') },
	handler: async (ctx, args) => {
		await requirePermission(ctx, PERMISSIONS.STUDENTS_READ);

		const student = await ctx.db.get(args.id);
		if (!student) return null;

		// Decrypt sensitive fields for authorized view (with graceful degradation)
		try {
			if (student.encryptedCPF) student.cpf = await decryptCPF(student.encryptedCPF);
		} catch (_e) {
			student.cpf = student.cpf || '[CPF criptografado - falha na decriptação]';
		}

		try {
			if (student.encryptedEmail) student.email = await decrypt(student.encryptedEmail);
		} catch (_e) {
			student.email = student.email || '[Email criptografado - falha na decriptação]';
		}

		try {
			if (student.encryptedPhone) student.phone = await decrypt(student.encryptedPhone);
		} catch (_e) {
			student.phone = student.phone || '[Telefone criptografado - falha na decriptação]';
		}

		return student;
	},
});

// Diagnostic query for fixing organizationId bug
export const diagnoseOrganizationId = query({
	args: {},
	handler: async (ctx) => {
		await requirePermission(ctx, PERMISSIONS.STUDENTS_READ);
		const organizationId = await getOrganizationId(ctx);

		// Count students without organizationId
		const allStudents = await ctx.db.query('students').collect();
		const studentsWithoutOrg = allStudents.filter((s) => !s.organizationId);

		// Count students matching current user's organizationId
		const studentsMatchingOrg = allStudents.filter((s) => s.organizationId === organizationId);

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
		};
	},
});

/**
 * Diagnostic query for checking encryption health
 * Identifies records that cannot be decrypted with current ENCRYPTION_KEY
 */
export const checkEncryptionHealth = query({
	args: {},
	returns: v.object({
		total: v.number(),
		cpfFailures: v.number(),
		emailFailures: v.number(),
		phoneFailures: v.number(),
		samples: v.array(
			v.object({
				id: v.string(),
				initials: v.string(),
				failures: v.array(v.string()),
			}),
		),
	}),
	handler: async (ctx) => {
		await requirePermission(ctx, PERMISSIONS.STUDENTS_READ);
		const students = await ctx.db.query('students').collect();

		let total = 0;
		let cpfFailures = 0;
		let emailFailures = 0;
		let phoneFailures = 0;
		const samples: Array<{ id: string; initials: string; failures: string[] }> = [];

		for (const student of students) {
			const failures: string[] = [];

			if (student.encryptedCPF) {
				try {
					await decryptCPF(student.encryptedCPF);
				} catch {
					cpfFailures++;
					failures.push('cpf');
				}
			}

			if (student.encryptedEmail) {
				try {
					await decrypt(student.encryptedEmail);
				} catch {
					emailFailures++;
					failures.push('email');
				}
			}

			if (student.encryptedPhone) {
				try {
					await decrypt(student.encryptedPhone);
				} catch {
					phoneFailures++;
					failures.push('phone');
				}
			}

			if (failures.length > 0 && samples.length < 5) {
				// Generate initials from name (first letter of first/last name) for privacy
				const nameParts = (student.name || '').split(' ');
				const initials =
					nameParts.length > 1
						? `${nameParts[0]?.[0] || ''}${nameParts.at(-1)?.[0] || ''}`.toUpperCase()
						: (nameParts[0]?.[0] || '?').toUpperCase();

				samples.push({
					id: String(student._id),
					initials,
					failures,
				});
			}
			total++;
		}

		return { total, cpfFailures, emailFailures, phoneFailures, samples };
	},
});

export const getChurnAlerts = query({
	args: {},
	handler: async (ctx) => {
		try {
			await requirePermission(ctx, PERMISSIONS.STUDENTS_READ);
			const ENGAGEMENT_WINDOW_DAYS = 30;
			const ENGAGEMENT_WINDOW_MS = ENGAGEMENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
			const thirtyDaysAgo = Date.now() - ENGAGEMENT_WINDOW_MS;

			const highRiskStudents = await ctx.db
				.query('students')
				.withIndex('by_churn_risk', (q) => q.eq('churnRisk', 'alto'))
				.collect();

			const mediumRiskStudents = await ctx.db
				.query('students')
				.withIndex('by_churn_risk', (q) => q.eq('churnRisk', 'medio'))
				.collect();

			const students = [...highRiskStudents, ...mediumRiskStudents];

			students.sort((a, b) => (a.lastEngagementAt || 0) - (b.lastEngagementAt || 0));

			const alerts: Array<{
				_id: any;
				studentName: string;
				reason: string;
				risk: 'alto' | 'medio';
			}> = [];

			for (const student of students) {
				if (alerts.length >= 5) break;

				const lateEnrollment = await ctx.db
					.query('enrollments')
					.withIndex('by_student', (q) => q.eq('studentId', student._id))
					.filter((q) => q.eq(q.field('paymentStatus'), 'atrasado'))
					.first();

				if (lateEnrollment) {
					alerts.push({
						_id: student._id,
						studentName: student.name,
						reason: 'Pagamento atrasado',
						risk: 'alto',
					});
					continue;
				}

				if (student.lastEngagementAt && student.lastEngagementAt < thirtyDaysAgo) {
					alerts.push({
						_id: student._id,
						studentName: student.name,
						reason: 'Sem engajamento',
						risk: student.churnRisk as 'alto' | 'medio',
					});
				}
			}

			return alerts;
		} catch (_error) {
			return [];
		}
	},
});

export const getStudentsGroupedByProducts = query({
	args: {},
	handler: async (ctx) => {
		await requirePermission(ctx, PERMISSIONS.STUDENTS_READ);
		const organizationId = await getOrganizationId(ctx);

		// Get students with organization filter
		const studentsQuery = ctx.db
			.query('students')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId));

		const students = await studentsQuery.collect();

		// Get all enrollments for these students to determine their products
		const enrollments = await ctx.db.query('enrollments').collect();
		const studentEnrollments = new Map<string, string[]>();

		for (const enrollment of enrollments) {
			const studentId = String(enrollment.studentId);
			const products = studentEnrollments.get(studentId) || [];
			products.push(enrollment.product);
			studentEnrollments.set(studentId, products);
		}

		// Define all product types
		const allProducts = [
			'trintae3',
			'otb',
			'black_neon',
			'comunidade',
			'auriculo',
			'na_mesa_certa',
			'sem_produto',
		] as const;
		type ProductType = (typeof allProducts)[number];

		// Group students by their products (a student can appear in multiple groups)
		const groups: Array<{
			id: ProductType;
			count: number;
			students: typeof students;
		}> = allProducts.map((productId) => ({
			id: productId,
			count: 0,
			students: [] as typeof students,
		}));

		for (const student of students) {
			const studentProducts = studentEnrollments.get(String(student._id)) || [];

			if (studentProducts.length === 0) {
				// Student has no enrollments - add to 'sem_produto'
				const noProductGroup = groups.find((g) => g.id === 'sem_produto')!;
				noProductGroup.count++;
				noProductGroup.students.push(student);
			} else {
				// Add student to each product group they're enrolled in
				for (const productId of studentProducts) {
					const group = groups.find((g) => g.id === productId);
					if (group) {
						group.count++;
						group.students.push(student);
					}
				}
			}
		}

		return groups;
	},
});

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
			v.literal('formado'),
		),
		assignedCS: v.optional(v.id('users')),
		leadId: v.optional(v.id('leads')),
		lgpdConsent: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		await requirePermission(ctx, PERMISSIONS.STUDENTS_WRITE);
		const organizationId = await getOrganizationId(ctx);

		// Check for existing student with same phone (duplicate prevention)
		const existingStudent = await ctx.db
			.query('students')
			.withIndex('by_phone', (q) => q.eq('phone', args.phone))
			.first();

		if (existingStudent) {
			return existingStudent._id;
		}

		const encryptedCPF = args.cpf ? await encryptCPF(args.cpf) : undefined;
		const encryptedEmail = await encrypt(args.email);
		const encryptedPhone = await encrypt(args.phone);

		const { email: _email, phone: _phone, cpf: _cpf, lgpdConsent, ...safeArgs } = args;

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
		});

		await logAudit(ctx, {
			studentId,
			actionType: lgpdConsent ? 'consent_granted' : 'data_creation',
			dataCategory: 'personal_data',
			description: lgpdConsent
				? 'Student profile created with explicit consent'
				: 'Student profile created',
			legalBasis: lgpdConsent ? 'consentimento' : 'contract_execution',
		});

		// Auto-sync with Asaas (async, don't wait)
		try {
			await ctx.scheduler.runAfter(
				0,
				internal.asaas.mutations.syncStudentAsCustomerInternal as any,
				{
					studentId,
				},
			);
		} catch (_error: any) {}

		// Auto-sync to email marketing (if student has email)
		if (args.email) {
			try {
				await ctx.scheduler.runAfter(0, internal.emailMarketing.syncStudentAsContactInternal, {
					studentId,
					organizationId,
				});
			} catch (_error) {}
		}

		return studentId;
	},
});

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
					v.literal('formado'),
				),
			),
			assignedCS: v.optional(v.id('users')),
			churnRisk: v.optional(v.union(v.literal('baixo'), v.literal('medio'), v.literal('alto'))),
			lastEngagementAt: v.optional(v.number()),
			leadId: v.optional(v.id('leads')),
		}),
	},
	handler: async (ctx, args) => {
		await requirePermission(ctx, PERMISSIONS.STUDENTS_WRITE);

		// biome-ignore lint/suspicious/noExplicitAny: dynamic patch object
		const updates: any = { ...args.patch };

		if (args.patch.cpf) updates.encryptedCPF = await encryptCPF(args.patch.cpf);
		if (args.patch.email) updates.encryptedEmail = await encrypt(args.patch.email);
		if (args.patch.phone) updates.encryptedPhone = await encrypt(args.patch.phone);

		await ctx.db.patch(args.studentId, {
			...updates,
			updatedAt: Date.now(),
		});

		await logAudit(ctx, {
			studentId: args.studentId,
			actionType: 'data_modification',
			dataCategory: 'personal_data',
			description: 'Student profile updated',
			legalBasis: 'contract_execution',
			metadata: { fields: Object.keys(args.patch) },
		});

		// Auto-sync with Asaas if CPF/email/phone changed
		const shouldSync = args.patch.cpf || args.patch.email || args.patch.phone;
		if (shouldSync) {
			try {
				await ctx.scheduler.runAfter(
					0,
					internal.asaas.mutations.syncStudentAsCustomerInternal as any,
					{
						studentId: args.studentId,
					},
				);
			} catch (_error: any) {}
		}
	},
});

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
		await requirePermission(ctx, PERMISSIONS.STUDENTS_WRITE);

		// Buscar todos os alunos sem organizationId
		const studentsWithoutOrg = await ctx.db
			.query('students')
			.filter((q) => q.eq(q.field('organizationId'), undefined))
			.collect();

		// Atualizar cada aluno com o organizationId fornecido
		const updates = [];
		for (const student of studentsWithoutOrg) {
			updates.push(
				ctx.db.patch(student._id, {
					organizationId: args.targetOrganizationId,
					updatedAt: Date.now(),
				}),
			);
		}

		await Promise.all(updates);

		return {
			updatedCount: studentsWithoutOrg.length,
			organizationId: args.targetOrganizationId,
		};
	},
});

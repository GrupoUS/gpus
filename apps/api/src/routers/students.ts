import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, ilike, or } from 'drizzle-orm';
import { z } from 'zod';

import { enrollments, students } from '@repo/shared/db/schema';
import { protectedProcedure, router } from '../_core/trpc';

export const studentsRouter = router({
	/** List students with filters */
	list: protectedProcedure
		.input(
			z.object({
				search: z.string().optional(),
				status: z.enum(['ativo', 'inativo', 'pausado', 'formado']).optional(),
				limit: z.number().min(1).max(100).default(50),
				offset: z.number().min(0).default(0),
			}),
		)
		.query(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) return { data: [], total: 0 };

			const conditions = [eq(students.organizationId, orgId)];

			if (input.search) {
				const term = `%${input.search}%`;
				const searchCondition = or(
					ilike(students.name, term),
					ilike(students.email, term),
					ilike(students.phone, term),
				);
				if (searchCondition) conditions.push(searchCondition);
			}
			if (input.status) {
				conditions.push(eq(students.status, input.status));
			}

			const where = and(...conditions);

			const [data, [{ total }]] = await Promise.all([
				ctx.db
					.select()
					.from(students)
					.where(where)
					.orderBy(desc(students.createdAt))
					.limit(input.limit)
					.offset(input.offset),
				ctx.db.select({ total: count() }).from(students).where(where),
			]);

			return { data, total };
		}),

	/** Get student by ID */
	get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
		const orgId = ctx.user?.organizationId;
		if (!orgId) {
			throw new TRPCError({ code: 'NOT_FOUND', message: 'Paciente não encontrado' });
		}

		const [student] = await ctx.db
			.select()
			.from(students)
			.where(and(eq(students.id, input.id), eq(students.organizationId, orgId)))
			.limit(1);

		if (!student) {
			throw new TRPCError({ code: 'NOT_FOUND', message: 'Paciente não encontrado' });
		}

		// Fetch enrollments
		const studentEnrollments = await ctx.db
			.select()
			.from(enrollments)
			.where(eq(enrollments.studentId, input.id));

		return { ...student, enrollments: studentEnrollments };
	}),

	/** Create student */
	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				email: z.string().email().optional(),
				phone: z.string().min(1),
				cpf: z.string().optional(),
				profession: z.string().optional(),
				professionalId: z.string().optional(),
				hasClinic: z.boolean().optional(),
				clinicName: z.string().optional(),
				clinicCity: z.string().optional(),
				leadId: z.number().optional(),
				lgpdConsent: z.boolean().optional(),
				notes: z.string().optional(),
				birthDate: z.string().optional(),
				address: z.any().optional(),
				products: z.array(z.string()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) {
				throw new TRPCError({ code: 'BAD_REQUEST', message: 'Organization required' });
			}

			const [created] = await ctx.db
				.insert(students)
				.values({
					...input,
					organizationId: orgId,
					status: 'ativo',
				})
				.returning();

			return created;
		}),

	/** Update student */
	update: protectedProcedure
		.input(
			z.object({
				studentId: z.number(),
				patch: z.object({
					name: z.string().optional(),
					email: z.string().optional(),
					phone: z.string().optional(),
					cpf: z.string().optional(),
					profession: z.string().optional(),
					professionalId: z.string().optional(),
					hasClinic: z.boolean().optional(),
					clinicName: z.string().optional(),
					clinicCity: z.string().optional(),
					status: z.enum(['ativo', 'inativo', 'pausado', 'formado']).optional(),
					notes: z.string().optional(),
					birthDate: z.string().optional(),
					address: z.any().optional(),
					products: z.array(z.string()).optional(),
					churnRisk: z.enum(['baixo', 'medio', 'alto']).optional(),
				}),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Paciente não encontrado' });
			}

			const [updated] = await ctx.db
				.update(students)
				.set({ ...input.patch, updatedAt: new Date() })
				.where(and(eq(students.id, input.studentId), eq(students.organizationId, orgId)))
				.returning();

			if (!updated) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Paciente não encontrado' });
			}
			return updated;
		}),

	/** Get churn risk alerts */
	churnAlerts: protectedProcedure.query(async ({ ctx }) => {
		const orgId = ctx.user?.organizationId;
		if (!orgId) return [];

		return await ctx.db
			.select()
			.from(students)
			.where(
				and(
					eq(students.organizationId, orgId),
					eq(students.status, 'ativo'),
					eq(students.churnRisk, 'alto'),
				),
			)
			.orderBy(desc(students.updatedAt))
			.limit(20);
	}),
});

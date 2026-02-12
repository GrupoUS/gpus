import { TRPCError } from '@trpc/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { enrollments } from '@repo/shared/db/schema';
import { protectedProcedure, router } from '../_core/trpc';

export const enrollmentsRouter = router({
	/** List enrollments for a student */
	listByStudent: protectedProcedure
		.input(z.object({ studentId: z.number() }))
		.query(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) return [];

			return await ctx.db
				.select()
				.from(enrollments)
				.where(
					and(eq(enrollments.studentId, input.studentId), eq(enrollments.organizationId, orgId)),
				)
				.orderBy(desc(enrollments.createdAt));
		}),

	/** Get enrollment by ID */
	get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
		const orgId = ctx.user?.organizationId;
		if (!orgId) {
			throw new TRPCError({ code: 'NOT_FOUND', message: 'Matrícula não encontrada' });
		}

		const [enrollment] = await ctx.db
			.select()
			.from(enrollments)
			.where(and(eq(enrollments.id, input.id), eq(enrollments.organizationId, orgId)))
			.limit(1);

		if (!enrollment) {
			throw new TRPCError({ code: 'NOT_FOUND', message: 'Matrícula não encontrada' });
		}
		return enrollment;
	}),

	/** Create enrollment */
	create: protectedProcedure
		.input(
			z.object({
				studentId: z.number(),
				product: z.string(),
				status: z.string().default('active'),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
				totalValue: z.string().optional(),
				installments: z.number().optional(),
				installmentValue: z.string().optional(),
				cohort: z.string().optional(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) {
				throw new TRPCError({ code: 'BAD_REQUEST', message: 'Organization required' });
			}

			const [created] = await ctx.db
				.insert(enrollments)
				.values({
					studentId: input.studentId,
					product: input.product,
					status: input.status as 'aguardando_inicio',
					startDate: input.startDate ? new Date(input.startDate) : undefined,
					endDate: input.endDate ? new Date(input.endDate) : undefined,
					totalValue: input.totalValue,
					installments: input.installments,
					installmentValue: input.installmentValue,
					cohort: input.cohort,
					notes: input.notes,
					organizationId: orgId,
				})
				.returning();

			return created;
		}),

	/** Update enrollment */
	update: protectedProcedure
		.input(
			z.object({
				enrollmentId: z.number(),
				patch: z.object({
					status: z.string().optional(),
					completionPercentage: z.number().optional(),
					practicesCompleted: z.number().optional(),
					notes: z.string().optional(),
					endDate: z.string().optional(),
				}),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Matrícula não encontrada' });
			}

			const updates: Record<string, unknown> = {
				...input.patch,
				updatedAt: new Date(),
			};
			if (input.patch.endDate) {
				updates.endDate = new Date(input.patch.endDate);
			}

			const [updated] = await ctx.db
				.update(enrollments)
				.set(updates)
				.where(and(eq(enrollments.id, input.enrollmentId), eq(enrollments.organizationId, orgId)))
				.returning();

			if (!updated) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Matrícula não encontrada' });
			}
			return updated;
		}),
});

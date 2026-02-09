import { TRPCError } from '@trpc/server';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { asaasConflicts, financialMetrics, objections } from '../../drizzle/schema';
import { protectedProcedure, router } from '../_core/trpc';

export const financialRouter = router({
	/** Financial metrics overview */
	metrics: protectedProcedure.query(async ({ ctx }) => {
		const orgId = ctx.user?.organizationId;
		if (!orgId) return null;

		const [metrics] = await ctx.db
			.select()
			.from(financialMetrics)
			.where(eq(financialMetrics.organizationId, orgId))
			.orderBy(desc(financialMetrics.updatedAt))
			.limit(1);

		return metrics ?? null;
	}),

	/** Asaas integration conflicts */
	conflicts: router({
		list: protectedProcedure.query(async ({ ctx }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) return [];

			return await ctx.db
				.select()
				.from(asaasConflicts)
				.where(eq(asaasConflicts.organizationId, orgId))
				.orderBy(desc(asaasConflicts.createdAt));
		}),

		resolve: protectedProcedure
			.input(
				z.object({
					conflictId: z.number(),
					resolutionNote: z.string(),
				}),
			)
			.mutation(async ({ ctx, input }) => {
				const [updated] = await ctx.db
					.update(asaasConflicts)
					.set({
						status: 'resolved',
						resolutionNote: input.resolutionNote,
						resolvedBy: ctx.user?.clerkId,
						resolvedAt: new Date(),
						updatedAt: new Date(),
					})
					.where(eq(asaasConflicts.id, input.conflictId))
					.returning();

				if (!updated) {
					throw new TRPCError({ code: 'NOT_FOUND', message: 'Conflito não encontrado' });
				}
				return updated;
			}),
	}),

	/** Objections tracking */
	objections: router({
		list: protectedProcedure.query(async ({ ctx }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) return [];

			return await ctx.db
				.select()
				.from(objections)
				.where(eq(objections.organizationId, orgId))
				.orderBy(desc(objections.createdAt));
		}),

		create: protectedProcedure
			.input(
				z.object({
					objectionText: z.string(),
					leadId: z.number().optional(),
				}),
			)
			.mutation(async ({ ctx, input }) => {
				const orgId = ctx.user?.organizationId;
				if (!orgId) {
					throw new TRPCError({ code: 'BAD_REQUEST', message: 'Organization required' });
				}

				const [created] = await ctx.db
					.insert(objections)
					.values({
						objectionText: input.objectionText,
						leadId: input.leadId,
						organizationId: orgId,
						recordedBy: ctx.user?.clerkId ?? '',
					})
					.returning();

				return created;
			}),
	}),
});

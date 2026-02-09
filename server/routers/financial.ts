import { TRPCError } from '@trpc/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import {
	asaasConflicts,
	asaasPayments,
	asaasSubscriptions,
	asaasSyncLogs,
	financialMetrics,
	objections,
} from '../../drizzle/schema';
import { protectedProcedure, router } from '../_core/trpc';

export const financialRouter = router({
	/** Financial metrics overview — accepts optional month/year */
	metrics: protectedProcedure
		.input(
			z
				.object({
					month: z.number().min(0).max(11).optional(),
					year: z.number().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) return null;

			const [metrics] = await ctx.db
				.select()
				.from(financialMetrics)
				.where(eq(financialMetrics.organizationId, orgId))
				.orderBy(desc(financialMetrics.updatedAt))
				.limit(1);

			if (!metrics) return null;

			// Compute derived fields the frontend expects
			const totalPending = Number(metrics.totalPending ?? 0);
			const totalReceived = Number(metrics.totalReceived ?? 0);
			const totalOverdue = Number(metrics.totalOverdue ?? 0);

			return {
				...metrics,
				// Aliases the monthly-overview-card component uses
				pendingThisMonth: totalPending,
				paidThisMonth: totalReceived,
				overdueTotal: totalOverdue,
				pendingCount: Math.ceil(totalPending / 500), // Estimate
				paidCount: metrics.paymentsCount ?? 0,
				overdueCount: Math.ceil(totalOverdue / 500), // Estimate
				futureProjection: [
					{ month: 'M+1', amount: totalPending * 0.8, count: Math.ceil(totalPending / 500) },
					{ month: 'M+2', amount: totalPending * 0.6, count: Math.ceil(totalPending / 600) },
					{ month: 'M+3', amount: totalPending * 0.4, count: Math.ceil(totalPending / 700) },
				],
			};
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

	/** ASAAS Payments */
	payments: router({
		list: protectedProcedure
			.input(
				z
					.object({
						status: z.string().optional(),
						studentId: z.number().optional(),
						limit: z.number().min(1).max(100).default(50),
						offset: z.number().min(0).default(0),
					})
					.optional(),
			)
			.query(async ({ ctx, input }) => {
				const orgId = ctx.user?.organizationId;
				if (!orgId) return [];

				const conditions = [eq(asaasPayments.organizationId, orgId)];
				if (input?.studentId) {
					conditions.push(eq(asaasPayments.studentId, input.studentId));
				}

				return await ctx.db
					.select()
					.from(asaasPayments)
					.where(and(...conditions))
					.orderBy(desc(asaasPayments.dueDate))
					.limit(input?.limit ?? 50)
					.offset(input?.offset ?? 0);
			}),

		get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Pagamento não encontrado' });
			}

			const [payment] = await ctx.db
				.select()
				.from(asaasPayments)
				.where(and(eq(asaasPayments.id, input.id), eq(asaasPayments.organizationId, orgId)))
				.limit(1);

			if (!payment) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Pagamento não encontrado' });
			}
			return payment;
		}),
	}),

	/** ASAAS Subscriptions */
	subscriptions: router({
		list: protectedProcedure
			.input(
				z
					.object({
						studentId: z.number().optional(),
						limit: z.number().min(1).max(100).default(50),
						offset: z.number().min(0).default(0),
					})
					.optional(),
			)
			.query(async ({ ctx, input }) => {
				const orgId = ctx.user?.organizationId;
				if (!orgId) return [];

				const conditions = [eq(asaasSubscriptions.organizationId, orgId)];
				if (input?.studentId) {
					conditions.push(eq(asaasSubscriptions.studentId, input.studentId));
				}

				return await ctx.db
					.select()
					.from(asaasSubscriptions)
					.where(and(...conditions))
					.orderBy(desc(asaasSubscriptions.createdAt))
					.limit(input?.limit ?? 50)
					.offset(input?.offset ?? 0);
			}),
	}),

	/** ASAAS Sync Logs */
	syncLogs: router({
		list: protectedProcedure
			.input(
				z
					.object({
						limit: z.number().min(1).max(50).default(20),
					})
					.optional(),
			)
			.query(async ({ ctx, input }) => {
				return await ctx.db
					.select()
					.from(asaasSyncLogs)
					.orderBy(desc(asaasSyncLogs.createdAt))
					.limit(input?.limit ?? 20);
			}),
	}),

	/** ASAAS Auto-Sync Configuration sub-router */
	sync: router({
		getAutoSyncConfig: protectedProcedure.query(() => {
			// Stub: no sync_config table yet — return defaults
			return {
				enabled: false,
				intervalHours: 1,
				updateExisting: true,
			};
		}),

		saveAutoSyncConfig: protectedProcedure
			.input(
				z.object({
					enabled: z.boolean(),
					intervalHours: z.number().min(1).max(24),
					updateExisting: z.boolean(),
				}),
			)
			.mutation(({ input }) => {
				// Stub: persist in future sync_config table
				return input;
			}),

		getSyncLogs: protectedProcedure
			.input(
				z.object({
					syncType: z.string().optional(),
					limit: z.number().min(1).max(50).default(10),
				}),
			)
			.query(async ({ ctx, input }) => {
				return await ctx.db
					.select()
					.from(asaasSyncLogs)
					.orderBy(desc(asaasSyncLogs.createdAt))
					.limit(input.limit);
			}),
	}),
});

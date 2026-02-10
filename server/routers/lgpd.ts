import { and, desc, eq, inArray, type SQL } from 'drizzle-orm';
import { z } from 'zod';

import { lgpdAudit, lgpdConsent, lgpdRequests, students } from '../../drizzle/schema';
import { protectedProcedure, router } from '../_core/trpc';

export const lgpdRouter = router({
	/** Consent records (per student) */
	consent: router({
		list: protectedProcedure
			.input(z.object({ studentId: z.number() }))
			.query(async ({ ctx, input }) => {
				return await ctx.db
					.select()
					.from(lgpdConsent)
					.where(eq(lgpdConsent.studentId, input.studentId))
					.orderBy(desc(lgpdConsent.grantedAt));
			}),

		grant: protectedProcedure
			.input(
				z.object({
					studentId: z.number(),
					consentType: z.string(),
					consentVersion: z.string(),
					dataCategories: z.array(z.string()),
					justification: z.string().optional(),
					ipAddress: z.string().optional(),
					userAgent: z.string().optional(),
				}),
			)
			.mutation(async ({ ctx, input }) => {
				const [created] = await ctx.db
					.insert(lgpdConsent)
					.values({
						studentId: input.studentId,
						consentType: input.consentType,
						consentVersion: input.consentVersion,
						granted: true,
						grantedAt: new Date(),
						dataCategories: input.dataCategories,
						justification: input.justification,
						ipAddress: input.ipAddress,
						userAgent: input.userAgent,
					})
					.returning();

				return created;
			}),

		withdraw: protectedProcedure
			.input(
				z.object({
					consentId: z.number(),
					reason: z.string().optional(),
				}),
			)
			.mutation(async ({ ctx, input }) => {
				const [updated] = await ctx.db
					.update(lgpdConsent)
					.set({
						granted: false,
						rightsWithdrawal: true,
						withdrawalAt: new Date(),
						withdrawalReason: input.reason,
						isActive: false,
						revokedAt: new Date(),
					})
					.where(eq(lgpdConsent.id, input.consentId))
					.returning();

				return updated;
			}),
	}),

	/** LGPD data requests */
	requests: router({
		list: protectedProcedure
			.input(
				z.object({
					studentId: z.number().optional(),
				}),
			)
			.query(async ({ ctx, input }) => {
				const orgId = ctx.user?.organizationId;
				if (!orgId) return [];

				// Scope to org via student ownership
				const orgStudentRows = await ctx.db
					.select({ id: students.id })
					.from(students)
					.where(eq(students.organizationId, orgId));

				if (orgStudentRows.length === 0) return [];

				const orgStudentIds = orgStudentRows.map((s) => s.id);
				const conditions: SQL[] = [inArray(lgpdRequests.studentId, orgStudentIds)];
				if (input.studentId) {
					conditions.push(eq(lgpdRequests.studentId, input.studentId));
				}

				return await ctx.db
					.select()
					.from(lgpdRequests)
					.where(and(...conditions))
					.orderBy(desc(lgpdRequests.createdAt));
			}),

		create: protectedProcedure
			.input(
				z.object({
					studentId: z.number(),
					requestType: z.string(),
					description: z.string().optional(),
					ipAddress: z.string(),
					userAgent: z.string(),
				}),
			)
			.mutation(async ({ ctx, input }) => {
				const [created] = await ctx.db
					.insert(lgpdRequests)
					.values({
						studentId: input.studentId,
						requestType: input.requestType as 'access',
						status: 'pending',
						description: input.description,
						ipAddress: input.ipAddress,
						userAgent: input.userAgent,
						processedBy: ctx.user?.clerkId ?? '',
					})
					.returning();

				return created;
			}),

		updateStatus: protectedProcedure
			.input(
				z.object({
					requestId: z.number(),
					status: z.string(),
					response: z.string().optional(),
					rejectionReason: z.string().optional(),
				}),
			)
			.mutation(async ({ ctx, input }) => {
				const updates: Record<string, unknown> = {
					status: input.status,
					response: input.response,
					rejectionReason: input.rejectionReason,
					updatedAt: new Date(),
				};
				if (input.status === 'completed') {
					updates.completedAt = new Date();
				}

				const [updated] = await ctx.db
					.update(lgpdRequests)
					.set(updates)
					.where(eq(lgpdRequests.id, input.requestId))
					.returning();

				return updated;
			}),
	}),

	/** Audit log */
	audit: router({
		list: protectedProcedure
			.input(
				z.object({
					studentId: z.number().optional(),
					limit: z.number().min(1).max(100).default(50),
				}),
			)
			.query(async ({ ctx, input }) => {
				const orgId = ctx.user?.organizationId;
				if (!orgId) return [];

				// Scope to org via student ownership
				const orgStudentRows = await ctx.db
					.select({ id: students.id })
					.from(students)
					.where(eq(students.organizationId, orgId));

				const conditions: SQL[] = [];
				if (orgStudentRows.length > 0) {
					conditions.push(
						inArray(
							lgpdAudit.studentId,
							orgStudentRows.map((s) => s.id),
						),
					);
				}
				if (input.studentId) {
					conditions.push(eq(lgpdAudit.studentId, input.studentId));
				}

				return await ctx.db
					.select()
					.from(lgpdAudit)
					.where(conditions.length ? and(...conditions) : undefined)
					.orderBy(desc(lgpdAudit.createdAt))
					.limit(input.limit);
			}),
	}),

	/** Data breach records */
	breaches: router({
		list: protectedProcedure.query(() => {
			// Note: lgpdDataBreach has no organizationId column
			// In production, add proper access control
			return [];
		}),
	}),
});

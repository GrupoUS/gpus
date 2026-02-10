import { TRPCError } from '@trpc/server';
import { and, desc, eq, ilike } from 'drizzle-orm';
import { z } from 'zod';

import {
	customFields,
	customFieldValues,
	dailyMetrics,
	leadTags,
	notifications,
	settings,
	tags,
} from '../../drizzle/schema';
import { protectedProcedure, router } from '../_core/trpc';

// ── Settings (org-scoped via key prefix: org:{orgId}:key) ──
export const settingsRouter = router({
	get: protectedProcedure.input(z.object({ key: z.string() })).query(async ({ ctx, input }) => {
		const orgId = ctx.user?.organizationId;
		const scopedKey = orgId ? `org:${orgId}:${input.key}` : input.key;

		const [setting] = await ctx.db
			.select()
			.from(settings)
			.where(eq(settings.key, scopedKey))
			.limit(1);

		return setting?.value ?? null;
	}),

	set: protectedProcedure
		.input(z.object({ key: z.string(), value: z.any() }))
		.mutation(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			const scopedKey = orgId ? `org:${orgId}:${input.key}` : input.key;

			const [existing] = await ctx.db
				.select()
				.from(settings)
				.where(eq(settings.key, scopedKey))
				.limit(1);

			if (existing) {
				const [updated] = await ctx.db
					.update(settings)
					.set({ value: input.value, updatedAt: new Date() })
					.where(eq(settings.id, existing.id))
					.returning();
				return updated;
			}

			const [created] = await ctx.db
				.insert(settings)
				.values({
					key: scopedKey,
					value: input.value,
				})
				.returning();

			return created;
		}),

	list: protectedProcedure.query(async ({ ctx }) => {
		const orgId = ctx.user?.organizationId;
		if (!orgId) return [];

		return await ctx.db
			.select()
			.from(settings)
			.where(ilike(settings.key, `org:${orgId}:%`));
	}),
});

// ── Notifications ──
export const notificationsRouter = router({
	list: protectedProcedure
		.input(z.object({ limit: z.number().min(1).max(50).default(20) }))
		.query(async ({ ctx, input }) => {
			if (!ctx.user) return [];

			return await ctx.db
				.select()
				.from(notifications)
				.where(eq(notifications.recipientId, ctx.user.clerkId))
				.orderBy(desc(notifications.createdAt))
				.limit(input.limit);
		}),

	markRead: protectedProcedure
		.input(z.object({ notificationId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const [updated] = await ctx.db
				.update(notifications)
				.set({ read: true, readAt: new Date() })
				.where(eq(notifications.id, input.notificationId))
				.returning();
			return updated;
		}),

	markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
		if (!ctx.user) return;

		await ctx.db
			.update(notifications)
			.set({ read: true, readAt: new Date() })
			.where(and(eq(notifications.recipientId, ctx.user.clerkId), eq(notifications.read, false)));

		return { success: true };
	}),
});

// ── Tags ──
export const tagsRouter = router({
	list: protectedProcedure.query(async ({ ctx }) => {
		const orgId = ctx.user?.organizationId;
		if (!orgId) return [];

		return await ctx.db.select().from(tags).where(eq(tags.organizationId, orgId));
	}),

	searchTags: protectedProcedure
		.input(z.object({ query: z.string() }))
		.query(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) return [];

			const conditions = [eq(tags.organizationId, orgId)];
			if (input.query) {
				conditions.push(ilike(tags.name, `%${input.query}%`));
			}

			return await ctx.db
				.select()
				.from(tags)
				.where(and(...conditions))
				.limit(20);
		}),

	getLeadTags: protectedProcedure
		.input(z.object({ leadId: z.number() }))
		.query(async ({ ctx, input }) => {
			const rows = await ctx.db
				.select({
					id: tags.id,
					name: tags.name,
					displayName: tags.displayName,
					color: tags.color,
				})
				.from(leadTags)
				.innerJoin(tags, eq(leadTags.tagId, tags.id))
				.where(eq(leadTags.leadId, input.leadId));

			return rows;
		}),

	addTagToLead: protectedProcedure
		.input(z.object({ leadId: z.number(), tagId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Organization required' });

			const [created] = await ctx.db
				.insert(leadTags)
				.values({
					leadId: input.leadId,
					tagId: input.tagId,
					organizationId: orgId,
					addedBy: ctx.user?.clerkId ?? '',
				})
				.returning();

			return created;
		}),

	removeTagFromLead: protectedProcedure
		.input(z.object({ leadId: z.number(), tagId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db
				.delete(leadTags)
				.where(and(eq(leadTags.leadId, input.leadId), eq(leadTags.tagId, input.tagId)));

			return { success: true };
		}),

	create: protectedProcedure
		.input(z.object({ name: z.string(), color: z.string().optional() }))
		.mutation(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) {
				throw new TRPCError({ code: 'BAD_REQUEST', message: 'Organization required' });
			}

			const [created] = await ctx.db
				.insert(tags)
				.values({ ...input, organizationId: orgId, createdBy: ctx.user?.clerkId ?? '' })
				.returning();

			return created;
		}),

	delete: protectedProcedure
		.input(z.object({ tagId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db.delete(tags).where(eq(tags.id, input.tagId));
			return { success: true };
		}),
});

// ── Metrics ──
export const metricsRouter = router({
	daily: protectedProcedure
		.input(
			z.object({
				date: z.string().optional(),
				period: z.enum(['7d', '30d', '90d', 'year']).optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) return null;

			const conditions = [eq(dailyMetrics.organizationId, orgId)];

			// Determine date range from period
			let limit = 30;
			if (input.date) {
				conditions.push(eq(dailyMetrics.date, input.date));
				limit = 1;
			} else if (input.period) {
				const periodDays: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, year: 365 };
				limit = periodDays[input.period] ?? 30;
			}

			const results = await ctx.db
				.select()
				.from(dailyMetrics)
				.where(and(...conditions))
				.orderBy(desc(dailyMetrics.date))
				.limit(limit);

			// If single date requested, return raw row
			if (input.date) return results[0] ?? null;

			// Compute aggregates for period queries
			const totalLeads = results.reduce((sum, r) => sum + (r.newLeads ?? 0), 0);
			const totalConversions = results.reduce((sum, r) => sum + (r.conversions ?? 0), 0);
			const revenue = results.reduce((sum, r) => sum + Number(r.conversionValue ?? 0), 0);
			const totalMessages = results.reduce(
				(sum, r) => sum + (r.messagesSent ?? 0) + (r.messagesReceived ?? 0),
				0,
			);
			const conversionRate =
				totalLeads > 0 ? Math.round((totalConversions / totalLeads) * 100 * 10) / 10 : 0;
			const closedWon = results.reduce((sum, r) => sum + (r.closedWon ?? 0), 0);
			const closedLost = results.reduce((sum, r) => sum + (r.closedLost ?? 0), 0);

			// Aggregate leadsByProduct from jsonb
			const leadsByProduct: Record<string, number> = {};
			for (const r of results) {
				const lbp = r.leadsByProduct as Record<string, number> | null;
				if (lbp) {
					for (const [key, val] of Object.entries(lbp)) {
						leadsByProduct[key] = (leadsByProduct[key] ?? 0) + (val ?? 0);
					}
				}
			}

			// Compute revenue trend (compare first half vs second half of period)
			const midpoint = Math.floor(results.length / 2);
			const recentRevenue = results
				.slice(0, midpoint)
				.reduce((s, r) => s + Number(r.conversionValue ?? 0), 0);
			const olderRevenue = results
				.slice(midpoint)
				.reduce((s, r) => s + Number(r.conversionValue ?? 0), 0);
			const revenueTrend =
				olderRevenue > 0 ? ((recentRevenue - olderRevenue) / olderRevenue) * 100 : 0;

			return {
				totalLeads,
				revenue,
				conversionRate,
				totalMessages,
				revenueTrend,
				leadsByProduct,
				funnel: {
					novo: totalLeads,
					qualificado: results.reduce((s, r) => s + (r.qualifiedLeads ?? 0), 0),
					fechado_ganho: closedWon,
					fechado_perdido: closedLost,
				},
				dailyMetrics: results.map((r) => ({
					date: r.date,
					newLeads: r.newLeads ?? 0,
					conversions: r.conversions ?? 0,
					conversionValue: Number(r.conversionValue ?? 0),
					messagesSent: r.messagesSent ?? 0,
					messagesReceived: r.messagesReceived ?? 0,
				})),
			};
		}),
});

// ── Custom Fields ──
export const customFieldsRouter = router({
	list: protectedProcedure
		.input(z.object({ entityType: z.enum(['lead', 'student']).optional() }))
		.query(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) return [];

			const conditions = [eq(customFields.organizationId, orgId)];
			if (input.entityType) {
				conditions.push(eq(customFields.entityType, input.entityType));
			}

			return await ctx.db
				.select()
				.from(customFields)
				.where(and(...conditions));
		}),

	create: protectedProcedure
		.input(
			z.object({
				name: z.string(),
				label: z.string(),
				fieldType: z.enum(['text', 'number', 'date', 'select', 'multiselect', 'boolean']),
				entityType: z.enum(['lead', 'student']),
				description: z.string().optional(),
				options: z.any().optional(),
				isRequired: z.boolean().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) {
				throw new TRPCError({ code: 'BAD_REQUEST', message: 'Organization required' });
			}

			const [created] = await ctx.db
				.insert(customFields)
				.values({
					...input,
					organizationId: orgId,
					createdBy: ctx.user?.clerkId,
					active: true,
				})
				.returning();

			return created;
		}),

	getValues: protectedProcedure
		.input(z.object({ entityId: z.string() }))
		.query(async ({ ctx, input }) => {
			return await ctx.db
				.select()
				.from(customFieldValues)
				.where(eq(customFieldValues.entityId, input.entityId));
		}),

	setValue: protectedProcedure
		.input(
			z.object({
				customFieldId: z.number(),
				entityId: z.string(),
				entityType: z.enum(['lead', 'student']),
				value: z.any(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) {
				throw new TRPCError({ code: 'BAD_REQUEST', message: 'Organization required' });
			}

			const [existing] = await ctx.db
				.select()
				.from(customFieldValues)
				.where(
					and(
						eq(customFieldValues.customFieldId, input.customFieldId),
						eq(customFieldValues.entityId, input.entityId),
					),
				)
				.limit(1);

			if (existing) {
				const [updated] = await ctx.db
					.update(customFieldValues)
					.set({
						value: input.value,
						updatedBy: ctx.user?.clerkId,
						updatedAt: new Date(),
					})
					.where(eq(customFieldValues.id, existing.id))
					.returning();
				return updated;
			}

			const [created] = await ctx.db
				.insert(customFieldValues)
				.values({
					customFieldId: input.customFieldId,
					entityId: input.entityId,
					entityType: input.entityType,
					organizationId: orgId,
					value: input.value,
					updatedBy: ctx.user?.clerkId,
				})
				.returning();

			return created;
		}),
});

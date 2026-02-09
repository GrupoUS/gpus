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

// ── Settings (global key-value, no org scope) ──
export const settingsRouter = router({
	get: protectedProcedure.input(z.object({ key: z.string() })).query(async ({ ctx, input }) => {
		const [setting] = await ctx.db
			.select()
			.from(settings)
			.where(eq(settings.key, input.key))
			.limit(1);

		return setting?.value ?? null;
	}),

	set: protectedProcedure
		.input(z.object({ key: z.string(), value: z.any() }))
		.mutation(async ({ ctx, input }) => {
			const [existing] = await ctx.db
				.select()
				.from(settings)
				.where(eq(settings.key, input.key))
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
					key: input.key,
					value: input.value,
				})
				.returning();

			return created;
		}),

	list: protectedProcedure.query(async ({ ctx }) => {
		return await ctx.db.select().from(settings);
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
		.input(z.object({ date: z.string().optional() }))
		.query(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) return null;

			const conditions = [eq(dailyMetrics.organizationId, orgId)];
			if (input.date) {
				conditions.push(eq(dailyMetrics.date, input.date));
			}

			const results = await ctx.db
				.select()
				.from(dailyMetrics)
				.where(and(...conditions))
				.orderBy(desc(dailyMetrics.date))
				.limit(input.date ? 1 : 30);

			return input.date ? (results[0] ?? null) : results;
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

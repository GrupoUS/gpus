import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import {
	emailCampaigns,
	emailContacts,
	emailEvents,
	emailLists,
	emailTemplates,
	messageTemplates,
} from '@repo/shared/db/schema';
import { protectedProcedure, router } from '../_core/trpc';

// ── Message Templates (WhatsApp/SMS) ──
export const templatesRouter = router({
	list: protectedProcedure.query(async ({ ctx }) => {
		const orgId = ctx.user?.organizationId;
		if (!orgId) return [];

		return await ctx.db
			.select()
			.from(messageTemplates)
			.where(eq(messageTemplates.organizationId, orgId));
	}),

	create: protectedProcedure
		.input(
			z.object({
				title: z.string(),
				content: z.string(),
				category: z.string(),
				variables: z.array(z.string()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) throw new Error('Organization required');

			const [created] = await ctx.db
				.insert(messageTemplates)
				.values({
					title: input.title,
					content: input.content,
					category: input.category as 'follow_up',
					variables: input.variables,
					organizationId: orgId,
					createdBy: ctx.user?.clerkId ?? '',
				})
				.returning();

			return created;
		}),
});

// ── Email Marketing ──
export const emailMarketingRouter = router({
	// ── Contacts ──
	contacts: router({
		list: protectedProcedure.query(async ({ ctx }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) return [];

			return await ctx.db
				.select()
				.from(emailContacts)
				.where(eq(emailContacts.organizationId, orgId))
				.orderBy(desc(emailContacts.createdAt));
		}),
	}),

	// ── Lists ──
	lists: router({
		list: protectedProcedure.query(async ({ ctx }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) return [];

			return await ctx.db.select().from(emailLists).where(eq(emailLists.organizationId, orgId));
		}),

		create: protectedProcedure
			.input(z.object({ name: z.string(), description: z.string().optional() }))
			.mutation(async ({ ctx, input }) => {
				const orgId = ctx.user?.organizationId;
				if (!orgId) throw new Error('Organization required');

				const [created] = await ctx.db
					.insert(emailLists)
					.values({
						name: input.name,
						description: input.description,
						organizationId: orgId,
					})
					.returning();

				return created;
			}),
	}),

	// ── Campaigns ──
	campaigns: router({
		list: protectedProcedure.query(async ({ ctx }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) return [];

			return await ctx.db
				.select()
				.from(emailCampaigns)
				.where(eq(emailCampaigns.organizationId, orgId))
				.orderBy(desc(emailCampaigns.createdAt));
		}),

		get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
			const [campaign] = await ctx.db
				.select()
				.from(emailCampaigns)
				.where(eq(emailCampaigns.id, input.id))
				.limit(1);
			return campaign ?? null;
		}),

		create: protectedProcedure
			.input(
				z.object({
					name: z.string(),
					subject: z.string(),
					htmlContent: z.string().optional(),
					listIds: z.array(z.number()).optional(),
					templateId: z.number().optional(),
					scheduledAt: z.string().optional(),
				}),
			)
			.mutation(async ({ ctx, input }) => {
				const orgId = ctx.user?.organizationId;
				if (!orgId) throw new Error('Organization required');

				const [created] = await ctx.db
					.insert(emailCampaigns)
					.values({
						name: input.name,
						subject: input.subject,
						htmlContent: input.htmlContent,
						listIds: input.listIds ?? [],
						templateId: input.templateId,
						organizationId: orgId,
						status: 'draft',
						createdBy: ctx.user?.id ?? 0,
						scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
					})
					.returning();

				return created;
			}),
	}),

	// ── Email Templates ──
	templates: router({
		list: protectedProcedure.query(async ({ ctx }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) return [];

			return await ctx.db
				.select()
				.from(emailTemplates)
				.where(eq(emailTemplates.organizationId, orgId));
		}),

		create: protectedProcedure
			.input(
				z.object({
					name: z.string(),
					subject: z.string(),
					htmlContent: z.string(),
					category: z.string().optional(),
				}),
			)
			.mutation(async ({ ctx, input }) => {
				const orgId = ctx.user?.organizationId;
				if (!orgId) throw new Error('Organization required');

				const [created] = await ctx.db
					.insert(emailTemplates)
					.values({
						name: input.name,
						subject: input.subject,
						htmlContent: input.htmlContent,
						category: input.category,
						organizationId: orgId,
					})
					.returning();

				return created;
			}),
	}),

	// ── Events ──
	events: router({
		list: protectedProcedure
			.input(z.object({ campaignId: z.number() }))
			.query(async ({ ctx, input }) => {
				return await ctx.db
					.select()
					.from(emailEvents)
					.where(eq(emailEvents.campaignId, input.campaignId))
					.orderBy(desc(emailEvents.createdAt));
			}),
	}),
});

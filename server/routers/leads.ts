import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';

import { activities, leads } from '../../drizzle/schema';
import { protectedProcedure, publicProcedure, router } from '../_core/trpc';

const leadStages = [
	'novo',
	'primeiro_contato',
	'qualificado',
	'proposta',
	'negociacao',
	'fechado_ganho',
	'fechado_perdido',
] as const;

const leadSources = [
	'whatsapp',
	'instagram',
	'landing_page',
	'indicacao',
	'evento',
	'organico',
	'trafego_pago',
	'outro',
] as const;

const temperatures = ['frio', 'morno', 'quente'] as const;

export const leadsRouter = router({
	/** List leads with filters and pagination */
	list: protectedProcedure
		.input(
			z.object({
				stage: z.enum(leadStages).optional(),
				stages: z.array(z.enum(leadStages)).optional(),
				search: z.string().optional(),
				temperature: z.array(z.enum(temperatures)).optional(),
				source: z.array(z.enum(leadSources)).optional(),
				assignedTo: z.string().optional(),
				limit: z.number().min(1).max(100).default(50),
				offset: z.number().min(0).default(0),
			}),
		)
		.query(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) return { data: [], total: 0 };

			const conditions = [eq(leads.organizationId, orgId)];

			if (input.stage) {
				conditions.push(eq(leads.stage, input.stage));
			}
			if (input.stages?.length) {
				conditions.push(inArray(leads.stage, input.stages));
			}
			if (input.search) {
				conditions.push(
					sql`(${leads.name} ILIKE ${`%${input.search}%`} OR ${leads.email} ILIKE ${`%${input.search}%`} OR ${leads.phone} ILIKE ${`%${input.search}%`})`,
				);
			}
			if (input.temperature?.length) {
				conditions.push(inArray(leads.temperature, input.temperature));
			}
			if (input.source?.length) {
				conditions.push(inArray(leads.source, input.source));
			}
			if (input.assignedTo) {
				conditions.push(eq(leads.assignedTo, input.assignedTo));
			}

			const where = and(...conditions);

			const [data, [{ total }]] = await Promise.all([
				ctx.db
					.select()
					.from(leads)
					.where(where)
					.orderBy(desc(leads.createdAt))
					.limit(input.limit)
					.offset(input.offset),
				ctx.db.select({ total: count() }).from(leads).where(where),
			]);

			return { data, total };
		}),

	/** Get single lead by ID */
	get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
		const orgId = ctx.user?.organizationId;
		if (!orgId) {
			throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead não encontrado' });
		}

		const [lead] = await ctx.db
			.select()
			.from(leads)
			.where(and(eq(leads.id, input.id), eq(leads.organizationId, orgId)))
			.limit(1);

		if (!lead) {
			throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead não encontrado' });
		}
		return lead;
	}),

	/** Get recent leads */
	recent: protectedProcedure
		.input(z.object({ limit: z.number().min(1).max(20).default(5) }))
		.query(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) return [];

			return await ctx.db
				.select()
				.from(leads)
				.where(eq(leads.organizationId, orgId))
				.orderBy(desc(leads.createdAt))
				.limit(input.limit);
		}),

	/** Get lead stats by stage */
	stats: protectedProcedure.query(async ({ ctx }) => {
		const orgId = ctx.user?.organizationId;
		if (!orgId) {
			return { total: 0, byStage: {}, byTemperature: {} };
		}

		const [totalResult] = await ctx.db
			.select({ total: count() })
			.from(leads)
			.where(eq(leads.organizationId, orgId));

		const byStageResult = await ctx.db
			.select({ stage: leads.stage, count: count() })
			.from(leads)
			.where(eq(leads.organizationId, orgId))
			.groupBy(leads.stage);

		const byTempResult = await ctx.db
			.select({ temperature: leads.temperature, count: count() })
			.from(leads)
			.where(eq(leads.organizationId, orgId))
			.groupBy(leads.temperature);

		const byStage = Object.fromEntries(byStageResult.map((r) => [r.stage, r.count]));
		const byTemperature = Object.fromEntries(byTempResult.map((r) => [r.temperature, r.count]));

		return { total: totalResult?.total ?? 0, byStage, byTemperature };
	}),

	/** Create a new lead */
	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				phone: z.string().min(1),
				email: z.string().email().optional(),
				source: z.enum(leadSources).optional(),
				sourceDetail: z.string().optional(),
				stage: z.enum(leadStages).default('novo'),
				temperature: z.enum(temperatures).default('frio'),
				observations: z.string().optional(),
				assignedTo: z.string().optional(),
				score: z.number().optional(),
				lgpdConsent: z.boolean().optional(),
				// UTM
				utmSource: z.string().optional(),
				utmMedium: z.string().optional(),
				utmCampaign: z.string().optional(),
				utmTerm: z.string().optional(),
				utmContent: z.string().optional(),
				// Qualification
				hasClinic: z.boolean().optional(),
				clinicName: z.string().optional(),
				clinicCity: z.string().optional(),
				yearsInAesthetics: z.number().optional(),
				currentRevenue: z.string().optional(),
				mainDesire: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) {
				throw new TRPCError({ code: 'BAD_REQUEST', message: 'Organization required' });
			}

			const [created] = await ctx.db
				.insert(leads)
				.values({
					...input,
					organizationId: orgId,
					assignedTo: input.assignedTo ?? ctx.user?.clerkId,
				})
				.returning();

			// Log activity
			await ctx.db.insert(activities).values({
				organizationId: orgId,
				type: 'lead_criado',
				description: `Lead "${input.name}" criado`,
				leadId: created.id,
				userId: ctx.user?.clerkId,
			});

			return created;
		}),

	/** Create public lead (landing page, no auth) */
	createPublic: publicProcedure
		.input(
			z.object({
				name: z.string().min(1),
				phone: z.string().min(1),
				email: z.string().email().optional(),
				source: z.enum(leadSources).optional(),
				sourceDetail: z.string().optional(),
				lgpdConsent: z.boolean().default(true),
				utmSource: z.string().optional(),
				utmMedium: z.string().optional(),
				utmCampaign: z.string().optional(),
				utmTerm: z.string().optional(),
				utmContent: z.string().optional(),
				organizationId: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [created] = await ctx.db
				.insert(leads)
				.values({
					...input,
					stage: 'novo',
					temperature: 'frio',
					consentGrantedAt: input.lgpdConsent ? new Date() : undefined,
				})
				.returning();

			return { id: created.id };
		}),

	/** Update lead */
	update: protectedProcedure
		.input(
			z.object({
				leadId: z.number(),
				patch: z.object({
					name: z.string().optional(),
					phone: z.string().optional(),
					email: z.string().optional(),
					source: z.enum(leadSources).optional(),
					sourceDetail: z.string().optional(),
					stage: z.enum(leadStages).optional(),
					temperature: z.enum(temperatures).optional(),
					observations: z.string().optional(),
					assignedTo: z.string().optional(),
					score: z.number().optional(),
					nextFollowUpAt: z.date().optional(),
					// UTM
					utmSource: z.string().optional(),
					utmMedium: z.string().optional(),
					utmCampaign: z.string().optional(),
					utmTerm: z.string().optional(),
					// Qualification
					hasClinic: z.boolean().optional(),
					clinicName: z.string().optional(),
					clinicCity: z.string().optional(),
					yearsInAesthetics: z.number().optional(),
					currentRevenue: z.string().optional(),
					mainDesire: z.string().optional(),
				}),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead não encontrado' });
			}

			const [updated] = await ctx.db
				.update(leads)
				.set({ ...input.patch, updatedAt: new Date() })
				.where(and(eq(leads.id, input.leadId), eq(leads.organizationId, orgId)))
				.returning();

			if (!updated) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead não encontrado' });
			}
			return updated;
		}),

	/** Update lead stage (pipeline movement) */
	updateStage: protectedProcedure
		.input(
			z.object({
				leadId: z.number(),
				newStage: z.enum(leadStages),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead não encontrado' });
			}

			const [lead] = await ctx.db
				.select()
				.from(leads)
				.where(and(eq(leads.id, input.leadId), eq(leads.organizationId, orgId)))
				.limit(1);

			if (!lead) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead não encontrado' });
			}

			const oldStage = lead.stage;
			const updates: Record<string, unknown> = {
				stage: input.newStage,
				updatedAt: new Date(),
			};

			if (input.newStage === 'fechado_ganho') {
				updates.convertedAt = new Date();
			}

			const [updated] = await ctx.db
				.update(leads)
				.set(updates)
				.where(and(eq(leads.id, input.leadId), eq(leads.organizationId, orgId)))
				.returning();

			// Log stage change activity
			await ctx.db.insert(activities).values({
				organizationId: lead.organizationId ?? '',
				type: 'stage_changed',
				description: `Lead movido de "${oldStage}" para "${input.newStage}"`,
				leadId: input.leadId,
				userId: ctx.user?.clerkId,
			});

			return updated;
		}),

	/** Bulk import leads from spreadsheet */
	importLeads: protectedProcedure
		.input(
			z.object({
				leads: z.array(
					z.object({
						name: z.string().min(1),
						phone: z.string().min(1),
						email: z.string().optional(),
						source: z.string().optional(),
					}),
				),
				defaultProduct: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) {
				throw new TRPCError({ code: 'BAD_REQUEST', message: 'Organization required' });
			}

			const results: { index: number; success: boolean; error?: string }[] = [];
			let success = 0;
			let failed = 0;

			for (let i = 0; i < input.leads.length; i++) {
				try {
					await ctx.db
						.insert(leads)
						.values({
							name: input.leads[i].name,
							phone: input.leads[i].phone,
							email: input.leads[i].email || undefined,
							source: 'outro',
							organizationId: orgId,
							stage: 'novo',
							temperature: 'frio',
						})
						.returning();
					results.push({ index: i, success: true });
					success++;
				} catch (err) {
					results.push({
						index: i,
						success: false,
						error: err instanceof Error ? err.message : 'Erro desconhecido',
					});
					failed++;
				}
			}

			return { total: input.leads.length, success, failed, results };
		}),

	/** Delete lead */
	delete: protectedProcedure
		.input(z.object({ leadId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const orgId = ctx.user?.organizationId;
			if (!orgId) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead não encontrado' });
			}

			const [deleted] = await ctx.db
				.delete(leads)
				.where(and(eq(leads.id, input.leadId), eq(leads.organizationId, orgId)))
				.returning();

			if (!deleted) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead não encontrado' });
			}
			return { success: true };
		}),
});

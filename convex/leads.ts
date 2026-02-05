import {
	type FunctionReference,
	type PaginationOptions,
	paginationOptsValidator,
	type SchedulableFunctionReference,
} from 'convex/server';
import { v } from 'convex/values';

import type { Doc, Id } from './_generated/dataModel';
import { internalMutation, internalQuery, mutation, query } from './_generated/server';
import { setCustomFieldValueInternal } from './customFields';
import { getOrganizationId, requirePermission } from './lib/auth';
import { PERMISSIONS } from './lib/permissions';

interface ListLeadsArgs {
	paginationOpts: PaginationOptions;
	stage?: string;
	stages?: string[];
	search?: string;
	temperature?: string[];
	products?: string[];
	source?: string[];
	tags?: Id<'tags'>[];
}

interface InternalApi {
	emailMarketing: {
		syncLeadAsContactInternal: SchedulableFunctionReference;
	};
	referrals: {
		calculateCashback: SchedulableFunctionReference;
	};
	tasks: {
		internalCreateTask: FunctionReference<'mutation', 'internal'>;
	};
}

const getInternalApi = (): InternalApi => {
	const apiModule = require('./_generated/api') as unknown;
	return (apiModule as { internal: InternalApi }).internal;
};

// Common args for lead creation/update
const leadArgs = {
	name: v.string(),
	phone: v.string(),
	email: v.optional(v.string()), // Optional in schema? Schema says v.optional now? Wait, schema has email: v.optional(v.string()) in my update?
	// Let's check schema update in Step 33.
	// Schema line 59: email: v.optional(v.string())
	// So email is optional.

	source: v.any(), // Keeping v.any() for now as schema has v.union but args can be looser or match

	// New fields
	lgpdConsent: v.optional(v.boolean()),
	whatsappConsent: v.optional(v.boolean()),
	message: v.optional(v.string()),

	// UTM
	utmSource: v.optional(v.string()),
	utmCampaign: v.optional(v.string()),
	utmMedium: v.optional(v.string()),
	utmContent: v.optional(v.string()),
	utmTerm: v.optional(v.string()),

	// Custom Fields
	customFieldValues: v.optional(
		v.array(
			v.object({
				customFieldId: v.id('customFields'),
				value: v.any(),
			}),
		),
	),

	sourceDetail: v.optional(v.string()),

	// Existing
	profession: v.optional(v.any()), // v.any() to match existing 'leads.ts' looseness or strict?
	// Schema line 94: profession: v.optional(v.union(...))
	// leadArgs used v.optional(v.any()) previously.

	interestedProduct: v.optional(v.any()),
	temperature: v.optional(v.any()),
	stage: v.optional(v.any()),

	// Clinic qualification
	hasClinic: v.optional(v.boolean()),
	clinicName: v.optional(v.string()),
	clinicCity: v.optional(v.string()),

	// Professional background
	yearsInAesthetics: v.optional(v.number()),
	currentRevenue: v.optional(v.string()),

	// Pain point diagnosis
	mainPain: v.optional(v.any()),
	mainDesire: v.optional(v.string()),

	score: v.optional(v.number()),
	nextFollowUpAt: v.optional(v.number()),
};

export const listLeads = query({
	args: {
		paginationOpts: paginationOptsValidator,
		stage: v.optional(v.string()),
		stages: v.optional(v.array(v.string())),
		search: v.optional(v.string()),
		temperature: v.optional(v.array(v.string())),
		products: v.optional(v.array(v.string())),
		source: v.optional(v.array(v.string())),
		tags: v.optional(v.array(v.id('tags'))),
	},
	handler: async (ctx, args: ListLeadsArgs) => {
		// 1. Verify Auth & Permissions
		await requirePermission(ctx, PERMISSIONS.LEADS_READ);
		const organizationId = await getOrganizationId(ctx);
		if (!organizationId) {
			return { page: [], isDone: true, continueCursor: '' };
		}

		// Optimization: Use index if filtering by a single stage
		const singleStage =
			(args.stages?.length === 1 ? args.stages[0] : null) ??
			(args.stage && args.stage !== 'all' ? args.stage : null);

		let leadQuery = singleStage
			? ctx.db
					.query('leads')
					.withIndex('by_organization_stage', (q) =>
						q
							.eq('organizationId', organizationId)
							.eq(
								'stage',
								singleStage as
									| 'novo'
									| 'primeiro_contato'
									| 'qualificado'
									| 'proposta'
									| 'negociacao'
									| 'fechado_ganho'
									| 'fechado_perdido',
							),
					)
			: ctx.db
					.query('leads')
					.withIndex('by_organization', (q) => q.eq('organizationId', organizationId));

		// Apply filters before pagination to preserve page size guarantees
		leadQuery = leadQuery.filter((q) => {
			const filters: ReturnType<typeof q.eq>[] = [];

			// Filter by multiple stages if applicable (when not already filtered by index)
			if (!singleStage && args.stages && args.stages.length > 0) {
				filters.push(q.or(...args.stages.map((stage) => q.eq(q.field('stage'), stage))));
			} else if (!singleStage && args.stage && args.stage !== 'all') {
				filters.push(q.eq(q.field('stage'), args.stage));
			}

			// Filter by temperature
			if (args.temperature && args.temperature.length > 0) {
				filters.push(
					q.or(...args.temperature.map((temperature) => q.eq(q.field('temperature'), temperature))),
				);
			}

			// Filter by product
			if (args.products && args.products.length > 0) {
				filters.push(
					q.and(
						q.neq(q.field('interestedProduct'), undefined),
						q.or(...args.products.map((product) => q.eq(q.field('interestedProduct'), product))),
					),
				);
			}

			// Filter by source
			if (args.source && args.source.length > 0) {
				filters.push(q.or(...args.source.map((source) => q.eq(q.field('source'), source))));
			}

			return filters.length > 0 ? q.and(...filters) : true;
		});

		// Custom Pagination Loop to handle Post-Query Filtering (Tags & Search)
		const { numItems, cursor } = args.paginationOpts;
		const accumulatedResults: Doc<'leads'>[] = [];
		let currentCursor = cursor;
		let isDone = false;

		// Loop until we have enough items or the query is exhausted
		// Use a safety break to prevent infinite loops if something goes wrong (e.g. 100 iterations)
		let iterations = 0;
		const MAX_ITERATIONS = 50;

		while (accumulatedResults.length < numItems && !isDone && iterations < MAX_ITERATIONS) {
			iterations++;

			// Fetch a page from the database
			// We ask for 'numItems' to maximize the chance of filling the page,
			// assuming some items might be filtered out.
			const pageResult = await leadQuery.order('desc').paginate({
				cursor: currentCursor,
				numItems,
			});

			let candidates: Doc<'leads'>[] = pageResult.page;

			// 1. Memory Search Filter (Convex doesn't support substring search in DB yet)
			if (args.search) {
				const searchLower = args.search.toLowerCase();
				candidates = candidates.filter(
					(lead) =>
						lead.name.toLowerCase().includes(searchLower) ||
						lead.phone.includes(searchLower) ||
						lead.email?.toLowerCase().includes(searchLower),
				);
			}

			// 2. Tag Filter (using by_lead index)
			if (args.tags && args.tags.length > 0) {
				// Check which candidates have at least one of the requested tags
				// Check which candidates have at least one of the requested tags

				// Process in parallel for checking tags of current batch
				const tagChecks = await Promise.all(
					candidates.map(async (lead) => {
						const tags = args.tags ?? [];
						const hasTag = await ctx.db
							.query('leadTags')
							.withIndex('by_lead', (q) => q.eq('leadId', lead._id))
							.filter((q) => q.or(...tags.map((tagId) => q.eq(q.field('tagId'), tagId))))
							.first();
						return hasTag ? lead : null;
					}),
				);

				candidates = tagChecks.filter((lead): lead is Doc<'leads'> => lead !== null);
			}

			accumulatedResults.push(...candidates);
			currentCursor = pageResult.continueCursor;
			isDone = pageResult.isDone;
		}

		return {
			page: accumulatedResults,
			isDone,
			continueCursor: currentCursor,
		};
	},
});

export const createLead = mutation({
	args: {
		...leadArgs,
		assignedTo: v.optional(v.id('users')),
		referredById: v.optional(v.id('leads')),
	},
	handler: async (ctx, args) => {
		// Check for auth and permissions
		const identity = await requirePermission(ctx, PERMISSIONS.LEADS_WRITE);
		const organizationId = await getOrganizationId(ctx);

		// Check for existing lead with same phone (duplicate prevention)
		const existingLead = await ctx.db
			.query('leads')
			.withIndex('by_organization_phone', (q) =>
				q.eq('organizationId', organizationId).eq('phone', args.phone),
			)
			.first();

		// Idempotent: return existing lead ID if duplicate
		if (existingLead) {
			return existingLead._id;
		}

		// Check referred lead ownership if provided
		if (args.referredById) {
			const referrer = await ctx.db.get(args.referredById);
			if (!referrer || referrer.organizationId !== organizationId) {
				throw new Error('Invalid referrer: Lead not found or belongs to another organization');
			}
		}

		// Destructure customFieldValues to avoid spreading into leads document
		const { customFieldValues, ...leadData } = args;

		const leadId = await ctx.db.insert('leads', {
			stage: 'novo',
			temperature: 'frio',
			...leadData,
			lgpdConsent: args.lgpdConsent ?? false,
			whatsappConsent: args.whatsappConsent ?? false,
			organizationId,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			referredById: args.referredById,
		});

		// Save custom fields
		if (args.customFieldValues) {
			await Promise.all(
				args.customFieldValues.map((cf) =>
					setCustomFieldValueInternal(ctx, {
						customFieldId: cf.customFieldId,
						entityId: leadId,
						entityType: 'lead',
						value: cf.value,
						userId: identity.subject,
						organizationId,
					}),
				),
			);
		}

		// Log activity
		await ctx.db.insert('activities', {
			type: 'lead_criado',
			description: `Lead "${args.name}" criado`,
			leadId,
			organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
		});

		// Auto-sync to email marketing (if lead has email)
		if (args.email) {
			const syncLeadAsContact = getInternalApi().emailMarketing.syncLeadAsContactInternal;
			await ctx.scheduler.runAfter(0, syncLeadAsContact, {
				leadId,
				organizationId,
			});
		}

		return leadId;
	},
});

// New Public Mutation for Landing Page
export const createPublicLead = mutation({
	args: {
		...leadArgs,
		organizationId: v.optional(v.string()), // Optional, or we find default
		userIp: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// 1. Rate Limit
		if (args.userIp) {
			const limit = 5;
			const window = 60 * 60 * 1000;
			const recent = await ctx.db
				.query('rateLimits')
				.withIndex('by_identifier_action', (q) =>
					q.eq('identifier', args.userIp ?? '').eq('action', 'submit_form'),
				)
				.filter((q) => q.gte(q.field('timestamp'), Date.now() - window))
				.collect();

			if (recent.length >= limit) throw new Error('Rate limit exceeded');

			await ctx.db.insert('rateLimits', {
				identifier: args.userIp,
				action: 'submit_form',
				timestamp: Date.now(),
			});
		}

		const { userIp, customFieldValues, ...leadData } = args;

		// Determine organization (fallback to null if not provided, or logic to find default)
		// For now, we allow null organizationId as per schema
		const orgId = args.organizationId;

		// Check duplicates if OrgId is present
		if (orgId) {
			const existing = await ctx.db
				.query('leads')
				.withIndex('by_organization_phone', (q) =>
					q.eq('organizationId', orgId ?? '').eq('phone', args.phone),
				)
				.first();
			if (existing) return existing._id;
		} else {
			// Check global phone duplicate
			const existing = await ctx.db
				.query('leads')
				.withIndex('by_phone', (q) => q.eq('phone', args.phone))
				.first();
			if (existing) return existing._id;
		}

		const leadId = await ctx.db.insert('leads', {
			...leadData,
			organizationId: orgId,
			stage: 'novo',
			temperature: 'frio',
			createdAt: Date.now(),
			updatedAt: Date.now(),
			lgpdConsent: args.lgpdConsent ?? false,
			whatsappConsent: args.whatsappConsent ?? false,
			consentGrantedAt: Date.now(),
			consentVersion: 'v1.0',
		});

		// Save custom fields
		if (customFieldValues) {
			await Promise.all(
				customFieldValues.map((cf) =>
					setCustomFieldValueInternal(ctx, {
						customFieldId: cf.customFieldId,
						entityId: leadId,
						entityType: 'lead',
						value: cf.value,
						userId: 'system_landing_page',
						organizationId: orgId ?? 'public',
					}),
				),
			);
		}

		// Activity log (system)
		await ctx.db.insert('activities', {
			type: 'lead_criado',
			description: `Lead "${args.name}" capturado via Landing Page`,
			leadId,
			organizationId: orgId ?? 'public',
			performedBy: 'system_landing_page',
			createdAt: Date.now(),
		});

		// Trigger email sync
		if (args.email) {
			const syncLeadAsContact = getInternalApi().emailMarketing.syncLeadAsContactInternal;
			await ctx.scheduler.runAfter(0, syncLeadAsContact, {
				leadId,
				organizationId: orgId ?? 'public',
			});
		}

		return leadId;
	},
});

export const updateLeadStage = mutation({
	args: {
		leadId: v.id('leads'),
		newStage: v.union(
			v.literal('novo'),
			v.literal('primeiro_contato'),
			v.literal('qualificado'),
			v.literal('proposta'),
			v.literal('negociacao'),
			v.literal('fechado_ganho'),
			v.literal('fechado_perdido'),
		),
	},
	handler: async (ctx, args) => {
		// Auth/Permission check
		const identity = await requirePermission(ctx, PERMISSIONS.LEADS_WRITE);
		const organizationId = await getOrganizationId(ctx);

		const lead = await ctx.db.get(args.leadId);
		if (!lead || lead.organizationId !== organizationId) {
			throw new Error('Lead not found or permission denied');
		}

		await ctx.db.patch(args.leadId, {
			stage: args.newStage,
			updatedAt: Date.now(),
		});

		// Activity log
		await ctx.db.insert('activities', {
			type: 'stage_changed',
			description: `Lead movido para ${args.newStage}`,
			leadId: args.leadId,
			organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
			metadata: { from: lead.stage, to: args.newStage },
		});

		// Trigger Cashback Calculation if Won
		if (args.newStage === 'fechado_ganho' && lead.referredById && !lead.cashbackPaidAt) {
			const calculateCashback = getInternalApi().referrals.calculateCashback;
			await ctx.scheduler.runAfter(0, calculateCashback, {
				referredLeadId: args.leadId,
			});
		}
	},
});

export const updateLead = mutation({
	args: {
		leadId: v.id('leads'),
		patch: v.object({
			// Allow partial updates of fields
			name: v.optional(v.string()),
			phone: v.optional(v.string()),
			email: v.optional(v.string()),
			stage: v.optional(v.any()),
			// Clinic qualification
			hasClinic: v.optional(v.boolean()),
			clinicName: v.optional(v.string()),
			clinicCity: v.optional(v.string()),

			// Professional background
			yearsInAesthetics: v.optional(v.number()),
			currentRevenue: v.optional(v.string()),
			profession: v.optional(v.any()),

			// Pain point diagnosis
			mainPain: v.optional(v.any()),
			mainDesire: v.optional(v.string()),

			// Product
			interestedProduct: v.optional(v.any()),

			// Additional
			sourceDetail: v.optional(v.string()),
			score: v.optional(v.number()),
			nextFollowUpAt: v.optional(v.number()),
			temperature: v.optional(v.any()),

			// Content & Consent
			message: v.optional(v.string()),
			lgpdConsent: v.optional(v.boolean()),
			whatsappConsent: v.optional(v.boolean()),

			// UTM
			utmSource: v.optional(v.string()),
			utmCampaign: v.optional(v.string()),
			utmMedium: v.optional(v.string()),
			utmContent: v.optional(v.string()),
			utmTerm: v.optional(v.string()),
		}),
		customFieldValues: v.optional(
			v.array(
				v.object({
					customFieldId: v.id('customFields'),
					value: v.any(),
				}),
			),
		),
	},
	handler: async (ctx, args) => {
		const identity = await requirePermission(ctx, PERMISSIONS.LEADS_WRITE);
		const organizationId = await getOrganizationId(ctx);

		const lead = await ctx.db.get(args.leadId);
		if (!lead || lead.organizationId !== organizationId) {
			throw new Error('Lead not found or permission denied');
		}

		await ctx.db.patch(args.leadId, { ...args.patch, updatedAt: Date.now() });

		// Save custom fields
		if (args.customFieldValues) {
			const userId = identity.subject;
			await Promise.all(
				args.customFieldValues.map((cf) =>
					setCustomFieldValueInternal(ctx, {
						customFieldId: cf.customFieldId,
						entityId: args.leadId,
						entityType: 'lead',
						value: cf.value,
						userId,
						organizationId,
					}),
				),
			);
		}
	},
});

export const getLead = query({
	args: { leadId: v.id('leads') },
	handler: async (ctx, args) => {
		// Require authentication and get organization scope
		await requirePermission(ctx, PERMISSIONS.LEADS_READ);
		const organizationId = await getOrganizationId(ctx);

		const lead = await ctx.db.get(args.leadId);

		// Only return lead if it belongs to the caller's organization
		if (!lead || lead.organizationId !== organizationId) {
			return null;
		}

		return lead;
	},
});
export const recent = query({
	args: {
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		try {
			await ctx.auth.getUserIdentity();

			await requirePermission(ctx, PERMISSIONS.LEADS_READ);
			const organizationId = await getOrganizationId(ctx);

			if (!organizationId) {
				return [];
			}

			// 2. Query leads using index
			const results = await ctx.db
				.query('leads')
				.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
				.order('desc')
				.take(args.limit ?? 10);

			return results;
		} catch {
			return [];
		}
	},
});
// ═══════════════════════════════════════════════════════
// ADMIN: Deduplicate existing leads (cleanup mutation)
// ═══════════════════════════════════════════════════════
export const deduplicateLeads = mutation({
	args: {
		dryRun: v.optional(v.boolean()), // If true, only returns duplicates without deleting
	},
	handler: async (ctx, args) => {
		// Permission check
		const identity = await requirePermission(ctx, PERMISSIONS.LEADS_WRITE);
		const organizationId = await getOrganizationId(ctx);

		// Fetch all leads for this organization
		const allLeads = await ctx.db
			.query('leads')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
			.collect();

		// Group leads by phone number
		const leadsByPhone = new Map<string, typeof allLeads>();
		for (const lead of allLeads) {
			const existing = leadsByPhone.get(lead.phone) || [];
			existing.push(lead);
			leadsByPhone.set(lead.phone, existing);
		}

		// Find duplicates (phone numbers with more than one lead)
		const duplicateGroups: {
			phone: string;
			keepId: Id<'leads'>;
			deleteIds: Id<'leads'>[];
		}[] = [];

		for (const [phone, leads] of leadsByPhone) {
			if (leads.length > 1) {
				// Sort by createdAt to keep the oldest one
				leads.sort((a, b) => a.createdAt - b.createdAt);
				const [keep, ...toDelete] = leads;
				duplicateGroups.push({
					phone,
					keepId: keep._id,
					deleteIds: toDelete.map((l) => l._id),
				});
			}
		}

		// If dry run, just return the duplicates found
		if (args.dryRun) {
			return {
				mode: 'dry_run',
				totalLeads: allLeads.length,
				duplicateGroupsCount: duplicateGroups.length,
				duplicatesToDelete: duplicateGroups.reduce((acc, g) => acc + g.deleteIds.length, 0),
				duplicateGroups,
			};
		}

		// Actually delete duplicates
		let deletedCount = 0;
		for (const group of duplicateGroups) {
			for (const deleteId of group.deleteIds) {
				await ctx.db.delete(deleteId);
				deletedCount++;
			}
		}

		// Log cleanup activity
		await ctx.db.insert('activities', {
			type: 'lead_criado', // Using existing type, ideally would have 'admin_cleanup'
			description: `Admin: Removed ${deletedCount} duplicate leads`,
			organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
		});

		return {
			mode: 'executed',
			totalLeads: allLeads.length,
			duplicateGroupsCount: duplicateGroups.length,
			deletedCount,
			remainingLeads: allLeads.length - deletedCount,
		};
	},
});

export const getIdleLeads = internalQuery({
	args: {
		days: v.number(),
		limit: v.number(),
	},
	handler: async (ctx, args) => {
		const cutoff = Date.now() - args.days * 24 * 60 * 60 * 1000;
		// Fetch idle leads only in eligible reactivation stages: 'primeiro_contato' or 'qualificado'
		return await ctx.db
			.query('leads')
			.filter((q) => q.lt(q.field('updatedAt'), cutoff))
			.filter((q) =>
				q.or(q.eq(q.field('stage'), 'primeiro_contato'), q.eq(q.field('stage'), 'qualificado')),
			)
			.take(args.limit);
	},
});

export const reactivateLead = internalMutation({
	args: {
		leadId: v.id('leads'),
	},
	handler: async (ctx, args) => {
		const lead = await ctx.db.get(args.leadId);
		if (!lead) return;

		// Guard: Only reactivate leads in eligible stages
		const eligibleStages = ['primeiro_contato', 'qualificado'];
		if (!eligibleStages.includes(lead.stage)) return;

		await ctx.db.patch(args.leadId, {
			stage: 'novo',
			updatedAt: Date.now(),
		});

		await ctx.db.insert('activities', {
			type: 'lead_reactivated',
			description: 'Lead reativado por inatividade',
			leadId: args.leadId,
			organizationId: lead.organizationId ?? 'system',
			performedBy: 'system', // Clerk ID placeholder for system
			createdAt: Date.now(),
			metadata: { previousStage: lead.stage },
		});

		// Create follow-up task
		const createTask = getInternalApi().tasks.internalCreateTask;
		await ctx.runMutation(createTask, {
			description: `Follow-up: Lead reativado automaticamente de ${lead.stage}`,
			leadId: lead._id,
			assignedTo: lead.assignedTo,
			dueDate: Date.now() + 24 * 60 * 60 * 1000, // +1 day
			organizationId: lead.organizationId ?? 'system',
			createdBy: 'system_cron',
		});

		if (lead.assignedTo) {
			await ctx.db.insert('notifications', {
				type: 'lead_reactivated',
				title: 'Lead Reativado',
				message: `O lead ${lead.name} foi reativado para o estágio inicial e uma tarefa de follow-up foi criada.`,
				recipientId: lead.assignedTo,
				recipientType: 'user',
				organizationId: lead.organizationId ?? 'system',
				read: false,
				status: 'sent',
				channel: 'system',
				createdAt: Date.now(),
				link: `/dashboard/leads/${lead._id}`,
			});
		}
	},
});

export const search = query({
	args: {
		query: v.string(),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		await requirePermission(ctx, PERMISSIONS.LEADS_READ);
		const organizationId = await getOrganizationId(ctx);

		if (!args.query) return [];

		// Naive search implementation: fetch recent leads and filter in memory
		// Ideally this should use Convex search index if configured
		// For now, we reuse the existing pattern or simplified scan
		const leads = await ctx.db
			.query('leads')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
			.order('desc')
			.take(200);

		const lowerQuery = args.query.toLowerCase();

		return leads
			.filter(
				(l) =>
					l.name.toLowerCase().includes(lowerQuery) ||
					l.phone.includes(lowerQuery) ||
					l.email?.toLowerCase().includes(lowerQuery),
			)
			.slice(0, args.limit ?? 10)
			.map((l) => ({
				id: l._id,
				name: l.name,
				phone: l.phone,
				email: l.email,
			}));
	},
});

// ═══════════════════════════════════════════════════════
// BULK IMPORT: Import leads from spreadsheet
// ═══════════════════════════════════════════════════════
const importLeadArg = v.object({
	name: v.string(),
	phone: v.string(),
	email: v.optional(v.string()),
	source: v.optional(v.string()),
	message: v.optional(v.string()),
	profession: v.optional(v.string()),
	interestedProduct: v.optional(v.string()),
	clinicCity: v.optional(v.string()),
	lastContactAt: v.optional(v.number()),
});

export const importLeads = mutation({
	args: {
		leads: v.array(importLeadArg),
		defaultProduct: v.optional(v.string()),
		defaultSource: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Auth/Permission check
		const identity = await requirePermission(ctx, PERMISSIONS.LEADS_WRITE);
		const organizationId = await getOrganizationId(ctx);

		if (!organizationId) {
			throw new Error('Organization not found');
		}

		const results: { index: number; success: boolean; leadId?: string; error?: string }[] = [];

		// Process each lead
		for (let i = 0; i < args.leads.length; i++) {
			const leadData = args.leads[i];

			try {
				// Validate required fields
				if (!leadData.name || leadData.name.trim() === '') {
					results.push({ index: i, success: false, error: 'Nome é obrigatório' });
					continue;
				}

				if (!leadData.phone || leadData.phone.trim() === '') {
					results.push({ index: i, success: false, error: 'Telefone é obrigatório' });
					continue;
				}

				// Normalize phone: remove non-digits, ensure has country code
				let phone = leadData.phone.replace(/\D/g, '');
				if (phone.length === 10 || phone.length === 11) {
					phone = `55${phone}`;
				}

				// Check for existing lead with same phone (duplicate prevention)
				const existingLead = await ctx.db
					.query('leads')
					.withIndex('by_organization_phone', (q) =>
						q.eq('organizationId', organizationId).eq('phone', phone),
					)
					.first();

				if (existingLead) {
					results.push({ index: i, success: false, error: 'Lead já existe com este telefone' });
					continue;
				}

				// Map source string to valid source value
				const sourceMap: Record<string, string> = {
					instagram: 'instagram',
					whatsapp: 'whatsapp',
					trafego: 'trafego_pago',
					landing: 'landing_page',
					indicacao: 'indicacao',
					organico: 'organico',
				};
				const rawSource = leadData.source?.toLowerCase() ?? args.defaultSource ?? 'landing_page';
				const source = sourceMap[rawSource] ?? 'landing_page';

				// Map product to valid product value
				const productMap: Record<string, string> = {
					otb: 'otb',
					neon: 'black_neon',
					black_neon: 'black_neon',
					trintae3: 'trintae3',
					comunidade: 'comunidade',
				};
				const rawProduct =
					leadData.interestedProduct?.toLowerCase() ?? args.defaultProduct ?? 'otb';
				const interestedProduct = productMap[rawProduct] ?? 'otb';

				// Insert the lead
				const leadId = await ctx.db.insert('leads', {
					name: leadData.name.trim(),
					phone,
					email: leadData.email?.trim() || undefined,
					source: source as Doc<'leads'>['source'],
					message: leadData.message?.trim() || undefined,
					profession: leadData.profession as Doc<'leads'>['profession'] | undefined,
					interestedProduct: interestedProduct as Doc<'leads'>['interestedProduct'],
					clinicCity: leadData.clinicCity?.trim() || undefined,
					lastContactAt: leadData.lastContactAt,
					stage: 'novo',
					temperature: 'frio',
					lgpdConsent: false,
					whatsappConsent: false,
					organizationId,
					createdAt: Date.now(),
					updatedAt: Date.now(),
				});

				results.push({ index: i, success: true, leadId: leadId as string });
			} catch (error) {
				results.push({
					index: i,
					success: false,
					error: error instanceof Error ? error.message : 'Erro desconhecido',
				});
			}
		}

		// Log bulk import activity
		const successCount = results.filter((r) => r.success).length;
		const failCount = results.filter((r) => !r.success).length;

		await ctx.db.insert('activities', {
			type: 'lead_criado',
			description: `Importação em massa: ${successCount} leads criados, ${failCount} ignorados`,
			organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
		});

		return {
			total: args.leads.length,
			success: successCount,
			failed: failCount,
			results,
		};
	},
});

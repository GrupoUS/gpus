import type { FunctionReference } from 'convex/server';
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';

import { query as convexQuery, internalMutation, mutation } from './_generated/server';
import { getOrganizationId, requirePermission } from './lib/auth';
import { PERMISSIONS } from './lib/permissions';
import { rateLimiters, validateInput, validationSchemas } from './lib/validation';

type MarketingLeadInterest =
	| 'Harmonização Facial'
	| 'Estética Corporal'
	| 'Bioestimuladores'
	| 'Outros';

type MarketingLeadStatus = 'new' | 'contacted' | 'converted' | 'unsubscribed';

interface InternalEmailMarketingApi {
	syncMarketingLeadAsContactInternal: FunctionReference<'mutation', 'internal'>;
	updateContactSubscriptionInternal: FunctionReference<'mutation', 'internal'>;
}

interface InternalApi {
	emailMarketing: InternalEmailMarketingApi;
}

const getInternalApi = (): InternalApi => {
	const apiModule = require('./_generated/api') as unknown;
	return (apiModule as { internal: InternalApi }).internal;
};

const internalEmailMarketing = getInternalApi().emailMarketing;

const MARKETING_INTERESTS = new Set<MarketingLeadInterest>([
	'Harmonização Facial',
	'Estética Corporal',
	'Bioestimuladores',
	'Outros',
]);

const MARKETING_STATUSES = new Set<MarketingLeadStatus>([
	'new',
	'contacted',
	'converted',
	'unsubscribed',
]);

const normalizeInterest = (value?: string | null): MarketingLeadInterest | null => {
	if (!value) return null;
	return MARKETING_INTERESTS.has(value as MarketingLeadInterest)
		? (value as MarketingLeadInterest)
		: null;
};

const normalizeStatus = (value?: string | null): MarketingLeadStatus | null => {
	if (!value) return null;
	return MARKETING_STATUSES.has(value as MarketingLeadStatus)
		? (value as MarketingLeadStatus)
		: null;
};

// ═══════════════════════════════════════════════════════
// PUBLIC MUTATION: Create Marketing Lead
// ═══════════════════════════════════════════════════════

export const create = mutation({
	args: {
		name: v.string(),
		email: v.string(),
		phone: v.string(),
		interest: v.union(
			v.literal('Harmonização Facial'),
			v.literal('Estética Corporal'),
			v.literal('Bioestimuladores'),
			v.literal('Outros'),
		),
		message: v.optional(v.string()),
		lgpdConsent: v.boolean(),
		whatsappConsent: v.boolean(),
		honeypot: v.optional(v.string()),
		utmSource: v.optional(v.string()),
		utmCampaign: v.optional(v.string()),
		utmMedium: v.optional(v.string()),
		utmContent: v.optional(v.string()),
		utmTerm: v.optional(v.string()),
		userIp: v.optional(v.string()),
		company: v.optional(v.string()),
		jobRole: v.optional(v.string()),
		origin: v.optional(v.string()),
		typebotId: v.optional(v.string()),
		resultId: v.optional(v.string()),
		externalTimestamp: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		// 1. Honeypot Check (anti-spam)
		if (args.honeypot && args.honeypot.length > 0) {
			throw new Error('Invalid submission');
		}

		// 2. Server-side Zod Validation
		const validation = validateInput(validationSchemas.marketingLead, args);
		if (!validation.success) {
			throw new Error(validation.error);
		}

		// 3. Rate Limiting (IP-based + Email Secondary)
		if (args.userIp) {
			const limit = 5;
			const window = 60 * 60 * 1000; // 1 hour
			const recent = await ctx.db
				.query('rateLimits')
				.withIndex('by_identifier_action', (q) =>
					q.eq('identifier', args.userIp ?? '').eq('action', 'marketing_lead_submit'),
				)
				.filter((q) => q.gte(q.field('timestamp'), Date.now() - window))
				.collect();

			if (recent.length >= limit) throw new Error('Rate limit exceeded');

			await ctx.db.insert('rateLimits', {
				identifier: args.userIp,
				action: 'marketing_lead_submit',
				timestamp: Date.now(),
			});
		}

		// Secondary email-based check (optional but good for consistency)
		const rateLimiter = rateLimiters.marketingLeadCapture;
		if (!rateLimiter.isAllowed(args.email)) {
			const resetTime = rateLimiter.getResetTime(args.email);
			throw new Error(
				`Limite de submissões excedido. Tente novamente em ${Math.ceil(resetTime / 60_000)} minutos.`,
			);
		}

		// 4. Duplicate Email Check
		const existing = await ctx.db
			.query('marketing_leads')
			.withIndex('by_email', (q) => q.eq('email', args.email))
			.first();

		if (existing) {
			return existing._id;
		}

		// 5. Get Default Organization ID (from env or null)
		const defaultOrgId = process.env.DEFAULT_ORGANIZATION_ID || undefined;

		// 6. Insert Lead
		const leadId = await ctx.db.insert('marketing_leads', {
			name: args.name,
			email: args.email,
			phone: args.phone,
			interest: args.interest,
			message: args.message,
			lgpdConsent: args.lgpdConsent,
			whatsappConsent: args.whatsappConsent,
			utmSource: args.utmSource,
			utmCampaign: args.utmCampaign,
			utmMedium: args.utmMedium,
			utmContent: args.utmContent,
			utmTerm: args.utmTerm,
			company: args.company,
			jobRole: args.jobRole,
			origin: args.origin,
			typebotId: args.typebotId,
			resultId: args.resultId,
			externalTimestamp: args.externalTimestamp,
			status: 'new',
			organizationId: defaultOrgId,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		// 7. Log Audit Event
		await ctx.db.insert('lgpdAudit', {
			actionType: 'data_creation',
			dataCategory: 'marketing_leads',
			description: `Lead capturado via formulário público: ${args.email}`,
			metadata: { entityId: leadId },
			processingPurpose: 'captura de leads de marketing',
			legalBasis: 'consentimento',
			ipAddress: args.userIp || 'unknown',
			actorId: 'system_public_form',
			actorRole: 'system',
			createdAt: Date.now(),
		});

		// 8. Auto-sync to Brevo (async)
		const syncFn = internalEmailMarketing?.syncMarketingLeadAsContactInternal;
		if (syncFn) {
			await ctx.scheduler.runAfter(0, syncFn, {
				leadId,
				organizationId: defaultOrgId,
			});
		}

		return leadId;
	},
});

// ═══════════════════════════════════════════════════════
// WEBHOOK MUTATION (Internal)
// ═══════════════════════════════════════════════════════

export const createFromWebhook = internalMutation({
	args: {
		email: v.string(),
		source: v.string(),
		name: v.optional(v.string()),
		phone: v.optional(v.string()),
		interest: v.optional(v.string()),
		message: v.optional(v.string()),
		utmSource: v.optional(v.string()),
		utmCampaign: v.optional(v.string()),
		utmMedium: v.optional(v.string()),
		utmContent: v.optional(v.string()),
		utmTerm: v.optional(v.string()),
		customFields: v.optional(v.any()),
		landingPage: v.optional(v.string()),
		landingPageUrl: v.optional(v.string()),
		ipAddress: v.optional(v.string()),
		userAgent: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// 1. Check for existing lead from this source
		const existing = await ctx.db
			.query('marketing_leads')
			.withIndex('by_email', (q) => q.eq('email', args.email))
			.filter((q) => q.eq(q.field('source'), args.source))
			.first();

		if (existing) {
			const interest = normalizeInterest(args.interest) ?? existing.interest;
			// Update only relevant fields if needed, or just return existing ID
			// For now, we update UTMs and contact info if provided
			await ctx.db.patch(existing._id, {
				name: args.name ?? existing.name,
				phone: args.phone ?? existing.phone,
				interest,
				utmSource: args.utmSource ?? existing.utmSource,
				utmCampaign: args.utmCampaign ?? existing.utmCampaign,
				utmMedium: args.utmMedium ?? existing.utmMedium,
				updatedAt: Date.now(),
			});
			return { id: existing._id, action: 'updated' };
		}

		// 2. Map interest to valid enum if possible, else default
		const interest = normalizeInterest(args.interest) ?? 'Outros';

		// 3. Create new lead
		const leadId = await ctx.db.insert('marketing_leads', {
			email: args.email,
			source: args.source,
			name: args.name || 'Unknown',
			phone: args.phone || '',
			interest,
			message: args.message,
			lgpdConsent: true, // Implied by webhook submission
			whatsappConsent: false,
			status: 'new',
			createdAt: Date.now(),
			updatedAt: Date.now(),
			utmSource: args.utmSource,
			utmCampaign: args.utmCampaign,
			utmMedium: args.utmMedium,
			utmContent: args.utmContent,
			utmTerm: args.utmTerm,
			landingPage: args.landingPage,
			landingPageUrl: args.landingPageUrl,
			// Add metadata as needed
		});

		// 4. Log Audit
		await ctx.db.insert('lgpdAudit', {
			actionType: 'data_creation',
			dataCategory: 'marketing_leads',
			description: `Lead capturado via webhook: ${args.email} (${args.source})`,
			metadata: {
				entityId: leadId,
				source: args.source,
				landingPage: args.landingPage,
			},
			processingPurpose: 'captura de leads via webhook',
			legalBasis: 'consentimento',
			ipAddress: args.ipAddress || 'unknown',
			actorId: 'system_webhook',
			actorRole: 'system',
			createdAt: Date.now(),
		});

		return { id: leadId, action: 'created' };
	},
});

// ═══════════════════════════════════════════════════════
// ADMIN QUERIES
// ═══════════════════════════════════════════════════════

export const list = convexQuery({
	args: {
		paginationOpts: paginationOptsValidator,
		status: v.optional(v.string()),
		interest: v.optional(v.string()),
		search: v.optional(v.string()),
		source: v.optional(v.string()),
		landingPage: v.optional(v.string()),
		startDate: v.optional(v.number()),
		endDate: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		await requirePermission(ctx, PERMISSIONS.MARKETING_LEADS_READ);
		const organizationId = await getOrganizationId(ctx);

		const status = normalizeStatus(args.status);
		const interestFilter = normalizeInterest(args.interest);

		let leadQuery = status
			? ctx.db
					.query('marketing_leads')
					.withIndex('by_organization_status', (q) =>
						q.eq('organizationId', organizationId).eq('status', status),
					)
			: ctx.db
					.query('marketing_leads')
					.withIndex('by_organization_created', (q) => q.eq('organizationId', organizationId));

		if (interestFilter) {
			leadQuery = leadQuery.filter((q) => q.eq(q.field('interest'), interestFilter));
		}

		if (args.source && args.source !== 'all') {
			leadQuery = leadQuery.filter((q) => q.eq(q.field('source'), args.source));
		}

		if (args.landingPage && args.landingPage !== 'all') {
			leadQuery = leadQuery.filter((q) => q.eq(q.field('landingPage'), args.landingPage));
		}

		const startDate = args.startDate;
		const endDate = args.endDate;
		if (startDate !== undefined) {
			leadQuery = leadQuery.filter((q) => q.gte(q.field('createdAt'), startDate));
		}
		if (endDate !== undefined) {
			leadQuery = leadQuery.filter((q) => q.lte(q.field('createdAt'), endDate));
		}

		const results = await leadQuery.order('desc').paginate(args.paginationOpts);

		if (args.search) {
			const searchLower = args.search.toLowerCase();
			results.page = results.page.filter(
				(lead) =>
					lead.name.toLowerCase().includes(searchLower) ||
					lead.email.toLowerCase().includes(searchLower) ||
					lead.phone.includes(searchLower),
			);
		}

		return results;
	},
});

export const getSources = convexQuery({
	handler: async (ctx) => {
		await requirePermission(ctx, PERMISSIONS.MARKETING_LEADS_READ);
		const organizationId = await getOrganizationId(ctx);

		const leads = await ctx.db
			.query('marketing_leads')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
			.collect();

		const sources = new Set<string>();
		for (const lead of leads) {
			if (lead.source) {
				sources.add(lead.source);
			}
		}

		return Array.from(sources).sort();
	},
});

export const getDistinctLandingPages = convexQuery({
	handler: async (ctx) => {
		await requirePermission(ctx, PERMISSIONS.MARKETING_LEADS_READ);
		const organizationId = await getOrganizationId(ctx);

		const leads = await ctx.db
			.query('marketing_leads')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
			.filter((q) => q.neq(q.field('landingPage'), undefined))
			.collect();

		const landingPages = new Set<string>();
		for (const lead of leads) {
			if (lead.landingPage) {
				landingPages.add(lead.landingPage);
			}
		}

		return Array.from(landingPages).sort();
	},
});

export const getStatsByLandingPage = convexQuery({
	args: {
		startDate: v.optional(v.number()),
		endDate: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		await requirePermission(ctx, PERMISSIONS.MARKETING_LEADS_READ);
		const organizationId = await getOrganizationId(ctx);

		let leadQuery = ctx.db
			.query('marketing_leads')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId));

		const startDate = args.startDate;
		const endDate = args.endDate;
		if (startDate !== undefined) {
			leadQuery = leadQuery.filter((q) => q.gte(q.field('createdAt'), startDate));
		}
		if (endDate !== undefined) {
			leadQuery = leadQuery.filter((q) => q.lte(q.field('createdAt'), endDate));
		}

		// Optimization: If many leads, this aggregation might be slow.
		// For now, it's acceptable. In future, use aggregate table.
		const leads = await leadQuery.collect();

		const stats: Record<string, { total: number; converted: number; new: number }> = {};

		for (const lead of leads) {
			const page = lead.landingPage || '(not set)';
			if (!stats[page]) {
				stats[page] = { total: 0, converted: 0, new: 0 };
			}
			stats[page].total++;
			if (lead.status === 'converted') stats[page].converted++;
			if (lead.status === 'new') stats[page].new++;
		}

		return Object.entries(stats)
			.map(([name, data]) => ({
				name,
				...data,
				conversionRate: data.total > 0 ? (data.converted / data.total) * 100 : 0,
			}))
			.sort((a, b) => b.total - a.total);
	},
});

export const get = convexQuery({
	args: { leadId: v.id('marketing_leads') },
	handler: async (ctx, args) => {
		await requirePermission(ctx, PERMISSIONS.MARKETING_LEADS_READ);
		const organizationId = await getOrganizationId(ctx);

		const lead = await ctx.db.get(args.leadId);
		if (!lead || lead.organizationId !== organizationId) {
			return null;
		}
		return lead;
	},
});

// ═══════════════════════════════════════════════════════
// ADMIN MUTATIONS
// ═══════════════════════════════════════════════════════

export const updateStatus = mutation({
	args: {
		leadId: v.id('marketing_leads'),
		newStatus: v.union(
			v.literal('new'),
			v.literal('contacted'),
			v.literal('converted'),
			v.literal('unsubscribed'),
		),
	},
	handler: async (ctx, args) => {
		const identity = await requirePermission(ctx, PERMISSIONS.MARKETING_LEADS_WRITE);
		const organizationId = await getOrganizationId(ctx);

		const lead = await ctx.db.get(args.leadId);
		if (!lead || lead.organizationId !== organizationId) {
			throw new Error('Lead not found or permission denied');
		}

		await ctx.db.patch(args.leadId, {
			status: args.newStatus,
			updatedAt: Date.now(),
		});

		await ctx.db.insert('activities', {
			type: 'lead_criado',
			description: `Marketing lead status changed to ${args.newStatus}`,
			organizationId: lead.organizationId || 'system',
			performedBy: identity.subject,
			createdAt: Date.now(),
		});

		if (args.newStatus === 'unsubscribed' && lead.brevoContactId) {
			const updateSubscriptionFn = internalEmailMarketing?.updateContactSubscriptionInternal;
			if (updateSubscriptionFn) {
				await ctx.scheduler.runAfter(0, updateSubscriptionFn, {
					email: lead.email,
					subscriptionStatus: 'unsubscribed',
				});
			}
		}
	},
});

export const exportToCSV = convexQuery({
	args: {
		status: v.optional(v.string()),
		interest: v.optional(v.string()),
		startDate: v.optional(v.number()),
		endDate: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		await requirePermission(ctx, PERMISSIONS.MARKETING_LEADS_READ);
		const organizationId = await getOrganizationId(ctx);

		const status = normalizeStatus(args.status);
		const interestFilter = normalizeInterest(args.interest);
		const startDate = args.startDate;
		const endDate = args.endDate;

		let exportQuery = status
			? ctx.db
					.query('marketing_leads')
					.withIndex('by_organization_status', (q) =>
						q.eq('organizationId', organizationId).eq('status', status),
					)
			: ctx.db
					.query('marketing_leads')
					.withIndex('by_organization', (q) => q.eq('organizationId', organizationId));

		if ((startDate !== undefined || endDate !== undefined) && !status) {
			exportQuery = ctx.db
				.query('marketing_leads')
				.withIndex('by_organization_created', (q) => q.eq('organizationId', organizationId));
		}

		let leads = await exportQuery.order('desc').collect();

		if (interestFilter) {
			leads = leads.filter((lead) => lead.interest === interestFilter);
		}

		if (startDate !== undefined || endDate !== undefined) {
			leads = leads.filter((lead) => {
				if (startDate !== undefined && lead.createdAt < startDate) return false;
				if (endDate !== undefined && lead.createdAt > endDate) return false;
				return true;
			});
		}

		return leads.map((lead) => ({
			name: lead.name,
			email: lead.email,
			phone: lead.phone,
			interest: lead.interest,
			message: lead.message || '',
			lgpdConsent: lead.lgpdConsent ? 'Sim' : 'Não',
			whatsappConsent: lead.whatsappConsent ? 'Sim' : 'Não',
			status: lead.status,
			utmSource: lead.utmSource || '',
			utmCampaign: lead.utmCampaign || '',
			utmMedium: lead.utmMedium || '',
			createdAt:
				new Date(lead.createdAt).toLocaleDateString('pt-BR') +
				' ' +
				new Date(lead.createdAt).toLocaleTimeString('pt-BR'),
		}));
	},
});

// ═══════════════════════════════════════════════════════
// INTERNAL MUTATIONS (Brevo Sync Wrapper)
// ═══════════════════════════════════════════════════════

export const syncToBrevoInternal = internalMutation({
	args: {
		leadId: v.id('marketing_leads'),
		organizationId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const lead = await ctx.db.get(args.leadId);
		if (!lead) return;

		const existingContact = await ctx.db
			.query('emailContacts')
			.withIndex('by_email', (q) => q.eq('email', lead.email))
			.first();

		if (existingContact) {
			await ctx.db.patch(args.leadId, {
				brevoContactId: existingContact.brevoId,
				lastSyncedAt: Date.now(),
			});
			return;
		}

		const syncFn = internalEmailMarketing?.syncMarketingLeadAsContactInternal;
		if (syncFn) {
			await ctx.scheduler.runAfter(0, syncFn, {
				leadId: args.leadId,
				organizationId: args.organizationId || 'system',
			});
		}
	},
});

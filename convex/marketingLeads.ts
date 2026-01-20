import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';

import { internal } from './_generated/api';
import { query as convexQuery, internalMutation, mutation } from './_generated/server';
import { getOrganizationId, requirePermission } from './lib/auth';
import { PERMISSIONS } from './lib/permissions';
import { rateLimiters, validateInput, validationSchemas } from './lib/validation';

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
		// biome-ignore lint/suspicious/noExplicitAny: Required to break type instantiation recursion
		const syncFn = (internal as any).emailMarketing?.syncMarketingLeadAsContactInternal;
		if (syncFn) {
			// biome-ignore lint/suspicious/noExplicitAny: scheduler type not fully generated
			await (ctx.scheduler as any).runAfter(0, syncFn, {
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
			// Update only relevant fields if needed, or just return existing ID
			// For now, we update UTMs and contact info if provided
			await ctx.db.patch(existing._id, {
				name: args.name ?? existing.name,
				phone: args.phone ?? existing.phone,
				// biome-ignore lint/suspicious/noExplicitAny: dynamic interest field casting
				interest: (args.interest as any) ?? existing.interest,
				utmSource: args.utmSource ?? existing.utmSource,
				utmCampaign: args.utmCampaign ?? existing.utmCampaign,
				utmMedium: args.utmMedium ?? existing.utmMedium,
				updatedAt: Date.now(),
			});
			return { id: existing._id, action: 'updated' };
		}

		// 2. Map interest to valid enum if possible, else default
		const validInterests = [
			'Harmonização Facial',
			'Estética Corporal',
			'Bioestimuladores',
			'Outros',
		];
		const interest = validInterests.includes(args.interest as string)
			? // biome-ignore lint/suspicious/noExplicitAny: casting validated interest to schema type
				(args.interest as any)
			: 'Outros';

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
	// biome-ignore lint/suspicious/noExplicitAny: Generic handler type
	handler: async (ctx, args: any) => {
		await requirePermission(ctx, PERMISSIONS.MARKETING_LEADS_READ);
		const organizationId = await getOrganizationId(ctx);

		// biome-ignore lint/suspicious/noExplicitAny: Complex query builder type
		let leadQuery: any;

		if (args.status && args.status !== 'all') {
			leadQuery = ctx.db.query('marketing_leads').withIndex('by_organization_status', (q) =>
				q.eq('organizationId', organizationId).eq(
					'status', // biome-ignore lint/suspicious/noExplicitAny: status type from args
					args.status as any,
				),
			);
		} else {
			leadQuery = ctx.db
				.query('marketing_leads')
				.withIndex('by_organization_created', (q) => q.eq('organizationId', organizationId));
		}

		if (args.interest && args.interest !== 'all') {
			// biome-ignore lint/suspicious/noExplicitAny: complex query filter
			leadQuery = leadQuery.filter((q: any) => q.eq(q.field('interest'), args.interest));
		}

		if (args.source && args.source !== 'all') {
			// Using the newly added source index if possible, or filter
			// Since we started with by_organization*, we chain filter
			// biome-ignore lint/suspicious/noExplicitAny: complex query filter
			leadQuery = leadQuery.filter((q: any) => q.eq(q.field('source'), args.source));
		}

		if (args.landingPage && args.landingPage !== 'all') {
			// Using the newly added index if possible (by_organization_landing_page)
			if (leadQuery.toString().includes('by_organization_created')) {
				// switch to by_organization_landing_page if possible, otherwise just filter
				// Actually, we can't easily switch index mid-stream with this logic structure without refactoring
				// So we append filter
				// biome-ignore lint/suspicious/noExplicitAny: complex query filter
				leadQuery = leadQuery.filter((q: any) => q.eq(q.field('landingPage'), args.landingPage));
			} else {
				// biome-ignore lint/suspicious/noExplicitAny: complex query filter
				leadQuery = leadQuery.filter((q: any) => q.eq(q.field('landingPage'), args.landingPage));
			}
		}

		if (args.startDate || args.endDate) {
			// biome-ignore lint/suspicious/noExplicitAny: complex query filter
			leadQuery = leadQuery.filter((q: any) => {
				// biome-ignore lint/suspicious/noExplicitAny: Complex condition array
				const conditions: any[] = [];
				if (args.startDate) conditions.push(q.gte(q.field('createdAt'), args.startDate));
				if (args.endDate) conditions.push(q.lte(q.field('createdAt'), args.endDate));
				return q.and(...conditions);
			});
		}

		const results = await leadQuery.order('desc').paginate(args.paginationOpts);

		if (args.search) {
			const searchLower = args.search.toLowerCase();
			results.page = results.page.filter(
				// biome-ignore lint/suspicious/noExplicitAny: generic result type
				(l: any) =>
					l.name.toLowerCase().includes(searchLower) ||
					l.email.toLowerCase().includes(searchLower) ||
					l.phone.includes(searchLower),
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

		if (args.startDate || args.endDate) {
			// biome-ignore lint/suspicious/noExplicitAny: complex filter
			leadQuery = leadQuery.filter((q: any) => {
				const conditions: any[] = [];
				if (args.startDate) conditions.push(q.gte(q.field('createdAt'), args.startDate));
				if (args.endDate) conditions.push(q.lte(q.field('createdAt'), args.endDate));
				// biome-ignore lint/suspicious/noExplicitAny: spread
				return q.and(...(conditions as any));
			});
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
			// biome-ignore lint/suspicious/noExplicitAny: Internal API may not be fully generated
			const syncFn = (internal as any).emailMarketing?.updateContactSubscriptionInternal;
			if (syncFn) {
				// biome-ignore lint/suspicious/noExplicitAny: scheduler type not fully generated
				await (ctx.scheduler as any).runAfter(0, syncFn, {
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

		// biome-ignore lint/suspicious/noExplicitAny: Complex query builder type
		let exportQuery: any;

		if (args.status && args.status !== 'all') {
			exportQuery = ctx.db.query('marketing_leads').withIndex('by_organization_status', (q) =>
				q.eq('organizationId', organizationId).eq(
					'status', // biome-ignore lint/suspicious/noExplicitAny: status type from args
					args.status as any,
				),
			);
		} else {
			exportQuery = ctx.db
				.query('marketing_leads')
				.withIndex('by_organization', (q) => q.eq('organizationId', organizationId));
		}

		if ((args.startDate || args.endDate) && (!args.status || args.status === 'all')) {
			exportQuery = ctx.db
				.query('marketing_leads')
				.withIndex('by_organization_created', (q) => q.eq('organizationId', organizationId));
		}

		let leads = await exportQuery.order('desc').collect();

		if (args.interest && args.interest !== 'all') {
			// biome-ignore lint/suspicious/noExplicitAny: complex filter type
			leads = leads.filter((l: any) => l.interest === args.interest);
		}

		if (args.startDate || args.endDate) {
			// biome-ignore lint/suspicious/noExplicitAny: complex filter type
			leads = leads.filter((l: any) => {
				if (args.startDate && l.createdAt < args.startDate) return false;
				if (args.endDate && l.createdAt > args.endDate) return false;
				return true;
			});
		}

		// biome-ignore lint/suspicious/noExplicitAny: complex map type
		return leads.map((l: any) => ({
			name: l.name,
			email: l.email,
			phone: l.phone,
			interest: l.interest,
			message: l.message || '',
			lgpdConsent: l.lgpdConsent ? 'Sim' : 'Não',
			whatsappConsent: l.whatsappConsent ? 'Sim' : 'Não',
			status: l.status,
			utmSource: l.utmSource || '',
			utmCampaign: l.utmCampaign || '',
			utmMedium: l.utmMedium || '',
			createdAt:
				new Date(l.createdAt).toLocaleDateString('pt-BR') +
				' ' +
				new Date(l.createdAt).toLocaleTimeString('pt-BR'),
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

		// biome-ignore lint/suspicious/noExplicitAny: Required to break type instantiation recursion
		const syncFn = (internal as any).emailMarketing?.syncMarketingLeadAsContactInternal;
		if (syncFn) {
			await ctx.scheduler.runAfter(0, syncFn, {
				leadId: args.leadId,
				organizationId: args.organizationId || 'system',
			});
		}
	},
});

import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { getOrganizationId, hasPermission, requirePermission } from './lib/auth';
import { PERMISSIONS } from './lib/permissions';

const SPLIT_REGEX = /\s+/;

// ═══════════════════════════════════════════════════════
// READ OPERATIONS
// ═══════════════════════════════════════════════════════

// Retrieve all objections for a specific lead in chronological order
export const listObjections = query({
	args: { leadId: v.id('leads') },
	handler: async (ctx, args) => {
		await requirePermission(ctx, PERMISSIONS.LEADS_READ);
		const organizationId = await getOrganizationId(ctx);

		const lead = await ctx.db.get(args.leadId);
		if (!lead || lead.organizationId !== organizationId) {
			return [];
		}

		// Chronological order (oldest first? "recordedAt ascending" as per plan)
		const objections = await ctx.db
			.query('objections')
			.withIndex('by_lead_recorded', (q) => q.eq('leadId', args.leadId))
			.collect();

		// Join with users table to get recordedBy details
		const objectionsWithDetails = await Promise.all(
			objections.map(async (objection) => {
				const user = await ctx.db
					.query('users')
					.withIndex('by_clerk_id', (q) => q.eq('clerkId', objection.recordedBy))
					.first();

				return {
					...objection,
					recordedByDetails: user ? { name: user.name } : undefined,
				};
			}),
		);

		return objectionsWithDetails;
	},
});

// Aggregate objection analytics for organization-wide insights
export const getObjectionStats = query({
	args: {
		organizationId: v.optional(v.string()),
		period: v.optional(v.union(v.literal('7d'), v.literal('30d'), v.literal('90d'))),
	},
	handler: async (ctx, args) => {
		await requirePermission(ctx, PERMISSIONS.LEADS_READ);

		// Always scope to authenticated organization (multi-tenant isolation)
		// Enable override only for admins (PERMISSIONS.ALL)
		let organizationId = await getOrganizationId(ctx);
		if (args.organizationId) {
			const hasAdminPerm = await hasPermission(ctx, PERMISSIONS.ALL);
			if (hasAdminPerm) {
				organizationId = args.organizationId;
			}
		}

		const period = args.period ?? '30d';
		let days = 30;
		if (period === '7d') days = 7;
		else if (period === '90d') days = 90;

		const now = Date.now();
		const startTime = now - days * 24 * 60 * 60 * 1000;

		const allObjections = await ctx.db
			.query('objections')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
			.collect();

		// Filter in memory as per plan
		const recentObjections = allObjections.filter((o) => o.recordedAt >= startTime);

		const totalObjections = recentObjections.length;

		// Objections by lead
		const objectionsByLead = new Map<string, number>();
		// Objections by resolution
		let resolvedCount = 0;

		// Objections over time (Daily buckets)
		const objectionsOverTime: Record<string, number> = {};

		// Detailed keyword analysis is complex, implemented simple frequency map
		const keywordMap = new Map<string, number>();

		for (const obj of recentObjections) {
			// By Lead
			objectionsByLead.set(obj.leadId, (objectionsByLead.get(obj.leadId) ?? 0) + 1);

			// Resolution
			if (obj.resolved) resolvedCount++;

			// Over Time
			const dateKey = new Date(obj.recordedAt).toISOString().split('T')[0];
			objectionsOverTime[dateKey] = (objectionsOverTime[dateKey] ?? 0) + 1;

			// Keywords
			const words = obj.objectionText.toLowerCase().split(SPLIT_REGEX);
			for (const word of words) {
				if (word.length > 3) {
					// Filter small words
					keywordMap.set(word, (keywordMap.get(word) ?? 0) + 1);
				}
			}
		}

		// Sort keywords
		const topPatterns = Array.from(keywordMap.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([word, count]) => ({ word, count }));

		return {
			totalObjections,
			uniqueLeads: objectionsByLead.size,
			resolutionRate: totalObjections > 0 ? resolvedCount / totalObjections : 0,
			topPatterns,
			objectionsOverTime,
		};
	},
});

// ═══════════════════════════════════════════════════════
// WRITE OPERATIONS
// ═══════════════════════════════════════════════════════

export const addObjection = mutation({
	args: {
		leadId: v.id('leads'),
		objectionText: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await requirePermission(ctx, PERMISSIONS.LEADS_WRITE);
		const organizationId = await getOrganizationId(ctx);

		const lead = await ctx.db.get(args.leadId);
		if (!lead || lead.organizationId !== organizationId) {
			throw new Error('Lead não encontrado ou permissão negada');
		}

		const text = args.objectionText.trim();
		if (text.length === 0) {
			throw new Error('Texto da objeção não pode estar vazio');
		}

		const objectionId = await ctx.db.insert('objections', {
			leadId: args.leadId,
			objectionText: text,
			organizationId,
			recordedBy: identity.subject,
			recordedAt: Date.now(),
			resolved: false,
		});

		const description =
			text.length > 50
				? `Objeção registrada: "${text.substring(0, 50)}..."`
				: `Objeção registrada: "${text}"`;

		await ctx.db.insert('activities', {
			type: 'nota_adicionada',
			description,
			leadId: args.leadId,
			organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
			metadata: { objectionId },
		});

		return objectionId;
	},
});

export const updateObjection = mutation({
	args: {
		objectionId: v.id('objections'),
		objectionText: v.string(),
		resolved: v.optional(v.boolean()),
		resolution: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await requirePermission(ctx, PERMISSIONS.LEADS_WRITE);
		const organizationId = await getOrganizationId(ctx);

		const objection = await ctx.db.get(args.objectionId);
		if (!objection) {
			throw new Error('Objeção não encontrada');
		}

		if (objection.organizationId !== organizationId) {
			throw new Error('Objeção não encontrada'); // Hide cross-org data
		}

		const isCreator = objection.recordedBy === identity.subject;
		// Admin permission check aligned with auth model
		const isAdmin = await hasPermission(ctx, PERMISSIONS.ALL);

		if (!(isCreator || isAdmin)) {
			throw new Error(
				'Permissão negada. Apenas o criador ou administradores podem editar objeções.',
			);
		}

		const text = args.objectionText.trim();
		if (text.length === 0) {
			throw new Error('Texto da objeção não pode estar vazio');
		}

		// biome-ignore lint/suspicious/noExplicitAny: Dynamic patch
		const updates: any = {
			objectionText: text,
		};
		if (args.resolved !== undefined) updates.resolved = args.resolved;
		if (args.resolution !== undefined) updates.resolution = args.resolution;

		await ctx.db.patch(args.objectionId, updates);

		await ctx.db.insert('activities', {
			type: 'nota_adicionada',
			description: 'Objeção atualizada',
			leadId: objection.leadId,
			organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
			metadata: {
				objectionId: args.objectionId,
				previousText: objection.objectionText.substring(0, 50),
				newText: text.substring(0, 50),
				changes: Object.keys(updates),
			},
		});
	},
});

export const deleteObjection = mutation({
	args: {
		objectionId: v.id('objections'),
	},
	handler: async (ctx, args) => {
		const identity = await requirePermission(ctx, PERMISSIONS.LEADS_WRITE);
		const organizationId = await getOrganizationId(ctx);

		const objection = await ctx.db.get(args.objectionId);
		if (!objection) {
			throw new Error('Objeção não encontrada');
		}

		if (objection.organizationId !== organizationId) {
			throw new Error('Objeção não encontrada');
		}

		const isCreator = objection.recordedBy === identity.subject;
		// Admin permission check aligned with auth model
		const isAdmin = await hasPermission(ctx, PERMISSIONS.ALL);

		if (!(isCreator || isAdmin)) {
			throw new Error(
				'Permissão negada. Apenas o criador ou administradores podem excluir objeções.',
			);
		}

		await ctx.db.delete(args.objectionId);

		const suffix = objection.objectionText.length > 50 ? '...' : '';
		const description = `Objeção removida: "${objection.objectionText.substring(0, 50)}${suffix}"`;

		await ctx.db.insert('activities', {
			type: 'nota_adicionada',
			description,
			leadId: objection.leadId,
			organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
			metadata: { deletedObjectionText: objection.objectionText },
		});
	},
});

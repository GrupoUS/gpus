import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { getOrganizationId, requirePermission } from './lib/auth';
import { PERMISSIONS } from './lib/permissions';

// ═══════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════

export const listTags = query({
	args: {},
	handler: async (ctx) => {
		const organizationId = await getOrganizationId(ctx);
		await requirePermission(ctx, PERMISSIONS.LEADS_READ);

		return await ctx.db
			.query('tags')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
			.order('desc')
			.collect();
	},
});

export const getLeadTags = query({
	args: { leadId: v.id('leads') },
	handler: async (ctx, args) => {
		const organizationId = await getOrganizationId(ctx);
		await requirePermission(ctx, PERMISSIONS.LEADS_READ);

		// Verify lead exists and belongs to organization
		const lead = await ctx.db.get(args.leadId);
		if (!lead || lead.organizationId !== organizationId) {
			return [];
		}

		// Get junction records
		const leadTagRelations = await ctx.db
			.query('leadTags')
			.withIndex('by_lead', (q) => q.eq('leadId', args.leadId))
			.collect();

		if (leadTagRelations.length === 0) {
			return [];
		}

		// Fetch actual tag details
		// (Convex doesn't support joins, so we map and Promise.all)
		// We could optimize by fetching all tags for org and filtering in memory if relations > tags
		// but typically a lead has few tags.
		const tags = await Promise.all(
			leadTagRelations.map(async (relation) => {
				const tag = await ctx.db.get(relation.tagId);
				return tag;
			}),
		);

		// Filter out any nulls (if tag was deleted but relation remained - shouldn't happen with correct cascade)
		return tags.filter((t) => t !== null);
	},
});

export const searchTags = query({
	args: { query: v.string() },
	handler: async (ctx, args) => {
		const organizationId = await getOrganizationId(ctx);
		await requirePermission(ctx, PERMISSIONS.LEADS_READ);

		// If query is empty, return all (up to a limit?) or empty?
		// Usually search implies filtering.
		if (!args.query) return [];

		const queryLower = args.query.toLowerCase();

		// Fetch all tags for organization (assuming tag count per org is reasonable < 1000)
		const allTags = await ctx.db
			.query('tags')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
			.collect();

		return allTags.filter((tag) => tag.name.toLowerCase().includes(queryLower));
	},
});

// ═══════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════

export const createTag = mutation({
	args: {
		name: v.string(),
		color: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await requirePermission(ctx, PERMISSIONS.LEADS_WRITE);
		const organizationId = await getOrganizationId(ctx);

		const normalizedName = args.name.trim();

		// Check for duplicates
		const existing = await ctx.db
			.query('tags')
			.withIndex('by_organization_name', (q) =>
				q.eq('organizationId', organizationId).eq('name', normalizedName),
			)
			.first();

		if (existing) {
			throw new Error(`A tag "${normalizedName}" já existe nesta organização.`);
		}

		const tagId = await ctx.db.insert('tags', {
			name: normalizedName,
			color: args.color,
			organizationId,
			createdBy: identity.subject,
			createdAt: Date.now(),
		});

		// Log activity
		await ctx.db.insert('activities', {
			type: 'integracao_configurada', // Using closest match for system settings
			description: `Nova tag criada: ${normalizedName}`,
			organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
			metadata: { type: 'system_settings', tagId },
		});

		return tagId;
	},
});

export const addTagToLead = mutation({
	args: {
		leadId: v.id('leads'),
		tagId: v.id('tags'),
	},
	handler: async (ctx, args) => {
		const identity = await requirePermission(ctx, PERMISSIONS.LEADS_WRITE);
		const organizationId = await getOrganizationId(ctx);

		// Validate lead ownership
		const lead = await ctx.db.get(args.leadId);
		if (!lead || lead.organizationId !== organizationId) {
			throw new Error('Lead não encontrado ou acesso negado.');
		}

		// Validate tag ownership
		const tag = await ctx.db.get(args.tagId);
		if (!tag || tag.organizationId !== organizationId) {
			throw new Error('Tag não encontrada ou acesso negado.');
		}

		// Check if already assigned
		// We can check by querying leadTags with by_lead index and filtering for tagId
		// OR by_tag index and filtering for leadId.
		// Since we usually have fewer tags per lead than leads per tag, by_lead is likely smaller.
		const existingRelation = await ctx.db
			.query('leadTags')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId)) // Use org index for safety
			.filter((q) =>
				q.and(q.eq(q.field('leadId'), args.leadId), q.eq(q.field('tagId'), args.tagId)),
			)
			.first();

		if (existingRelation) {
			return existingRelation._id; // Already added
		}

		const relationId = await ctx.db.insert('leadTags', {
			leadId: args.leadId,
			tagId: args.tagId,
			organizationId,
			addedBy: identity.subject,
			addedAt: Date.now(),
		});

		// Log activity
		await ctx.db.insert('activities', {
			type: 'nota_adicionada', // Using closest match for annotation
			description: `Tag "${tag.name}" adicionada ao lead`,
			leadId: args.leadId,
			organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
			metadata: { tagId: args.tagId, tagName: tag.name },
		});

		return relationId;
	},
});

export const removeTagFromLead = mutation({
	args: {
		leadId: v.id('leads'),
		tagId: v.id('tags'),
	},
	handler: async (ctx, args) => {
		const identity = await requirePermission(ctx, PERMISSIONS.LEADS_WRITE);
		const organizationId = await getOrganizationId(ctx);

		// Find connection
		const relation = await ctx.db
			.query('leadTags')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
			.filter((q) =>
				q.and(q.eq(q.field('leadId'), args.leadId), q.eq(q.field('tagId'), args.tagId)),
			)
			.first();

		if (!relation) {
			return; // Connection doesn't exist, nothing to do
		}

		await ctx.db.delete(relation._id);

		// Log activity (optional, maybe too verbose?)
		// Let's fetch tag name for log
		const tag = await ctx.db.get(args.tagId);

		await ctx.db.insert('activities', {
			type: 'nota_adicionada',
			description: `Tag "${tag?.name ?? 'desconhecida'}" removida do lead`,
			leadId: args.leadId,
			organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
			metadata: { tagId: args.tagId },
		});
	},
});

export const deleteTag = mutation({
	args: {
		tagId: v.id('tags'),
	},
	handler: async (ctx, args) => {
		const identity = await requirePermission(ctx, PERMISSIONS.LEADS_WRITE); // Or PERMISSIONS.ADMIN
		const organizationId = await getOrganizationId(ctx);

		const tag = await ctx.db.get(args.tagId);
		if (!tag || tag.organizationId !== organizationId) {
			throw new Error('Tag não encontrada ou acesso negado.');
		}

		// 1. Delete all associations in leadTags
		// Need to iterate and delete.
		const relations = await ctx.db
			.query('leadTags')
			.withIndex('by_tag', (q) => q.eq('tagId', args.tagId))
			.collect();

		// Should verify they belong to same org? The tag belongs to the org, so relations using it must too.
		// But explicit check or organization index usage is safer.
		// Actually leadTags has organizationId.

		for (const relation of relations) {
			if (relation.organizationId === organizationId) {
				await ctx.db.delete(relation._id);
			}
		}

		// 2. Delete the tag itself
		await ctx.db.delete(args.tagId);

		// Log activity
		await ctx.db.insert('activities', {
			type: 'integracao_configurada',
			description: `Tag "${tag.name}" excluída`,
			organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
			metadata: { type: 'system_settings', deletedTag: tag.name },
		});
	},
});

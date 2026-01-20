import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { getOrganizationId, requirePermission } from './lib/auth';
import { PERMISSIONS } from './lib/permissions';

// ═══════════════════════════════════════════════════════
// TAGS (Etiquetas)
// ═══════════════════════════════════════════════════════

/**
 * Listar todas as tags da organização
 */
export const listTags = query({
	args: {},
	handler: async (ctx) => {
		await requirePermission(ctx, PERMISSIONS.LEADS_READ);
		const organizationId = await getOrganizationId(ctx);

		const tags = await ctx.db
			.query('tags')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
			.order('desc')
			.collect();

		return tags;
	},
});

/**
 * Buscar tags de um lead específico
 */
export const getLeadTags = query({
	args: { leadId: v.id('leads') },
	handler: async (ctx, args) => {
		await requirePermission(ctx, PERMISSIONS.LEADS_READ);
		const organizationId = await getOrganizationId(ctx);

		const lead = await ctx.db.get(args.leadId);
		if (!lead || lead.organizationId !== organizationId) {
			return []; // Ou throw, dependendo da UX. Return empty para segurança silenciosa em queries.
		}

		const leadTags = await ctx.db
			.query('leadTags')
			.withIndex('by_lead', (q) => q.eq('leadId', args.leadId))
			.collect();

		// Fetch tag details efficiently
		const tags = await Promise.all(
			leadTags.map(async (lt) => {
				const tag = await ctx.db.get(lt.tagId);
				return tag ? { ...tag, addedAt: lt.addedAt, addedBy: lt.addedBy } : null;
			}),
		);

		return tags.filter((t) => t !== null);
	},
});

/**
 * Pesquisar tags (Autocomplete)
 */
export const searchTags = query({
	args: { query: v.string() },
	handler: async (ctx, args) => {
		await requirePermission(ctx, PERMISSIONS.LEADS_READ);
		const organizationId = await getOrganizationId(ctx);

		// Convex search indexes don't support partial match well yet for short strings without full tokenization config
		// For tags (usually small set), in-memory filtering is acceptable
		const allTags = await ctx.db
			.query('tags')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
			.collect();

		const queryLower = args.query.toLowerCase();
		return allTags.filter((t) => t.name.toLowerCase().includes(queryLower)).slice(0, 10);
	},
});

/**
 * Criar uma nova tag
 */
export const createTag = mutation({
	args: {
		name: v.string(),
		color: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await requirePermission(ctx, PERMISSIONS.LEADS_WRITE);
		const organizationId = await getOrganizationId(ctx);

		const normalizedName = args.name.trim();
		if (!normalizedName) {
			throw new Error('Nome da tag não pode estar vazio');
		}

		// Duplicate check (Case insensitive logic ideally, but index is case sensitive)
		// We normalized case for check? The plan said "normalized name (lowercase)".
		// But schema doesn't force lowercase. Let's check exact match first.
		const existing = await ctx.db
			.query('tags')
			.withIndex('by_organization_name', (q) =>
				q.eq('organizationId', organizationId).eq('name', normalizedName),
			)
			.first();

		if (existing) {
			throw new Error('Tag já existe nesta organização');
		}

		const tagId = await ctx.db.insert('tags', {
			name: normalizedName,
			color: args.color,
			organizationId,
			createdBy: identity.subject,
			createdAt: Date.now(),
		});

		await ctx.db.insert('activities', {
			type: 'tag_criada',
			description: `Tag "${normalizedName}" criada`,
			organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
		});

		return tagId;
	},
});

/**
 * Adicionar tag ao Lead
 */
export const addTagToLead = mutation({
	args: {
		leadId: v.id('leads'),
		tagId: v.id('tags'),
	},
	handler: async (ctx, args) => {
		const identity = await requirePermission(ctx, PERMISSIONS.LEADS_WRITE);
		const organizationId = await getOrganizationId(ctx);

		const lead = await ctx.db.get(args.leadId);
		if (!lead || lead.organizationId !== organizationId) {
			throw new Error('Lead não encontrado ou sem permissão');
		}

		const tag = await ctx.db.get(args.tagId);
		if (!tag || tag.organizationId !== organizationId) {
			throw new Error('Tag não encontrada ou sem permissão');
		}

		// Check strictly for existing association
		const existing = await ctx.db
			.query('leadTags')
			.withIndex('by_lead', (q) => q.eq('leadId', args.leadId))
			.filter((q) => q.eq(q.field('tagId'), args.tagId))
			.first();

		if (existing) {
			return; // Idempotent
		}

		await ctx.db.insert('leadTags', {
			leadId: args.leadId,
			tagId: args.tagId,
			organizationId,
			addedBy: identity.subject,
			addedAt: Date.now(),
		});

		await ctx.db.insert('activities', {
			type: 'tag_adicionada',
			description: `Tag "${tag.name}" adicionada ao lead`,
			leadId: args.leadId,
			organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
		});
	},
});

/**
 * Remover tag do Lead
 */
export const removeTagFromLead = mutation({
	args: {
		leadId: v.id('leads'),
		tagId: v.id('tags'),
	},
	handler: async (ctx, args) => {
		const identity = await requirePermission(ctx, PERMISSIONS.LEADS_WRITE);
		const organizationId = await getOrganizationId(ctx);

		const lead = await ctx.db.get(args.leadId);
		if (!lead || lead.organizationId !== organizationId) {
			throw new Error('Lead não encontrado ou sem permissão');
		}

		// Find association
		const association = await ctx.db
			.query('leadTags')
			.withIndex('by_lead', (q) => q.eq('leadId', args.leadId))
			.filter((q) => q.eq(q.field('tagId'), args.tagId))
			.first();

		if (!association) {
			return; // Idempotent
		}

		await ctx.db.delete(association._id);

		// Get tag name for log
		const tag = await ctx.db.get(args.tagId);
		const tagName = tag ? tag.name : 'Desconhecida';

		await ctx.db.insert('activities', {
			type: 'tag_removida',
			description: `Tag "${tagName}" removida do lead`,
			leadId: args.leadId,
			organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
		});
	},
});

/**
 * Deletar Tag (Admin Only)
 */
export const deleteTag = mutation({
	args: { tagId: v.id('tags') },
	handler: async (ctx, args) => {
		const identity = await requirePermission(ctx, PERMISSIONS.ALL); // Admin only
		const organizationId = await getOrganizationId(ctx);

		const tag = await ctx.db.get(args.tagId);
		if (!tag || tag.organizationId !== organizationId) {
			throw new Error('Tag não encontrada ou sem permissão');
		}

		// Cascade delete LeadTags
		const associations = await ctx.db
			.query('leadTags')
			.withIndex('by_tag', (q) => q.eq('tagId', args.tagId))
			.collect();

		let deletedCount = 0;
		for (const assoc of associations) {
			await ctx.db.delete(assoc._id);
			deletedCount++;
		}

		await ctx.db.delete(args.tagId);

		await ctx.db.insert('activities', {
			type: 'tag_deletada',
			description: `Tag "${tag.name}" deletada (${deletedCount} associações removidas)`,
			organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
			metadata: { deletedAssociations: deletedCount },
		});
	},
});

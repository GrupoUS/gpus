import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { requireAuth } from './lib/auth';

// Comment 7: Type-safety improvements with explicit unions from schema
export const list = query({
	args: {
		category: v.optional(
			v.union(
				v.literal('abertura'),
				v.literal('qualificacao'),
				v.literal('apresentacao'),
				v.literal('objecao_preco'),
				v.literal('objecao_tempo'),
				v.literal('objecao_outros_cursos'),
				v.literal('follow_up'),
				v.literal('fechamento'),
				v.literal('pos_venda'),
				v.literal('suporte'),
			),
		),
		product: v.optional(
			v.union(
				v.literal('trintae3'),
				v.literal('otb'),
				v.literal('black_neon'),
				v.literal('comunidade'),
				v.literal('auriculo'),
				v.literal('na_mesa_certa'),
				v.literal('geral'),
			),
		),
		isActive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		let templates = await ctx.db.query('messageTemplates').collect();

		if (args.category) {
			templates = await ctx.db
				.query('messageTemplates')
				.withIndex('by_category', (q) => q.eq('category', args.category))
				.collect();
		}

		// Apply filters
		if (args.product) {
			templates = templates.filter((t) => t.product === args.product);
		}
		if (args.isActive !== undefined) {
			templates = templates.filter((t) => t.isActive === args.isActive);
		}

		return templates.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
	},
});

export const getByCategory = query({
	args: {
		category: v.union(
			v.literal('abertura'),
			v.literal('qualificacao'),
			v.literal('apresentacao'),
			v.literal('objecao_preco'),
			v.literal('objecao_tempo'),
			v.literal('objecao_outros_cursos'),
			v.literal('follow_up'),
			v.literal('fechamento'),
			v.literal('pos_venda'),
			v.literal('suporte'),
		),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		return await ctx.db
			.query('messageTemplates')
			.withIndex('by_category', (q) => q.eq('category', args.category))
			.filter((q) => q.eq(q.field('isActive'), true))
			.collect();
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		category: v.union(
			v.literal('abertura'),
			v.literal('qualificacao'),
			v.literal('apresentacao'),
			v.literal('objecao_preco'),
			v.literal('objecao_tempo'),
			v.literal('objecao_outros_cursos'),
			v.literal('follow_up'),
			v.literal('fechamento'),
			v.literal('pos_venda'),
			v.literal('suporte'),
		),
		product: v.optional(
			v.union(
				v.literal('trintae3'),
				v.literal('otb'),
				v.literal('black_neon'),
				v.literal('comunidade'),
				v.literal('auriculo'),
				v.literal('na_mesa_certa'),
				v.literal('geral'),
			),
		),
		content: v.string(),
		variables: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error('Unauthenticated');

		const templateId = await ctx.db.insert('messageTemplates', {
			...args,
			isActive: true,
			usageCount: 0,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		return templateId;
	},
});

export const update = mutation({
	args: {
		templateId: v.id('messageTemplates'),
		patch: v.object({
			name: v.optional(v.string()),
			content: v.optional(v.string()),
			isActive: v.optional(v.boolean()),
			category: v.optional(
				v.union(
					v.literal('abertura'),
					v.literal('qualificacao'),
					v.literal('apresentacao'),
					v.literal('objecao_preco'),
					v.literal('objecao_tempo'),
					v.literal('objecao_outros_cursos'),
					v.literal('follow_up'),
					v.literal('fechamento'),
					v.literal('pos_venda'),
					v.literal('suporte'),
				),
			),
			product: v.optional(
				v.union(
					v.literal('trintae3'),
					v.literal('otb'),
					v.literal('black_neon'),
					v.literal('comunidade'),
					v.literal('auriculo'),
					v.literal('na_mesa_certa'),
					v.literal('geral'),
				),
			),
			variables: v.optional(v.array(v.string())),
		}),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error('Unauthenticated');

		await ctx.db.patch(args.templateId, {
			...args.patch,
			updatedAt: Date.now(),
		});
	},
});

export const deleteTemplate = mutation({
	args: {
		templateId: v.id('messageTemplates'),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error('Unauthenticated');

		await ctx.db.delete(args.templateId);
	},
});

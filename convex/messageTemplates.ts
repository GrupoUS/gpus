import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireAuth } from './lib/auth'

export const listTemplates = query({
  args: {
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx)
    
    let templates = await ctx.db
      .query('messageTemplates')
      .order('desc')
      .collect()

    if (args.category) {
      templates = templates.filter(t => t.category === args.category)
    }

    if (args.isActive !== undefined) {
      templates = templates.filter(t => t.isActive === args.isActive)
    }

    return templates
  },
})

export const getTemplate = query({
  args: { templateId: v.id('messageTemplates') },
  handler: async (ctx, args) => {
    await requireAuth(ctx)
    
    return await ctx.db.get(args.templateId)
  },
})

export const createTemplate = mutation({
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
      v.literal('suporte')
    ),
    content: v.string(),
    variables: v.optional(v.array(v.string())),
    product: v.optional(v.union(
      v.literal('trintae3'),
      v.literal('otb'),
      v.literal('black_neon'),
      v.literal('comunidade'),
      v.literal('auriculo'),
      v.literal('na_mesa_certa'),
      v.literal('geral')
    )),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    return await ctx.db.insert('messageTemplates', {
      ...args,
      isActive: args.isActive ?? true,
      usageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
})

export const updateTemplate = mutation({
  args: {
    templateId: v.id('messageTemplates'),
    name: v.optional(v.string()),
    content: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    const { templateId, ...updates } = args
    await ctx.db.patch(templateId, {
      ...updates,
      updatedAt: Date.now(),
    })
  },
})

export const deleteTemplate = mutation({
  args: { templateId: v.id('messageTemplates') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    await ctx.db.delete(args.templateId)
  },
})

export const incrementUsage = mutation({
  args: { templateId: v.id('messageTemplates') },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId)
    if (!template) throw new Error('Template not found')

    await ctx.db.patch(args.templateId, {
      usageCount: (template.usageCount ?? 0) + 1,
    })
  },
})

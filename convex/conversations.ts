import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const listConversations = query({
  args: {
    status: v.optional(v.string()),
    assignedTo: v.optional(v.id('users')),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let conversations = await ctx.db
      .query('conversations')
      .order('desc')
      .collect()

    if (args.status && args.status !== 'all') {
      conversations = conversations.filter(c => c.status === args.status)
    }

    if (args.assignedTo) {
      conversations = conversations.filter(c => c.assignedTo === args.assignedTo)
    }

    return conversations
  },
})

export const getConversation = query({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId)
  },
})

export const createConversation = mutation({
  args: {
    leadId: v.optional(v.id('leads')),
    studentId: v.optional(v.id('students')),
    channel: v.union(
      v.literal('whatsapp'),
      v.literal('instagram'),
      v.literal('portal'),
      v.literal('email')
    ),
    department: v.union(
      v.literal('vendas'),
      v.literal('cs'),
      v.literal('suporte')
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', q => q.eq('clerkId', identity.subject))
      .first()

    const now = Date.now()

    return await ctx.db.insert('conversations', {
      ...args,
      status: 'em_atendimento',
      assignedTo: user?._id,
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const updateConversationStatus = mutation({
  args: {
    conversationId: v.id('conversations'),
    status: v.union(
      v.literal('aguardando_atendente'),
      v.literal('em_atendimento'),
      v.literal('aguardando_cliente'),
      v.literal('resolvido'),
      v.literal('bot_ativo')
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    await ctx.db.patch(args.conversationId, {
      status: args.status,
      updatedAt: Date.now(),
    })
  },
})

export const assignConversation = mutation({
  args: {
    conversationId: v.id('conversations'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    await ctx.db.patch(args.conversationId, {
      assignedTo: args.userId,
      updatedAt: Date.now(),
    })
  },
})

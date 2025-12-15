import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const getByConversation = query({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('messages')
      .withIndex('by_conversation', (q) => q.eq('conversationId', args.conversationId))
      .order('asc') // Chronological
      .collect()
  },
})

export const send = mutation({
  args: {
    conversationId: v.id('conversations'),
    content: v.string(),
    contentType: v.union(
      v.literal('text'),
      v.literal('image'),
      v.literal('audio'),
      v.literal('document'),
      v.literal('template')
    ),
    mediaUrl: v.optional(v.string()),
    templateId: v.optional(v.id('messageTemplates')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')
    
    // Find the user to link as sender logic
    // If authenticated, it's an agent or admin usually.
    // Plan says: "Determinar sender baseado no usuário autenticado (agent/bot/system)"
    // Usually via UI it's 'agent'.
    
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()
      
    // Default to 'agent' if user found, else 'system' or fail?
    // Plan assumes 'agent' logic.
    const sender = 'agent'
    
    const messageId = await ctx.db.insert('messages', {
      ...args,
      sender: sender,
      senderId: user?._id,
      status: 'enviando',
      createdAt: Date.now(),
    })
    
    // Update conversation
    // Note: Schema doesn't have 'lastMessage', only 'lastMessageAt'
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: Date.now(),
      updatedAt: Date.now(),
    })
    
    return messageId
  },
})

export const updateStatus = mutation({
  args: {
    messageId: v.id('messages'),
    status: v.union(
      v.literal('enviando'),
      v.literal('enviado'),
      v.literal('entregue'),
      v.literal('lido'),
      v.literal('falhou')
    ),
  },
  handler: async (ctx, args) => {
    // No auth check required as per plan (webhook usage)
    await ctx.db.patch(args.messageId, {
      status: args.status,
    })
  },
})

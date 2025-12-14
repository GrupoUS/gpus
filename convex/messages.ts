import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const listMessages = query({
  args: {
    conversationId: v.id('conversations'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50
    
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_conversation', q => q.eq('conversationId', args.conversationId))
      .order('asc')
      .take(limit)

    return messages
  },
})

export const sendMessage = mutation({
  args: {
    conversationId: v.id('conversations'),
    content: v.string(),
    contentType: v.optional(v.union(
      v.literal('text'),
      v.literal('image'),
      v.literal('audio'),
      v.literal('document'),
      v.literal('template')
    )),
    mediaUrl: v.optional(v.string()),
    templateId: v.optional(v.id('messageTemplates')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', q => q.eq('clerkId', identity.subject))
      .first()

    const now = Date.now()

    // Create the message
    const messageId = await ctx.db.insert('messages', {
      conversationId: args.conversationId,
      sender: 'agent',
      senderId: user?._id,
      content: args.content,
      contentType: args.contentType ?? 'text',
      mediaUrl: args.mediaUrl,
      templateId: args.templateId,
      status: 'enviado',
      createdAt: now,
    })

    // Update conversation with last message time
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
      updatedAt: now,
    })

    return messageId
  },
})

export const updateMessageStatus = mutation({
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
    await ctx.db.patch(args.messageId, {
      status: args.status,
    })
  },
})

// For receiving messages from external sources (webhooks)
export const receiveMessage = mutation({
  args: {
    conversationId: v.id('conversations'),
    content: v.string(),
    contentType: v.optional(v.union(
      v.literal('text'),
      v.literal('image'),
      v.literal('audio'),
      v.literal('document')
    )),
    mediaUrl: v.optional(v.string()),
    externalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    // Create the message from client
    const messageId = await ctx.db.insert('messages', {
      conversationId: args.conversationId,
      sender: 'client',
      content: args.content,
      contentType: args.contentType ?? 'text',
      mediaUrl: args.mediaUrl,
      externalId: args.externalId,
      status: 'entregue',
      createdAt: now,
    })

    // Update conversation
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
      updatedAt: now,
    })

    return messageId
  },
})

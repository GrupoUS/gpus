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

    // Find the internal user ID based on Clerk ID
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    const messageId = await ctx.db.insert('messages', {
      ...args,
      sender: 'agent',
      senderId: user?._id, // If user not found, strictly speaking it might be null, but usually system ensures user exists.
      status: 'enviando',
      createdAt: Date.now(),
    })

    // Update conversation
    await ctx.db.patch(args.conversationId, {
      lastMessage: args.content,
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
      v.literal('enviado'),
      v.literal('entregue'),
      v.literal('lido'),
      v.literal('falhou'),
      // Also potentially 'enviando' if needed, but usually we transition out of it.
      // Plan lists "enviado, entregue, lido, falhou" explicitly in description but "union(...)" in args.
      // I'll stick to the common ones plus 'enviando' if reset needed, or just these 4.
      v.literal('enviando') 
    ),
  },
  handler: async (ctx, args) => {
    // No auth check as per plan (webhook)
    await ctx.db.patch(args.messageId, {
      status: args.status,
      // Could allow updating updatedAt if needed, but not specified
    })
  },
})

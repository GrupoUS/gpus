import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const list = query({
  args: {
    department: v.optional(v.string()),
    search: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let conversations
    
    if (args.department) {
      conversations = await ctx.db
        .query('conversations')
        // @ts-ignore - Schema defines department literals, but args.department is string. 
        // We trust the filter logic or could validate strictly if needed.
        .withIndex('by_department', (q) => q.eq('department', args.department as any))
        .collect()
    } else {
      conversations = await ctx.db.query('conversations').collect()
    }
    
    // Filter by status if provided
    if (args.status) {
      conversations = conversations.filter(c => c.status === args.status)
    }

    // Enrich with contactName and lastMessage
    const enrichedConversations = await Promise.all(
      conversations.map(async (c) => {
        let contactName = 'Desconhecido'
        if (c.leadId) {
          const lead = await ctx.db.get(c.leadId)
          if (lead) contactName = lead.name
        } else if (c.studentId) {
          const student = await ctx.db.get(c.studentId)
          if (student) contactName = student.name
        }

        // Fetch last message content
        const lastMsg = await ctx.db
          .query('messages')
          .withIndex('by_conversation', (q) => q.eq('conversationId', c._id))
          .order('desc')
          .first()

        return {
          ...c,
          contactName,
          lastMessage: lastMsg?.content,
        }
      })
    )

    // Apply search filter (on contactName)
    let filtered = enrichedConversations
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      filtered = filtered.filter((c) => 
        c.contactName.toLowerCase().includes(searchLower)
      )
    }

    // Sort by lastMessageAt desc
    return filtered.sort((a, b) => b.lastMessageAt - a.lastMessageAt)
  },
})

export const getById = query({
  args: { id: v.id('conversations') },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.id)
    if (!conversation) return null

    let contactName = 'Desconhecido'
    let lead = null
    let student = null

    if (conversation.leadId) {
      lead = await ctx.db.get(conversation.leadId)
      if (lead) contactName = lead.name
    } else if (conversation.studentId) {
      student = await ctx.db.get(conversation.studentId)
      if (student) contactName = student.name
    }

    return {
      ...conversation,
      contactName,
      lead,
      student,
    }
  },
})

export const getByStudent = query({
  args: { studentId: v.id('students') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('conversations')
      .withIndex('by_student', (q) => q.eq('studentId', args.studentId))
      .collect()
  },
})

export const getByLead = query({
  args: { leadId: v.id('leads') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('conversations')
      .withIndex('by_lead', (q) => q.eq('leadId', args.leadId))
      .collect()
  },
})

export const create = mutation({
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
    status: v.union(
      v.literal('aguardando_atendente'),
      v.literal('em_atendimento'),
      v.literal('aguardando_cliente'),
      v.literal('resolvido'),
      v.literal('bot_ativo')
    ),
    externalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    const conversationId = await ctx.db.insert('conversations', {
      ...args,
      lastMessageAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    
    return conversationId
  },
})

export const update = mutation({
  args: {
    conversationId: v.id('conversations'),
    patch: v.object({
      status: v.optional(
        v.union(
          v.literal('aguardando_atendente'),
          v.literal('em_atendimento'),
          v.literal('aguardando_cliente'),
          v.literal('resolvido'),
          v.literal('bot_ativo')
        )
      ),
      assignedTo: v.optional(v.id('users')),
      // Note: lastMessage is not in schema, so we don't update it here.
      // logic handles lastMessage retrieval dynamically.
      lastMessageAt: v.optional(v.number()),
      department: v.optional(
        v.union(
          v.literal('vendas'),
          v.literal('cs'),
          v.literal('suporte')
        )
      ),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    await ctx.db.patch(args.conversationId, {
      ...args.patch,
      updatedAt: Date.now(),
    })
  },
})

import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import type { Doc } from './_generated/dataModel'

export const list = query({
  args: {
    department: v.optional(v.string()),
    search: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let conversations
    
    // Manual cast or loose check since we simplified args to string for flexibility
    // but schema requires union. We'll use a type assertion for the filter.
    if (args.department) {
      conversations = await ctx.db
        .query('conversations')
        .withIndex('by_department', (q) => q.eq('department', args.department as any)) 
        .collect()
    } else {
      conversations = await ctx.db.query('conversations').collect()
    }

    const enrichConversation = async (conv: Doc<'conversations'>) => {
      let contactName = 'Unknown'
      if (conv.leadId) {
        const lead = await ctx.db.get(conv.leadId)
        if (lead) contactName = lead.name
      } else if (conv.studentId) {
        const student = await ctx.db.get(conv.studentId)
        if (student) contactName = student.name
      }
      return { ...conv, contactName }
    }

    const enriched = await Promise.all(conversations.map(enrichConversation))

    let filtered = enriched

    if (args.status) {
      filtered = filtered.filter((c) => c.status === args.status)
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase()
      filtered = filtered.filter((c) => 
        c.contactName.toLowerCase().includes(searchLower)
      )
    }
    
    // Sort desc by lastMessageAt
    return filtered.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0))
  },
})

export const getById = query({
  args: { id: v.id('conversations') },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.id)
    if (!conversation) return null

    let contactName = 'Unknown'
    let contactPhone = ''
    if (conversation.leadId) {
      const lead = await ctx.db.get(conversation.leadId)
      if (lead) {
        contactName = lead.name
        contactPhone = lead.phone || ''
      }
    } else if (conversation.studentId) {
      const student = await ctx.db.get(conversation.studentId)
      if (student) {
        contactName = student.name
        contactPhone = student.phone || ''
      }
    }

    return { ...conversation, contactName, contactPhone }
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
      assignedTo: undefined, 
    })

    return conversationId
  },
})

export const update = mutation({
  args: {
    conversationId: v.id('conversations'),
    patch: v.object({
      status: v.optional(v.union(
        v.literal('aguardando_atendente'),
        v.literal('em_atendimento'),
        v.literal('aguardando_cliente'),
        v.literal('resolvido'),
        v.literal('bot_ativo')
      )),
      assignedTo: v.optional(v.id('users')),
      // lastMessage removed as it does not exist in schema
      lastMessageAt: v.optional(v.number()),
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

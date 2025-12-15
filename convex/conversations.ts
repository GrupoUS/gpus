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
        .withIndex('by_department', (q) => q.eq('department', args.department))
        .collect()
    } else {
      conversations = await ctx.db.query('conversations').collect()
    }

    const enrichConversation = async (conv: any) => {
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
    channel: v.string(),
    department: v.string(),
    status: v.string(),
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
      assignedTo: undefined, // Plan doesn't specify default, assumes undefined or optional
    })

    return conversationId
  },
})

export const update = mutation({
  args: {
    conversationId: v.id('conversations'),
    patch: v.object({
      status: v.optional(v.string()),
      assignedTo: v.optional(v.id('users')),
      lastMessage: v.optional(v.string()),
      lastMessageAt: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    await ctx.db.patch(args.conversationId, {
      ...args.patch,
      updatedAt: Date.now(),
      // lastMessageAt is in patch if provided, otherwise preserve
    })
  },
})

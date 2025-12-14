import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

// Common args for activity logging
const activityArgs = {
  type: v.union(
      v.literal('lead_criado'),
      v.literal('lead_qualificado'),
      v.literal('stage_changed'),
      v.literal('mensagem_enviada'),
      v.literal('mensagem_recebida'),
      v.literal('ligacao'),
      v.literal('email_enviado'),
      v.literal('proposta_enviada'),
      v.literal('venda_fechada'),
      v.literal('matricula_criada'),
      v.literal('pagamento_confirmado'),
      v.literal('pagamento_atrasado'),
      v.literal('modulo_concluido'),
      v.literal('pratica_agendada'),
      v.literal('pratica_concluida'),
      v.literal('certificado_emitido'),
      v.literal('ticket_aberto'),
      v.literal('ticket_resolvido'),
      v.literal('nota_adicionada'),
      v.literal('atribuicao_alterada')
  ),
  description: v.string(),
  metadata: v.optional(v.any()),
}

export const listByLead = query({
  args: { leadId: v.id('leads') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('activities')
      .withIndex('by_lead', (q) => q.eq('leadId', args.leadId))
      .order('desc')
      .collect()
  },
})

export const listByStudent = query({
  args: { studentId: v.id('students') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('activities')
      .withIndex('by_student', (q) => q.eq('studentId', args.studentId))
      .order('desc')
      .collect()
  },
})

export const logActivity = mutation({
  args: {
    ...activityArgs,
    leadId: v.optional(v.id('leads')),
    studentId: v.optional(v.id('students')),
    enrollmentId: v.optional(v.id('enrollments')),
    conversationId: v.optional(v.id('conversations')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    // Find internal user ID based on clerkId? 
    // For now we might just store the clerkId or rely on frontend to pass it (not secure).
    // Better: look up user by clerkId in `users` table.
    const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();

    await ctx.db.insert('activities', {
      ...args,
      userId: user?._id, // If user not found (e.g. admin sync issue), might be undefined or we handle it
      createdAt: Date.now(),
    })
  },
})

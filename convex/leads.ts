import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

// Common args for lead creation/update
const leadArgs = {
  name: v.string(),
  phone: v.string(),
  email: v.optional(v.string()),
  source: v.union(
    v.literal('whatsapp'),
    v.literal('instagram'),
    v.literal('landing_page'),
    v.literal('indicacao'),
    v.literal('evento'),
    v.literal('organico'),
    v.literal('trafego_pago'),
    v.literal('outro')
  ),
  profession: v.optional(v.union(
    v.literal('enfermeiro'),
    v.literal('dentista'),
    v.literal('biomedico'),
    v.literal('farmaceutico'),
    v.literal('medico'),
    v.literal('esteticista'),
    v.literal('outro')
  )),
  interestedProduct: v.optional(v.union(
    v.literal('trintae3'),
    v.literal('otb'),
    v.literal('black_neon'),
    v.literal('comunidade'),
    v.literal('auriculo'),
    v.literal('na_mesa_certa'),
    v.literal('indefinido')
  )),
  temperature: v.union(
    v.literal('frio'),
    v.literal('morno'),
    v.literal('quente')
  ),
  stage: v.union(
    v.literal('novo'),
    v.literal('primeiro_contato'),
    v.literal('qualificado'),
    v.literal('proposta'),
    v.literal('negociacao'),
    v.literal('fechado_ganho'),
    v.literal('fechado_perdido')
  ),
}

export const listLeads = query({
  args: {
    stage: v.optional(v.string()), // Filter by stage
    search: v.optional(v.string()), // Search via text
  },
  handler: async (ctx, args) => {
    // Basic implementation: fetch all then filter? Or use indexes.
    // If stage is provided, use index.
    let leads
    if (args.stage) {
      if (args.stage === 'all') { // Optional: 'all' keyword
          leads = await ctx.db.query('leads').order('desc').collect()
      } else {
         // This assumes the passed string is a valid stage literal.
         // In a real app we might want to validate or cast, but schema ensures types on write.
         // On read, we need to match the union type or just use string for the query args if relaxed.
         // However, schema definition for stage is strict. Let's assume frontend passes valid stage.
         // We can't query by string if schema expects literal union, unless we cast or match.
         // But queries are flexible on args.
         // Let's use filter if we can't guarantee type, or iterate.
         // Using 'by_stage' index:
         // Note: args.stage is string, schema is union. Typescript might complain if we don't cast.
         // But at runtime it works if value matches.
         leads = await ctx.db
          .query('leads')
          // @ts-ignore
          .withIndex('by_stage', (q) => q.eq('stage', args.stage))
          .collect()
      }
    } else {
        leads = await ctx.db.query('leads').order('desc').collect()
    }

    if (args.search) {
        const search = args.search.toLowerCase()
        leads = leads.filter(l => 
            l.name.toLowerCase().includes(search) || 
            l.phone.includes(search) ||
            (l.email && l.email.toLowerCase().includes(search))
        )
    }

    return leads
  },
})

export const createLead = mutation({
  args: {
      ...leadArgs,
      assignedTo: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
      // Check for auth if needed
      const identity = await ctx.auth.getUserIdentity()
      if (!identity) {
          throw new Error("Unauthenticated")
      }

      const leadId = await ctx.db.insert('leads', {
          ...args,
          createdAt: Date.now(),
          updatedAt: Date.now(),
      })
      return leadId
  }
})

export const updateLeadStage = mutation({
    args: {
        leadId: v.id('leads'),
        newStage: v.union(
            v.literal('novo'),
            v.literal('primeiro_contato'),
            v.literal('qualificado'),
            v.literal('proposta'),
            v.literal('negociacao'),
            v.literal('fechado_ganho'),
            v.literal('fechado_perdido')
        )
    },
    handler: async (ctx, args) => {
        // Auth check
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) throw new Error("Unauthenticated")
        
        await ctx.db.patch(args.leadId, {
            stage: args.newStage,
            updatedAt: Date.now()
        })
    }
})

export const updateLead = mutation({
    args: {
        leadId: v.id('leads'),
        patch: v.object({
             // Allow partial updates of fields
             name: v.optional(v.string()),
             phone: v.optional(v.string()),
             stage: v.optional(v.union(
                v.literal('novo'),
                v.literal('primeiro_contato'),
                v.literal('qualificado'),
                v.literal('proposta'),
                v.literal('negociacao'),
                v.literal('fechado_ganho'),
                v.literal('fechado_perdido')
              )),
             // Add others as needed
             interestedProduct: v.optional(v.union(
                v.literal('trintae3'),
                v.literal('otb'),
                v.literal('black_neon'),
                v.literal('comunidade'),
                v.literal('auriculo'),
                v.literal('na_mesa_certa'),
                v.literal('indefinido')
              )),
        })
    },
    handler: async (ctx, args) => {
         const identity = await ctx.auth.getUserIdentity()
         if (!identity) throw new Error("Unauthenticated")

         await ctx.db.patch(args.leadId, {
             ...args.patch,
             updatedAt: Date.now()
         })
    }
})

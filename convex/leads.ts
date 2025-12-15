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

  // Clinic qualification
  hasClinic: v.optional(v.boolean()),
  clinicName: v.optional(v.string()),
  clinicCity: v.optional(v.string()),

  // Professional background
  yearsInAesthetics: v.optional(v.number()),
  currentRevenue: v.optional(v.string()), // '0-5k' | '5k-10k' | '10k-20k' | '20k-50k' | '50k+'

  // Pain point diagnosis
  mainPain: v.optional(v.union(
    v.literal('tecnica'),
    v.literal('vendas'),
    v.literal('gestao'),
    v.literal('posicionamento'),
    v.literal('escala'),
    v.literal('certificacao'),
    v.literal('outro')
  )),
  mainDesire: v.optional(v.string()),

  // Additional
  sourceDetail: v.optional(v.string()),
  score: v.optional(v.number()),
  nextFollowUpAt: v.optional(v.number()),
}

export const listLeads = query({
  args: {
    stage: v.optional(v.string()), // Deprecated, kept for backward compatibility if needed, though we prefer array now
    stages: v.optional(v.array(v.string())),
    search: v.optional(v.string()),
    temperature: v.optional(v.array(v.string())),
    products: v.optional(v.array(v.string())),
    source: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    let leads = await ctx.db.query('leads').order('desc').collect()

    // Filter by stage(s)
    if (args.stages && args.stages.length > 0) {
        leads = leads.filter(l => args.stages!.includes(l.stage))
    } else if (args.stage && args.stage !== 'all') {
         // Fallback to legacy single stage param
         leads = leads.filter(l => l.stage === args.stage)
    }

    // Filter by temperature
    if (args.temperature && args.temperature.length > 0) {
        leads = leads.filter(l => args.temperature!.includes(l.temperature))
    }

    // Filter by product
    if (args.products && args.products.length > 0) {
        leads = leads.filter(l => l.interestedProduct ? args.products!.includes(l.interestedProduct) : false)
    }

    // Filter by source
    if (args.source && args.source.length > 0) {
         leads = leads.filter(l => args.source!.includes(l.source))
    }

    // Filter by search text
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
             email: v.optional(v.string()),
             stage: v.optional(v.union(
                v.literal('novo'),
                v.literal('primeiro_contato'),
                v.literal('qualificado'),
                v.literal('proposta'),
                v.literal('negociacao'),
                v.literal('fechado_ganho'),
                v.literal('fechado_perdido')
              )),
             // Clinic qualification
             hasClinic: v.optional(v.boolean()),
             clinicName: v.optional(v.string()),
             clinicCity: v.optional(v.string()),
             
             // Professional background
             yearsInAesthetics: v.optional(v.number()),
             currentRevenue: v.optional(v.string()),
             profession: v.optional(v.union(
               v.literal('enfermeiro'),
               v.literal('dentista'),
               v.literal('biomedico'),
               v.literal('farmaceutico'),
               v.literal('medico'),
               v.literal('esteticista'),
               v.literal('outro')
             )),

             // Pain point diagnosis
             mainPain: v.optional(v.union(
               v.literal('tecnica'),
               v.literal('vendas'),
               v.literal('gestao'),
               v.literal('posicionamento'),
               v.literal('escala'),
               v.literal('certificacao'),
               v.literal('outro')
             )),
             mainDesire: v.optional(v.string()),

             // Product
             interestedProduct: v.optional(v.union(
                v.literal('trintae3'),
                v.literal('otb'),
                v.literal('black_neon'),
                v.literal('comunidade'),
                v.literal('auriculo'),
                v.literal('na_mesa_certa'),
                v.literal('indefinido')
              )),

            // Additional
            sourceDetail: v.optional(v.string()),
            score: v.optional(v.number()),
            nextFollowUpAt: v.optional(v.number()),
            temperature: v.optional(v.union(
                v.literal('frio'),
                v.literal('morno'),
                v.literal('quente')
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

export const getLead = query({
  args: { leadId: v.id('leads') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.leadId)
  }
})

export const recent = query({
  args: {
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('leads')
      .withIndex('by_created')
      .order('desc')
      .take(args.limit ?? 10)
  }
})

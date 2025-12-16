import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireAuth, getOrganizationId } from './lib/auth'

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
    // 1. Verify Auth & Get Org ID
    const organizationId = await getOrganizationId(ctx);

    let leads;
    
    // Optimization: Use index if filtering by a single stage
    const singleStage = 
        (args.stages?.length === 1 ? args.stages[0] : null) ?? 
        (args.stage && args.stage !== 'all' ? args.stage : null);

    if (singleStage) {
        leads = await ctx.db
            .query('leads')
            .withIndex('by_organization_stage', q => 
                q.eq('organizationId', organizationId)
                 .eq('stage', singleStage as any)
            )
            .order('desc')
            .collect();
    } else {
        leads = await ctx.db
            .query('leads')
            .withIndex('by_organization', q => q.eq('organizationId', organizationId))
            .order('desc')
            .collect();

        // Filter by multiple stages if applicable
        if (args.stages && args.stages.length > 0) {
            leads = leads.filter(l => args.stages!.includes(l.stage));
        } else if (args.stage && args.stage !== 'all') {
             leads = leads.filter(l => l.stage === args.stage);
        }
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
      // Check for auth and get org
      const identity = await requireAuth(ctx)
      const organizationId = await getOrganizationId(ctx)

      const leadId = await ctx.db.insert('leads', {
          ...args,
          organizationId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
      })
      
      // Log activity
      await ctx.db.insert('activities', {
          type: 'lead_criado',
          description: `Lead "${args.name}" criado`,
          leadId: leadId,
          organizationId,
          performedBy: identity.subject,
          createdAt: Date.now(),
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
        const identity = await requireAuth(ctx)
        const organizationId = await getOrganizationId(ctx)
        
        const lead = await ctx.db.get(args.leadId)
        if (!lead || lead.organizationId !== organizationId) {
             throw new Error("Lead not found or permission denied")
        }
        
        await ctx.db.patch(args.leadId, {
            stage: args.newStage,
            updatedAt: Date.now()
        })
        
        // Activity log
        await ctx.db.insert('activities', {
            type: 'stage_changed',
            description: `Lead movido para ${args.newStage}`,
            leadId: args.leadId,
            organizationId,
            performedBy: identity.subject,
            createdAt: Date.now(),
            metadata: { from: lead.stage, to: args.newStage }
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
         await requireAuth(ctx)
         const organizationId = await getOrganizationId(ctx)
         
         const lead = await ctx.db.get(args.leadId)
         if (!lead || lead.organizationId !== organizationId) {
             throw new Error("Lead not found or permission denied")
         }

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
    // recent leads should also be scoped? usually yes.
    const organizationId = await getOrganizationId(ctx);

    // filtering by created AND organization is tricky without specific index.
    // Schema has 'by_created'. 'by_organization' exists. 
    // Ideally we need 'by_organization_created' but 'by_organization' + manual sort might suffice for small sets.
    // Or we use the by_organization index and sort in memory if not too many.
    // Let's assume we want to stick to DB sorting. 
    // Plan didn't specify recent query index updates. 
    // I added 'by_organization'. 
    // Let's use 'by_organization' and take recent.
    // Actually typically 'recent' dashboard widgets need efficient latest. 
    // I'll add 'by_organization_created' index to schema? No, I shouldn't modify schema again if I can avoid it.
    // Let's filter in memory for now or just use standard query if volume is low.
    // BUT we must filter by organization.
    
    return await ctx.db
      .query('leads')
      .withIndex('by_organization', q => q.eq('organizationId', organizationId))
      .order('desc')
      // .take(args.limit ?? 10) // .take() on query uses the index order. 
      // by_organization index doesn't guarantee creation order? 
      // convex indexes are ordered by indexed fields + _creationTime implicitly? 
      // Wait, standard index is by fields. If duplicates, then _id.
      // So 'by_organization' order is random for same org? No.
      // Convex docs: "Records with the same values for the indexed fields are ordered by their creation time."
      // YES! So by_organization is implicitly by_organization_and_creation_time.
      .take(args.limit ?? 10)
  }
})

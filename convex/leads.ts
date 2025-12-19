import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { paginationOptsValidator } from 'convex/server'
import { internal } from './_generated/api'
import { getOrganizationId, requirePermission } from './lib/auth'
import { PERMISSIONS } from './lib/permissions'

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
    paginationOpts: paginationOptsValidator,
    stage: v.optional(v.string()),
    stages: v.optional(v.array(v.string())),
    search: v.optional(v.string()),
    temperature: v.optional(v.array(v.string())),
    products: v.optional(v.array(v.string())),
    source: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // 1. Verify Auth & Permissions
    await requirePermission(ctx, PERMISSIONS.LEADS_READ)
    const organizationId = await getOrganizationId(ctx);

    // Optimization: Use index if filtering by a single stage
    const singleStage =
        (args.stages?.length === 1 ? args.stages[0] : null) ??
        (args.stage && args.stage !== 'all' ? args.stage : null);

    let query;
    if (singleStage) {
        query = ctx.db
            .query('leads')
            .withIndex('by_organization_stage', q =>
                q.eq('organizationId', organizationId)
                 .eq('stage', singleStage as any)
            )
            .order('desc');
    } else {
        query = ctx.db
            .query('leads')
            .withIndex('by_organization', q => q.eq('organizationId', organizationId))
            .order('desc');
    }

    const results = await query.paginate(args.paginationOpts);

    // Filter the page in memory (Note: this may result in fewer items than numItems)
    results.page = results.page.filter(l => {
        // Filter by multiple stages if applicable
        if (args.stages && args.stages.length > 0) {
            if (!args.stages.includes(l.stage)) return false;
        } else if (args.stage && args.stage !== 'all') {
             if (l.stage !== args.stage) return false;
        }

        // Filter by temperature
        if (args.temperature && args.temperature.length > 0) {
            if (!args.temperature.includes(l.temperature)) return false;
        }

        // Filter by product
        if (args.products && args.products.length > 0) {
            if (!l.interestedProduct || !args.products.includes(l.interestedProduct)) return false;
        }

        // Filter by source
        if (args.source && args.source.length > 0) {
             if (!args.source.includes(l.source)) return false;
        }

        // Filter by search text
        if (args.search) {
            const search = args.search.toLowerCase()
            const matches = 
                l.name.toLowerCase().includes(search) ||
                l.phone.includes(search) ||
                (l.email && l.email.toLowerCase().includes(search));
            if (!matches) return false;
        }

        return true;
    });

    return results;
  },
})

export const createLead = mutation({
  args: {
      ...leadArgs,
      assignedTo: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
      // Check for auth and permissions
      const identity = await requirePermission(ctx, PERMISSIONS.LEADS_WRITE)
      const organizationId = await getOrganizationId(ctx)

      // Check for existing lead with same phone (duplicate prevention)
      const existingLead = await ctx.db
          .query('leads')
          .withIndex('by_organization_phone', (q) =>
              q.eq('organizationId', organizationId).eq('phone', args.phone)
          )
          .first()

      // Idempotent: return existing lead ID if duplicate
      if (existingLead) {
          return existingLead._id
      }

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

      // Auto-sync to email marketing (if lead has email)
      if (args.email) {
          await ctx.scheduler.runAfter(0, (internal as any).emailMarketing.syncLeadAsContactInternal, {
              leadId,
              organizationId,
          })
      }

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
        // Auth/Permission check
        const identity = await requirePermission(ctx, PERMISSIONS.LEADS_WRITE)
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
         await requirePermission(ctx, PERMISSIONS.LEADS_WRITE)
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
    // Require authentication and get organization scope
    await requirePermission(ctx, PERMISSIONS.LEADS_READ)
    const organizationId = await getOrganizationId(ctx)

    const lead = await ctx.db.get(args.leadId)

    // Only return lead if it belongs to the caller's organization
    if (!lead || lead.organizationId !== organizationId) {
      return null
    }

    return lead
  }
})
export const recent = query({
  args: {
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, PERMISSIONS.LEADS_READ)

    const organizationId = await getOrganizationId(ctx);

    return await ctx.db
      .query('leads')
      .withIndex('by_organization', q => q.eq('organizationId', organizationId))
      .order('desc')
      .take(args.limit ?? 10)
  }
})

// ═══════════════════════════════════════════════════════
// ADMIN: Deduplicate existing leads (cleanup mutation)
// ═══════════════════════════════════════════════════════
export const deduplicateLeads = mutation({
  args: {
    dryRun: v.optional(v.boolean()), // If true, only returns duplicates without deleting
  },
  handler: async (ctx, args) => {
    // Permission check
    const identity = await requirePermission(ctx, PERMISSIONS.LEADS_WRITE)
    const organizationId = await getOrganizationId(ctx)

    // Fetch all leads for this organization
    const allLeads = await ctx.db
      .query('leads')
      .withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
      .collect()

    // Group leads by phone number
    const leadsByPhone = new Map<string, typeof allLeads>()
    for (const lead of allLeads) {
      const existing = leadsByPhone.get(lead.phone) || []
      existing.push(lead)
      leadsByPhone.set(lead.phone, existing)
    }

    // Find duplicates (phone numbers with more than one lead)
    const duplicateGroups: Array<{
      phone: string
      keepId: string
      deleteIds: string[]
    }> = []

    for (const [phone, leads] of leadsByPhone) {
      if (leads.length > 1) {
        // Sort by createdAt to keep the oldest one
        leads.sort((a, b) => a.createdAt - b.createdAt)
        const [keep, ...toDelete] = leads
        duplicateGroups.push({
          phone,
          keepId: keep._id,
          deleteIds: toDelete.map((l) => l._id),
        })
      }
    }

    // If dry run, just return the duplicates found
    if (args.dryRun) {
      return {
        mode: 'dry_run',
        totalLeads: allLeads.length,
        duplicateGroupsCount: duplicateGroups.length,
        duplicatesToDelete: duplicateGroups.reduce((acc, g) => acc + g.deleteIds.length, 0),
        duplicateGroups,
      }
    }

    // Actually delete duplicates
    let deletedCount = 0
    for (const group of duplicateGroups) {
      for (const deleteId of group.deleteIds) {
        await ctx.db.delete(deleteId as any)
        deletedCount++
      }
    }

    // Log cleanup activity
    await ctx.db.insert('activities', {
      type: 'lead_criado', // Using existing type, ideally would have 'admin_cleanup'
      description: `Admin: Removed ${deletedCount} duplicate leads`,
      organizationId,
      performedBy: identity.subject,
      createdAt: Date.now(),
    })

    return {
      mode: 'executed',
      totalLeads: allLeads.length,
      duplicateGroupsCount: duplicateGroups.length,
      deletedCount,
      remainingLeads: allLeads.length - deletedCount,
    }
  },
})

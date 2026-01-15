import { v } from 'convex/values'
import { mutation, query, internalMutation } from './_generated/server'
import { paginationOptsValidator } from 'convex/server'
import * as apiModule from './_generated/api'
const internal = (apiModule as any).internal
import { requirePermission } from './lib/auth'
import { PERMISSIONS } from './lib/permissions'
import { validateInput, rateLimiters, validationSchemas } from './lib/validation'
import { createAuditLog } from './lib/auditLogging'

// ═══════════════════════════════════════════════════════
// PUBLIC MUTATION: Create Marketing Lead
// ═══════════════════════════════════════════════════════

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    interest: v.union(
      v.literal("Harmonização Facial"),
      v.literal("Estética Corporal"),
      v.literal("Bioestimuladores"),
      v.literal("Outros")
    ),
    message: v.optional(v.string()),
    lgpdConsent: v.boolean(),
    whatsappConsent: v.boolean(),
    honeypot: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmContent: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Honeypot Check (anti-spam)
    if (args.honeypot && args.honeypot.length > 0) {
      console.warn('[MarketingLeads] Honeypot triggered, rejecting submission')
      throw new Error('Invalid submission')
    }

    // 2. Server-side Zod Validation
    const validation = validateInput(validationSchemas.marketingLead, args)
    if (!validation.success) {
      throw new Error(validation.error)
    }

    // 3. Rate Limiting (by email)
    const rateLimiter = rateLimiters.marketingLeadCapture
    if (!rateLimiter.isAllowed(args.email)) {
      const resetTime = rateLimiter.getResetTime(args.email)
      throw new Error(
        `Limite de submissões excedido. Tente novamente em ${Math.ceil(resetTime / 60000)} minutos.`
      )
    }

    // 4. Duplicate Email Check
    const existing = await ctx.db
      .query('marketing_leads')
      .withIndex('by_email', q => q.eq('email', args.email))
      .first()

    if (existing) {
      // Idempotent: return existing ID
      console.log('[MarketingLeads] Duplicate email, returning existing lead')
      return existing._id
    }

    // 5. Get Default Organization ID (from env or null)
    // Note: process.env for Convex functions is set in Dashboard
    const defaultOrgId = process.env.DEFAULT_ORGANIZATION_ID || undefined

    // 6. Insert Lead
    const leadId = await ctx.db.insert('marketing_leads', {
      name: args.name,
      email: args.email,
      phone: args.phone,
      interest: args.interest,
      message: args.message,
      lgpdConsent: args.lgpdConsent,
      whatsappConsent: args.whatsappConsent,
      utmSource: args.utmSource,
      utmCampaign: args.utmCampaign,
      utmMedium: args.utmMedium,
      utmContent: args.utmContent,
      utmTerm: args.utmTerm,
      status: 'new',
      organizationId: defaultOrgId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // 7. Log Audit Event
    // Use createAuditLog directly since logDataCreation requires studentId
    await createAuditLog(ctx, {
      actionType: 'data_creation',
      dataCategory: 'marketing_leads',
      description: `Lead capturado via formulário público: ${args.email}`,
      entityId: leadId,
      processingPurpose: 'captura de leads de marketing',
      legalBasis: 'consentimento',
      ipAddress: 'unknown',
    })

    // 8. Auto-sync to Brevo (async)
    // We use 'any' cast for internal calls as types might not be fully generated yet for this new file
    const syncFn = (internal as any)?.marketingLeads?.syncToBrevoInternal
    if (syncFn) {
        await (ctx.scheduler as any).runAfter(0, syncFn, {
        leadId,
        organizationId: defaultOrgId,
        })
    } else {
        console.warn('syncToBrevoInternal not scheduled - internal API likely not generated yet. Rerun code generation.')
    }

    return leadId
  }
})

// ═══════════════════════════════════════════════════════
// ADMIN QUERIES
// ═══════════════════════════════════════════════════════

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.string()),
    interest: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args: any) => {
    // Require admin permissions
    await requirePermission(ctx, PERMISSIONS.MARKETING_LEADS_READ)

    // Build query with filters
    const baseQuery = ctx.db.query('marketing_leads')
    let query

    if (args.status && args.status !== 'all') {
      query = baseQuery.withIndex('by_status', q => q.eq('status', args.status as any))
    } else {
      query = baseQuery.order('desc')
    }

    // Apply filters
    // Note: .filter() returns Query, preserving type
    query = query.filter((q: any) => {
      const filters = []

      if (args.interest) {
        filters.push(q.eq(q.field('interest'), args.interest))
      }

      return filters.length > 0 ? q.and(...filters) : true
    })

    const results = await query.paginate(args.paginationOpts)

    // Search filter (in-memory)
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      results.page = results.page.filter((l: any) =>
        l.name.toLowerCase().includes(searchLower) ||
        l.email.toLowerCase().includes(searchLower) ||
        l.phone.includes(searchLower)
      )
    }

    return results
  }
})

export const get = query({
  args: { leadId: v.id('marketing_leads') },
  handler: async (ctx, args) => {
    await requirePermission(ctx, PERMISSIONS.MARKETING_LEADS_READ)
    return await ctx.db.get(args.leadId)
  }
})

// ═══════════════════════════════════════════════════════
// ADMIN MUTATIONS
// ═══════════════════════════════════════════════════════

export const updateStatus = mutation({
  args: {
    leadId: v.id('marketing_leads'),
    newStatus: v.union(
      v.literal('new'),
      v.literal('contacted'),
      v.literal('converted'),
      v.literal('unsubscribed')
    )
  },
  handler: async (ctx, args) => {
    const identity = await requirePermission(ctx, PERMISSIONS.MARKETING_LEADS_WRITE)

    const lead = await ctx.db.get(args.leadId)
    if (!lead) {
      throw new Error('Lead not found')
    }

    await ctx.db.patch(args.leadId, {
      status: args.newStatus,
      updatedAt: Date.now()
    })

    // Log activity
    await ctx.db.insert('activities', {
      type: 'lead_criado', // Using existing type for now
      description: `Marketing lead status changed to ${args.newStatus}`,
      organizationId: lead.organizationId || 'system',
      performedBy: identity.subject,
      createdAt: Date.now(),
    })

    // If unsubscribed, update Brevo
    if (args.newStatus === 'unsubscribed' && lead.brevoContactId) {
      const syncFn = (internal as any).emailMarketing?.updateContactSubscriptionInternal
      if (syncFn) {
          await (ctx.scheduler as any).runAfter(0, syncFn, {
            email: lead.email,
            subscriptionStatus: 'unsubscribed'
          })
      }
    }
  }
})

export const exportToCSV = query({
  args: {
    status: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, PERMISSIONS.MARKETING_LEADS_READ)

    const baseQuery = ctx.db.query('marketing_leads')
    let query

    if (args.status && args.status !== 'all') {
      query = baseQuery.withIndex('by_status', q => q.eq('status', args.status as any))
    } else {
      query = baseQuery.order('desc')
    }

    let leads = await query.collect()

    // Date range filter
    if (args.startDate || args.endDate) {
      leads = leads.filter(l => {
        if (args.startDate && l.createdAt < args.startDate) return false
        if (args.endDate && l.createdAt > args.endDate) return false
        return true
      })
    }

    // Format for CSV export (return as array of objects)
    return leads.map(l => ({
      name: l.name,
      email: l.email,
      phone: l.phone,
      interest: l.interest,
      message: l.message || '',
      lgpdConsent: l.lgpdConsent ? 'Sim' : 'Não',
      whatsappConsent: l.whatsappConsent ? 'Sim' : 'Não',
      status: l.status,
      utmSource: l.utmSource || '',
      utmCampaign: l.utmCampaign || '',
      utmMedium: l.utmMedium || '',
      createdAt: new Date(l.createdAt).toISOString(),
    }))
  }
})

// ═══════════════════════════════════════════════════════
// INTERNAL MUTATIONS (Brevo Sync)
// ═══════════════════════════════════════════════════════

export const syncToBrevoInternal = internalMutation({
  args: {
    leadId: v.id('marketing_leads'),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId)
    if (!lead) {
      console.error('[MarketingLeads] Lead not found for Brevo sync')
      return
    }

    // Check if contact already exists
    const existingContact = await ctx.db
      .query('emailContacts')
      .withIndex('by_email', q => q.eq('email', lead.email))
      .first()

    if (existingContact) {
      console.log('[MarketingLeads] Contact already exists in Brevo')
      await ctx.db.patch(args.leadId, {
        brevoContactId: existingContact.brevoId,
        lastSyncedAt: Date.now()
      })
      return
    }

    // Create new contact via emailMarketing module
    // Note: We access internal via any to avoid type errors before generation
    const syncFn = (internal as any).emailMarketing?.syncLeadAsContactInternal

    if (syncFn) {
        await ctx.scheduler.runAfter(0, syncFn, {
        leadId: args.leadId,
        organizationId: args.organizationId || 'system',
        })
         console.log('[MarketingLeads] Scheduled Brevo sync for lead:', lead.email)
    } else {
        console.error('[MarketingLeads] emailMarketing.syncLeadAsContactInternal not found')
    }
  }
})

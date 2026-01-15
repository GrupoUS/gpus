import { v } from 'convex/values'
import { mutation, query, internalMutation } from './_generated/server'
import { paginationOptsValidator } from 'convex/server'
import * as apiModule from './_generated/api'
const internal = (apiModule as any).internal
import { requirePermission, getOrganizationId } from './lib/auth'
import { PERMISSIONS } from './lib/permissions'
import { validateInput, rateLimiters, validationSchemas } from './lib/validation'
// createAuditLog removed from imports as we do manual insert to avoid auth check
// import { createAuditLog } from './lib/auditLogging'

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
    userIp: v.optional(v.string()),
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

    // 3. Rate Limiting (IP-based + Email Secondary)
    if (args.userIp) {
        const limit = 5;
        const window = 60 * 60 * 1000; // 1 hour
        const recent = await ctx.db.query("rateLimits")
            .withIndex("by_identifier_action", q => q.eq("identifier", args.userIp!).eq("action", "marketing_lead_submit"))
            .filter(q => q.gte(q.field("timestamp"), Date.now() - window))
            .collect();

        if (recent.length >= limit) throw new Error("Rate limit exceeded");

        await ctx.db.insert("rateLimits", {
            identifier: args.userIp,
            action: "marketing_lead_submit",
            timestamp: Date.now()
        });
    }

    // Secondary email-based check (optional but good for consistency)
    const rateLimiter = rateLimiters.marketingLeadCapture
    if (!rateLimiter.isAllowed(args.email)) {
      const resetTime = rateLimiter.getResetTime(args.email)
      throw new Error(
        `Limite de submissões excedido. Tente novamente em ${Math.ceil(resetTime / 60000)} minutos.`
      )
    }

    // 4. Duplicate Email Check
    // We try to catch constraints if they exist, but usually Convex throws on insert if unique index exists.
    // However, we'll keep the check for graceful handling.
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

    // 7. Log Audit Event (Manual Insert to bypass Auth check)
    // Comment 1: "replace it with a logging path that does not require authentication"
    await ctx.db.insert('lgpdAudit', {
      actionType: 'data_creation',
      dataCategory: 'marketing_leads',
      description: `Lead capturado via formulário público: ${args.email}`,
      // entityId removed from top level, moved to metadata
      // entityId: leadId,
      metadata: { entityId: leadId },
      processingPurpose: 'captura de leads de marketing',
      legalBasis: 'consentimento',
      ipAddress: args.userIp || 'unknown',
      actorId: 'system_public_form', // System identity
      actorRole: 'system',
      createdAt: Date.now(),
    });

    // 8. Auto-sync to Brevo (async)
    // Comment 2: "uses the wrong internal mutation... update to schedule that function"
    const syncFn = (internal as any)?.emailMarketing?.syncMarketingLeadAsContactInternal
    if (syncFn) {
        await (ctx.scheduler as any).runAfter(0, syncFn, {
        leadId,
        organizationId: defaultOrgId,
        })
    } else {
        console.warn('syncMarketingLeadAsContactInternal not scheduled - internal API likely not generated yet.')
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
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args: any) => {
    // Require admin permissions
    await requirePermission(ctx, PERMISSIONS.MARKETING_LEADS_READ)
    // Comment 3: Organization scoping
    const organizationId = await getOrganizationId(ctx);

    // Build query with filters
    let query: any; // Use any to allow different Query types (Ordered vs Filtered)

    if (args.status && args.status !== 'all') {
      // Filter by status using index
      query = ctx.db.query('marketing_leads')
        .withIndex('by_organization_status', q => q.eq('organizationId', organizationId).eq('status', args.status as any))
    } else {
      // Default: all statuses
      // Use index 'by_organization_created' [organizationId, createdAt]
      query = ctx.db.query('marketing_leads')
        .withIndex('by_organization_created', q => q.eq('organizationId', organizationId))
    }

    // Apply filters
    // Note: .filter() returns Query, preserving type
    if (args.interest) {
        query = query.filter((q: any) => q.eq(q.field('interest'), args.interest));
    }

    // Date range filter
    if (args.startDate || args.endDate) {
        query = query.filter((q: any) => {
            const conditions = [];
            if (args.startDate) conditions.push(q.gte(q.field('createdAt'), args.startDate));
            if (args.endDate) conditions.push(q.lte(q.field('createdAt'), args.endDate));
            return q.and(...conditions);
        });
    }

    // Always order desc (reverse index scan/system order)
    const results = await query.order('desc').paginate(args.paginationOpts)

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
    const organizationId = await getOrganizationId(ctx);

    const lead = await ctx.db.get(args.leadId)
    if (!lead || lead.organizationId !== organizationId) {
        return null;
    }
    return lead
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
    const organizationId = await getOrganizationId(ctx);

    const lead = await ctx.db.get(args.leadId)
    // Comment 3: verify lead's organizationId matches
    if (!lead || lead.organizationId !== organizationId) {
      throw new Error('Lead not found or permission denied')
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
    interest: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, PERMISSIONS.MARKETING_LEADS_READ)
    const organizationId = await getOrganizationId(ctx);

    // const baseQuery removed
    let query

    if (args.status && args.status !== 'all') {
      // Use efficient index
      query = ctx.db.query('marketing_leads')
         .withIndex('by_organization_status', q => q.eq('organizationId', organizationId).eq('status', args.status as any))
    } else {
      query = ctx.db.query('marketing_leads')
         .withIndex('by_organization', q => q.eq('organizationId', organizationId))
    }

    if (args.startDate || args.endDate) {
        // If sorting by date is less important than organization + status, we filter in memory or use complex index
        // Schema has "by_organization_created"
        // If status is 'all' and we have dates, use that.
        if ((!args.status || args.status === 'all') && (args.startDate || args.endDate)) {
            query = ctx.db.query('marketing_leads')
                .withIndex('by_organization_created', q => q.eq('organizationId', organizationId))
                // We could use range queries if we had strict ranges, but filter is fine for CSV export volume
        }
    }

    // Always order desc
    let leads = await query.order('desc').collect()

    // Interest filter
    if (args.interest && args.interest !== 'all') {
      leads = leads.filter(l => l.interest === args.interest)
    }

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
      createdAt: new Date(l.createdAt).toLocaleDateString('pt-BR') + ' ' + new Date(l.createdAt).toLocaleTimeString('pt-BR'),
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
    // Comment 2: Use syncMarketingLeadAsContactInternal (though this is the OLD syncToBrevoInternal wrapper?
    // Comment 2 only mentioned updating create to schedule the function.
    // It says "Update convex/marketingLeads.ts to schedule that function" - probably refers to the create mutation.
    // But `syncToBrevoInternal` here is likely legacy or unused code if we change `create` to call `emailMarketing` directly.
    // However, if we keep `syncToBrevoInternal` as a wrapper, we should update it.
    // The previous implementation of `create` called `syncToBrevoInternal`? No, it called `emailMarketing.syncToBrevoInternal`?
    // Wait, step 9 code line 108: `const syncFn = (internal as any)?.marketingLeads?.syncToBrevoInternal`.
    // Ah, it was calling ITSELF (internal mutation in same file).
    // And THAT internal mutation (at line 283) called `emailMarketing.syncLeadAsContactInternal`.
    // The comment says "Update convex/marketingLeads.ts to schedule THAT function" (referring to the new internal mutation in emailMarketing).
    // So in `create`, I should call `emailMarketing.syncMarketingLeadAsContactInternal` properly.
    // And this `syncToBrevoInternal` function in `marketingLeads.ts` might become redundant or needs to be updated to use the new one.
    // I will simply remove `syncToBrevoInternal` from `marketingLeads.ts` if it's no longer used, OR update it to redirect.
    // Since `create` now calls `emailMarketing` directly (as per my update above), this function is orphaned unless scheduled elsewhere.
    // I'll leave it but updated just in case, or comment it out?
    // I'll update it to use the new correct internal function too, for safety.

    const syncFn = (internal as any).emailMarketing?.syncMarketingLeadAsContactInternal

    if (syncFn) {
        await ctx.scheduler.runAfter(0, syncFn, {
        leadId: args.leadId,
        organizationId: args.organizationId || 'system',
        })
         console.log('[MarketingLeads] Scheduled Brevo sync for lead via wrapper:', lead.email)
    } else {
        console.error('[MarketingLeads] emailMarketing.syncMarketingLeadAsContactInternal not found')
    }
  }
})

/**
 * Email Marketing Module (Brevo Integration)
 *
 * Provides queries, mutations, and actions for managing email marketing:
 * - Contact Management (sync from leads/students)
 * - List Management (distribution lists)
 * - Campaign Management (create, send, track)
 * - Template Management (email templates)
 *
 * LGPD Compliance: All operations are audited and respect consent settings.
 */

import { v } from 'convex/values'
import {
	action,
	internalMutation,
	internalQuery,
	mutation,
	query,
} from './_generated/server'
import { internal } from './_generated/api'

// Type assertion helper for internal functions during code generation bootstrap
// Once Convex generates types for this file, these can be removed
// biome-ignore lint/suspicious/noExplicitAny: Required for Convex internal API bootstrap
const internalEmailMarketing = (internal as any).emailMarketing as {
	getContactInternal: any
	getListInternal: any
	getCampaignInternal: any
	getTemplateInternal: any
	updateContactBrevoId: any
	updateListBrevoId: any
	updateCampaignBrevoId: any
	updateCampaignStatus: any
	updateCampaignStats: any
	updateTemplateBrevoId: any
	recordEmailEvent: any
	syncCampaignToBrevoInternal: any
}
import { getOrganizationId, requireAuth, getClerkId } from './lib/auth'
import {
	brevoCampaigns,
	brevoContacts,
	brevoLists,
	brevoTemplates,
} from './lib/brevo'
import { createAuditLog } from './lib/audit-logging'

// ═══════════════════════════════════════════════════════
// SECTION 1: CONTACT MANAGEMENT
// ═══════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────
// Contact Queries
// ─────────────────────────────────────────────────────────

/**
 * List contacts with optional filters
 */
export const getContacts = query({
	args: {
		subscriptionStatus: v.optional(
			v.union(
				v.literal('subscribed'),
				v.literal('unsubscribed'),
				v.literal('pending'),
			),
		),
		sourceType: v.optional(v.union(v.literal('lead'), v.literal('student'))),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const organizationId = await getOrganizationId(ctx)

		let contacts = await ctx.db
			.query('emailContacts')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
			.order('desc')
			.collect()

		// Apply filters
		if (args.subscriptionStatus) {
			contacts = contacts.filter(
				(c) => c.subscriptionStatus === args.subscriptionStatus,
			)
		}
		if (args.sourceType) {
			contacts = contacts.filter((c) => c.sourceType === args.sourceType)
		}

		// Apply limit
		if (args.limit) {
			contacts = contacts.slice(0, args.limit)
		}

		return contacts
	},
})

/**
 * Get single contact by ID
 */
export const getContact = query({
	args: { contactId: v.id('emailContacts') },
	handler: async (ctx, args) => {
		const organizationId = await getOrganizationId(ctx)
		const contact = await ctx.db.get(args.contactId)

		if (!contact || contact.organizationId !== organizationId) {
			return null
		}

		return contact
	},
})

/**
 * Get contact by email
 */
export const getContactByEmail = query({
	args: { email: v.string() },
	handler: async (ctx, args) => {
		const organizationId = await getOrganizationId(ctx)

		const contact = await ctx.db
			.query('emailContacts')
			.withIndex('by_email', (q) => q.eq('email', args.email))
			.first()

		if (!contact || contact.organizationId !== organizationId) {
			return null
		}

		return contact
	},
})

/**
 * Internal query for actions to fetch contact
 */
export const getContactInternal = internalQuery({
	args: { contactId: v.id('emailContacts') },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.contactId)
	},
})

// ─────────────────────────────────────────────────────────
// Contact Mutations
// ─────────────────────────────────────────────────────────

/**
 * Sync a lead as an email contact
 */
export const syncLeadAsContact = mutation({
	args: {
		leadId: v.id('leads'),
		consentId: v.optional(v.id('lgpdConsent')),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx)
		const organizationId = await getOrganizationId(ctx)

		// Get lead data
		const lead = await ctx.db.get(args.leadId)
		if (!lead) {
			throw new Error('Lead não encontrado')
		}
		if (!lead.email) {
			throw new Error('Lead não possui email cadastrado')
		}

		// Check if contact already exists for this lead
		const existing = await ctx.db
			.query('emailContacts')
			.withIndex('by_lead', (q) => q.eq('leadId', args.leadId))
			.first()

		if (existing) {
			return existing._id
		}

		const now = Date.now()
		const nameParts = (lead.name || '').split(' ')

		// Create contact
		const contactId = await ctx.db.insert('emailContacts', {
			email: lead.email,
			firstName: nameParts[0] || undefined,
			lastName: nameParts.slice(1).join(' ') || undefined,
			sourceType: 'lead',
			sourceId: args.leadId,
			leadId: args.leadId,
			organizationId,
			subscriptionStatus: 'pending',
			consentId: args.consentId,
			createdAt: now,
			updatedAt: now,
		})

		// LGPD Audit Log
		await createAuditLog(ctx, {
			actionType: 'data_creation',
			dataCategory: 'email_marketing',
			description: `Lead sincronizado como contato de email marketing: ${lead.email}`,
			entityId: contactId,
			processingPurpose: 'email marketing',
			legalBasis: 'consentimento',
		})

		return contactId
	},
})

/**
 * Sync a student as an email contact
 */
export const syncStudentAsContact = mutation({
	args: {
		studentId: v.id('students'),
		consentId: v.optional(v.id('lgpdConsent')),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx)
		const organizationId = await getOrganizationId(ctx)

		// Get student data
		const student = await ctx.db.get(args.studentId)
		if (!student) {
			throw new Error('Aluno não encontrado')
		}
		if (!student.email) {
			throw new Error('Aluno não possui email cadastrado')
		}

		// Check if contact already exists for this student
		const existing = await ctx.db
			.query('emailContacts')
			.withIndex('by_student', (q) => q.eq('studentId', args.studentId))
			.first()

		if (existing) {
			return existing._id
		}

		const now = Date.now()

		// Parse name into firstName/lastName
		const nameParts = (student.name || '').trim().split(' ')
		const firstName = nameParts[0] || undefined
		const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined

		// Create contact
		const contactId = await ctx.db.insert('emailContacts', {
			email: student.email,
			firstName,
			lastName,
			sourceType: 'student',
			sourceId: args.studentId,
			studentId: args.studentId,
			organizationId,
			subscriptionStatus: 'pending',
			consentId: args.consentId,
			createdAt: now,
			updatedAt: now,
		})

		// LGPD Audit Log
		await createAuditLog(ctx, {
			actionType: 'data_creation',
			dataCategory: 'email_marketing',
			description: `Aluno sincronizado como contato de email marketing: ${student.email}`,
			entityId: contactId,
			studentId: args.studentId,
			processingPurpose: 'email marketing',
			legalBasis: 'consentimento',
		})

		return contactId
	},
})

/**
 * Update contact subscription status (used by webhooks)
 */
export const updateContactSubscription = mutation({
	args: {
		contactId: v.id('emailContacts'),
		subscriptionStatus: v.union(
			v.literal('subscribed'),
			v.literal('unsubscribed'),
			v.literal('pending'),
		),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx)
		const organizationId = await getOrganizationId(ctx)

		const contact = await ctx.db.get(args.contactId)
		if (!contact || contact.organizationId !== organizationId) {
			throw new Error('Contato não encontrado')
		}

		await ctx.db.patch(args.contactId, {
			subscriptionStatus: args.subscriptionStatus,
			updatedAt: Date.now(),
		})

		// Log unsubscribe as LGPD consent withdrawal
		if (args.subscriptionStatus === 'unsubscribed') {
			await createAuditLog(ctx, {
				actionType: 'consent_withdrawn',
				dataCategory: 'email_marketing',
				description: `Contato cancelou inscrição de email marketing: ${contact.email}`,
				entityId: args.contactId,
				processingPurpose: 'email marketing',
				legalBasis: 'consentimento',
			})
		}
	},
})

/**
 * Internal mutation to update Brevo ID after sync
 */
export const updateContactBrevoId = internalMutation({
	args: {
		contactId: v.id('emailContacts'),
		brevoId: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.contactId, {
			brevoId: args.brevoId,
			lastSyncedAt: Date.now(),
			updatedAt: Date.now(),
		})
	},
})

/**
 * Internal mutation to update subscription from webhook
 */
export const updateContactSubscriptionInternal = internalMutation({
	args: {
		email: v.string(),
		subscriptionStatus: v.union(
			v.literal('subscribed'),
			v.literal('unsubscribed'),
			v.literal('pending'),
		),
	},
	handler: async (ctx, args) => {
		const contact = await ctx.db
			.query('emailContacts')
			.withIndex('by_email', (q) => q.eq('email', args.email))
			.first()

		if (contact) {
			await ctx.db.patch(contact._id, {
				subscriptionStatus: args.subscriptionStatus,
				updatedAt: Date.now(),
			})
		}
	},
})

// ─────────────────────────────────────────────────────────
// Contact Actions (External API Calls)
// ─────────────────────────────────────────────────────────

/**
 * Sync a contact to Brevo
 */
export const syncContactToBrevo = action({
	args: { contactId: v.id('emailContacts') },
	handler: async (ctx, args) => {
		// Get contact data via internal query
		const contact = await ctx.runQuery(
			internalEmailMarketing.getContactInternal,
			{ contactId: args.contactId },
		)

		if (!contact) {
			throw new Error('Contato não encontrado')
		}

		// Get list Brevo IDs for the contact's lists
		const brevoListIds: number[] = []
		if (contact.listIds && contact.listIds.length > 0) {
			for (const listId of contact.listIds) {
				const list = await ctx.runQuery(
					internalEmailMarketing.getListInternal,
					{ listId },
				)
				if (list?.brevoListId) {
					brevoListIds.push(list.brevoListId)
				}
			}
		}

		// Call Brevo API - upsert contact
		const result = await brevoContacts.upsert({
			email: contact.email,
			attributes: {
				FIRSTNAME: contact.firstName || '',
				LASTNAME: contact.lastName || '',
			},
			listIds: brevoListIds.length > 0 ? brevoListIds : undefined,
		})

		// Update DB with brevoId
		await ctx.runMutation(internalEmailMarketing.updateContactBrevoId, {
			contactId: args.contactId,
			brevoId: String(result.id),
		})

		return { success: true, brevoId: result.id }
	},
})

// ═══════════════════════════════════════════════════════
// SECTION 2: LIST MANAGEMENT
// ═══════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────
// List Queries
// ─────────────────────────────────────────────────────────

/**
 * List all email lists for organization
 */
export const getLists = query({
	args: {
		activeOnly: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const organizationId = await getOrganizationId(ctx)

		let lists = await ctx.db
			.query('emailLists')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
			.order('desc')
			.collect()

		if (args.activeOnly) {
			lists = lists.filter((l) => l.isActive)
		}

		return lists
	},
})

/**
 * Get single list by ID
 */
export const getList = query({
	args: { listId: v.id('emailLists') },
	handler: async (ctx, args) => {
		const organizationId = await getOrganizationId(ctx)
		const list = await ctx.db.get(args.listId)

		if (!list || list.organizationId !== organizationId) {
			return null
		}

		return list
	},
})

/**
 * Internal query for actions to fetch list
 */
export const getListInternal = internalQuery({
	args: { listId: v.id('emailLists') },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.listId)
	},
})

// ─────────────────────────────────────────────────────────
// List Mutations
// ─────────────────────────────────────────────────────────

/**
 * Create a new email list
 */
export const createList = mutation({
	args: {
		name: v.string(),
		description: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx)
		const organizationId = await getOrganizationId(ctx)
		const now = Date.now()

		return await ctx.db.insert('emailLists', {
			name: args.name,
			description: args.description,
			organizationId,
			contactCount: 0,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		})
	},
})

/**
 * Update an email list
 */
export const updateList = mutation({
	args: {
		listId: v.id('emailLists'),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		isActive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx)
		const organizationId = await getOrganizationId(ctx)

		const list = await ctx.db.get(args.listId)
		if (!list || list.organizationId !== organizationId) {
			throw new Error('Lista não encontrada')
		}

		const updates: Record<string, unknown> = { updatedAt: Date.now() }
		if (args.name !== undefined) updates.name = args.name
		if (args.description !== undefined) updates.description = args.description
		if (args.isActive !== undefined) updates.isActive = args.isActive

		await ctx.db.patch(args.listId, updates)
	},
})

/**
 * Delete an email list
 */
export const deleteList = mutation({
	args: { listId: v.id('emailLists') },
	handler: async (ctx, args) => {
		await requireAuth(ctx)
		const organizationId = await getOrganizationId(ctx)

		const list = await ctx.db.get(args.listId)
		if (!list || list.organizationId !== organizationId) {
			throw new Error('Lista não encontrada')
		}

		await ctx.db.delete(args.listId)
	},
})

/**
 * Add a contact to a list
 */
export const addContactToList = mutation({
	args: {
		contactId: v.id('emailContacts'),
		listId: v.id('emailLists'),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx)
		const organizationId = await getOrganizationId(ctx)

		const contact = await ctx.db.get(args.contactId)
		if (!contact || contact.organizationId !== organizationId) {
			throw new Error('Contato não encontrado')
		}

		const list = await ctx.db.get(args.listId)
		if (!list || list.organizationId !== organizationId) {
			throw new Error('Lista não encontrada')
		}

		// Add list to contact's listIds if not already present
		const currentListIds = contact.listIds || []
		if (!currentListIds.includes(args.listId)) {
			await ctx.db.patch(args.contactId, {
				listIds: [...currentListIds, args.listId],
				updatedAt: Date.now(),
			})

			// Increment list contact count
			await ctx.db.patch(args.listId, {
				contactCount: list.contactCount + 1,
				updatedAt: Date.now(),
			})
		}
	},
})

/**
 * Remove a contact from a list
 */
export const removeContactFromList = mutation({
	args: {
		contactId: v.id('emailContacts'),
		listId: v.id('emailLists'),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx)
		const organizationId = await getOrganizationId(ctx)

		const contact = await ctx.db.get(args.contactId)
		if (!contact || contact.organizationId !== organizationId) {
			throw new Error('Contato não encontrado')
		}

		const list = await ctx.db.get(args.listId)
		if (!list || list.organizationId !== organizationId) {
			throw new Error('Lista não encontrada')
		}

		// Remove list from contact's listIds
		const currentListIds = contact.listIds || []
		if (currentListIds.includes(args.listId)) {
			await ctx.db.patch(args.contactId, {
				listIds: currentListIds.filter((id) => id !== args.listId),
				updatedAt: Date.now(),
			})

			// Decrement list contact count
			await ctx.db.patch(args.listId, {
				contactCount: Math.max(0, list.contactCount - 1),
				updatedAt: Date.now(),
			})
		}
	},
})

/**
 * Internal mutation to update Brevo list ID after sync
 */
export const updateListBrevoId = internalMutation({
	args: {
		listId: v.id('emailLists'),
		brevoListId: v.number(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.listId, {
			brevoListId: args.brevoListId,
			updatedAt: Date.now(),
		})
	},
})

// ─────────────────────────────────────────────────────────
// List Actions (External API Calls)
// ─────────────────────────────────────────────────────────

/**
 * Sync a list to Brevo
 */
export const syncListToBrevo = action({
	args: { listId: v.id('emailLists') },
	handler: async (ctx, args) => {
		// Get list data via internal query
		const list = await ctx.runQuery(internalEmailMarketing.getListInternal, {
			listId: args.listId,
		})

		if (!list) {
			throw new Error('Lista não encontrada')
		}

		// If already has brevoListId, return it
		if (list.brevoListId) {
			return { success: true, brevoListId: list.brevoListId }
		}

		// Create list in Brevo (using folder 1 as default)
		const result = await brevoLists.create({
			name: list.name,
			folderId: 1,
		})

		// Update DB with brevoListId
		await ctx.runMutation(internalEmailMarketing.updateListBrevoId, {
			listId: args.listId,
			brevoListId: result.id,
		})

		return { success: true, brevoListId: result.id }
	},
})

// ═══════════════════════════════════════════════════════
// SECTION 3: CAMPAIGN MANAGEMENT
// ═══════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────
// Campaign Queries
// ─────────────────────────────────────────────────────────

/**
 * List campaigns with optional status filter
 */
export const getCampaigns = query({
	args: {
		status: v.optional(
			v.union(
				v.literal('draft'),
				v.literal('scheduled'),
				v.literal('sending'),
				v.literal('sent'),
				v.literal('failed'),
			),
		),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const organizationId = await getOrganizationId(ctx)

		let campaigns = await ctx.db
			.query('emailCampaigns')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
			.order('desc')
			.collect()

		if (args.status) {
			campaigns = campaigns.filter((c) => c.status === args.status)
		}

		if (args.limit) {
			campaigns = campaigns.slice(0, args.limit)
		}

		return campaigns
	},
})

/**
 * Get single campaign by ID
 */
export const getCampaign = query({
	args: { campaignId: v.id('emailCampaigns') },
	handler: async (ctx, args) => {
		const organizationId = await getOrganizationId(ctx)
		const campaign = await ctx.db.get(args.campaignId)

		if (!campaign || campaign.organizationId !== organizationId) {
			return null
		}

		return campaign
	},
})

/**
 * Internal query for actions to fetch campaign
 */
export const getCampaignInternal = internalQuery({
	args: { campaignId: v.id('emailCampaigns') },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.campaignId)
	},
})

// ─────────────────────────────────────────────────────────
// Campaign Mutations
// ─────────────────────────────────────────────────────────

/**
 * Create a new campaign (draft)
 */
export const createCampaign = mutation({
	args: {
		name: v.string(),
		subject: v.string(),
		htmlContent: v.optional(v.string()),
		templateId: v.optional(v.id('emailTemplates')),
		listIds: v.array(v.id('emailLists')),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx)
		const organizationId = await getOrganizationId(ctx)
		const clerkId = await getClerkId(ctx)

		// Get user ID from clerkId
		const user = await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkId))
			.first()

		if (!user) {
			throw new Error('Usuário não encontrado')
		}

		const now = Date.now()

		return await ctx.db.insert('emailCampaigns', {
			name: args.name,
			subject: args.subject,
			htmlContent: args.htmlContent,
			templateId: args.templateId,
			listIds: args.listIds,
			status: 'draft',
			organizationId,
			createdBy: user._id,
			createdAt: now,
			updatedAt: now,
		})
	},
})

/**
 * Update a campaign (only drafts can be updated)
 */
export const updateCampaign = mutation({
	args: {
		campaignId: v.id('emailCampaigns'),
		name: v.optional(v.string()),
		subject: v.optional(v.string()),
		htmlContent: v.optional(v.string()),
		templateId: v.optional(v.id('emailTemplates')),
		listIds: v.optional(v.array(v.id('emailLists'))),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx)
		const organizationId = await getOrganizationId(ctx)

		const campaign = await ctx.db.get(args.campaignId)
		if (!campaign || campaign.organizationId !== organizationId) {
			throw new Error('Campanha não encontrada')
		}

		if (campaign.status !== 'draft') {
			throw new Error('Apenas campanhas em rascunho podem ser editadas')
		}

		const updates: Record<string, unknown> = { updatedAt: Date.now() }
		if (args.name !== undefined) updates.name = args.name
		if (args.subject !== undefined) updates.subject = args.subject
		if (args.htmlContent !== undefined) updates.htmlContent = args.htmlContent
		if (args.templateId !== undefined) updates.templateId = args.templateId
		if (args.listIds !== undefined) updates.listIds = args.listIds

		await ctx.db.patch(args.campaignId, updates)
	},
})

/**
 * Delete a campaign (only drafts can be deleted)
 */
export const deleteCampaign = mutation({
	args: { campaignId: v.id('emailCampaigns') },
	handler: async (ctx, args) => {
		await requireAuth(ctx)
		const organizationId = await getOrganizationId(ctx)

		const campaign = await ctx.db.get(args.campaignId)
		if (!campaign || campaign.organizationId !== organizationId) {
			throw new Error('Campanha não encontrada')
		}

		if (campaign.status !== 'draft') {
			throw new Error('Apenas campanhas em rascunho podem ser excluídas')
		}

		await ctx.db.delete(args.campaignId)
	},
})

/**
 * Internal mutation to update Brevo campaign ID
 */
export const updateCampaignBrevoId = internalMutation({
	args: {
		campaignId: v.id('emailCampaigns'),
		brevoCampaignId: v.number(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.campaignId, {
			brevoCampaignId: args.brevoCampaignId,
			updatedAt: Date.now(),
		})
	},
})

/**
 * Internal mutation to update campaign status
 */
export const updateCampaignStatus = internalMutation({
	args: {
		campaignId: v.id('emailCampaigns'),
		status: v.union(
			v.literal('draft'),
			v.literal('scheduled'),
			v.literal('sending'),
			v.literal('sent'),
			v.literal('failed'),
		),
		sentAt: v.optional(v.number()),
		scheduledAt: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const updates: Record<string, unknown> = {
			status: args.status,
			updatedAt: Date.now(),
		}
		if (args.sentAt !== undefined) updates.sentAt = args.sentAt
		if (args.scheduledAt !== undefined) updates.scheduledAt = args.scheduledAt

		await ctx.db.patch(args.campaignId, updates)
	},
})

/**
 * Internal mutation to update campaign stats from webhook
 */
export const updateCampaignStats = internalMutation({
	args: {
		campaignId: v.id('emailCampaigns'),
		stats: v.object({
			sent: v.number(),
			delivered: v.number(),
			opened: v.number(),
			clicked: v.number(),
			bounced: v.number(),
			unsubscribed: v.number(),
		}),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.campaignId, {
			stats: args.stats,
			updatedAt: Date.now(),
		})
	},
})

// ─────────────────────────────────────────────────────────
// Campaign Actions (External API Calls)
// ─────────────────────────────────────────────────────────

/**
 * Sync campaign to Brevo (creates campaign in Brevo)
 */
export const syncCampaignToBrevo = action({
	args: { campaignId: v.id('emailCampaigns') },
	handler: async (ctx, args) => {
		// Get campaign data
		const campaign = await ctx.runQuery(
			internalEmailMarketing.getCampaignInternal,
			{ campaignId: args.campaignId },
		)

		if (!campaign) {
			throw new Error('Campanha não encontrada')
		}

		if (campaign.brevoCampaignId) {
			return { success: true, brevoCampaignId: campaign.brevoCampaignId }
		}

		// Get Brevo list IDs for campaign lists
		const brevoListIds: number[] = []
		for (const listId of campaign.listIds) {
			const list = await ctx.runQuery(
				internalEmailMarketing.getListInternal,
				{ listId },
			)
			if (list?.brevoListId) {
				brevoListIds.push(list.brevoListId)
			}
		}

		if (brevoListIds.length === 0) {
			throw new Error(
				'Nenhuma lista da campanha está sincronizada com Brevo. Sincronize as listas primeiro.',
			)
		}

		// Create campaign in Brevo
		const result = await brevoCampaigns.create({
			name: campaign.name,
			subject: campaign.subject,
			sender: {
				name: 'GrupoUS',
				email: 'contato@grupous.com.br',
			},
			htmlContent: campaign.htmlContent || '<html><body>{{message}}</body></html>',
			recipients: {
				listIds: brevoListIds,
			},
		})

		// Update DB with brevoCampaignId
		await ctx.runMutation(internalEmailMarketing.updateCampaignBrevoId, {
			campaignId: args.campaignId,
			brevoCampaignId: result.id,
		})

		return { success: true, brevoCampaignId: result.id }
	},
})

/**
 * Send campaign immediately
 */
export const sendCampaign = action({
	args: { campaignId: v.id('emailCampaigns') },
	handler: async (ctx, args) => {
		// Ensure campaign is synced to Brevo
		const syncResult = await ctx.runAction(
			internalEmailMarketing.syncCampaignToBrevoInternal,
			{ campaignId: args.campaignId },
		)

		// Send via Brevo API
		await brevoCampaigns.sendNow(syncResult.brevoCampaignId)

		// Update status to sending
		await ctx.runMutation(internalEmailMarketing.updateCampaignStatus, {
			campaignId: args.campaignId,
			status: 'sending',
			sentAt: Date.now(),
		})

		return { success: true }
	},
})

/**
 * Internal action for syncing campaign (called by other actions)
 */
export const syncCampaignToBrevoInternal = action({
	args: { campaignId: v.id('emailCampaigns') },
	handler: async (ctx, args) => {
		// Get campaign data
		const campaign = await ctx.runQuery(
			internalEmailMarketing.getCampaignInternal,
			{ campaignId: args.campaignId },
		)

		if (!campaign) {
			throw new Error('Campanha não encontrada')
		}

		if (campaign.brevoCampaignId) {
			return { success: true, brevoCampaignId: campaign.brevoCampaignId }
		}

		// Get Brevo list IDs
		const brevoListIds: number[] = []
		for (const listId of campaign.listIds) {
			const list = await ctx.runQuery(
				internalEmailMarketing.getListInternal,
				{ listId },
			)
			if (list?.brevoListId) {
				brevoListIds.push(list.brevoListId)
			}
		}

		if (brevoListIds.length === 0) {
			throw new Error('Sincronize as listas primeiro')
		}

		// Create in Brevo
		const result = await brevoCampaigns.create({
			name: campaign.name,
			subject: campaign.subject,
			sender: { name: 'GrupoUS', email: 'contato@grupous.com.br' },
			htmlContent: campaign.htmlContent || '<html><body>Conteúdo</body></html>',
			recipients: { listIds: brevoListIds },
		})

		await ctx.runMutation(internalEmailMarketing.updateCampaignBrevoId, {
			campaignId: args.campaignId,
			brevoCampaignId: result.id,
		})

		return { success: true, brevoCampaignId: result.id }
	},
})

/**
 * Schedule campaign for later
 */
export const scheduleCampaign = action({
	args: {
		campaignId: v.id('emailCampaigns'),
		scheduledAt: v.number(), // Unix timestamp
	},
	handler: async (ctx, args) => {
		// Ensure campaign is synced
		const syncResult = await ctx.runAction(
			internalEmailMarketing.syncCampaignToBrevoInternal,
			{ campaignId: args.campaignId },
		)

		// Schedule via Brevo API
		const scheduledDate = new Date(args.scheduledAt).toISOString()
		await brevoCampaigns.schedule(syncResult.brevoCampaignId, scheduledDate)

		// Update status to scheduled
		await ctx.runMutation(internalEmailMarketing.updateCampaignStatus, {
			campaignId: args.campaignId,
			status: 'scheduled',
			scheduledAt: args.scheduledAt,
		})

		return { success: true, scheduledAt: args.scheduledAt }
	},
})

/**
 * Refresh campaign stats from Brevo
 */
export const refreshCampaignStats = action({
	args: { campaignId: v.id('emailCampaigns') },
	handler: async (ctx, args) => {
		// Get campaign
		const campaign = await ctx.runQuery(
			internalEmailMarketing.getCampaignInternal,
			{ campaignId: args.campaignId },
		)

		if (!campaign?.brevoCampaignId) {
			throw new Error('Campanha não sincronizada com Brevo')
		}

		// Get stats from Brevo
		const stats = await brevoCampaigns.getStats(campaign.brevoCampaignId)
		const globalStats = stats.globalStats

		// Update stats in DB
		await ctx.runMutation(internalEmailMarketing.updateCampaignStats, {
			campaignId: args.campaignId,
			stats: {
				sent: globalStats?.sent || 0,
				delivered: globalStats?.delivered || 0,
				opened: globalStats?.uniqueViews || 0,
				clicked: globalStats?.uniqueClicks || 0,
				bounced: (globalStats?.hardBounces || 0) + (globalStats?.softBounces || 0),
				unsubscribed: globalStats?.unsubscriptions || 0,
			},
		})

		return { success: true, stats: globalStats }
	},
})

// ═══════════════════════════════════════════════════════
// SECTION 4: TEMPLATE MANAGEMENT
// ═══════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────
// Template Queries
// ─────────────────────────────────────────────────────────

/**
 * List templates with optional category filter
 */
export const getTemplates = query({
	args: {
		category: v.optional(v.string()),
		activeOnly: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const organizationId = await getOrganizationId(ctx)

		let templates = await ctx.db
			.query('emailTemplates')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
			.order('desc')
			.collect()

		if (args.category) {
			templates = templates.filter((t) => t.category === args.category)
		}

		if (args.activeOnly) {
			templates = templates.filter((t) => t.isActive)
		}

		return templates
	},
})

/**
 * Get single template by ID
 */
export const getTemplate = query({
	args: { templateId: v.id('emailTemplates') },
	handler: async (ctx, args) => {
		const organizationId = await getOrganizationId(ctx)
		const template = await ctx.db.get(args.templateId)

		if (!template || template.organizationId !== organizationId) {
			return null
		}

		return template
	},
})

/**
 * Internal query for actions to fetch template
 */
export const getTemplateInternal = internalQuery({
	args: { templateId: v.id('emailTemplates') },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.templateId)
	},
})

// ─────────────────────────────────────────────────────────
// Template Mutations
// ─────────────────────────────────────────────────────────

/**
 * Create a new email template
 */
export const createTemplate = mutation({
	args: {
		name: v.string(),
		subject: v.string(),
		htmlContent: v.string(),
		category: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx)
		const organizationId = await getOrganizationId(ctx)
		const now = Date.now()

		return await ctx.db.insert('emailTemplates', {
			name: args.name,
			subject: args.subject,
			htmlContent: args.htmlContent,
			category: args.category,
			organizationId,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		})
	},
})

/**
 * Update an email template
 */
export const updateTemplate = mutation({
	args: {
		templateId: v.id('emailTemplates'),
		name: v.optional(v.string()),
		subject: v.optional(v.string()),
		htmlContent: v.optional(v.string()),
		category: v.optional(v.string()),
		isActive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx)
		const organizationId = await getOrganizationId(ctx)

		const template = await ctx.db.get(args.templateId)
		if (!template || template.organizationId !== organizationId) {
			throw new Error('Template não encontrado')
		}

		const updates: Record<string, unknown> = { updatedAt: Date.now() }
		if (args.name !== undefined) updates.name = args.name
		if (args.subject !== undefined) updates.subject = args.subject
		if (args.htmlContent !== undefined) updates.htmlContent = args.htmlContent
		if (args.category !== undefined) updates.category = args.category
		if (args.isActive !== undefined) updates.isActive = args.isActive

		await ctx.db.patch(args.templateId, updates)
	},
})

/**
 * Delete an email template
 */
export const deleteTemplate = mutation({
	args: { templateId: v.id('emailTemplates') },
	handler: async (ctx, args) => {
		await requireAuth(ctx)
		const organizationId = await getOrganizationId(ctx)

		const template = await ctx.db.get(args.templateId)
		if (!template || template.organizationId !== organizationId) {
			throw new Error('Template não encontrado')
		}

		await ctx.db.delete(args.templateId)
	},
})

/**
 * Internal mutation to update Brevo template ID
 */
export const updateTemplateBrevoId = internalMutation({
	args: {
		templateId: v.id('emailTemplates'),
		brevoTemplateId: v.number(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.templateId, {
			brevoTemplateId: args.brevoTemplateId,
			updatedAt: Date.now(),
		})
	},
})

// ─────────────────────────────────────────────────────────
// Template Actions (External API Calls)
// ─────────────────────────────────────────────────────────

/**
 * Sync template to Brevo
 */
export const syncTemplateToBrevo = action({
	args: { templateId: v.id('emailTemplates') },
	handler: async (ctx, args) => {
		// Get template data
		const template = await ctx.runQuery(
			internalEmailMarketing.getTemplateInternal,
			{ templateId: args.templateId },
		)

		if (!template) {
			throw new Error('Template não encontrado')
		}

		if (template.brevoTemplateId) {
			return { success: true, brevoTemplateId: template.brevoTemplateId }
		}

		// Create template in Brevo
		const result = await brevoTemplates.create({
			name: template.name,
			subject: template.subject,
			htmlContent: template.htmlContent,
			sender: {
				name: 'GrupoUS',
				email: 'contato@grupous.com.br',
			},
			isActive: template.isActive,
		})

		// Update DB with brevoTemplateId
		await ctx.runMutation(internalEmailMarketing.updateTemplateBrevoId, {
			templateId: args.templateId,
			brevoTemplateId: result.id,
		})

		return { success: true, brevoTemplateId: result.id }
	},
})

// ═══════════════════════════════════════════════════════
// SECTION 5: EMAIL EVENTS (Webhook Support)
// ═══════════════════════════════════════════════════════

/**
 * Internal mutation to record email event from webhook
 */
export const recordEmailEvent = internalMutation({
	args: {
		campaignId: v.optional(v.id('emailCampaigns')),
		contactId: v.optional(v.id('emailContacts')),
		email: v.string(),
		eventType: v.union(
			v.literal('delivered'),
			v.literal('opened'),
			v.literal('clicked'),
			v.literal('bounced'),
			v.literal('spam'),
			v.literal('unsubscribed'),
		),
		link: v.optional(v.string()),
		bounceType: v.optional(v.string()),
		brevoMessageId: v.optional(v.string()),
		timestamp: v.number(),
		metadata: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert('emailEvents', {
			campaignId: args.campaignId,
			contactId: args.contactId,
			email: args.email,
			eventType: args.eventType,
			link: args.link,
			bounceType: args.bounceType,
			brevoMessageId: args.brevoMessageId,
			timestamp: args.timestamp,
			metadata: args.metadata,
			createdAt: Date.now(),
		})
	},
})

/**
 * Get events for a campaign
 */
export const getCampaignEvents = query({
	args: {
		campaignId: v.id('emailCampaigns'),
		eventType: v.optional(
			v.union(
				v.literal('delivered'),
				v.literal('opened'),
				v.literal('clicked'),
				v.literal('bounced'),
				v.literal('spam'),
				v.literal('unsubscribed'),
			),
		),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const organizationId = await getOrganizationId(ctx)

		// Verify campaign belongs to organization
		const campaign = await ctx.db.get(args.campaignId)
		if (!campaign || campaign.organizationId !== organizationId) {
			return []
		}

		let events = await ctx.db
			.query('emailEvents')
			.withIndex('by_campaign', (q) => q.eq('campaignId', args.campaignId))
			.order('desc')
			.collect()

		if (args.eventType) {
			events = events.filter((e) => e.eventType === args.eventType)
		}

		if (args.limit) {
			events = events.slice(0, args.limit)
		}

		return events
	},
})

/**
 * Get events for a contact
 */
export const getContactEvents = query({
	args: {
		contactId: v.id('emailContacts'),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const organizationId = await getOrganizationId(ctx)

		// Verify contact belongs to organization
		const contact = await ctx.db.get(args.contactId)
		if (!contact || contact.organizationId !== organizationId) {
			return []
		}

		let events = await ctx.db
			.query('emailEvents')
			.withIndex('by_contact', (q) => q.eq('contactId', args.contactId))
			.order('desc')
			.collect()

		if (args.limit) {
			events = events.slice(0, args.limit)
		}

		return events
	},
})

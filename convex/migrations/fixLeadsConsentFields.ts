/**
 * Migration: Fix Missing Consent Fields in Leads Table
 *
 * This migration adds default values for lgpdConsent and whatsappConsent
 * to existing leads documents that are missing these fields.
 *
 * This resolves the schema validation error during Convex deployment.
 */

import { internalMutation } from '../_generated/server';
import { v } from 'convex/values';

export const fixLeadsConsentFields = internalMutation({
	args: {},
	handler: async (ctx) => {
		// Query all leads that are missing lgpdConsent or whatsappConsent
		const allLeads = await ctx.db.query('leads').collect();

		let updatedCount = 0;
		const errors: string[] = [];

		for (const lead of allLeads) {
			const updates: Record<string, boolean | number> = {};
			let needsUpdate = false;

			// Add default value for lgpdConsent if missing
			if (lead.lgpdConsent === undefined) {
				updates.lgpdConsent = false;
				needsUpdate = true;
			}

			// Add default value for whatsappConsent if missing
			if (lead.whatsappConsent === undefined) {
				updates.whatsappConsent = false;
				needsUpdate = true;
			}

			// Update the lead if any fields are missing
			if (needsUpdate) {
				try {
					await ctx.db.patch(lead._id, {
						...updates,
						updatedAt: Date.now(),
					});
					updatedCount++;
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : String(error);
					errors.push(`Failed to update lead ${lead._id}: ${errorMsg}`);
				}
			}
		}

		// Return migration results
		return {
			totalLeads: allLeads.length,
			updatedLeads: updatedCount,
			errors,
			timestamp: Date.now(),
		};
	},
});

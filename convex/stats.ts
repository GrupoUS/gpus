import { v } from 'convex/values';
import { query } from './_generated/server';

/**
 * Get dashboard statistics
 */
export const getDashboardStats = query({
	args: {},
	handler: async (ctx) => {
		// Get all leads
		const allLeads = await ctx.db.query('leads').collect();

		// Calculate stats
		const totalLeads = allLeads.length;
		const leadsThisMonth = allLeads.filter(
			(lead) => new Date(lead.createdAt).getMonth() === new Date().getMonth()
		).length;

		// Leads by stage
		const leadsByStage = allLeads.reduce(
			(acc, lead) => {
				acc[lead.stage] = (acc[lead.stage] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		// Leads by product
		const leadsByProduct = allLeads.reduce(
			(acc, lead) => {
				if (lead.interestedProduct) {
					acc[lead.interestedProduct] = (acc[lead.interestedProduct] || 0) + 1;
				}
				return acc;
			},
			{} as Record<string, number>
		);

		// Conversion rate (closed won / total)
		const closedWon = leadsByStage['fechado_ganho'] || 0;
		const conversionRate = totalLeads > 0 ? (closedWon / totalLeads) * 100 : 0;

		// Get messages count (if conversations exist)
		const conversations = await ctx.db.query('conversations').collect();
		const messagesCount = conversations.length;

		// Calculate revenue (mock for now - would come from enrollments)
		const revenue = closedWon * 5000; // Mock: R$ 5k per conversion

		return {
			totalLeads,
			leadsThisMonth,
			conversionRate: Number(conversionRate.toFixed(1)),
			messagesCount,
			revenue,
			leadsByStage,
			leadsByProduct,
		};
	},
});


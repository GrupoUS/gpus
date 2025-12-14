import { v } from 'convex/values';
import { query } from './_generated/server';

/**
 * Get dashboard statistics
 */
export const getDashboardStats = query({
	args: {
		period: v.optional(v.union(
			v.literal('7d'),
			v.literal('30d'),
			v.literal('all')
		)),
	},
	handler: async (ctx, args) => {
		const period = args.period || 'all';
		
		// Calculate date threshold based on period
		let dateThreshold = 0;
		if (period === '7d') {
			dateThreshold = Date.now() - 7 * 24 * 60 * 60 * 1000;
		} else if (period === '30d') {
			dateThreshold = Date.now() - 30 * 24 * 60 * 60 * 1000;
		}
		
		// Get all leads (filtered by period if needed)
		let allLeads = await ctx.db.query('leads').collect();
		if (period !== 'all') {
			allLeads = allLeads.filter(lead => lead.createdAt >= dateThreshold);
		}

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

		// Get messages count from messages table
		const allMessages = await ctx.db.query('messages').collect();
		const messagesCount = allMessages.length;
		
		// Get conversations count
		const conversations = await ctx.db.query('conversations').collect();
		const conversationsCount = conversations.length;

		// Calculate revenue (mock for now - would come from enrollments)
		const revenue = closedWon * 5000; // Mock: R$ 5k per conversion

		// Get daily metrics for time-series charts
		let dailyMetrics = await ctx.db.query('dailyMetrics').collect();
		if (period !== 'all') {
			const thresholdDate = new Date(dateThreshold).toISOString().split('T')[0];
			dailyMetrics = dailyMetrics.filter(metric => metric.date >= thresholdDate);
		}
		dailyMetrics.sort((a, b) => a.date.localeCompare(b.date));

		return {
			totalLeads,
			leadsThisMonth,
			conversionRate: Number(conversionRate.toFixed(1)),
			messagesCount,
			conversationsCount,
			revenue,
			leadsByStage,
			leadsByProduct,
			dailyMetrics: dailyMetrics.map(m => ({
				date: m.date,
				newLeads: m.newLeads,
				messagesReceived: m.messagesReceived,
				messagesSent: m.messagesSent,
				conversions: m.conversions,
			})),
		};
	},
});


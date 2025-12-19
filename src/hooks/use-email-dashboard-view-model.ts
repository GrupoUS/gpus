import { api } from '@convex/_generated/api';
import { useQuery } from 'convex/react';
import { format, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';

export function useEmailDashboardViewModel() {
	// Fetch sent campaigns for metrics
	const campaigns = useQuery(api.emailMarketing.getCampaigns, {
		status: 'sent',
		limit: 100, // Fetch last 100 sent campaigns for stats
	});

	// Fetch all contacts to calculate growth (approximate)
	const contacts = useQuery(api.emailMarketing.getContacts, {
		limit: 1000,
	});

	const metrics = useMemo(() => {
		if (!(campaigns && contacts)) {
			return {
				totalSent: 0,
				avgOpenRate: 0,
				avgClickRate: 0,
				bounceRate: 0,
				totalContacts: 0,
				contactGrowth: 0,
			};
		}

		// Aggregate campaign stats
		let totalSent = 0;
		let totalDelivered = 0;
		let totalOpened = 0;
		let totalClicked = 0;
		let totalBounced = 0;

		for (const campaign of campaigns) {
			if (campaign.stats) {
				totalSent += campaign.stats.sent;
				totalDelivered += campaign.stats.delivered;
				totalOpened += campaign.stats.opened;
				totalClicked += campaign.stats.clicked;
				totalBounced += campaign.stats.bounced;
			}
		}

		const avgOpenRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
		const avgClickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
		const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;

		// Contact growth (last 30 days)
		const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
		const newContacts = contacts.filter((c) => c.createdAt && c.createdAt > thirtyDaysAgo).length;

		return {
			totalSent,
			avgOpenRate: avgOpenRate.toFixed(1),
			avgClickRate: avgClickRate.toFixed(1),
			bounceRate: bounceRate.toFixed(1),
			totalContacts: contacts.length,
			contactGrowth: newContacts,
		};
	}, [campaigns, contacts]);

	const chartData = useMemo(() => {
		if (!campaigns) return [];

		// Group by month (last 6 months)
		const last6Months = Array.from({ length: 6 }, (_, i) => {
			const date = subMonths(new Date(), i);
			return {
				name: format(date, 'MMM', { locale: ptBR }),
				date: startOfMonth(date).getTime(),
				enviados: 0,
				abertos: 0,
				cliques: 0,
			};
		}).reverse();

		for (const campaign of campaigns) {
			if (!(campaign.sentAt && campaign.stats)) continue;

			const campaignDate = new Date(campaign.sentAt);
			const MonthStart = startOfMonth(campaignDate).getTime();

			const monthData = last6Months.find((m) => m.date === MonthStart);
			if (monthData) {
				monthData.enviados += campaign.stats.sent;
				monthData.abertos += campaign.stats.opened;
				monthData.cliques += campaign.stats.clicked;
			}
		}

		return last6Months;
	}, [campaigns]);

	const topCampaigns = useMemo(() => {
		if (!campaigns) return [];

		// Sort by open rate
		return [...campaigns]
			.sort((a, b) => {
				const rateA = a.stats && a.stats.delivered > 0 ? a.stats.opened / a.stats.delivered : 0;
				const rateB = b.stats && b.stats.delivered > 0 ? b.stats.opened / b.stats.delivered : 0;
				return rateB - rateA;
			})
			.slice(0, 5);
	}, [campaigns]);

	return {
		metrics,
		chartData,
		topCampaigns,
		isLoading: !(campaigns && contacts),
	};
}

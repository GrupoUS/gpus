import { api } from '@convex/_generated/api';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { useEffect, useMemo } from 'react';

import type { Id } from '../../convex/_generated/dataModel';

const PAGE_SIZE = 12;

// biome-ignore lint/suspicious/noExplicitAny: generic route typing
export function useCampaignsViewModel(Route: any) {
	const navigate = useNavigate();
	const { search, status, view, page } = Route.useSearch();

	// Set default search params
	useEffect(() => {
		const searchParams = new URLSearchParams(window.location.search);
		const hasAnyParam = searchParams.toString().length > 0;

		if (!hasAnyParam) {
			void navigate({
				to: '/marketing',
				search: {
					view: 'grid',
					page: 1,
					search: '',
					status: 'all',
				},
			});
		}
	}, [navigate]);

	// Fetch campaigns with optional status filter
	const campaigns = useQuery(api.emailMarketing.getCampaigns, {
		status: status === 'all' ? undefined : status,
	});

	// Client-side search filtering
	const filteredCampaigns = useMemo(() => {
		if (!campaigns) return undefined;
		if (!search) return campaigns;

		const searchLower = search.toLowerCase();
		return campaigns.filter(
			(c: { name: string; subject: string }) =>
				c.name.toLowerCase().includes(searchLower) || c.subject.toLowerCase().includes(searchLower),
		);
	}, [campaigns, search]);

	const clearFilters = () => {
		void navigate({
			to: '/marketing',
			search: {
				view: 'grid',
				page: 1,
				search: '',
				status: 'all',
			},
		});
	};

	// Stats
	const totalCampaigns = filteredCampaigns?.length ?? 0;
	const draftCount =
		filteredCampaigns?.filter((c: { status: string }) => c.status === 'draft').length ?? 0;
	const sentCount =
		filteredCampaigns?.filter((c: { status: string }) => c.status === 'sent').length ?? 0;

	// Calculate average open rate from sent campaigns
	const avgOpenRate = useMemo(() => {
		if (!filteredCampaigns) return 0;
		const sentCampaigns = filteredCampaigns.filter(
			(c: { status: string; stats?: { delivered: number } }) =>
				c.status === 'sent' && c.stats && c.stats.delivered > 0,
		);
		if (sentCampaigns.length === 0) return 0;

		const totalRate = sentCampaigns.reduce(
			(acc: number, c: { stats?: { opened: number; delivered: number } }) => {
				const rate = c.stats ? (c.stats.opened / c.stats.delivered) * 100 : 0;
				return acc + rate;
			},
			0,
		);
		return totalRate / sentCampaigns.length;
	}, [filteredCampaigns]);

	// Pagination
	const totalPages = Math.ceil(totalCampaigns / PAGE_SIZE);
	const paginatedCampaigns = useMemo(() => {
		if (!filteredCampaigns) return [];
		return filteredCampaigns.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
	}, [filteredCampaigns, page]);

	// Reset page when filters change
	const handleFilterChange = (key: string, value: string) => {
		void navigate({
			to: '/marketing',
			search: { ...{ search, status, view, page }, [key]: value, page: 1 },
		});
	};

	const navigateToCampaign = (campaignId: Id<'emailCampaigns'>) => {
		void navigate({
			to: '/marketing/$campaignId',
			params: { campaignId },
			search: {
				page,
				search,
				status,
				view,
			},
		});
	};

	const navigateToNewCampaign = () => {
		void navigate({
			to: '/marketing/nova',
			search: { search: '', status: 'all', view: view || 'grid', page: 1 },
		});
	};

	return {
		search,
		status,
		view,
		page,
		campaigns: filteredCampaigns,
		paginatedCampaigns,
		totalCampaigns,
		draftCount,
		sentCount,
		avgOpenRate,
		totalPages,
		PAGE_SIZE,
		clearFilters,
		handleFilterChange,
		navigateToCampaign,
		navigateToNewCampaign,
		navigate,
	};
}

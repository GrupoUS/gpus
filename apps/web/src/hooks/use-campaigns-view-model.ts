import { useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo } from 'react';

import { trpc } from '../lib/trpc';

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

	// Fetch all campaigns (filtering done client-side)
	const { data: allCampaigns } = trpc.emailMarketing.campaigns.list.useQuery();

	// Client-side filtering (status + search)
	const filteredCampaigns = useMemo(() => {
		if (!allCampaigns) return undefined;

		let result = [...allCampaigns];

		// Status filter
		if (status && status !== 'all') {
			result = result.filter((c) => c.status === status);
		}

		// Search filter
		if (search) {
			const searchLower = search.toLowerCase();
			result = result.filter(
				(c) =>
					c.name.toLowerCase().includes(searchLower) ||
					c.subject.toLowerCase().includes(searchLower),
			);
		}

		return result;
	}, [allCampaigns, status, search]);

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
	const draftCount = filteredCampaigns?.filter((c) => c.status === 'draft').length ?? 0;
	const sentCount = filteredCampaigns?.filter((c) => c.status === 'sent').length ?? 0;

	// Calculate average open rate from sent campaigns
	const avgOpenRate = useMemo(() => {
		if (!filteredCampaigns) return 0;
		const sentCampaigns = filteredCampaigns.filter(
			(c) => c.status === 'sent' && c.stats && c.stats.delivered > 0,
		);
		if (sentCampaigns.length === 0) return 0;

		const totalRate = sentCampaigns.reduce((acc, c) => {
			const rate = c.stats ? (c.stats.opened / c.stats.delivered) * 100 : 0;
			return acc + rate;
		}, 0);
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

	const navigateToCampaign = (campaignId: number | string) => {
		void navigate({
			to: '/marketing/$campaignId',
			params: { campaignId: String(campaignId) },
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

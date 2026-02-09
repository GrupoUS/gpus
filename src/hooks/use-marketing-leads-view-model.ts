import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

import { trpc } from '../lib/trpc';

// biome-ignore lint/suspicious/noExplicitAny: generic route typing
export function useMarketingLeadsViewModel(Route: any) {
	const navigate = useNavigate();
	const searchParams = Route.useSearch();

	const [search, setSearch] = useState(searchParams.search || '');
	const [status, setStatus] = useState(searchParams.status || 'all');
	const [interest, setInterest] = useState(searchParams.interest || 'all');
	const [source, setSource] = useState(searchParams.source || 'all');
	const [landingPage, setLandingPage] = useState(searchParams.landingPage || 'all');
	const [date, setDate] = useState<DateRange | undefined>(() => {
		if (searchParams.startDate) {
			return {
				from: new Date(searchParams.startDate),
				to: searchParams.endDate ? new Date(searchParams.endDate) : undefined,
			};
		}
		return undefined;
	});

	// TODO: marketing_leads is not yet in the tRPC router
	// For now, using leads router as a fallback
	const { data: leadsResult, isLoading } = trpc.leads.list.useQuery({
		search: search || undefined,
		limit: 100,
	});

	const leads = leadsResult?.data ?? [];

	// Stats - computed from loaded leads
	const stats = (() => {
		if (!leads || leads.length === 0) return null;
		const total = leads.length;
		const newLeads = leads.filter((l: { stage?: string }) => l.stage === 'novo').length;
		const contacted = leads.filter((l: { stage?: string }) => l.stage === 'contato_feito').length;
		const converted = leads.filter((l: { stage?: string }) => l.stage === 'cliente').length;

		const conversionRate = total > 0 ? (converted / total) * 100 : 0;

		return {
			total,
			new: newLeads,
			contacted,
			converted,
			unsubscribed: 0,
			conversionRate: conversionRate.toFixed(1),
		};
	})();

	// Handlers
	const handleStatusUpdate = (_leadId: number, _newStatus: string) => {
		// TODO: Add updateStatus mutation for marketing leads
		toast.info('Atualização de status em breve');
	};

	// biome-ignore lint/suspicious/noExplicitAny: dynamic URL search params
	const updateUrl = (newParams: Record<string, any>) => {
		void navigate({
			to: '/marketing/leads',
			search: {
				...searchParams,
				...newParams,
				page: 1,
			},
		});
	};

	const handleSearchChange = (value: string) => {
		setSearch(value);
		updateUrl({ search: value });
	};

	const handleStatusChange = (value: string) => {
		setStatus(value);
		updateUrl({ status: value });
	};

	const handleInterestChange = (value: string) => {
		setInterest(value);
		updateUrl({ interest: value });
	};

	const handleSourceChange = (value: string) => {
		setSource(value);
		updateUrl({ source: value });
	};

	const handleLandingPageChange = (value: string) => {
		setLandingPage(value);
		updateUrl({ landingPage: value });
	};

	const handleDateChange = (range: DateRange | undefined) => {
		setDate(range);
		updateUrl({
			startDate: range?.from ? range.from.toISOString().split('T')[0] : undefined,
			endDate: range?.to ? range.to.toISOString().split('T')[0] : undefined,
		});
	};

	const handleLoadMore = () => {
		// No pagination yet
	};

	const handleClearFilters = () => {
		setSearch('');
		setStatus('all');
		setInterest('all');
		setSource('all');
		setLandingPage('all');
		setDate(undefined);

		void navigate({
			to: '/marketing/leads',
			search: {
				page: 1,
				search: undefined,
				status: undefined,
				interest: undefined,
				source: undefined,
				landingPage: undefined,
				startDate: undefined,
				endDate: undefined,
				// biome-ignore lint/suspicious/noExplicitAny: router search params typing workaround
			} as any,
		});
	};

	const handleExportCSV = () => {
		// TODO: Add CSV export as a tRPC query
		toast.info('Exportação CSV em breve');
	};

	return {
		leads,
		stats,
		landingPageStats: [],
		isLoading,
		canLoadMore: false,
		paginationStatus: 'Exhausted' as const,
		filters: {
			search,
			status,
			interest,
			source,
			landingPage,
			date,
		},
		options: {
			sources: [] as string[],
			landingPages: [] as string[],
		},
		handlers: {
			onStatusUpdate: handleStatusUpdate,
			onSearchChange: handleSearchChange,
			onStatusChange: handleStatusChange,
			onInterestChange: handleInterestChange,
			onSourceChange: handleSourceChange,
			onLandingPageChange: handleLandingPageChange,
			onDateChange: handleDateChange,
			onClearFilters: handleClearFilters,
			onExport: handleExportCSV,
			onLoadMore: handleLoadMore,
		},
	};
}

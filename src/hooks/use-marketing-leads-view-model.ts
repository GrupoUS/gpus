import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useNavigate } from '@tanstack/react-router';
import { useConvex, useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { endOfDay, startOfDay } from 'date-fns';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

// biome-ignore lint/suspicious/noExplicitAny: generic route typing
export function useMarketingLeadsViewModel(Route: any) {
	const navigate = useNavigate();
	const searchParams = Route.useSearch();
	// Initialize state from URL params if available, else default
	// Note: In a real app we might want to sync state <-> URL bi-directionally stricter
	// For now we initialize from URL and update URL on change, which triggers re-render

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

	// Mutations & Queries
	// Early cast pattern to break TS deep recursion on Convex api type
	const updateStatusMutation = (api as { marketingLeads: { updateStatus: unknown } }).marketingLeads
		.updateStatus;
	const updateStatus = useMutation(updateStatusMutation as typeof api.marketingLeads.updateStatus);

	// Fetch Options
	const sourceOptions = useQuery(api.marketingLeads.getSources) || [];
	const landingPageOptions = useQuery(api.marketingLeads.getDistinctLandingPages) || [];
	const landingPageStats = useQuery(api.marketingLeads.getStatsByLandingPage, {
		startDate: date?.from ? startOfDay(date.from).getTime() : undefined,
		endDate: date?.to ? endOfDay(date.to).getTime() : undefined,
	});

	// Use paginated query for server-side pagination
	const {
		results: leads,
		status: queryStatus,
		loadMore,
		isLoading: _isLoadingMore,
	} = usePaginatedQuery(
		api.marketingLeads.list,
		{
			paginationOpts: { numItems: PAGE_SIZE, cursor: null },
			status: status === 'all' ? undefined : status,
			interest: interest === 'all' ? undefined : interest,
			source: source === 'all' ? undefined : source,
			landingPage: landingPage === 'all' ? undefined : landingPage,
			search: search || undefined,
			startDate: date?.from ? startOfDay(date.from).getTime() : undefined,
			endDate: date?.to ? endOfDay(date.to).getTime() : undefined,
		},
		{ initialNumItems: PAGE_SIZE },
	);

	// Stats - computed from loaded leads
	const stats = (() => {
		if (!leads || leads.length === 0) return null;
		const total = leads.length;
		const newLeads = leads.filter((l) => l.status === 'new').length;
		const contacted = leads.filter((l) => l.status === 'contacted').length;
		const converted = leads.filter((l) => l.status === 'converted').length;
		const unsubscribed = leads.filter((l) => l.status === 'unsubscribed').length;

		// Calculate conversion rate (converted / total * 100)
		const conversionRate = total > 0 ? (converted / total) * 100 : 0;

		return {
			total,
			new: newLeads,
			contacted,
			converted,
			unsubscribed,
			conversionRate: conversionRate.toFixed(1),
		};
	})();

	// Handlers
	const handleStatusUpdate = async (
		leadId: Id<'marketing_leads'>,
		newStatus: 'new' | 'contacted' | 'converted' | 'unsubscribed',
	) => {
		try {
			await updateStatus({
				leadId,
				newStatus,
			});
			toast.success('Status atualizado com sucesso');
		} catch (_error) {
			toast.error('Erro ao atualizar status');
		}
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
		if (queryStatus === 'CanLoadMore') {
			loadMore(PAGE_SIZE);
		}
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

	const convex = useConvex();

	const handleExportCSV = async () => {
		try {
			// biome-ignore lint/suspicious/noExplicitAny: prevent TS error on query
			const data = await convex.query((api as any).marketingLeads.exportToCSV, {
				status: status === 'all' ? undefined : status,
				interest: interest === 'all' ? undefined : interest,
				source: source === 'all' ? undefined : source,
				landingPage: landingPage === 'all' ? undefined : landingPage,
				startDate: date?.from ? startOfDay(date.from).getTime() : undefined,
				endDate: date?.to ? endOfDay(date.to).getTime() : undefined,
			});

			if (!data || data.length === 0) {
				toast.error('Nenhum dado para exportar');
				return;
			}

			// Convert to CSV
			const headers = [
				'Nome',
				'Email',
				'Telefone',
				'Interesse',
				'Mensagem',
				'Consentimento LGPD',
				'Consentimento WhatsApp',
				'Status',
				'Origem',
				'Campanha',
				'Mídia',
				'Data',
			];
			const csvContent = [
				headers.join(','),
				// biome-ignore lint/suspicious/noExplicitAny: dynamic CSV row type
				...data.map((row: any) =>
					[
						`"${row.name || ''}"`,
						`"${row.email || ''}"`,
						`"${row.phone || ''}"`,
						`"${row.interest || ''}"`,
						`"${(row.message || '').replace(/"/g, '""')}"`,
						row.lgpdConsent ? 'Sim' : 'Não',
						row.whatsappConsent ? 'Sim' : 'Não',
						row.status,
						row.source || '',
						row.utmCampaign || '',
						row.utmMedium || '',
						new Date(row.createdAt).toLocaleString('pt-BR'),
					].join(','),
				),
			].join('\n');

			const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `leads-captura-${new Date().toISOString().split('T')[0]}.csv`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			toast.success('Exportação concluída com sucesso');
		} catch (_error) {
			toast.error('Erro ao exportar CSV');
		}
	};

	return {
		leads: leads ?? [],
		stats,
		landingPageStats: landingPageStats || [],
		isLoading: queryStatus === 'LoadingFirstPage',
		canLoadMore: queryStatus === 'CanLoadMore',
		paginationStatus: queryStatus,
		filters: {
			search,
			status,
			interest,
			source,
			landingPage,
			date,
		},
		options: {
			sources: sourceOptions,
			landingPages: landingPageOptions,
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

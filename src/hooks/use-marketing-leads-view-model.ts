import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useNavigate } from '@tanstack/react-router';
import { useConvex, useMutation, usePaginatedQuery } from 'convex/react';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

// biome-ignore lint/suspicious/noExplicitAny: generic route typing
export function useMarketingLeadsViewModel(Route: any) {
	const navigate = useNavigate();
	const searchParams = Route.useSearch();
	const { search, status, interest } = searchParams;

	// Mutations & Queries
	const updateStatus = useMutation(api.marketingLeads.updateStatus);
	// We don't fetch CSV data automatically, only on demand

	// Use paginated query for server-side pagination
	const {
		results: leads,
		status: paginationStatus,
		loadMore,
		isLoading,
	} = usePaginatedQuery(
		api.marketingLeads.list,
		{
			status: status === 'all' ? undefined : status,
			interest: interest === 'all' ? undefined : interest,
			search: search || undefined,
		},
		{ initialNumItems: PAGE_SIZE },
	);

	// Stats - computed from loaded leads
	// Note: Ideally stats should come from a separate backend query for accuracy over total dataset
	// But per instructions, we compute from loaded leads (which might be partial if paginated?)
	// Actually, the prompt says "Compute stats from loaded leads".
	// However, usually detailed stats like "Total" should reflect the DB state, not just current page.
	// Given the prompt, I will stick to computing from loaded leads, but arguably a separate query would be better.
	// Re-reading usage in contacts: "Stats - computed from all loaded contacts".
	// The `usePaginatedQuery` returns `results` which accumulates pages as we load more.
	// So it is "all loaded so far".

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

	const handleFilterChange = (key: string, value: string) => {
		void navigate({
			to: '/marketing/leads',
			search: { ...searchParams, [key]: value, page: 1 },
		});
	};

	const handleLoadMore = () => {
		if (paginationStatus === 'CanLoadMore') {
			loadMore(PAGE_SIZE);
		}
	};

	const clearFilters = () => {
		void navigate({
			to: '/marketing/leads',
			search: {
				page: 1,
				search: '',
				status: 'all',
				interest: 'all',
			},
		});
	};

	// CSV Export Logic
	// We need to query ALL data, not just paginated.
	// We can use useQuery directly but validly only when we want to export.
	// Hooks rules prevent conditional hooks.
	// Instead we can use a "lazy" approach: pass parameters to the View Model,
	// and rely on a separate query or an action.
	// The prompt says: "Implement useQuery for api.marketingLeads.exportToCSV (triggered on demand)"
	// Typically useQuery runs automatically. To make it "on demand" usually involves
	// skipping the query until a flag is set, or using a convex action/mutation if it was separate.
	// But `exportToCSV` is a query.
	// We'll use a `skip` token pattern if Convex supports it or just fetch it via a client client
	// OR we just use `useQuery` but enabled only when a state is set.

	// Using `conves/react`'s `useConvex` hook allows imperative calls.
	const convex = useConvex(); // Need to import this

	const handleExportCSV = async () => {
		try {
			const data = await convex.query(api.marketingLeads.exportToCSV, {
				status: status === 'all' ? undefined : status,
				// We don't have date filters in the UI yet per instructions (only Status, Interest, Search)
				// The `lead-capture-filters.tsx` instruction mentions Status and Interest.
				// The backend `exportToCSV` supports status, startDate, endDate.
				// We will just pass the current status filter.
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
				...data.map((row) =>
					[
						`"${row.name}"`,
						`"${row.email}"`,
						`"${row.phone}"`,
						`"${row.interest}"`,
						`"${(row.message || '').replace(/"/g, '""')}"`,
						row.lgpdConsent,
						row.whatsappConsent,
						row.status,
						row.utmSource,
						row.utmCampaign,
						row.utmMedium,
						row.createdAt,
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
		} catch {
			toast.error('Erro ao exportar CSV');
		}
	};

	return {
		leads: leads ?? [],
		stats,
		isLoading,
		canLoadMore: paginationStatus === 'CanLoadMore',
		paginationStatus,
		filters: {
			search,
			status,
			interest,
		},
		handleStatusUpdate,
		handleFilterChange,
		handleLoadMore,
		clearFilters,
		handleExportCSV,
	};
}

import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { trpc } from '../lib/trpc';

// biome-ignore lint/suspicious/noExplicitAny: generic route typing
export function useContactsViewModel(Route: any) {
	const navigate = useNavigate();
	const searchParams = Route.useSearch();
	const { search, status, sourceType } = searchParams;

	// Fetch contacts
	const { data: contacts, isLoading } = trpc.emailMarketing.contacts.list.useQuery();

	// Stats - computed from all loaded contacts
	const stats = (() => {
		if (!contacts || contacts.length === 0) return null;
		const total = contacts.length;
		const subscribed = contacts.filter((c) => c.subscriptionStatus === 'subscribed').length;
		const pending = contacts.filter((c) => c.subscriptionStatus === 'pending').length;
		const unsubscribed = contacts.filter((c) => c.subscriptionStatus === 'unsubscribed').length;

		const unsubscribeRate = total > 0 ? (unsubscribed / total) * 100 : 0;

		return {
			total,
			subscribed,
			pending,
			unsubscribed,
			unsubscribeRate: unsubscribeRate.toFixed(1),
		};
	})();

	// Filter client-side
	const filteredContacts = (() => {
		if (!contacts) return [];
		let result = [...contacts];

		if (status && status !== 'all') {
			result = result.filter((c) => c.subscriptionStatus === status);
		}
		if (search) {
			const searchLower = search.toLowerCase();
			result = result.filter(
				(c) =>
					c.email?.toLowerCase().includes(searchLower) ||
					c.firstName?.toLowerCase().includes(searchLower) ||
					c.lastName?.toLowerCase().includes(searchLower),
			);
		}
		return result;
	})();

	// Handlers (stubs — Brevo sync actions not yet in tRPC)
	const handleSyncContact = (_contactId: number) => {
		toast.info('Sincronização com Brevo em breve');
	};

	const handleUpdateSubscription = (
		_contactId: number,
		_newStatus: 'subscribed' | 'unsubscribed',
	) => {
		toast.info('Atualização de inscrição em breve');
	};

	const handleFilterChange = (key: string, value: string | number) => {
		void navigate({
			to: '/marketing/contatos',
			search: { ...searchParams, [key]: value, page: 1 },
		});
	};

	const handleLoadMore = () => {
		// No pagination yet — all contacts loaded at once
	};

	const clearFilters = () => {
		void navigate({
			to: '/marketing/contatos',
			search: {
				page: 1,
				search: '',
				status: 'all',
				sourceType: 'all',
			},
		});
	};

	return {
		contacts: filteredContacts,
		stats,
		isLoading,
		canLoadMore: false,
		paginationStatus: 'Exhausted' as const,
		totalContacts: filteredContacts.length,
		filters: {
			search,
			status,
			sourceType,
		},
		handleSyncContact,
		handleUpdateSubscription,
		handleFilterChange,
		handleLoadMore,
		clearFilters,
	};
}

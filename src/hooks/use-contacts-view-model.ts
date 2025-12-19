import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useNavigate } from '@tanstack/react-router';
import { useAction, useMutation, usePaginatedQuery } from 'convex/react';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

// biome-ignore lint/suspicious/noExplicitAny: generic route typing
export function useContactsViewModel(Route: any) {
	const navigate = useNavigate();
	const searchParams = Route.useSearch();
	const { search, status, sourceType } = searchParams;

	// Mutations & Actions
	const syncContact = useAction(api.emailMarketing.syncContactToBrevo);
	const updateSubscription = useMutation(api.emailMarketing.updateContactSubscription);

	// Use paginated query for server-side pagination
	const {
		results: contacts,
		status: paginationStatus,
		loadMore,
		isLoading,
	} = usePaginatedQuery(
		api.emailMarketing.getContactsPaginated,
		{
			subscriptionStatus:
				status === 'all' ? undefined : (status as 'subscribed' | 'unsubscribed' | 'pending'),
			sourceType: sourceType === 'all' ? undefined : (sourceType as 'lead' | 'student'),
			search: search || undefined,
		},
		{ initialNumItems: PAGE_SIZE },
	);

	// Stats - computed from all loaded contacts
	const stats = (() => {
		if (!contacts || contacts.length === 0) return null;
		const total = contacts.length;
		const subscribed = contacts.filter((c) => c.subscriptionStatus === 'subscribed').length;
		const pending = contacts.filter((c) => c.subscriptionStatus === 'pending').length;
		const unsubscribed = contacts.filter((c) => c.subscriptionStatus === 'unsubscribed').length;

		// Calculate unsubscribe rate (unsubscribed / total * 100)
		const unsubscribeRate = total > 0 ? (unsubscribed / total) * 100 : 0;

		return {
			total,
			subscribed,
			pending,
			unsubscribed,
			unsubscribeRate: unsubscribeRate.toFixed(1),
		};
	})();

	// Handlers
	const handleSyncContact = async (contactId: Id<'emailContacts'>) => {
		try {
			const result = await syncContact({ contactId });
			if (result.success) {
				toast.success('Contato sincronizado com Brevo com sucesso');
			}
		} catch (_error) {
			toast.error('Falha ao sincronizar contato');
		}
	};

	const handleUpdateSubscription = async (
		contactId: Id<'emailContacts'>,
		newStatus: 'subscribed' | 'unsubscribed',
	) => {
		try {
			await updateSubscription({
				contactId,
				subscriptionStatus: newStatus,
			});
			toast.success('Status de inscrição atualizado');
		} catch (_error) {
			toast.error('Falha ao atualizar status de inscrição');
		}
	};

	const handleFilterChange = (key: string, value: string | number) => {
		void navigate({
			to: '/marketing/contatos',
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
		contacts: contacts ?? [],
		stats,
		isLoading,
		canLoadMore: paginationStatus === 'CanLoadMore',
		paginationStatus,
		totalContacts: contacts?.length ?? 0,
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

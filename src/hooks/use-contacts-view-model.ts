import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useNavigate } from '@tanstack/react-router';
import { useAction, useMutation, useQuery } from 'convex/react';
import { useMemo } from 'react';
import { toast } from 'sonner';

// biome-ignore lint/suspicious/noExplicitAny: generic route typing
export function useContactsViewModel(Route: any) {
	const navigate = useNavigate();
	const searchParams = Route.useSearch();
	const { search, status, sourceType, page } = searchParams;

	const PAGE_SIZE = 20;

	// Mutations & Actions
	const syncContact = useAction(api.emailMarketing.syncContactToBrevo);
	const updateSubscription = useMutation(api.emailMarketing.updateContactSubscription);

	// Queries
	const contacts = useQuery(api.emailMarketing.getContacts, {
		subscriptionStatus:
			status === 'all' ? undefined : (status as 'subscribed' | 'unsubscribed' | 'pending'),
		sourceType: sourceType === 'all' ? undefined : (sourceType as 'lead' | 'student'),
	});

	// Client-side filtering and pagination
	const filteredContacts = useMemo(() => {
		if (!contacts) return undefined;

		let filtered = [...contacts];

		// Filter by search term (email or name)
		if (search) {
			const searchLower = search.toLowerCase();
			filtered = filtered.filter(
				(c) =>
					c.email.toLowerCase().includes(searchLower) ||
					c.firstName?.toLowerCase().includes(searchLower) ||
					c.lastName?.toLowerCase().includes(searchLower),
			);
		}

		return filtered;
	}, [contacts, search]);

	// Pagination logic
	const totalContacts = filteredContacts?.length ?? 0;
	const totalPages = Math.ceil(totalContacts / PAGE_SIZE);

	const paginatedContacts = useMemo(() => {
		if (!filteredContacts) return [];
		const start = (page - 1) * PAGE_SIZE;
		return filteredContacts.slice(start, start + PAGE_SIZE);
	}, [filteredContacts, page]);

	// Stats
	const stats = useMemo(() => {
		if (!contacts) return null;
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
	}, [contacts]);

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

	const handlePageChange = (newPage: number) => {
		void navigate({
			to: '/marketing/contatos',
			search: { ...searchParams, page: newPage },
		});
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
		contacts: paginatedContacts,
		stats,
		isLoading: contacts === undefined,
		totalPages,
		currentPage: page,
		totalContacts,
		filters: {
			search,
			status,
			sourceType,
		},
		handleSyncContact,
		handleUpdateSubscription,
		handleFilterChange,
		handlePageChange,
		clearFilters,
	};
}

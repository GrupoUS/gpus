import { createFileRoute } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

import { ContactFilters } from '@/components/marketing/contact-filters';
import { ContactStats } from '@/components/marketing/contact-stats';
import { ContactTable } from '@/components/marketing/contact-table';
import { CreateListDialog } from '@/components/marketing/create-list-dialog';
import { Button } from '@/components/ui/button';
import { useContactsViewModel } from '@/hooks/use-contacts-view-model';

const searchSchema = z.object({
	page: z.number().catch(1),
	search: z.string().catch(''),
	status: z.string().catch('all'),
	sourceType: z.string().catch('all'),
});

export const Route = createFileRoute('/_authenticated/marketing/contatos')({
	component: ContactsPage,
	validateSearch: searchSchema,
});

function ContactsPage() {
	const {
		contacts,
		stats,
		isLoading,
		canLoadMore,
		paginationStatus,
		filters,
		handleSyncContact,
		handleFilterChange,
		handleLoadMore,
		clearFilters,
	} = useContactsViewModel(Route);

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Contatos de Email</h1>
					<p className="text-muted-foreground">Gerencie seus contatos e sincronize com o Brevo.</p>
				</div>
				<div className="flex items-center gap-2">
					<CreateListDialog />
				</div>
			</div>

			<ContactStats stats={stats} />

			<div className="space-y-4">
				<ContactFilters
					onClear={clearFilters}
					onSearchChange={(v) => handleFilterChange('search', v)}
					onSourceTypeChange={(v) => handleFilterChange('sourceType', v)}
					onStatusChange={(v) => handleFilterChange('status', v)}
					search={filters.search}
					sourceType={filters.sourceType}
					status={filters.status}
				/>

				<ContactTable contacts={contacts} onSync={handleSyncContact} />

				{/* Server-side cursor-based pagination */}
				{canLoadMore && (
					<div className="mt-4 flex justify-center">
						<Button
							disabled={paginationStatus === 'LoadingMore'}
							onClick={handleLoadMore}
							variant="outline"
						>
							{paginationStatus === 'LoadingMore' ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Carregando...
								</>
							) : (
								'Carregar mais contatos'
							)}
						</Button>
					</div>
				)}

				{isLoading && contacts.length === 0 && (
					<div className="flex h-32 items-center justify-center">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
					</div>
				)}
			</div>
		</div>
	);
}

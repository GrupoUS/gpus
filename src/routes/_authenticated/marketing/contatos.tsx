import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { ContactFilters } from '@/components/marketing/contact-filters';
import { ContactStats } from '@/components/marketing/contact-stats';
import { ContactTable } from '@/components/marketing/contact-table';
import { CreateListDialog } from '@/components/marketing/create-list-dialog';
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui/pagination';
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
		totalPages,
		currentPage,
		filters,
		handleSyncContact,
		handleFilterChange,
		handlePageChange,
		clearFilters,
	} = useContactsViewModel(Route);

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Contatos de Email</h1>
					<p className="text-muted-foreground">Gerencie seus contatos e sincronize com o Brevo.</p>
				</div>
				<div className="flex items-center gap-2">
					<CreateListDialog />
				</div>
			</div>

			<ContactStats stats={stats} />

			<div className="space-y-4">
				<ContactFilters
					search={filters.search}
					onSearchChange={(v) => handleFilterChange('search', v)}
					status={filters.status}
					onStatusChange={(v) => handleFilterChange('status', v)}
					sourceType={filters.sourceType}
					onSourceTypeChange={(v) => handleFilterChange('sourceType', v)}
					onClear={clearFilters}
				/>

				<ContactTable contacts={contacts} onSync={handleSyncContact} />

				{totalPages > 1 && (
					<div className="flex justify-center mt-4">
						<Pagination>
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious
										className={
											currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
										}
										onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
									/>
								</PaginationItem>
								{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
									<PaginationItem key={page}>
										<PaginationLink
											isActive={page === currentPage}
											onClick={() => handlePageChange(page)}
											className="cursor-pointer"
										>
											{page}
										</PaginationLink>
									</PaginationItem>
								))}
								<PaginationItem>
									<PaginationNext
										className={
											currentPage === totalPages
												? 'pointer-events-none opacity-50'
												: 'cursor-pointer'
										}
										onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</div>
				)}
			</div>
		</div>
	);
}

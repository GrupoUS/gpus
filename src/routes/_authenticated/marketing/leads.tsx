import { createFileRoute } from '@tanstack/react-router';
import { Download, Loader2 } from 'lucide-react';
import { z } from 'zod';

import { LeadCaptureFilters } from '@/components/marketing/lead-capture-filters';
import { LeadCaptureStats } from '@/components/marketing/lead-capture-stats';
import { LeadCaptureTable } from '@/components/marketing/lead-capture-table';
import { Button } from '@/components/ui/button';
import { useMarketingLeadsViewModel } from '@/hooks/use-marketing-leads-view-model';

const searchSchema = z.object({
	page: z.number().catch(1),
	search: z.string().catch(''),
	status: z.string().catch('all'),
	interest: z.string().catch('all'),
});

export const Route = createFileRoute('/_authenticated/marketing/leads')({
	component: LeadsPage,
	validateSearch: searchSchema,
});

function LeadsPage() {
	const {
		leads,
		stats,
		isLoading,
		canLoadMore,
		handleStatusUpdate,
		filters,
		handleFilterChange,
		handleLoadMore,
		clearFilters,
		handleExportCSV,
	} = useMarketingLeadsViewModel(Route);

	return (
		<div className="flex flex-col gap-6 p-6">
			{/* Header */}
			<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Leads de Captura</h1>
					<p className="text-muted-foreground">
						Gerencie os leads capturados através do formulário público.
					</p>
				</div>
				<Button variant="outline" onClick={handleExportCSV} className="gap-2">
					<Download className="h-4 w-4" />
					Exportar CSV
				</Button>
			</div>

			{/* Stats */}
			<LeadCaptureStats stats={stats} />

			{/* Filters */}
			<LeadCaptureFilters
				search={filters.search}
				onSearchChange={(v) => handleFilterChange('search', v)}
				status={filters.status}
				onStatusChange={(v) => handleFilterChange('status', v)}
				interest={filters.interest}
				onInterestChange={(v) => handleFilterChange('interest', v)}
				onClear={clearFilters}
			/>

			{/* Table and Load More */}
			<div className="space-y-4">
				<LeadCaptureTable leads={leads} onStatusUpdate={handleStatusUpdate} />

				{isLoading && leads.length === 0 && (
					<div className="flex justify-center py-10">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				)}

				<div className="flex justify-center">
					{canLoadMore && (
						<Button variant="outline" onClick={handleLoadMore} disabled={isLoading}>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Carregando...
								</>
							) : (
								'Carregar mais'
							)}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}

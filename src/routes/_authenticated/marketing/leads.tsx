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
	source: z.string().catch('all'),
	landingPage: z.string().catch('all'),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
});

export const Route = createFileRoute('/_authenticated/marketing/leads')({
	component: LeadsPage,
	validateSearch: searchSchema,
});

function LeadsPage() {
	const { leads, stats, landingPageStats, isLoading, canLoadMore, filters, options, handlers } =
		useMarketingLeadsViewModel(Route);

	return (
		<div className="flex flex-col gap-6 p-6">
			{/* Header */}
			<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Leads de Captura</h1>
					<p className="text-muted-foreground">
						Gerencie os leads capturados através do formulário público.
					</p>
				</div>
				<Button className="gap-2" onClick={handlers.onExport} variant="outline">
					<Download className="h-4 w-4" />
					Exportar CSV
				</Button>
			</div>

			{/* Stats */}
			<LeadCaptureStats landingPageStats={landingPageStats} stats={stats} />

			{/* Filters */}
			<div className="flex flex-col gap-4">
				<LeadCaptureFilters
					date={filters.date}
					interest={filters.interest}
					landingPage={filters.landingPage}
					landingPageOptions={options.landingPages}
					onClear={handlers.onClearFilters}
					onDateChange={handlers.onDateChange}
					onInterestChange={handlers.onInterestChange}
					onLandingPageChange={handlers.onLandingPageChange}
					onSearchChange={handlers.onSearchChange}
					onSourceChange={handlers.onSourceChange}
					onStatusChange={handlers.onStatusChange}
					search={filters.search}
					source={filters.source}
					sourceOptions={options.sources}
					status={filters.status}
				/>
			</div>

			{/* Table and Load More */}
			<div className="space-y-4">
				<LeadCaptureTable leads={leads} onStatusUpdate={handlers.onStatusUpdate} />

				{isLoading && leads.length === 0 && (
					<div className="flex justify-center py-10">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				)}

				<div className="flex justify-center">
					{canLoadMore && (
						<Button disabled={isLoading} onClick={handlers.onLoadMore} variant="outline">
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

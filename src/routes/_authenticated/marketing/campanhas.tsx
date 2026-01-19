import type { Doc } from '@convex/_generated/dataModel';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, Mail, Plus } from 'lucide-react';

import { CampaignCard } from '@/components/marketing/campaign-card';
import { CampaignFilters } from '@/components/marketing/campaign-filters';
import { CampaignStats } from '@/components/marketing/campaign-stats';
import { CampaignTable } from '@/components/marketing/campaign-table';
import { Button } from '@/components/ui/button';
import { useCampaignsViewModel } from '@/hooks/use-campaigns-view-model';

export const Route = createFileRoute('/_authenticated/marketing/campanhas')({
	validateSearch: (search: Record<string, unknown>) => {
		return {
			search: (search.search as string) || '',
			status: (search.status as string) || 'all',
			view: ((search.view as string) || 'grid') === 'table' ? 'table' : 'grid',
			page: Math.max(1, Number(search.page) || 1),
		};
	},
	component: CampaignsPage,
});

function CampaignsPage() {
	const {
		search,
		status,
		view,
		page,
		campaigns,
		paginatedCampaigns,
		totalCampaigns,
		draftCount,
		sentCount,
		avgOpenRate,
		totalPages,
		clearFilters,
		handleFilterChange,
		navigateToCampaign,
		navigate,
		PAGE_SIZE,
	} = useCampaignsViewModel(Route);

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Campanhas</h1>
					<p className="text-muted-foreground">Gerencie suas campanhas de email marketing.</p>
				</div>
				<Link to="/marketing/nova">
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Nova Campanha
					</Button>
				</Link>
			</div>

			{/* Stats Cards */}
			<CampaignStats
				avgOpenRate={avgOpenRate}
				draftCount={draftCount}
				sentCount={sentCount}
				totalCampaigns={totalCampaigns}
			/>

			{/* Filters */}
			<CampaignFilters
				onClear={clearFilters}
				onSearchChange={(v) => handleFilterChange('search', v)}
				onStatusChange={(v) => handleFilterChange('status', v)}
				search={search || ''}
				status={status || 'all'}
			/>

			{/* Campaigns List */}
			{campaigns ? (
				campaigns.length === 0 ? (
					<div className="py-12 text-center text-muted-foreground">
						<Mail className="mx-auto mb-4 h-16 w-16 opacity-30" />
						<h2 className="font-medium text-lg">Nenhuma campanha encontrada</h2>
						<p className="text-sm">Crie uma nova campanha para começar</p>
					</div>
				) : view === 'table' ? (
					/* Table View */
					<CampaignTable campaigns={paginatedCampaigns} onCampaignClick={navigateToCampaign} />
				) : (
					/* Grid View */
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{paginatedCampaigns.map((campaign: Doc<'emailCampaigns'>) => (
							<CampaignCard
								campaign={campaign}
								key={campaign._id}
								onClick={() => navigateToCampaign(campaign._id)}
							/>
						))}
					</div>
				)
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3, 4, 5, 6].map((i) => (
						<div className="h-40 animate-pulse rounded-lg bg-muted/20" key={i} />
					))}
				</div>
			)}

			{/* Pagination */}
			{campaigns && campaigns.length > PAGE_SIZE && (
				<div className="flex items-center justify-between">
					<p className="text-muted-foreground text-sm">
						Mostrando {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, totalCampaigns)} de{' '}
						{totalCampaigns} campanhas
					</p>
					<div className="flex items-center gap-2">
						<Button
							disabled={page === 1}
							onClick={() => {
								void navigate({
									to: '/marketing/campanhas',
									search: { search, status, view, page: page - 1 },
								});
							}}
							size="sm"
							variant="outline"
						>
							<ChevronLeft className="mr-1 h-4 w-4" />
							Anterior
						</Button>
						<span className="text-muted-foreground text-sm">
							{page} / {totalPages}
						</span>
						<Button
							disabled={page === totalPages}
							onClick={() => {
								void navigate({
									to: '/marketing/campanhas',
									search: { search, status, view, page: page + 1 },
								});
							}}
							size="sm"
							variant="outline"
						>
							Próximo
							<ChevronRight className="ml-1 h-4 w-4" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

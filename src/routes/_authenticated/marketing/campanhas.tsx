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
					<h1 className="text-2xl font-bold tracking-tight">Campanhas</h1>
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
				totalCampaigns={totalCampaigns}
				draftCount={draftCount}
				sentCount={sentCount}
				avgOpenRate={avgOpenRate}
			/>

			{/* Filters */}
			<CampaignFilters
				search={search || ''}
				onSearchChange={(v) => handleFilterChange('search', v)}
				status={status || 'all'}
				onStatusChange={(v) => handleFilterChange('status', v)}
				onClear={clearFilters}
			/>

			{/* Campaigns List */}
			{!campaigns ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3, 4, 5, 6].map((i) => (
						<div key={i} className="h-40 bg-muted/20 animate-pulse rounded-lg" />
					))}
				</div>
			) : campaigns.length === 0 ? (
				<div className="text-center py-12 text-muted-foreground">
					<Mail className="h-16 w-16 mx-auto mb-4 opacity-30" />
					<h2 className="text-lg font-medium">Nenhuma campanha encontrada</h2>
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
							key={campaign._id}
							campaign={campaign}
							onClick={() => navigateToCampaign(campaign._id)}
						/>
					))}
				</div>
			)}

			{/* Pagination */}
			{campaigns && campaigns.length > PAGE_SIZE && (
				<div className="flex items-center justify-between">
					<p className="text-sm text-muted-foreground">
						Mostrando {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, totalCampaigns)} de{' '}
						{totalCampaigns} campanhas
					</p>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={page === 1}
							onClick={() => {
								void navigate({
									to: '/marketing/campanhas',
									search: { search, status, view, page: page - 1 },
								});
							}}
						>
							<ChevronLeft className="h-4 w-4 mr-1" />
							Anterior
						</Button>
						<span className="text-sm text-muted-foreground">
							{page} / {totalPages}
						</span>
						<Button
							variant="outline"
							size="sm"
							disabled={page === totalPages}
							onClick={() => {
								void navigate({
									to: '/marketing/campanhas',
									search: { search, status, view, page: page + 1 },
								});
							}}
						>
							Próximo
							<ChevronRight className="h-4 w-4 ml-1" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

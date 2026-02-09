import { createFileRoute } from '@tanstack/react-router';
import { Upload } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { toast } from 'sonner';

import { LeadFilters } from '@/components/crm/lead-filters';

// Lazy load heavy CRM components
const LeadDetail = lazy(() =>
	import('@/components/crm/lead-detail').then((module) => ({ default: module.LeadDetail })),
);
const PipelineKanban = lazy(() =>
	import('@/components/crm/pipeline-kanban').then((module) => ({ default: module.PipelineKanban })),
);
const LeadImportDialog = lazy(() =>
	import('@/components/crm/lead-import-dialog').then((module) => ({
		default: module.LeadImportDialog,
	})),
);
const AdminUserSelector = lazy(() =>
	import('@/components/crm/admin-user-selector').then((module) => ({
		default: module.AdminUserSelector,
	})),
);

import { z } from 'zod';

import { trpc } from '../../lib/trpc';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ... imports remain the same

export const Route = createFileRoute('/_authenticated/crm')({
	validateSearch: z.object({
		product: z.string().optional().catch('all'),
	}),
	component: CRMPage,
});


function CRMPage() {
	const navigate = Route.useNavigate();
	const { product } = Route.useSearch();
	const [selectedProduct, setSelectedProduct] = useState<string>(product || 'all');

	const [filters, setFilters] = useState({
		search: '',
		stages: [] as string[],
		temperature: [] as string[],
		products: [] as string[],
		source: [] as string[],
		tags: [] as string[],
	});
	const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
	const [importDialogOpen, setImportDialogOpen] = useState(false);
	const [adminSelectedUserId, setAdminSelectedUserId] = useState<string | null>(null);

	const handleTabChange = (value: string) => {
		setSelectedProduct(value);
		navigate({ search: { product: value } });
	};

	let leadsProducts: string[] | undefined;
	if (selectedProduct !== 'all') {
		leadsProducts = [selectedProduct];
	} else if (filters.products.length > 0) {
		leadsProducts = filters.products;
	}

	const { data: allLeadsResult } = trpc.leads.list.useQuery({});
	const allLeadsData = allLeadsResult?.data ?? [];

	// Filter leads based on product selection
	const allLeadsForCounts = allLeadsData;
	const leads = leadsProducts
		? allLeadsData.filter((l) => leadsProducts.includes(l.interestedProduct as string))
		: allLeadsData;

	const updateStage = trpc.leads.updateStage.useMutation();

	const handleDragEnd = async (leadId: string, newStage: string) => {
		try {
			await updateStage.mutateAsync({
				leadId: Number(leadId),
				// biome-ignore lint/suspicious/noExplicitAny: stage enum type
				newStage: newStage as any,
			});
			toast.success('Lead atualizado');
		} catch {
			toast.error('Erro ao atualizar lead');
		}
	};

	const formattedLeads = leads.map((l) => ({
		...l,
		stage: l.stage,
		temperature: l.temperature,
	}));

	// Calculate counts from UNFILTERED lead set for accurate badge totals
	const counts = {
		all: allLeadsForCounts.length,
		otb: allLeadsForCounts.filter((l) => l.interestedProduct === 'otb').length,
		black_neon: allLeadsForCounts.filter((l) => l.interestedProduct === 'black_neon').length,
		trintae3: allLeadsForCounts.filter((l) => l.interestedProduct === 'trintae3').length,
	};

	return (
		<div className="flex h-[calc(100vh-4rem)] flex-col space-y-4">
			<div className="flex animate-fade-in-up flex-col gap-4">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="font-bold font-display text-4xl tracking-tight md:text-5xl">
							Pipeline de Vendas
						</h1>
						<p className="font-sans text-base text-muted-foreground">
							Gerencie seus leads e oportunidades
						</p>
					</div>
					<div className="flex items-center gap-4">
						<Suspense fallback={null}>
							<AdminUserSelector
								onUserSelect={setAdminSelectedUserId}
								selectedUserId={adminSelectedUserId}
							/>
						</Suspense>
						<Button className="gap-2" onClick={() => setImportDialogOpen(true)} variant="outline">
							<Upload className="h-4 w-4" />
							Importar Leads
						</Button>
					</div>
				</div>

				<Tabs onValueChange={handleTabChange} value={selectedProduct}>
					<TabsList>
						<TabsTrigger value="all">
							Todos{' '}
							<Badge className="ml-2" variant="secondary">
								{counts.all}
							</Badge>
						</TabsTrigger>
						<TabsTrigger value="otb">
							OTB 2025{' '}
							<Badge className="ml-2" variant="secondary">
								{counts.otb}
							</Badge>
						</TabsTrigger>
						<TabsTrigger value="black_neon">
							NEON{' '}
							<Badge className="ml-2" variant="secondary">
								{counts.black_neon}
							</Badge>
						</TabsTrigger>
						<TabsTrigger value="trintae3">
							TRINTAE3{' '}
							<Badge className="ml-2" variant="secondary">
								{counts.trintae3}
							</Badge>
						</TabsTrigger>
					</TabsList>
				</Tabs>

				<Suspense fallback={<div>Carregando filtros...</div>}>
					<LeadFilters
						onFiltersChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
					/>
				</Suspense>
			</div>

			<div className="flex-1 overflow-hidden">
				{allLeadsResult === undefined ? (
					<div className="flex h-full items-center justify-center text-muted-foreground">
						Carregando pipeline...
					</div>
				) : (
					<Suspense fallback={<div>Carregando pipeline...</div>}>
						<PipelineKanban
							// @ts-expect-error - Migration: error TS2322
							leads={formattedLeads}
							onDragEnd={handleDragEnd}
							// @ts-expect-error - Migration: error TS2352
							onLeadClick={(id: string) => setSelectedLeadId(id as number)}
						/>
					</Suspense>
				)}
			</div>

			<Suspense fallback={<div>Carregando detalhes...</div>}>
				<LeadDetail leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />
			</Suspense>

			<Suspense fallback={null}>
				<LeadImportDialog onOpenChange={setImportDialogOpen} open={importDialogOpen} />
			</Suspense>
		</div>
	);
}

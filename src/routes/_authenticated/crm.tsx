import { api } from '@convex/_generated/api';
import { createFileRoute } from '@tanstack/react-router';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { Upload } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { toast } from 'sonner';

import type { Doc, Id } from '../../../convex/_generated/dataModel';
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

type LeadItem = Doc<'leads'>;
interface ListLeadsResult {
	page: LeadItem[];
	isDone: boolean;
	continueCursor: string;
}

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
	const [selectedLeadId, setSelectedLeadId] = useState<Id<'leads'> | null>(null);
	const [importDialogOpen, setImportDialogOpen] = useState(false);
	const [adminSelectedUserId, setAdminSelectedUserId] = useState<string | null>(null);
	const { isAuthenticated } = useConvexAuth();

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

	// Build query args
	const baseArgs = {
		paginationOpts: { numItems: 1000, cursor: null as null },
		search: filters.search || undefined,
		stages: filters.stages.length > 0 ? filters.stages : undefined,
		temperature: filters.temperature.length > 0 ? filters.temperature : undefined,
		source: filters.source.length > 0 ? filters.source : undefined,
		tags: filters.tags.length > 0 ? (filters.tags as Id<'tags'>[]) : undefined,
	};

	// Early cast at hook call site to avoid Convex deep type instantiation
	const useLeadsQuery = useQuery as unknown as (
		query: unknown,
		args?: unknown,
	) => ListLeadsResult | undefined;

	const allLeadsForCounts = useLeadsQuery(
		api.leads.listLeads,
		isAuthenticated ? { ...baseArgs, products: undefined } : 'skip',
	);

	const leads = useLeadsQuery(
		api.leads.listLeads,
		isAuthenticated ? { ...baseArgs, products: leadsProducts } : 'skip',
	);

	const updateStage = useMutation(api.leads.updateLeadStage);

	const handleDragEnd = async (leadId: string, newStage: string) => {
		try {
			await updateStage({
				leadId: leadId as Id<'leads'>,
				newStage: newStage as Doc<'leads'>['stage'],
			});
			toast.success('Lead atualizado');
		} catch {
			toast.error('Erro ao atualizar lead');
		}
	};

	const formattedLeads =
		leads?.page?.map((l: LeadItem) => ({
			...l,
			stage: l.stage,
			temperature: l.temperature,
		})) ?? [];

	// Calculate counts from UNFILTERED lead set for accurate badge totals
	const allLeadsForCountsPage = allLeadsForCounts?.page ?? [];
	const counts = {
		all: allLeadsForCountsPage.length,
		otb: allLeadsForCountsPage.filter((l: LeadItem) => l.interestedProduct === 'otb').length,
		black_neon: allLeadsForCountsPage.filter((l: LeadItem) => l.interestedProduct === 'black_neon')
			.length,
		trintae3: allLeadsForCountsPage.filter((l: LeadItem) => l.interestedProduct === 'trintae3')
			.length,
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
				{leads === undefined ? (
					<div className="flex h-full items-center justify-center text-muted-foreground">
						Carregando pipeline...
					</div>
				) : (
					<Suspense fallback={<div>Carregando pipeline...</div>}>
						<PipelineKanban
							leads={formattedLeads}
							onDragEnd={handleDragEnd}
							onLeadClick={(id: string) => setSelectedLeadId(id as Id<'leads'>)}
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

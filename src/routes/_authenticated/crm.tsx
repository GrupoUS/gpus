import { api } from '@convex/_generated/api';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
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

export const Route = createFileRoute('/_authenticated/crm')({
	component: CRMPage,
});

type LeadItem = Doc<'leads'>;
interface ListLeadsResult {
	page: LeadItem[];
	isDone: boolean;
	continueCursor: string;
}

function CRMPage() {
	const [filters, setFilters] = useState({
		search: '',
		stages: [] as string[],
		temperature: [] as string[],
		products: [] as string[],
		source: [] as string[],
	});
	const [selectedLeadId, setSelectedLeadId] = useState<Id<'leads'> | null>(null);

	// Break type inference chain to avoid "Type instantiation is excessively deep" error
	// biome-ignore lint/suspicious/noExplicitAny: Required to break type inference chain
	const leads = useQuery((api as any).leads.listLeads, {
		paginationOpts: { numItems: 1000, cursor: null },
		search: filters.search || undefined,
		stages: filters.stages.length > 0 ? filters.stages : undefined,
		temperature: filters.temperature.length > 0 ? filters.temperature : undefined,
		products: filters.products.length > 0 ? filters.products : undefined,
		source: filters.source.length > 0 ? filters.source : undefined,
	}) as ListLeadsResult | undefined;

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
		leads?.page?.map((l) => ({
			...l,
			stage: l.stage,
			temperature: l.temperature,
		})) ?? [];

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
				</div>

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
		</div>
	);
}

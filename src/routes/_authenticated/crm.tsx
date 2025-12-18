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

function CRMPage() {
	const [filters, setFilters] = useState({
		search: '',
		stages: [] as string[],
		temperature: [] as string[],
		products: [] as string[],
		source: [] as string[],
	});
	const [selectedLeadId, setSelectedLeadId] = useState<Id<'leads'> | null>(null);

	const leads = useQuery(api.leads.listLeads, {
		search: filters.search || undefined,
		stages: filters.stages.length ? filters.stages : undefined,
		temperature: filters.temperature.length ? filters.temperature : undefined,
		products: filters.products.length ? filters.products : undefined,
		source: filters.source.length ? filters.source : undefined,
	});

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
		leads?.map((l: Doc<'leads'>) => ({
			...l,
			stage: l.stage,
			temperature: l.temperature,
		})) ?? [];

	return (
		<div className="h-[calc(100vh-4rem)] flex flex-col space-y-4">
			<div className="flex flex-col gap-4 animate-fade-in-up">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
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
					<div className="h-full flex items-center justify-center text-muted-foreground">
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

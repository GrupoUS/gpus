import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '../../../convex/_generated/api';
import type { Doc, Id } from '../../../convex/_generated/dataModel';
import { PipelineKanban } from '@/components/crm/pipeline-kanban';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/crm/')({
	component: CRMPage,
});

function CRMPage() {
	const leads = useQuery(api.leads.listLeads, {});
	const updateStage = useMutation(api.leads.updateLeadStage);

	const handleDragEnd = async (leadId: string, newStage: string) => {
		// Optimistic update could go here, but for now just mutate
		// We need to cast newStage to the union type, but backend validates it.
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

	if (leads === undefined) {
		return <div className="p-8">Carregando leads...</div>;
	}

	// Cast leads to match interface (Convex types vs Frontend Interface)
	// In a real app we'd use shared types. For now we map.
	const formattedLeads = leads.map((l: Doc<'leads'>) => ({
		...l,
		stage: l.stage,
		temperature: l.temperature,
	}));

	return (
		<div className="h-[calc(100vh-4rem)] flex flex-col space-y-4">
			<div className="flex items-center justify-between animate-fade-in-up">
				<div>
					<h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
						Pipeline de Vendas
					</h1>
					<p className="font-sans text-base text-muted-foreground">
						Gerencie seus leads e oportunidades
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button>
						<Plus className="mr-2 h-4 w-4" /> Novo Lead
					</Button>
				</div>
			</div>

			<div className="flex-1 overflow-hidden">
				<PipelineKanban leads={formattedLeads} onDragEnd={handleDragEnd} />
			</div>
		</div>
	);
}

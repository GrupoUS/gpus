import { closestCenter, DndContext, type DragEndEvent, useDroppable } from '@dnd-kit/core';

import { LeadCard } from './lead-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const stages = [
	{ id: 'novo', label: 'Novo', color: 'bg-blue-500' },
	{ id: 'primeiro_contato', label: 'Primeiro Contato', color: 'bg-yellow-500' },
	{ id: 'qualificado', label: 'Qualificado', color: 'bg-purple-500' },
	{ id: 'proposta', label: 'Proposta', color: 'bg-orange-500' },
	{ id: 'negociacao', label: 'Negociação', color: 'bg-pink-500' },
	{ id: 'fechado_ganho', label: 'Fechado ✓', color: 'bg-green-500' },
];

interface Lead {
	_id: string;
	name: string;
	phone: string;
	profession?: string;
	interestedProduct?: string;
	temperature: 'frio' | 'morno' | 'quente';
	stage: string;
	lastContactAt?: number;
}

interface PipelineKanbanProps {
	leads: Lead[];
	onDragEnd: (leadId: string, newStage: string) => void;
	onLeadClick?: (leadId: string) => void;
}

// Droppable Column Component
function KanbanColumn({
	stage,
	leads,
	onLeadClick,
}: {
	stage: (typeof stages)[0];
	leads: Lead[];
	onLeadClick?: (id: string) => void;
}) {
	const { setNodeRef } = useDroppable({
		id: stage.id,
	});

	return (
		<div ref={setNodeRef} className="shrink-0 w-[300px] snap-start">
			<Card
				variant="glass"
				className="h-[calc(100vh-200px)] min-h-[400px] flex flex-col kanban-column"
			>
				<CardHeader className="pb-3 shrink-0 kanban-column-header">
					<div className="flex items-center justify-between">
						<CardTitle className="text-sm font-medium flex items-center gap-2 font-display">
							<div className={`h-2 w-2 rounded-full ${stage.color}`} />
							{stage.label}
						</CardTitle>
						<Badge variant="secondary" className="font-display tabular-nums animate-scale-in">
							{leads.length}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="flex-1 min-h-0">
					<ScrollArea className="h-full">
						<div className="space-y-3 pr-4 pb-4">
							{leads.map((lead) => (
								<div
									key={lead._id}
									role="button"
									tabIndex={0}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											onLeadClick?.(lead._id);
										}
									}}
									onClick={() => onLeadClick?.(lead._id)}
									className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
								>
									<LeadCard lead={lead} />
								</div>
							))}
							{leads.length === 0 && (
								<div className="h-20 border-2 border-dashed border-muted rounded-lg flex items-center justify-center text-muted-foreground text-xs">
									Arraste para cá
								</div>
							)}
						</div>
					</ScrollArea>
				</CardContent>
			</Card>
		</div>
	);
}

export function PipelineKanban({ leads, onDragEnd, onLeadClick }: PipelineKanbanProps) {
	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			// Find which stage the "over" id belongs to or if it is a stage id itself
			// The Droppable ID IS the stage ID in KanbanColumn
			// The Active ID IS the lead ID
			onDragEnd(active.id as string, over.id as string);
		}
	};

	return (
		<DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
			<div className="flex gap-4 overflow-x-auto pb-4 h-full snap-x snap-mandatory scroll-smooth">
				{stages.map((stage) => {
					const stageLeads = leads.filter((l) => l.stage === stage.id);
					return (
						<KanbanColumn
							key={stage.id}
							stage={stage}
							leads={stageLeads}
							onLeadClick={onLeadClick}
						/>
					);
				})}
			</div>
		</DndContext>
	);
}

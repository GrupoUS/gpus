import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	useDroppable,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MessageSquare } from 'lucide-react';
import { useMemo, useState } from 'react';

import { LeadCard } from './lead-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const stages = [
	{ id: 'novo', label: 'Novo', color: 'bg-primary' },
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
	clinicName?: string;
	hasClinic?: boolean;
}

interface PipelineKanbanProps {
	leads: Lead[];
	onDragEnd: (leadId: string, newStage: string) => void;
	onLeadClick?: (leadId: string) => void;
}

function SortableLeadCard({
	lead,
	onLeadClick,
}: {
	lead: Lead;
	onLeadClick?: (id: string) => void;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: lead._id,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className="rounded-lg touch-none"
		>
			<button
				type="button"
				onClick={() => onLeadClick?.(lead._id)}
				className="w-full text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
			>
				<LeadCard lead={lead} />
			</button>
			{lead.phone && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						if (lead.phone) {
							window.open(`https://wa.me/${lead.phone}`, '_blank');
						}
					}}
					className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-xs font-medium cursor-pointer"
					onPointerDown={(e) => e.stopPropagation()}
				>
					<MessageSquare className="h-3.5 w-3.5" />
					WhatsApp
				</button>
			)}
		</div>
	);
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

	const leadIds = useMemo(() => leads.map((l) => l._id), [leads]);

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
							<SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
								{leads.map((lead) => (
									<SortableLeadCard key={lead._id} lead={lead} onLeadClick={onLeadClick} />
								))}
							</SortableContext>
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
	const [activeId, setActiveId] = useState<string | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
	);

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(event.active.id as string);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		setActiveId(null);

		if (!over) return;

		const activeId = active.id as string;
		const overId = over.id as string;

		// If the item dropped on itself active.id === over.id, usually that's a sort.
		// But we also need to check if the 'over' is a container (Stage) or another Item.

		if (activeId !== overId) {
			// Check if we dropped on a stage column
			const isOverStage = stages.some((stage) => stage.id === overId);

			if (isOverStage) {
				// Dropped on a column, handle stage change
				onDragEnd(activeId, overId);
			} else {
				// Dropped on another item
				// Find the stage of the over item
				const overLead = leads.find((l) => l._id === overId);
				const activeLead = leads.find((l) => l._id === activeId);

				if (overLead && activeLead && overLead.stage !== activeLead.stage) {
					// Different stage, so it's a stage change
					onDragEnd(activeId, overLead.stage);
				}
				// If same stage, it's just a reorder, which we ignore for backend
				// (or we could implement reorder callback if needed)
			}
		}
	};

	const activeLead = useMemo(() => leads.find((l) => l._id === activeId), [activeId, leads]);

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
		>
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
			<DragOverlay>
				{activeLead ? (
					<div className="opacity-80 rotate-2 cursor-grabbing">
						<LeadCard lead={activeLead} />
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	);
}

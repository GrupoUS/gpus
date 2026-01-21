import type { Id } from '@convex/_generated/dataModel';
import { AnimatePresence, LayoutGroup, motion, Reorder } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { LeadCard } from './lead-card';
import { LeadForm } from './lead-form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cardVariants, dragTransition, layoutTransition, SPRING_SMOOTH } from '@/lib/motion-config';

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

// ============================================================================
// Draggable Lead Card Component
// ============================================================================

function DraggableLeadCard({
	lead,
	onLeadClick,
	onDragToColumn,
	columnRefs,
}: {
	lead: Lead;
	onLeadClick?: (id: string) => void;
	onDragToColumn: (leadId: string, newStage: string) => void;
	columnRefs: React.RefObject<Map<string, HTMLDivElement>>;
}) {
	const [isDragging, setIsDragging] = useState(false);

	const handleDragEnd = useCallback(
		(_event: MouseEvent | TouchEvent | PointerEvent, info: { point: { x: number; y: number } }) => {
			setIsDragging(false);

			// Find which column the card was dropped on
			const columns = columnRefs.current;
			if (!columns) return;

			for (const [stageId, element] of columns.entries()) {
				const rect = element.getBoundingClientRect();
				if (
					info.point.x >= rect.left &&
					info.point.x <= rect.right &&
					info.point.y >= rect.top &&
					info.point.y <= rect.bottom
				) {
					if (stageId !== lead.stage) {
						onDragToColumn(lead._id, stageId);
					}
					break;
				}
			}
		},
		[columnRefs, lead._id, lead.stage, onDragToColumn],
	);

	return (
		<Reorder.Item
			animate="animate"
			className="relative touch-none rounded-lg will-change-transform"
			drag
			dragElastic={0.1}
			dragTransition={dragTransition}
			exit="exit"
			id={lead._id}
			initial="initial"
			layout="position"
			layoutId={lead._id}
			onDragEnd={handleDragEnd}
			onDragStart={() => setIsDragging(true)}
			transition={layoutTransition}
			value={lead}
			variants={cardVariants}
			whileDrag={{
				scale: 1.05,
				boxShadow: '0 25px 50px -12px hsl(var(--primary) / 0.4)',
				zIndex: 50,
				cursor: 'grabbing',
			}}
		>
			<div className="relative w-full">
				<LeadCard lead={{ ...lead, _id: lead._id as Id<'leads'> }} />
				<button
					aria-label="Abrir lead"
					className="absolute inset-0 h-full w-full cursor-pointer rounded-lg border-none bg-transparent p-0 opacity-0 focus:opacity-100 focus:ring-2 focus:ring-primary focus:ring-offset-2"
					onClick={() => {
						if (!isDragging) {
							onLeadClick?.(lead._id);
						}
					}}
					type="button"
				/>
			</div>
			{lead.phone && (
				<motion.button
					className="mt-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md bg-green-50 px-3 py-1.5 font-medium text-green-700 text-xs transition-colors hover:bg-green-100"
					onClick={(e) => {
						e.stopPropagation();
						if (lead.phone) {
							window.open(`https://wa.me/${lead.phone}`, '_blank');
						}
					}}
					onPointerDown={(e) => e.stopPropagation()}
					type="button"
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
				>
					<MessageSquare className="h-3.5 w-3.5" />
					WhatsApp
				</motion.button>
			)}
		</Reorder.Item>
	);
}

// ============================================================================
// Kanban Column Component
// ============================================================================

function KanbanColumn({
	stage,
	leads,
	onLeadClick,
	onReorder,
	onDragToColumn,
	columnRefs,
	headerAction,
	registerColumn,
}: {
	stage: (typeof stages)[0];
	leads: Lead[];
	onLeadClick?: (id: string) => void;
	onReorder: (stageId: string, newOrder: Lead[]) => void;
	onDragToColumn: (leadId: string, newStage: string) => void;
	columnRefs: React.RefObject<Map<string, HTMLDivElement>>;
	registerColumn: (stageId: string, element: HTMLDivElement | null) => void;
	headerAction?: React.ReactNode;
}) {
	return (
		<motion.div
			className="w-[300px] shrink-0 snap-start"
			layout
			ref={(el) => registerColumn(stage.id, el)}
			transition={SPRING_SMOOTH}
		>
			<Card
				className="kanban-column flex h-[calc(100vh-200px)] min-h-[400px] flex-col"
				variant="glass"
			>
				<CardHeader className="kanban-column-header shrink-0 pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-2 font-display font-medium text-sm">
							<motion.div
								className={`h-2 w-2 rounded-full ${stage.color}`}
								layoutId={`stage-dot-${stage.id}`}
							/>
							{stage.label}
						</CardTitle>
						<Badge className="font-display tabular-nums" variant="secondary">
							<motion.span
								animate={{ scale: 1 }}
								initial={{ scale: 1.2 }}
								key={leads.length}
								transition={SPRING_SMOOTH}
							>
								{leads.length}
							</motion.span>
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="flex min-h-0 flex-1 flex-col">
					{headerAction}
					<ScrollArea className="h-full">
						<Reorder.Group
							axis="y"
							className="space-y-3 pr-4 pb-4"
							layoutScroll
							onReorder={(newOrder) => onReorder(stage.id, newOrder)}
							values={leads}
						>
							<AnimatePresence initial={false} mode="popLayout">
								{leads.map((lead) => (
									<DraggableLeadCard
										columnRefs={columnRefs}
										key={lead._id}
										lead={lead}
										onDragToColumn={onDragToColumn}
										onLeadClick={onLeadClick}
									/>
								))}
							</AnimatePresence>
							{leads.length === 0 && (
								<motion.div
									animate={{ opacity: 1 }}
									className="flex h-20 items-center justify-center rounded-lg border-2 border-muted border-dashed text-muted-foreground text-xs"
									initial={{ opacity: 0 }}
									transition={{ delay: 0.2 }}
								>
									Arraste para cá
								</motion.div>
							)}
						</Reorder.Group>
					</ScrollArea>
				</CardContent>
			</Card>
		</motion.div>
	);
}

// ============================================================================
// Main Kanban Component
// ============================================================================

export function PipelineKanban({ leads, onDragEnd, onLeadClick }: PipelineKanbanProps) {
	// Track column DOM elements for hit detection
	const columnRefs = useRef<Map<string, HTMLDivElement>>(new Map());

	// Local state for optimistic reordering within columns
	const [localLeads, setLocalLeads] = useState<Lead[] | null>(null);

	// Use local leads if we have them (during reorder), otherwise use props
	const currentLeads = localLeads ?? leads;

	// Group leads by stage
	const leadsByStage = useMemo(() => {
		const grouped: Record<string, Lead[]> = {};
		for (const stage of stages) {
			grouped[stage.id] = currentLeads.filter((l) => l.stage === stage.id);
		}
		return grouped;
	}, [currentLeads]);

	// Register column element for hit detection
	const registerColumn = useCallback((stageId: string, element: HTMLDivElement | null) => {
		if (element) {
			columnRefs.current.set(stageId, element);
		} else {
			columnRefs.current.delete(stageId);
		}
	}, []);

	// Handle reorder within the same column
	const handleReorder = useCallback(
		(stageId: string, newOrder: Lead[]) => {
			setLocalLeads((prev) => {
				const current = prev ?? leads;
				const otherLeads = current.filter((l) => l.stage !== stageId);
				return [...otherLeads, ...newOrder];
			});
		},
		[leads],
	);

	// Handle drag to a different column
	const handleDragToColumn = useCallback(
		(leadId: string, newStage: string) => {
			// Reset local state to let props take over
			setLocalLeads(null);
			// Notify parent of stage change
			onDragEnd(leadId, newStage);
		},
		[onDragEnd],
	);

	// Sync local leads with props when props change
	useEffect(() => {
		setLocalLeads(null);
	}, []);

	return (
		<LayoutGroup>
			<div className="flex h-full snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4">
				{stages.map((stage) => (
					<KanbanColumn
						columnRefs={columnRefs}
						headerAction={stage.id === 'novo' ? <LeadForm /> : null}
						key={stage.id}
						leads={leadsByStage[stage.id] || []}
						onDragToColumn={handleDragToColumn}
						onLeadClick={onLeadClick}
						onReorder={handleReorder}
						registerColumn={registerColumn}
						stage={stage}
					/>
				))}
			</div>
		</LayoutGroup>
	);
}

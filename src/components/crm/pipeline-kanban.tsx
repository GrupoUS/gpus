import { AnimatePresence, LayoutGroup, motion, Reorder } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';

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
			value={lead}
			id={lead._id}
			layoutId={lead._id}
			layout="position"
			drag
			dragElastic={0.1}
			dragTransition={dragTransition}
			onDragStart={() => setIsDragging(true)}
			onDragEnd={handleDragEnd}
			initial="initial"
			animate="animate"
			exit="exit"
			whileDrag={{
				scale: 1.05,
				boxShadow: '0 25px 50px -12px hsl(var(--primary) / 0.4)',
				zIndex: 50,
				cursor: 'grabbing',
			}}
			variants={cardVariants}
			transition={layoutTransition}
			className="relative rounded-lg touch-none will-change-transform"
		>
			<div
				role="button"
				tabIndex={0}
				onClick={(event) => {
					if (event.target instanceof HTMLElement && event.target.closest('button')) {
						return;
					}
					if (!isDragging) {
						onLeadClick?.(lead._id);
					}
				}}
				onKeyDown={(event) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						if (!isDragging) {
							onLeadClick?.(lead._id);
						}
					}
				}}
				className="w-full text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
			>
				<LeadCard lead={lead} />
			</div>
			{lead.phone && (
				<motion.button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						if (lead.phone) {
							window.open(`https://wa.me/${lead.phone}`, '_blank');
						}
					}}
					className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-xs font-medium cursor-pointer"
					onPointerDown={(e) => e.stopPropagation()}
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
			ref={(el) => registerColumn(stage.id, el)}
			className="shrink-0 w-[300px] snap-start"
			layout
			transition={SPRING_SMOOTH}
		>
			<Card
				variant="glass"
				className="h-[calc(100vh-200px)] min-h-[400px] flex flex-col kanban-column"
			>
				<CardHeader className="pb-3 shrink-0 kanban-column-header">
					<div className="flex items-center justify-between">
						<CardTitle className="text-sm font-medium flex items-center gap-2 font-display">
							<motion.div
								className={`h-2 w-2 rounded-full ${stage.color}`}
								layoutId={`stage-dot-${stage.id}`}
							/>
							{stage.label}
						</CardTitle>
						<Badge variant="secondary" className="font-display tabular-nums">
							<motion.span
								key={leads.length}
								initial={{ scale: 1.2 }}
								animate={{ scale: 1 }}
								transition={SPRING_SMOOTH}
							>
								{leads.length}
							</motion.span>
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="flex-1 min-h-0 flex flex-col">
					{headerAction}
					<ScrollArea className="h-full">
						<Reorder.Group
							axis="y"
							values={leads}
							onReorder={(newOrder) => onReorder(stage.id, newOrder)}
							layoutScroll
							className="space-y-3 pr-4 pb-4"
						>
							<AnimatePresence mode="popLayout" initial={false}>
								{leads.map((lead) => (
									<DraggableLeadCard
										key={lead._id}
										lead={lead}
										onLeadClick={onLeadClick}
										onDragToColumn={onDragToColumn}
										columnRefs={columnRefs}
									/>
								))}
							</AnimatePresence>
							{leads.length === 0 && (
								<motion.div
									className="h-20 border-2 border-dashed border-muted rounded-lg flex items-center justify-center text-muted-foreground text-xs"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
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
	useMemo(() => {
		setLocalLeads(null);
	}, []);

	return (
		<LayoutGroup>
			<div className="flex gap-4 overflow-x-auto pb-4 h-full snap-x snap-mandatory scroll-smooth">
				{stages.map((stage) => (
					<KanbanColumn
						key={stage.id}
						stage={stage}
						leads={leadsByStage[stage.id] || []}
						onLeadClick={onLeadClick}
						onReorder={handleReorder}
						onDragToColumn={handleDragToColumn}
						columnRefs={columnRefs}
						registerColumn={registerColumn}
						headerAction={stage.id === 'novo' ? <LeadForm /> : null}
					/>
				))}
			</div>
		</LayoutGroup>
	);
}

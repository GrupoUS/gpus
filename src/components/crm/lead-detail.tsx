import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, Briefcase, Clock, Layers, Mail, MessageSquare, Phone, Send } from 'lucide-react';
import { useState } from 'react';

import { ObjectionsTab } from './objections-tab';
import { ReferralSection } from './referral-section';
import { TagSection } from './tag-section';
import { TasksTab } from './tasks-tab';
import { WhatsAppDialog } from './whatsapp-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LeadDetailProps {
	leadId: Id<'leads'> | null;
	onClose: () => void;
}

interface TasksResult {
	page?: Array<{ completed?: boolean }>;
}

const useQueryUnsafe = useQuery as unknown as (query: unknown, args?: unknown) => unknown;

const apiAny = api as unknown as Record<string, Record<string, unknown>>;

function formatCustomFieldValue(value: unknown) {
	if (Array.isArray(value)) {
		return value.join(', ');
	}

	if (typeof value === 'boolean') {
		return value ? 'Sim' : 'Não';
	}

	return String(value);
}

export function LeadDetail({ leadId, onClose }: LeadDetailProps) {
	const lead = useQueryUnsafe(apiAny.leads.getLead, leadId ? { leadId } : 'skip') as
		| Doc<'leads'>
		| null
		| undefined;
	const activities = useQueryUnsafe(apiAny.activities.listByLead, leadId ? { leadId } : 'skip') as
		| Doc<'activities'>[]
		| undefined;
	const tasksResult = useQueryUnsafe(
		apiAny.tasks.listTasks,
		leadId ? { leadId, paginationOpts: { numItems: 50, cursor: null } } : 'skip',
	) as TasksResult | undefined;
	const pendingTasksCount = tasksResult?.page?.filter((task) => !task.completed).length ?? 0;

	const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);

	const isOpen = !!leadId;

	return (
		<Sheet onOpenChange={(open) => !open && onClose()} open={isOpen}>
			<SheetContent
				className="flex w-full flex-col overflow-hidden border-border/50 border-l bg-background/95 p-0 backdrop-blur-xl sm:max-w-2xl"
				side="right"
				transition={{ type: 'spring', stiffness: 150, damping: 22 }}
			>
				{/* Accessibility requirements */}
				<SheetHeader className="sr-only">
					<SheetTitle>Detalhes do Lead</SheetTitle>
					<SheetDescription>
						Visualize as informações, histórico e atividades deste lead no funil de vendas.
					</SheetDescription>
				</SheetHeader>

				{lead ? (
					<>
						{/* Header */}
						<div className="border-border/50 border-b bg-muted/20 p-6">
							<div className="mb-4 flex items-start justify-between">
								<div>
									<h2 className="font-bold font-display text-2xl text-foreground tracking-tight">
										{lead.name}
									</h2>
									<div className="mt-1 flex items-center gap-2 text-muted-foreground text-sm">
										<Badge
											className="border-primary/50 bg-primary/10 text-primary"
											variant="outline"
										>
											{lead.stage.replace('_', ' ').toUpperCase()}
										</Badge>
										<span className="flex items-center gap-1">
											<Clock className="h-3 w-3" />
											Atualizado{' '}
											{formatDistanceToNow(lead.updatedAt, {
												addSuffix: true,
												locale: ptBR,
											})}
										</span>
									</div>
								</div>
							</div>

							<div className="flex gap-2">
								<Button
									className="flex-1 gap-2 border-0 bg-[#25D366] text-white hover:bg-[#128C7E]"
									onClick={() =>
										window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank')
									}
									size="sm"
								>
									<MessageSquare className="h-4 w-4" />
									WhatsApp
								</Button>
								<Button
									className="flex-1 gap-2"
									onClick={() => setWhatsappDialogOpen(true)}
									size="sm"
									variant="outline"
								>
									<Send className="h-4 w-4" />
									Msg
								</Button>
								<Button
									className="flex-1 gap-2"
									onClick={() => {
										window.location.href = `tel:${lead.phone}`;
									}}
									size="sm"
									variant="outline"
								>
									<Phone className="h-4 w-4" />
									Ligar
								</Button>
								<Button
									className="flex-1 gap-2"
									disabled={!lead.email}
									onClick={() => {
										if (!lead.email) return;
										window.location.href = `mailto:${lead.email}`;
									}}
									size="sm"
									title={lead.email ? undefined : 'Sem email cadastrado'}
									variant="outline"
								>
									<Mail className="h-4 w-4" />
									Email
								</Button>
							</div>
						</div>

						{/* Content Tabs */}
						<Tabs className="flex flex-1 flex-col overflow-hidden" defaultValue="overview">
							<div className="border-border/50 border-b bg-muted/10 px-6 pt-2">
								<TabsList className="gap-6 bg-transparent p-0">
									<TabsTrigger
										className="rounded-none px-0 pb-2 data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
										value="overview"
									>
										Visão Geral
									</TabsTrigger>
									<TabsTrigger
										className="rounded-none px-0 pb-2 data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
										value="timeline"
									>
										Timeline
									</TabsTrigger>
									<TabsTrigger
										className="rounded-none px-0 pb-2 data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
										value="tasks"
									>
										Tarefas
										{pendingTasksCount > 0 && (
											<Badge className="ml-2 h-5 min-w-5 px-1.5" variant="destructive">
												{pendingTasksCount}
											</Badge>
										)}
									</TabsTrigger>
									<TabsTrigger
										className="rounded-none px-0 pb-2 data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
										value="notes"
									>
										Notas
									</TabsTrigger>
									<TabsTrigger
										className="rounded-none px-0 pb-2 data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
										value="objections"
									>
										Objeções
									</TabsTrigger>
								</TabsList>
							</div>

							<ScrollArea className="flex-1 p-6">
								<TabsContent
									className="slide-in-from-left-2 mt-0 animate-in space-y-6 duration-300"
									value="overview"
								>
									<LeadOverview lead={lead} />
								</TabsContent>

								<TabsContent
									className="slide-in-from-right-2 mt-0 animate-in space-y-4 duration-300"
									value="timeline"
								>
									<LeadTimeline activities={activities} />
								</TabsContent>

								<TabsContent className="mt-0" value="notes">
									<div className="flex h-40 items-center justify-center rounded-lg border-2 border-border/50 border-dashed bg-muted/10 text-muted-foreground">
										Em breve: Notas e Comentários
									</div>
								</TabsContent>

								<TabsContent className="mt-0" value="tasks">
									<TasksTab leadId={lead._id} />
								</TabsContent>

								<TabsContent className="mt-0" value="objections">
									<ObjectionsTab leadId={lead._id} />
								</TabsContent>
							</ScrollArea>
						</Tabs>
					</>
				) : (
					<div className="flex h-full items-center justify-center">
						<div className="flex flex-col items-center gap-2">
							<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
							<p className="font-medium text-muted-foreground text-sm">Carregando...</p>
						</div>
					</div>
				)}
			</SheetContent>

			{lead && (
				<WhatsAppDialog
					leadId={lead._id}
					leadName={lead.name}
					leadPhone={lead.phone}
					onOpenChange={setWhatsappDialogOpen}
					open={whatsappDialogOpen}
				/>
			)}
		</Sheet>
	);
}

function LeadOverview({ lead }: { lead: Doc<'leads'> }) {
	const customFieldValues = useQuery(api.customFields.getCustomFieldValues, {
		entityId: lead._id,
		entityType: 'lead',
	});

	return (
		<>
			<section className="space-y-3">
				<h3 className="flex items-center gap-2 font-medium text-muted-foreground text-sm uppercase tracking-wider">
					<Briefcase className="h-4 w-4" /> Dados Profissionais
				</h3>
				<div className="grid grid-cols-2 gap-4 text-sm">
					<div className="rounded-lg border border-border/50 bg-card p-3">
						<span className="mb-1 block text-muted-foreground text-xs">Profissão</span>
						<span className="font-medium">{lead.profession || 'Não informado'}</span>
					</div>
					<div className="rounded-lg border border-border/50 bg-card p-3">
						<span className="mb-1 block text-muted-foreground text-xs">Clínica</span>
						<span className="font-medium">{lead.hasClinic ? lead.clinicName || 'Sim' : 'Não'}</span>
						{lead.clinicCity && (
							<span className="block text-muted-foreground text-xs">{lead.clinicCity}</span>
						)}
					</div>
					<div className="rounded-lg border border-border/50 bg-card p-3">
						<span className="mb-1 block text-muted-foreground text-xs">Experiência</span>
						<span className="font-medium">
							{lead.yearsInAesthetics ? `${lead.yearsInAesthetics} anos` : 'N/A'}
						</span>
					</div>

					<div className="rounded-lg border border-border/50 bg-card p-3">
						<span className="mb-1 block text-muted-foreground text-xs">Faturamento</span>
						<span className="font-medium">{lead.currentRevenue || 'N/A'}</span>
					</div>
				</div>
			</section>

			<section className="space-y-3">
				<h3 className="flex items-center gap-2 font-medium text-muted-foreground text-sm uppercase tracking-wider">
					<Activity className="h-4 w-4" /> Interesse
				</h3>
				<div className="space-y-3 rounded-lg border border-border/50 bg-card p-4">
					<div className="flex justify-between border-border/30 border-b pb-2">
						<span className="text-muted-foreground">Produto</span>
						<span className="font-medium text-primary">
							{lead.interestedProduct || 'Indefinido'}
						</span>
					</div>
					<div className="flex justify-between border-border/30 border-b pb-2">
						<span className="text-muted-foreground">Temperatura</span>
						<Badge variant={lead.temperature === 'quente' ? 'destructive' : 'secondary'}>
							{lead.temperature === 'quente' && '🔥 Quente'}
							{lead.temperature === 'morno' && '🌤️ Morno'}
							{lead.temperature !== 'quente' && lead.temperature !== 'morno' && '❄️ Frio'}
						</Badge>
					</div>
					<div className="space-y-1">
						<span className="text-muted-foreground text-xs">Dor Principal</span>
						<p className="text-sm">{lead.mainPain || 'Não identificada'}</p>
					</div>
					{lead.mainDesire && (
						<div className="space-y-1 border-border/30 border-t pt-2">
							<span className="text-muted-foreground text-xs">Desejo / Objetivo</span>
							<p className="text-sm">{lead.mainDesire}</p>
						</div>
					)}
				</div>
			</section>

			{customFieldValues && customFieldValues.length > 0 && (
				<section className="space-y-3">
					<h3 className="flex items-center gap-2 font-medium text-muted-foreground text-sm uppercase tracking-wider">
						<Layers className="h-4 w-4" /> Informações Adicionais
					</h3>
					<div className="grid grid-cols-2 gap-4 text-sm">
						{customFieldValues.map((cf) => (
							<div className="rounded-lg border border-border/50 bg-card p-3" key={cf._id}>
								<span className="mb-1 block text-muted-foreground text-xs">
									{cf.fieldDefinition?.name}
								</span>
								<span className="font-medium">{formatCustomFieldValue(cf.value)}</span>
							</div>
						))}
					</div>
				</section>
			)}

			<ReferralSection leadId={lead._id} />
			<TagSection leadId={lead._id} />
		</>
	);
}

function LeadTimeline({ activities }: { activities?: Doc<'activities'>[] }) {
	if (!activities) {
		return (
			<div className="space-y-4">
				{[1, 2, 3].map((i) => (
					<div className="h-16 animate-pulse rounded-lg bg-muted/20" key={i} />
				))}
			</div>
		);
	}

	if (activities.length === 0) {
		return (
			<div className="py-10 text-center text-muted-foreground">Nenhuma atividade registrada.</div>
		);
	}

	return (
		<div className="relative ml-3 space-y-6 border-border/50 border-l">
			{activities.map((activity) => (
				<div className="relative pl-6" key={activity._id}>
					<div className="absolute top-1 -left-[5px] h-2.5 w-2.5 rounded-full border-2 border-background bg-primary ring-2 ring-primary/20" />
					<div className="flex flex-col gap-1">
						<span className="text-muted-foreground text-xs">
							{formatDistanceToNow(activity.createdAt, {
								addSuffix: true,
								locale: ptBR,
							})}
						</span>
						<p className="font-medium text-sm">{activity.description}</p>
						<span className="w-fit rounded-full bg-muted px-2 py-0.5 text-muted-foreground text-xs capitalize">
							{activity.type.replace('_', ' ')}
						</span>
					</div>
				</div>
			))}
		</div>
	);
}

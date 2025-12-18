import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, Briefcase, Clock, Mail, MessageSquare, Phone } from 'lucide-react';

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

export function LeadDetail({ leadId, onClose }: LeadDetailProps) {
	const lead = useQuery(api.leads.getLead, leadId ? { leadId } : 'skip');
	const activities = useQuery(api.activities.listByLead, leadId ? { leadId } : 'skip');

	const isOpen = !!leadId;

	return (
		<Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<SheetContent
				side="right"
				transition={{ type: 'spring', stiffness: 150, damping: 22 }}
				className="w-full sm:max-w-2xl p-0 flex flex-col overflow-hidden border-l border-border/50 bg-background/95 backdrop-blur-xl"
			>
				{/* Accessibility requirements */}
				<SheetHeader className="sr-only">
					<SheetTitle>Detalhes do Lead</SheetTitle>
					<SheetDescription>
						Visualize as informações, histórico e atividades deste lead no funil de vendas.
					</SheetDescription>
				</SheetHeader>

				{!lead ? (
					<div className="flex items-center justify-center h-full">
						<div className="flex flex-col items-center gap-2">
							<div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
							<p className="text-sm text-muted-foreground font-medium">Carregando...</p>
						</div>
					</div>
				) : (
					<>
						{/* Header */}
						<div className="p-6 border-b border-border/50 bg-muted/20">
							<div className="flex items-start justify-between mb-4">
								<div>
									<h2 className="text-2xl font-bold font-display tracking-tight text-foreground">
										{lead.name}
									</h2>
									<div className="flex items-center gap-2 mt-1 text-muted-foreground text-sm">
										<Badge
											variant="outline"
											className="border-primary/50 text-primary bg-primary/10"
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
									size="sm"
									className="flex-1 gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white border-0"
									onClick={() =>
										window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank')
									}
								>
									<MessageSquare className="h-4 w-4" />
									WhatsApp
								</Button>
								<Button
									size="sm"
									variant="outline"
									className="flex-1 gap-2"
									onClick={() => {
										window.location.href = `tel:${lead.phone}`;
									}}
								>
									<Phone className="h-4 w-4" />
									Ligar
								</Button>
								<Button
									size="sm"
									variant="outline"
									className="flex-1 gap-2"
									disabled={!lead.email}
									onClick={() => {
										if (!lead.email) return;
										window.location.href = `mailto:${lead.email}`;
									}}
									title={!lead.email ? 'Sem email cadastrado' : undefined}
								>
									<Mail className="h-4 w-4" />
									Email
								</Button>
							</div>
						</div>

						{/* Content Tabs */}
						<Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
							<div className="px-6 pt-2 border-b border-border/50 bg-muted/10">
								<TabsList className="bg-transparent p-0 gap-6">
									<TabsTrigger
										value="overview"
										className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2"
									>
										Visão Geral
									</TabsTrigger>
									<TabsTrigger
										value="timeline"
										className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2"
									>
										Timeline
									</TabsTrigger>
									<TabsTrigger
										value="notes"
										className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2"
									>
										Notas
									</TabsTrigger>
								</TabsList>
							</div>

							<ScrollArea className="flex-1 p-6">
								<TabsContent
									value="overview"
									className="mt-0 space-y-6 animate-in slide-in-from-left-2 duration-300"
								>
									<LeadOverview lead={lead} />
								</TabsContent>

								<TabsContent
									value="timeline"
									className="mt-0 space-y-4 animate-in slide-in-from-right-2 duration-300"
								>
									<LeadTimeline activities={activities} />
								</TabsContent>

								<TabsContent value="notes" className="mt-0">
									<div className="flex items-center justify-center h-40 text-muted-foreground border-2 border-dashed border-border/50 rounded-lg bg-muted/10">
										Em breve: Notas e Comentários
									</div>
								</TabsContent>
							</ScrollArea>
						</Tabs>
					</>
				)}
			</SheetContent>
		</Sheet>
	);
}

function LeadOverview({ lead }: { lead: Doc<'leads'> }) {
	return (
		<>
			<section className="space-y-3">
				<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
					<Briefcase className="h-4 w-4" /> Dados Profissionais
				</h3>
				<div className="grid grid-cols-2 gap-4 text-sm">
					<div className="p-3 rounded-lg bg-card border border-border/50">
						<span className="text-muted-foreground block text-xs mb-1">Profissão</span>
						<span className="font-medium">{lead.profession || 'Não informado'}</span>
					</div>
					<div className="p-3 rounded-lg bg-card border border-border/50">
						<span className="text-muted-foreground block text-xs mb-1">Clínica</span>
						<span className="font-medium">{lead.hasClinic ? lead.clinicName || 'Sim' : 'Não'}</span>
						{lead.clinicCity && (
							<span className="text-xs text-muted-foreground block">{lead.clinicCity}</span>
						)}
					</div>
					<div className="p-3 rounded-lg bg-card border border-border/50">
						<span className="text-muted-foreground block text-xs mb-1">Experiência</span>
						<span className="font-medium">
							{lead.yearsInAesthetics ? `${lead.yearsInAesthetics} anos` : 'N/A'}
						</span>
					</div>
					<div className="p-3 rounded-lg bg-card border border-border/50">
						<span className="text-muted-foreground block text-xs mb-1">Faturamento</span>
						<span className="font-medium">{lead.currentRevenue || 'N/A'}</span>
					</div>
				</div>
			</section>

			<section className="space-y-3">
				<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
					<Activity className="h-4 w-4" /> Interesse
				</h3>
				<div className="p-4 rounded-lg bg-card border border-border/50 space-y-3">
					<div className="flex justify-between border-b border-border/30 pb-2">
						<span className="text-muted-foreground">Produto</span>
						<span className="font-medium text-primary">
							{lead.interestedProduct || 'Indefinido'}
						</span>
					</div>
					<div className="flex justify-between border-b border-border/30 pb-2">
						<span className="text-muted-foreground">Temperatura</span>
						<Badge
							variant={
								lead.temperature === 'quente'
									? 'destructive'
									: lead.temperature === 'morno'
										? 'secondary'
										: 'secondary'
							}
						>
							{lead.temperature === 'quente'
								? '🔥 Quente'
								: lead.temperature === 'morno'
									? '🌤️ Morno'
									: '❄️ Frio'}
						</Badge>
					</div>
					<div className="space-y-1">
						<span className="text-muted-foreground text-xs">Dor Principal</span>
						<p className="text-sm">{lead.mainPain || 'Não identificada'}</p>
					</div>
					{lead.mainDesire && (
						<div className="space-y-1 pt-2 border-t border-border/30">
							<span className="text-muted-foreground text-xs">Desejo / Objetivo</span>
							<p className="text-sm">{lead.mainDesire}</p>
						</div>
					)}
				</div>
			</section>
		</>
	);
}

function LeadTimeline({ activities }: { activities?: Doc<'activities'>[] }) {
	if (!activities) {
		return (
			<div className="space-y-4">
				{[1, 2, 3].map((i) => (
					<div key={i} className="h-16 bg-muted/20 animate-pulse rounded-lg" />
				))}
			</div>
		);
	}

	if (activities.length === 0) {
		return (
			<div className="text-center py-10 text-muted-foreground">Nenhuma atividade registrada.</div>
		);
	}

	return (
		<div className="relative border-l border-border/50 ml-3 space-y-6">
			{activities.map((activity) => (
				<div key={activity._id} className="relative pl-6">
					<div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background ring-2 ring-primary/20" />
					<div className="flex flex-col gap-1">
						<span className="text-xs text-muted-foreground">
							{formatDistanceToNow(activity.createdAt, {
								addSuffix: true,
								locale: ptBR,
							})}
						</span>
						<p className="text-sm font-medium">{activity.description}</p>
						<span className="text-xs px-2 py-0.5 rounded-full bg-muted w-fit text-muted-foreground capitalize">
							{activity.type.replace('_', ' ')}
						</span>
					</div>
				</div>
			))}
		</div>
	);
}

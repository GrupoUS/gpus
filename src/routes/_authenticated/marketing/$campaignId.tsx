import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { createFileRoute } from '@tanstack/react-router';
import { useAction, useMutation, useQuery } from 'convex/react';
import DOMPurify from 'dompurify';
import {
	ArrowLeft,
	CalendarDays,
	CheckCircle,
	Clock,
	Edit,
	ExternalLink,
	Eye,
	ListChecks,
	Loader2,
	Mail,
	MousePointerClick,
	Pencil,
	Send,
	Sparkles,
	Trash2,
	TrendingUp,
	Users,
	XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/_authenticated/marketing/$campaignId')({
	component: CampaignDetailPage,
});

// Types
type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

// Status badge configuration
const statusConfig: Record<
	CampaignStatus,
	{
		label: string;
		variant: 'secondary' | 'outline' | 'default' | 'destructive';
		icon: typeof Pencil;
	}
> = {
	draft: { label: 'Rascunho', variant: 'secondary', icon: Pencil },
	scheduled: { label: 'Agendada', variant: 'outline', icon: Clock },
	sending: { label: 'Enviando', variant: 'default', icon: Loader2 },
	sent: { label: 'Enviada', variant: 'default', icon: CheckCircle },
	failed: { label: 'Falhou', variant: 'destructive', icon: XCircle },
};

// Format date/time
function formatDateTime(timestamp: number | undefined): string {
	if (!timestamp) return '-';
	return new Intl.DateTimeFormat('pt-BR', {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(new Date(timestamp));
}

// Format percentage
function formatPercentage(value: number | undefined, total: number | undefined): string {
	if (!(value && total) || total === 0) return '0%';
	return `${((value / total) * 100).toFixed(1)}%`;
}

// ============================================================================
// Sub-components (extracted to reduce complexity)
// ============================================================================

type LoadingSkeletonProps = Record<string, never>;

function LoadingSkeleton(_props: LoadingSkeletonProps) {
	return (
		<div className="space-y-6">
			<Skeleton className="h-10 w-48" />
			<div className="grid gap-6 lg:grid-cols-3">
				<div className="space-y-6 lg:col-span-2">
					<Skeleton className="h-64" />
					<Skeleton className="h-48" />
				</div>
				<div className="space-y-6">
					<Skeleton className="h-48" />
					<Skeleton className="h-32" />
				</div>
			</div>
		</div>
	);
}

interface CampaignNotFoundProps {
	onBack: () => void;
}

function CampaignNotFound({ onBack }: CampaignNotFoundProps) {
	return (
		<div className="space-y-6">
			<Button onClick={onBack} variant="ghost">
				<ArrowLeft className="mr-2 h-4 w-4" />
				Voltar para campanhas
			</Button>
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-12">
					<XCircle className="mb-4 h-12 w-12 text-muted-foreground" />
					<h2 className="font-semibold text-lg">Campanha não encontrada</h2>
					<p className="mt-2 text-muted-foreground text-sm">
						A campanha que você procura não existe ou foi removida.
					</p>
					<Button className="mt-6" onClick={onBack}>
						Voltar para campanhas
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}

interface CampaignStatsProps {
	stats: {
		sent?: number;
		delivered?: number;
		opened?: number;
		clicked?: number;
		bounced?: number;
	};
}

function CampaignStats({ stats }: CampaignStatsProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<TrendingUp className="h-5 w-5" />
					Estatísticas da Campanha
				</CardTitle>
				<CardDescription>Métricas de desempenho após o envio</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
					<div className="rounded-lg border p-4 text-center">
						<div className="flex items-center justify-center gap-2 text-muted-foreground">
							<Send className="h-4 w-4" />
							<span className="text-sm">Enviados</span>
						</div>
						<p className="mt-2 font-bold text-2xl">{stats.sent ?? 0}</p>
					</div>
					<div className="rounded-lg border p-4 text-center">
						<div className="flex items-center justify-center gap-2 text-muted-foreground">
							<CheckCircle className="h-4 w-4" />
							<span className="text-sm">Entregues</span>
						</div>
						<p className="mt-2 font-bold text-2xl">{stats.delivered ?? 0}</p>
						<p className="text-muted-foreground text-xs">
							{formatPercentage(stats.delivered, stats.sent)}
						</p>
					</div>
					<div className="rounded-lg border p-4 text-center">
						<div className="flex items-center justify-center gap-2 text-muted-foreground">
							<Eye className="h-4 w-4" />
							<span className="text-sm">Abertos</span>
						</div>
						<p className="mt-2 font-bold text-2xl">{stats.opened ?? 0}</p>
						<p className="text-muted-foreground text-xs">
							{formatPercentage(stats.opened, stats.delivered)}
						</p>
					</div>
					<div className="rounded-lg border p-4 text-center">
						<div className="flex items-center justify-center gap-2 text-muted-foreground">
							<MousePointerClick className="h-4 w-4" />
							<span className="text-sm">Cliques</span>
						</div>
						<p className="mt-2 font-bold text-2xl">{stats.clicked ?? 0}</p>
						<p className="text-muted-foreground text-xs">
							{formatPercentage(stats.clicked, stats.opened)}
						</p>
					</div>
					<div className="rounded-lg border p-4 text-center">
						<div className="flex items-center justify-center gap-2 text-muted-foreground">
							<XCircle className="h-4 w-4" />
							<span className="text-sm">Bounces</span>
						</div>
						<p className="mt-2 font-bold text-2xl">{stats.bounced ?? 0}</p>
						<p className="text-muted-foreground text-xs">
							{formatPercentage(stats.bounced, stats.sent)}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

interface CampaignContentPreviewProps {
	templateId?: string;
	htmlContent?: string;
}

function CampaignContentPreview({ templateId, htmlContent }: CampaignContentPreviewProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Sparkles className="h-5 w-5" />
					Conteúdo
				</CardTitle>
				<CardDescription>Prévia do conteúdo da campanha</CardDescription>
			</CardHeader>
			<CardContent>
				{templateId ? (
					<div className="rounded-lg border border-dashed p-6 text-center">
						<Sparkles className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
						<p className="font-medium">Template vinculado</p>
						<p className="mt-1 text-muted-foreground text-sm">
							Esta campanha usa um template. O conteúdo será carregado do template no momento do
							envio.
						</p>
					</div>
				) : htmlContent ? (
					<div className="space-y-4">
						<div className="rounded-lg border bg-muted/50 p-4">
							<p className="mb-2 font-medium text-muted-foreground text-xs">PRÉVIA DO HTML:</p>
							<div
								className="prose prose-sm dark:prose-invert max-w-none"
								// biome-ignore lint/security/noDangerouslySetInnerHtml: Sanitized with DOMPurify
								dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }}
							/>
						</div>
						<details className="group">
							<summary className="cursor-pointer text-muted-foreground text-sm hover:text-foreground">
								Ver código fonte
							</summary>
							<pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted p-4 text-xs">
								<code>{htmlContent}</code>
							</pre>
						</details>
					</div>
				) : (
					<div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
						<Mail className="mx-auto mb-2 h-8 w-8" />
						<p>Nenhum conteúdo definido</p>
						<p className="mt-1 text-sm">
							Adicione conteúdo HTML ou selecione um template para esta campanha.
						</p>
					</div>
				)}{' '}
			</CardContent>
		</Card>
	);
}

interface TargetListsCardProps {
	listNames: string[];
}

function TargetListsCard({ listNames }: TargetListsCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<ListChecks className="h-5 w-5" />
					Listas Destinatárias
				</CardTitle>
				<CardDescription>Listas que receberão esta campanha</CardDescription>
			</CardHeader>
			<CardContent>
				{listNames.length > 0 ? (
					<div className="space-y-2">
						{listNames.map((name, index) => (
							<div
								className="flex items-center gap-2 rounded-md border p-2"
								key={`${name}-${index}`}
							>
								<Users className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm">{name}</span>
							</div>
						))}
						<Separator className="my-3" />
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">Total de listas</span>
							<Badge variant="secondary">{listNames.length}</Badge>
						</div>
					</div>
				) : (
					<div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
						<Users className="mx-auto mb-2 h-6 w-6" />
						<p className="text-sm">Nenhuma lista selecionada</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

interface ActionsCardProps {
	isDraft: boolean;
	isSending: boolean;
	isDeleting: boolean;
	campaignName: string;
	campaignStatus: string;
	onEdit: () => void;
	onSend: () => void;
	onDelete: () => void;
	onBack: () => void;
}

function ActionsCard({
	isDraft,
	isSending,
	isDeleting,
	campaignName,
	campaignStatus,
	onEdit,
	onSend,
	onDelete,
	onBack,
}: ActionsCardProps) {
	let statusMessage: string;
	if (campaignStatus === 'sent') {
		statusMessage = 'Esta campanha já foi enviada e não pode ser modificada.';
	} else if (campaignStatus === 'sending') {
		statusMessage = 'Esta campanha está sendo enviada.';
	} else if (campaignStatus === 'scheduled') {
		statusMessage = 'Esta campanha está agendada para envio.';
	} else {
		statusMessage = 'Esta campanha falhou no envio.';
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Ações</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{isDraft ? (
					<>
						<Button className="w-full" onClick={onEdit} variant="outline">
							<Edit className="mr-2 h-4 w-4" />
							Editar Campanha
						</Button>
						<Button className="w-full" disabled={isSending} onClick={onSend}>
							{isSending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Enviando...
								</>
							) : (
								<>
									<Send className="mr-2 h-4 w-4" />
									Enviar Agora
								</>
							)}
						</Button>
						<Separator />
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button className="w-full" disabled={isDeleting} variant="destructive">
									{isDeleting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Excluindo...
										</>
									) : (
										<>
											<Trash2 className="mr-2 h-4 w-4" />
											Excluir Campanha
										</>
									)}
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
									<AlertDialogDescription>
										Você está prestes a excluir a campanha "{campaignName}". Esta ação não pode ser
										desfeita.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancelar</AlertDialogCancel>
									<AlertDialogAction
										className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
										onClick={onDelete}
									>
										Excluir
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</>
				) : (
					<div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
						<p className="text-sm">{statusMessage}</p>
					</div>
				)}

				<Button className="w-full" onClick={onBack} variant="outline">
					<ArrowLeft className="mr-2 h-4 w-4" />
					Voltar para Campanhas
				</Button>
			</CardContent>
		</Card>
	);
}

// --- Event Logs Component ---

interface EventLogsProps {
	campaignId: Id<'emailCampaigns'>;
}

function EventLogs({ campaignId }: EventLogsProps) {
	// Type workaround for deep instantiation issue
	const getCampaignEventsQuery = (api as any).emailMarketing.getCampaignEvents;
	const events = useQuery(getCampaignEventsQuery, {
		campaignId,
		limit: 20,
	}) as
		| Array<{
				_id: string;
				eventType: string;
				email: string;
				timestamp: number;
				link?: string;
		  }>
		| undefined;

	if (events === undefined) {
		return <Skeleton className="h-[200px] w-full" />;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<ListChecks className="h-5 w-5" />
					Logs de Eventos Recentes
				</CardTitle>
				<CardDescription>Últimas atividades registradas para esta campanha</CardDescription>
			</CardHeader>
			<CardContent>
				{events.length > 0 ? (
					<div className="space-y-4">
						{events.map((event) => (
							<div
								className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
								key={event._id}
							>
								<div className="flex items-center gap-3">
									<Badge
										className={(() => {
											if (event.eventType === 'delivered') return 'border-green-500 text-green-500';
											if (event.eventType === 'opened') return 'border-blue-500 text-blue-500';
											if (event.eventType === 'clicked') return 'border-yellow-500 text-yellow-500';
											if (event.eventType === 'bounced' || event.eventType === 'spam')
												return 'border-red-500 text-red-500';
											return 'border-gray-500 text-gray-500';
										})()}
										variant="outline"
									>
										{event.eventType}
									</Badge>
									<div className="flex flex-col">
										<span className="font-medium text-sm">{event.email}</span>
										<span className="text-muted-foreground text-xs">
											{formatDateTime(event.timestamp)}
										</span>
									</div>
								</div>
								{event.link && (
									<a
										className="text-blue-500 text-xs hover:underline"
										href={event.link}
										rel="noreferrer"
										target="_blank"
									>
										Link clicado
									</a>
								)}
							</div>
						))}
					</div>
				) : (
					<div className="py-8 text-center text-muted-foreground">
						<p>Nenhum evento registrado ainda.</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

// --- Main Component ---

function CampaignDetailPage() {
	const { campaignId } = Route.useParams();
	const navigate = Route.useNavigate();

	const [isSending, setIsSending] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	// Convex queries
	const campaign = useQuery(api.emailMarketing.getCampaign, {
		campaignId: campaignId as Id<'emailCampaigns'>,
	});
	const lists = useQuery(api.emailMarketing.getLists, { activeOnly: false });

	// Convex mutations/actions
	const deleteCampaign = useMutation(api.emailMarketing.deleteCampaign);
	const sendCampaign = useAction(api.emailMarketing.sendCampaign);

	// Get list names for display
	const getListNames = (): string[] => {
		if (!(campaign?.listIds && lists)) return [];
		return campaign.listIds
			.map(
				(listId: Id<'emailLists'>) => lists.find((l: Doc<'emailLists'>) => l._id === listId)?.name,
			)
			.filter((name: string | undefined): name is string => !!name);
	};

	// Navigation back to list
	const handleBack = () => {
		navigate({
			to: '/marketing',
			search: { search: '', status: 'all', view: 'grid', page: 1 },
		});
	};

	// Edit campaign (navigate to edit route - for now, we'll go to nova with params)
	const handleEdit = () => {
		// TODO: Implement edit route. For now, show toast
		toast.info('Edição de campanha', {
			description: 'Funcionalidade de edição será implementada em breve.',
		});
	};

	// Send campaign
	const handleSend = async () => {
		if (!campaign) return;

		setIsSending(true);
		try {
			await sendCampaign({ campaignId: campaign._id });
			toast.success('Campanha enviada!', {
				description: 'Sua campanha foi enviada com sucesso.',
			});
		} catch (error) {
			toast.error('Erro ao enviar campanha', {
				description:
					error instanceof Error ? error.message : 'Ocorreu um erro inesperado. Tente novamente.',
			});
		} finally {
			setIsSending(false);
		}
	};

	// Delete campaign
	const handleDelete = async () => {
		if (!campaign) return;

		setIsDeleting(true);
		try {
			await deleteCampaign({ campaignId: campaign._id });
			toast.success('Campanha excluída', {
				description: 'A campanha foi excluída com sucesso.',
			});
			handleBack();
		} catch (error) {
			toast.error('Erro ao excluir campanha', {
				description:
					error instanceof Error ? error.message : 'Ocorreu um erro inesperado. Tente novamente.',
			});
		} finally {
			setIsDeleting(false);
		}
	};

	// Loading state
	if (campaign === undefined) {
		return <LoadingSkeleton />;
	}

	// Campaign not found
	if (campaign === null) {
		return <CampaignNotFound onBack={handleBack} />;
	}

	const status =
		campaign.status in statusConfig
			? statusConfig[campaign.status as CampaignStatus]
			: statusConfig.draft;
	const StatusIcon = status.icon;
	const isDraft = campaign.status === 'draft';
	const isSent = campaign.status === 'sent';
	const listNames = getListNames();

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-4">
					<Button onClick={handleBack} size="icon" variant="ghost">
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div>
						<div className="flex items-center gap-3">
							<h1 className="font-bold text-2xl tracking-tight">{campaign.name}</h1>
							<Badge className="flex items-center gap-1" variant={status.variant}>
								<StatusIcon
									className={`h-3 w-3 ${campaign.status === 'sending' ? 'animate-spin' : ''}`}
								/>
								{status.label}
							</Badge>
						</div>
						<p className="text-muted-foreground">{campaign.subject}</p>
					</div>
				</div>

				{/* Action buttons */}
				{isDraft && (
					<div className="flex gap-2">
						<Button onClick={handleEdit} variant="outline">
							<Edit className="mr-2 h-4 w-4" />
							Editar
						</Button>
						<Button disabled={isSending} onClick={handleSend}>
							{isSending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Enviando...
								</>
							) : (
								<>
									<Send className="mr-2 h-4 w-4" />
									Enviar Campanha
								</>
							)}
						</Button>
					</div>
				)}
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Main Content */}
				<div className="space-y-6 lg:col-span-2">
					{/* Campaign Stats (only for sent campaigns) */}
					{isSent && campaign.stats && <CampaignStats stats={campaign.stats} />}

					{/* Campaign Info */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Mail className="h-5 w-5" />
								Informações da Campanha
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<p className="font-medium text-muted-foreground text-sm">Assunto</p>
									<p className="mt-1">{campaign.subject}</p>
								</div>
								<div>
									<p className="font-medium text-muted-foreground text-sm">Status</p>
									<Badge className="mt-1 flex w-fit items-center gap-1" variant={status.variant}>
										<StatusIcon
											className={`h-3 w-3 ${campaign.status === 'sending' ? 'animate-spin' : ''}`}
										/>
										{status.label}
									</Badge>
								</div>
							</div>

							<Separator />

							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<p className="font-medium text-muted-foreground text-sm">Criada em</p>
									<p className="mt-1 flex items-center gap-2">
										<CalendarDays className="h-4 w-4 text-muted-foreground" />
										{formatDateTime(campaign._creationTime)}
									</p>
								</div>
								<div>
									<p className="font-medium text-muted-foreground text-sm">Atualizada em</p>
									<p className="mt-1 flex items-center gap-2">
										<Clock className="h-4 w-4 text-muted-foreground" />
										{formatDateTime(campaign._creationTime)}
									</p>
								</div>
							</div>

							{campaign.sentAt && (
								<>
									<Separator />
									<div>
										<p className="font-medium text-muted-foreground text-sm">Enviada em</p>
										<p className="mt-1 flex items-center gap-2">
											<Send className="h-4 w-4 text-muted-foreground" />
											{formatDateTime(campaign.sentAt)}
										</p>
									</div>
								</>
							)}

							{campaign.scheduledAt && (
								<>
									<Separator />
									<div>
										<p className="font-medium text-muted-foreground text-sm">Agendada para</p>
										<p className="mt-1 flex items-center gap-2">
											<Clock className="h-4 w-4 text-muted-foreground" />
											{formatDateTime(campaign.scheduledAt)}
										</p>
									</div>
								</>
							)}

							{campaign.brevoCampaignId && (
								<>
									<Separator />
									<div>
										<p className="font-medium text-muted-foreground text-sm">ID Brevo</p>
										<p className="mt-1 flex items-center gap-2">
											<ExternalLink className="h-4 w-4 text-muted-foreground" />
											<code className="rounded bg-muted px-2 py-0.5 text-sm">
												{campaign.brevoCampaignId}
											</code>
										</p>
									</div>
								</>
							)}
						</CardContent>
					</Card>

					{/* Content Preview */}
					<CampaignContentPreview
						htmlContent={campaign.htmlContent}
						templateId={campaign.templateId}
					/>

					{/* Event Logs */}
					{isSent && <EventLogs campaignId={campaign._id} />}
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					{/* Target Lists */}
					<TargetListsCard listNames={listNames} />

					{/* Actions Card */}
					<ActionsCard
						campaignName={campaign.name}
						campaignStatus={campaign.status}
						isDeleting={isDeleting}
						isDraft={isDraft}
						isSending={isSending}
						onBack={handleBack}
						onDelete={handleDelete}
						onEdit={handleEdit}
						onSend={handleSend}
					/>

					{/* Info Card */}
					{isDraft && (
						<Card className="border-primary/20 bg-primary/5">
							<CardContent className="pt-6">
								<p className="text-muted-foreground text-sm">
									<strong>Dica:</strong> Revise o conteúdo e as listas de destinatários antes de
									enviar. Após o envio, a campanha não poderá ser editada.
								</p>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}

'use client';

import type { Doc } from '@convex/_generated/dataModel';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Eye, Mail, MousePointerClick, Send, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CampaignCardProps {
	campaign: Doc<'emailCampaigns'>;
	onClick?: () => void;
}

const statusLabels: Record<string, string> = {
	draft: 'Rascunho',
	scheduled: 'Agendada',
	sending: 'Enviando',
	sent: 'Enviada',
	failed: 'Falhou',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
	draft: 'secondary',
	scheduled: 'outline',
	sending: 'default',
	sent: 'default',
	failed: 'destructive',
};

export function CampaignCard({ campaign, onClick }: CampaignCardProps) {
	const openRate =
		campaign.stats && campaign.stats.delivered > 0
			? (campaign.stats.opened / campaign.stats.delivered) * 100
			: 0;

	const clickRate =
		campaign.stats && campaign.stats.opened > 0
			? (campaign.stats.clicked / campaign.stats.opened) * 100
			: 0;

	return (
		<Card
			className={cn(
				'cursor-pointer transition-all hover:shadow-md',
				onClick && 'hover:border-primary/50',
			)}
			onClick={onClick}
		>
			<CardHeader className="pb-2">
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary/70">
							<Mail className="h-5 w-5 text-white" />
						</div>
						<div className="min-w-0 flex-1">
							<h3 className="truncate font-semibold text-sm">{campaign.name}</h3>
							<p className="truncate text-muted-foreground text-xs">{campaign.subject}</p>
						</div>
					</div>
					<Badge variant={statusVariants[campaign.status]}>{statusLabels[campaign.status]}</Badge>
				</div>
			</CardHeader>

			<CardContent className="space-y-3">
				{/* Stats - only show if campaign has been sent */}
				{campaign.stats && campaign.status === 'sent' && (
					<div className="grid grid-cols-3 gap-2 text-center">
						<div className="flex flex-col items-center gap-1">
							<Users className="h-4 w-4 text-muted-foreground" />
							<span className="font-medium text-sm">{campaign.stats.delivered}</span>
							<span className="text-muted-foreground text-xs">Entregues</span>
						</div>
						<div className="flex flex-col items-center gap-1">
							<Eye className="h-4 w-4 text-primary" />
							<span className="font-medium text-primary text-sm">{openRate.toFixed(1)}%</span>
							<span className="text-muted-foreground text-xs">Abertos</span>
						</div>
						<div className="flex flex-col items-center gap-1">
							<MousePointerClick className="h-4 w-4 text-green-500" />
							<span className="font-medium text-green-600 text-sm">{clickRate.toFixed(1)}%</span>
							<span className="text-muted-foreground text-xs">Cliques</span>
						</div>
					</div>
				)}

				{/* Footer */}
				<div className="flex items-center justify-between border-t pt-2">
					<div className="flex items-center gap-2 text-muted-foreground text-xs">
						{campaign.status === 'sent' && campaign.sentAt ? (
							<>
								<Send className="h-3 w-3" />
								<span>Enviada {formatDistanceToNow(campaign.sentAt, { locale: ptBR })} atrás</span>
							</>
						) : campaign.status === 'scheduled' && campaign.scheduledAt ? (
							<>
								<Calendar className="h-3 w-3" />
								<span>
									Agendada para {formatDistanceToNow(campaign.scheduledAt, { locale: ptBR })}
								</span>
							</>
						) : (
							<>
								<Calendar className="h-3 w-3" />
								<span>
									Criada {formatDistanceToNow(campaign._creationTime, { locale: ptBR })} atrás
								</span>
							</>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

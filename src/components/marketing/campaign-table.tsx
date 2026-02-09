'use client';

import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronDown, ChevronRight, ChevronUp, Mail } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { EmailCampaign } from '@/types/api';

interface CampaignTableProps {
	campaigns: EmailCampaign[];
	onCampaignClick: (campaignId: number) => void;
}

type SortField = 'name' | 'status' | 'openRate' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface SortState {
	field: SortField;
	direction: SortDirection;
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

function getOpenRate(campaign: EmailCampaign): number {
	if (!campaign.stats || campaign.stats.delivered === 0) return 0;
	return (campaign.stats.opened / campaign.stats.delivered) * 100;
}

export function CampaignTable({ campaigns, onCampaignClick }: CampaignTableProps) {
	const [sort, setSort] = useState<SortState>({ field: 'createdAt', direction: 'desc' });

	const handleSort = (field: SortField) => {
		setSort((current) => ({
			field,
			direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc',
		}));
	};

	const sortedCampaigns = [...campaigns].sort((a, b) => {
		const { field, direction } = sort;

		let aValue: string | number;
		let bValue: string | number;

		switch (field) {
			case 'name':
				aValue = a.name.toLowerCase();
				bValue = b.name.toLowerCase();
				break;
			case 'status':
				aValue = a.status;
				bValue = b.status;
				break;
			case 'openRate':
				aValue = getOpenRate(a);
				bValue = getOpenRate(b);
				break;
			case 'createdAt':
				aValue = a._creationTime || 0;
				bValue = b._creationTime || 0;
				break;
			default:
				return 0;
		}

		if (aValue < bValue) return direction === 'asc' ? -1 : 1;
		if (aValue > bValue) return direction === 'asc' ? 1 : -1;
		return 0;
	});

	const getSortIcon = (field: SortField) => {
		if (sort.field !== field) return null;
		return sort.direction === 'asc' ? (
			<ChevronUp className="ml-1 h-4 w-4" />
		) : (
			<ChevronDown className="ml-1 h-4 w-4" />
		);
	};

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>
							<button
								aria-label="Ordenar por nome"
								className="flex items-center rounded font-medium transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
								onClick={() => handleSort('name')}
								type="button"
							>
								Campanha
								{getSortIcon('name')}
							</button>
						</TableHead>
						<TableHead>
							<button
								aria-label="Ordenar por status"
								className="flex items-center rounded font-medium transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
								onClick={() => handleSort('status')}
								type="button"
							>
								Status
								{getSortIcon('status')}
							</button>
						</TableHead>
						<TableHead>
							<button
								aria-label="Ordenar por taxa de abertura"
								className="flex items-center rounded font-medium transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
								onClick={() => handleSort('openRate')}
								type="button"
							>
								Abertura
								{getSortIcon('openRate')}
							</button>
						</TableHead>
						<TableHead>
							<button
								aria-label="Ordenar por data"
								className="flex items-center rounded font-medium transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
								onClick={() => handleSort('createdAt')}
								type="button"
							>
								Data
								{getSortIcon('createdAt')}
							</button>
						</TableHead>
						<TableHead className="w-10" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{sortedCampaigns.map((campaign) => {
						const openRate = getOpenRate(campaign);
						let openRateContent: React.ReactNode = (
							<span className="text-muted-foreground text-sm">-</span>
						);
						if (campaign.status === 'sent') {
							let openRateColor = 'text-red-600';
							if (openRate >= 30) {
								openRateColor = 'text-green-600';
							} else if (openRate >= 15) {
								openRateColor = 'text-yellow-600';
							}
							openRateContent = (
								<span className={cn('font-medium', openRateColor)}>{openRate.toFixed(1)}%</span>
							);
						}
						return (
							<TableRow
								aria-label={`Ver detalhes de ${campaign.name}`}
								className="cursor-pointer transition-colors hover:bg-muted/50"
								key={campaign.id}
								onClick={() => onCampaignClick(campaign.id)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										onCampaignClick(campaign.id);
									}
								}}
								role="button"
								tabIndex={0}
							>
								<TableCell>
									<div className="flex items-center gap-3">
										<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-purple-500 to-indigo-500">
											<Mail className="h-4 w-4 text-white" />
										</div>
										<div>
											<p className="font-medium text-sm">{campaign.name}</p>
											<p className="max-w-[200px] truncate text-muted-foreground text-xs">
												{campaign.subject}
											</p>
										</div>
									</div>
								</TableCell>
								<TableCell>
									<Badge variant={statusVariants[campaign.status]}>
										{statusLabels[campaign.status]}
									</Badge>
								</TableCell>
								<TableCell>{openRateContent}</TableCell>
								<TableCell className="text-muted-foreground text-sm">
									{formatDistanceToNow(campaign._creationTime, { locale: ptBR, addSuffix: true })}
								</TableCell>
								<TableCell>
									<ChevronRight className="h-4 w-4 text-muted-foreground" />
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}

'use client';

import type { Doc, Id } from '@convex/_generated/dataModel';
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

interface CampaignTableProps {
	campaigns: Doc<'emailCampaigns'>[];
	onCampaignClick: (campaignId: Id<'emailCampaigns'>) => void;
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

function getOpenRate(campaign: Doc<'emailCampaigns'>): number {
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
				aValue = a.createdAt || 0;
				bValue = b.createdAt || 0;
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
			<ChevronUp className="h-4 w-4 ml-1" />
		) : (
			<ChevronDown className="h-4 w-4 ml-1" />
		);
	};

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>
							<button
								type="button"
								onClick={() => handleSort('name')}
								className="flex items-center hover:text-foreground transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
								aria-label="Ordenar por nome"
							>
								Campanha
								{getSortIcon('name')}
							</button>
						</TableHead>
						<TableHead>
							<button
								type="button"
								onClick={() => handleSort('status')}
								className="flex items-center hover:text-foreground transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
								aria-label="Ordenar por status"
							>
								Status
								{getSortIcon('status')}
							</button>
						</TableHead>
						<TableHead>
							<button
								type="button"
								onClick={() => handleSort('openRate')}
								className="flex items-center hover:text-foreground transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
								aria-label="Ordenar por taxa de abertura"
							>
								Abertura
								{getSortIcon('openRate')}
							</button>
						</TableHead>
						<TableHead>
							<button
								type="button"
								onClick={() => handleSort('createdAt')}
								className="flex items-center hover:text-foreground transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
								aria-label="Ordenar por data"
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
						return (
							<TableRow
								key={campaign._id}
								className="cursor-pointer hover:bg-muted/50 transition-colors"
								onClick={() => onCampaignClick(campaign._id)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										onCampaignClick(campaign._id);
									}
								}}
								tabIndex={0}
								role="button"
								aria-label={`Ver detalhes de ${campaign.name}`}
							>
								<TableCell>
									<div className="flex items-center gap-3">
										<div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-indigo-500 flex items-center justify-center shrink-0">
											<Mail className="h-4 w-4 text-white" />
										</div>
										<div>
											<p className="font-medium text-sm">{campaign.name}</p>
											<p className="text-xs text-muted-foreground truncate max-w-[200px]">
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
								<TableCell>
									{campaign.status === 'sent' ? (
										<span
											className={cn(
												'font-medium',
												openRate >= 30
													? 'text-green-600'
													: openRate >= 15
														? 'text-yellow-600'
														: 'text-red-600',
											)}
										>
											{openRate.toFixed(1)}%
										</span>
									) : (
										<span className="text-muted-foreground text-sm">-</span>
									)}
								</TableCell>
								<TableCell className="text-muted-foreground text-sm">
									{formatDistanceToNow(campaign.createdAt, { locale: ptBR, addSuffix: true })}
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

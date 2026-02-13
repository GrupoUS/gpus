'use client';

import { Eye, MousePointerClick, Send } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import type { EmailCampaign } from '@/types/api';

interface TopCampaignsTableProps {
	campaigns: EmailCampaign[];
}

export function TopCampaignsTable({ campaigns }: TopCampaignsTableProps) {
	return (
		<Card className="col-span-3">
			<CardHeader>
				<CardTitle>Top Campanhas (Taxa de Abertura)</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Campanha</TableHead>
							<TableHead className="text-right">Enviados</TableHead>
							<TableHead className="text-right">Taxa Abertura</TableHead>
							<TableHead className="text-right">Taxa Cliques</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{campaigns.map((campaign) => {
							const delivered = campaign.stats?.delivered || 0;
							const opened = campaign.stats?.opened || 0;
							const clicked = campaign.stats?.clicked || 0;

							const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
							const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;

							return (
								<TableRow key={campaign.id}>
									<TableCell className="font-medium">
										<div className="flex flex-col">
											<span className="max-w-[200px] truncate" title={campaign.name}>
												{campaign.name}
											</span>
											<span className="max-w-[200px] truncate text-muted-foreground text-xs">
												{campaign.subject}
											</span>
										</div>
									</TableCell>
									<TableCell className="text-right">
										<div className="flex items-center justify-end gap-1">
											<Send className="h-3 w-3 text-muted-foreground" />
											{campaign.stats?.sent || 0}
										</div>
									</TableCell>
									<TableCell className="text-right">
										<Badge
											className="bg-green-500/10 text-green-500 hover:bg-green-500/20"
											variant="outline"
										>
											<Eye className="mr-1 h-3 w-3" />
											{openRate.toFixed(1)}%
										</Badge>
									</TableCell>
									<TableCell className="text-right">
										<div className="flex items-center justify-end gap-1 text-sm">
											<MousePointerClick className="h-3 w-3 text-yellow-500" />
											{clickRate.toFixed(1)}%
										</div>
									</TableCell>
								</TableRow>
							);
						})}
						{campaigns.length === 0 && (
							<TableRow>
								<TableCell className="h-24 text-center text-muted-foreground" colSpan={4}>
									Nenhuma campanha enviada ainda.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}

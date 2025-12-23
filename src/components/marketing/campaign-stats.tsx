import { Eye, FileEdit, Mail, Send } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CampaignStatsProps {
	totalCampaigns: number;
	draftCount: number;
	sentCount: number;
	avgOpenRate: number;
}

export function CampaignStats({
	totalCampaigns,
	draftCount,
	sentCount,
	avgOpenRate,
}: CampaignStatsProps) {
	return (
		<div className="grid gap-4 md:grid-cols-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium">Total de Campanhas</CardTitle>
					<Mail className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{totalCampaigns}</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
					<FileEdit className="h-4 w-4 text-yellow-500" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold text-yellow-600">{draftCount}</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium">Enviadas</CardTitle>
					<Send className="h-4 w-4 text-green-500" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold text-green-600">{sentCount}</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium">Taxa de Abertura</CardTitle>
					<Eye className="h-4 w-4 text-primary" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold text-primary">{avgOpenRate.toFixed(1)}%</div>
				</CardContent>
			</Card>
		</div>
	);
}

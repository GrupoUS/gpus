import { CheckCircle, MessageSquare, UserPlus, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LeadStats {
	total: number;
	new: number;
	contacted: number;
	converted: number;
	unsubscribed: number;
	conversionRate: string;
}

interface LeadCaptureStatsProps {
	stats: LeadStats | null;
}

export function LeadCaptureStats({ stats }: LeadCaptureStatsProps) {
	if (!stats) return null;

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
					<Users className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.total}</div>
					<p className="text-xs text-muted-foreground">+180% em relação ao mês anterior (mock)</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Novos</CardTitle>
					<UserPlus className="h-4 w-4 text-blue-500" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.new}</div>
					<p className="text-xs text-muted-foreground">Aguardando contato</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Contatados</CardTitle>
					<MessageSquare className="h-4 w-4 text-yellow-500" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.contacted}</div>
					<p className="text-xs text-muted-foreground">Em negociação</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Convertidos</CardTitle>
					<CheckCircle className="h-4 w-4 text-green-500" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.converted}</div>
					<p className="text-xs text-muted-foreground">
						Taxa de conversão: {stats.conversionRate}%
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

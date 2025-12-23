import { createFileRoute } from '@tanstack/react-router';
import { Loader2, Mail, MousePointerClick, TrendingUp, Users } from 'lucide-react';

import { EmailMetricsChart } from '@/components/marketing/email-metrics-chart';
import { TopCampaignsTable } from '@/components/marketing/top-campaigns-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmailDashboardViewModel } from '@/hooks/use-email-dashboard-view-model';

export const Route = createFileRoute('/_authenticated/marketing/dashboard')({
	component: DashboardPage,
});

function DashboardPage() {
	const { metrics, chartData, topCampaigns, isLoading } = useEmailDashboardViewModel();

	if (isLoading) {
		return (
			<div className="flex h-[80vh] items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Dashboard de Marketing</h1>
				<p className="text-muted-foreground">
					Visão geral da performance de suas campanhas de email.
				</p>
			</div>

			{/* Metrics Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Emails Enviados</CardTitle>
						<Mail className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{metrics.totalSent.toLocaleString()}</div>
						<p className="text-xs text-muted-foreground">Total acumulado</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Taxa de Abertura</CardTitle>
						<Users className="h-4 w-4 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{metrics.avgOpenRate}%</div>
						<p className="text-xs text-muted-foreground">Média geral</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Taxa de Cliques</CardTitle>
						<MousePointerClick className="h-4 w-4 text-yellow-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{metrics.avgClickRate}%</div>
						<p className="text-xs text-muted-foreground">Média geral</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Contatos</CardTitle>
						<TrendingUp className="h-4 w-4 text-blue-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{metrics.totalContacts.toLocaleString()}</div>
						<p className="text-xs text-muted-foreground">
							+{metrics.contactGrowth} novos (30 dias)
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
				<EmailMetricsChart data={chartData} />
				<TopCampaignsTable campaigns={topCampaigns} />
			</div>
		</div>
	);
}

import { api } from '@convex/_generated/api';
import { createFileRoute } from '@tanstack/react-router';
import { useConvex, useQuery } from 'convex/react';
import { AlertTriangle, CheckCircle, Clock, DollarSign, RefreshCw, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { InvoiceList } from '@/components/financial/invoice-list';
import { MonthlyOverviewCard } from '@/components/financial/monthly-overview-card';
import { PaymentCalendar } from '@/components/financial/payment-calendar';
import { RevenueChart } from '@/components/financial/revenue-chart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/_authenticated/financial/dashboard')({
	component: FinancialDashboardPage,
});

function FinancialDashboardPage() {
	const [isSyncing, setIsSyncing] = useState(false);
	const convex = useConvex();

	// Get sync status for display
	const syncStatus = useQuery(api.asaas.sync.getLastSyncStatus);

	// Get monthly summary for KPIs
	const now = new Date();
	const monthlySummary = useQuery(api.asaas.queries.getMonthlyFinancialSummary, {
		month: now.getMonth(),
		year: now.getFullYear(),
	});

	const handleSync = async () => {
		setIsSyncing(true);
		try {
			toast.info('Sincronizando dados do Asaas...');
			await convex.action(api.asaas.actions.importAllFromAsaas, {
				initiatedBy: 'dashboard_sync',
			});
			toast.success('Sincronização concluída!');
		} catch (error) {
			toast.error('Erro na sincronização', {
				description: error instanceof Error ? error.message : 'Erro desconhecido',
			});
		} finally {
			setIsSyncing(false);
		}
	};

	// Format currency
	const formatCurrency = (value: number) =>
		new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(value);

	// Format relative time
	const formatRelativeTime = (timestamp?: number) => {
		if (!timestamp) return 'Nunca';
		const diff = Date.now() - timestamp;
		const minutes = Math.floor(diff / 60_000);
		if (minutes < 60) return `${minutes}m atrás`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h atrás`;
		const days = Math.floor(hours / 24);
		return `${days}d atrás`;
	};

	// Calculate default rate
	const defaultRate =
		monthlySummary?.overdueCount &&
		(monthlySummary
			? monthlySummary.paidCount + monthlySummary.pendingCount + monthlySummary.overdueCount
			: 0)
			? (
					(monthlySummary.overdueCount /
						(monthlySummary.paidCount +
							monthlySummary.pendingCount +
							monthlySummary.overdueCount)) *
					100
				).toFixed(1)
			: '0';

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl">Dashboard Financeiro</h1>
					<p className="text-muted-foreground">Visão geral das finanças do negócio</p>
				</div>
				<div className="flex gap-2">
					<Button disabled={isSyncing} onClick={handleSync}>
						<RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
						Sincronizar Asaas
					</Button>
				</div>
			</div>

			{/* Sync Status Banner */}
			{syncStatus && (
				<Card className="bg-muted/50">
					<CardContent className="py-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-6 text-sm">
								<span className="font-medium">Última Sincronização:</span>
								{(['customers', 'payments'] as const).map((type) => {
									const sync = syncStatus[type];
									return (
										<div className="flex items-center gap-2" key={type}>
											{sync?.status === 'completed' ? (
												<CheckCircle className="h-4 w-4 text-green-500" />
											) : sync?.status === 'failed' ? (
												<AlertTriangle className="h-4 w-4 text-red-500" />
											) : (
												<Clock className="h-4 w-4 text-muted-foreground" />
											)}
											<span className="capitalize">{type}:</span>
											<Badge variant={sync?.status === 'completed' ? 'secondary' : 'outline'}>
												{formatRelativeTime(sync?.completedAt)}
											</Badge>
										</div>
									);
								})}
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* KPI Cards */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Faturamento do Mês</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{monthlySummary ? formatCurrency(monthlySummary.paidThisMonth || 0) : '-'}
						</div>
						<p className="text-muted-foreground text-xs">
							{monthlySummary?.paidCount || 0} pagamentos confirmados
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">A Receber</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{monthlySummary ? formatCurrency(monthlySummary.pendingThisMonth || 0) : '-'}
						</div>
						<p className="text-muted-foreground text-xs">
							{monthlySummary?.pendingCount || 0} cobranças pendentes
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Vencidos</CardTitle>
						<AlertTriangle className="h-4 w-4 text-red-500" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-red-600">
							{monthlySummary ? formatCurrency(monthlySummary.overdueTotal || 0) : '-'}
						</div>
						<p className="text-muted-foreground text-xs">
							{monthlySummary?.overdueCount || 0} cobranças atrasadas
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Taxa de Inadimplência</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{defaultRate}%</div>
						<p className="text-muted-foreground text-xs">Cobranças vencidas vs total</p>
					</CardContent>
				</Card>
			</div>

			{/* Monthly Overview Cards */}
			<MonthlyOverviewCard />

			{/* Charts Row */}
			<div className="grid gap-4 md:grid-cols-2">
				<RevenueChart />
				<PaymentCalendar />
			</div>

			{/* Invoice List */}
			<Card>
				<CardHeader>
					<CardTitle>Cobranças</CardTitle>
				</CardHeader>
				<CardContent>
					<InvoiceList />
				</CardContent>
			</Card>
		</div>
	);
}

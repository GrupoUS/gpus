import { api } from '@convex/_generated/api';
import { createFileRoute } from '@tanstack/react-router';
import { useConvex } from 'convex/react';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { InvoiceList } from '@/components/financial/invoice-list';
import { MonthlyOverviewCard } from '@/components/financial/monthly-overview-card';
import { PaymentCalendar } from '@/components/financial/payment-calendar';
import { RevenueChart } from '@/components/financial/revenue-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/_authenticated/financial/dashboard')({
	component: FinancialDashboardPage,
});

function FinancialDashboardPage() {
	const [isSyncing, setIsSyncing] = useState(false);
	const convex = useConvex();

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

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Dashboard Financeiro</h1>
					<p className="text-muted-foreground">Visão geral das finanças do negócio</p>
				</div>
				<div className="flex gap-2">
					<Button onClick={handleSync} disabled={isSyncing}>
						<RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
						Sincronizar Asaas
					</Button>
				</div>
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

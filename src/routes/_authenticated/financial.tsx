'use client';

import { api } from '@convex/_generated/api';
import { createFileRoute } from '@tanstack/react-router';
import { useAction } from 'convex/react';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { InvoiceList } from '@/components/financial/invoice-list';
import { MonthlyOverviewCard } from '@/components/financial/monthly-overview-card';
import { PaymentCalendar } from '@/components/financial/payment-calendar';
import { RevenueChart } from '@/components/financial/revenue-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/_authenticated/financial')({
	component: FinancialDashboard,
});

type ImportResult = {
	success: boolean;
	recordsProcessed: number;
	recordsCreated: number;
	recordsUpdated: number;
	recordsFailed: number;
};

function FinancialDashboard() {
	const [isSyncing, setIsSyncing] = useState(false);
	// biome-ignore lint/suspicious/noExplicitAny: Convex action type inference workaround
	const syncPayments = useAction(api.asaas.actions.importPaymentsFromAsaas as any);

	const handleSync = async () => {
		setIsSyncing(true);
		try {
			toast.info('Sincronizando pagamentos...');
			const result = (await syncPayments({
				initiatedBy: 'manual_dashboard_sync',
			})) as ImportResult;

			if (result?.success) {
				toast.success('Sincronização concluída!', {
					description: `${result.recordsCreated} novos, ${result.recordsUpdated} atualizados`,
				});
			}
		} catch (error) {
			toast.error('Falha na sincronização', {
				description: error instanceof Error ? error.message : 'Erro desconhecido',
			});
		} finally {
			setIsSyncing(false);
		}
	};

	return (
		<div className="flex-1 space-y-6 p-8 pt-6">
			{/* Header with Quick Actions */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-3xl font-bold tracking-tight">Financeiro</h2>
					<p className="text-muted-foreground">Acompanhe cobranças, receitas e pagamentos</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={handleSync}
						disabled={isSyncing}
						className="gap-2"
					>
						<RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
						{isSyncing ? 'Sincronizando...' : 'Sincronizar'}
					</Button>
				</div>
			</div>

			{/* Monthly Overview Cards */}
			<MonthlyOverviewCard />

			{/* Charts and Calendar Row */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Revenue Chart */}
				<RevenueChart />

				{/* Payment Calendar */}
				<PaymentCalendar />
			</div>

			{/* Invoice List */}
			<Card>
				<CardHeader>
					<CardTitle>Cobranças do Mês</CardTitle>
					<CardDescription>Lista de cobranças com filtros por status</CardDescription>
				</CardHeader>
				<CardContent>
					<InvoiceList />
				</CardContent>
			</Card>
		</div>
	);
}

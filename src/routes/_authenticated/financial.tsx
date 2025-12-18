'use client';

import { api } from '@convex/_generated/api';
import type { Doc } from '@convex/_generated/dataModel';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { AlertCircle, CheckCircle, DollarSign, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

export const Route = createFileRoute('/_authenticated/financial')({
	component: FinancialDashboard,
});

function FinancialDashboard() {
	const summary = useQuery(api.asaas.getFinancialSummary, {});
	const payments = useQuery(api.asaas.listPayments, { limit: 20 });

	const getStatusBadge = (status: string) => {
		const map: Record<string, string> = {
			PENDING: 'bg-yellow-500',
			RECEIVED: 'bg-green-500',
			CONFIRMED: 'bg-green-600',
			OVERDUE: 'bg-red-500',
			REFUNDED: 'bg-purple-500',
			DELETED: 'bg-gray-400',
			CANCELLED: 'bg-gray-500',
		};
		return <Badge className={map[status] ?? 'bg-gray-500'}>{status}</Badge>;
	};

	return (
		<div className="flex-1 space-y-4 p-8 pt-6">
			<div className="flex items-center justify-between space-y-2">
				<h2 className="text-3xl font-bold tracking-tight">Financeiro</h2>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Receita Confirmada</CardTitle>
						<DollarSign className="h-4 w-4 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{summary ? (
								new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
									summary.received,
								)
							) : (
								<Loader2 className="h-4 w-4 animate-spin" />
							)}
						</div>
						<p className="text-xs text-muted-foreground">Total recebido/confirmado</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">A Receber (Pendente)</CardTitle>
						<CheckCircle className="h-4 w-4 text-yellow-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-yellow-600">
							{summary ? (
								new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
									summary.pending,
								)
							) : (
								<Loader2 className="h-4 w-4 animate-spin" />
							)}
						</div>
						<p className="text-xs text-muted-foreground">
							Cobranças geradas e aguardando pagamento
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Inadimplência</CardTitle>
						<AlertCircle className="h-4 w-4 text-red-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">
							{summary ? (
								new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
									summary.overdue,
								)
							) : (
								<Loader2 className="h-4 w-4 animate-spin" />
							)}
						</div>
						<p className="text-xs text-muted-foreground">
							{summary ? `${summary.overdueCount} cobranças vencidas` : '...'}
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 md:grid-cols-1">
				<Card className="col-span-1">
					<CardHeader>
						<CardTitle>Últimos Pagamentos</CardTitle>
						<CardDescription>Lista das 20 últimas movimentações financeiras.</CardDescription>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Data Criação</TableHead>
									<TableHead>Vencimento</TableHead>
									<TableHead>Valor</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Forma</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{payments === undefined ? (
									<TableRow>
										<TableCell colSpan={5} className="text-center py-8">
											<Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
										</TableCell>
									</TableRow>
								) : payments.length === 0 ? (
									<TableRow>
										<TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
											Nenhum registro encontrado.
										</TableCell>
									</TableRow>
								) : (
									payments.map((payment: Doc<'asaasPayments'>) => (
										<TableRow key={payment._id}>
											<TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
											<TableCell>
												{payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : '-'}
											</TableCell>
											<TableCell>
												{new Intl.NumberFormat('pt-BR', {
													style: 'currency',
													currency: 'BRL',
												}).format(payment.value)}
											</TableCell>
											<TableCell>{getStatusBadge(payment.status)}</TableCell>
											<TableCell>{payment.billingType}</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

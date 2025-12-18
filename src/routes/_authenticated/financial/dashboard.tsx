'use client';

import { api } from '@convex/_generated/api';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { Calendar, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCard } from '@/components/dashboard/stats-card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const Route = createFileRoute('/_authenticated/financial/dashboard')({
	component: FinancialDashboardPage,
});

function FinancialDashboardPage() {
	const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

	// Calculate date range based on period
	const now = Date.now();
	const periodMap = {
		day: 24 * 60 * 60 * 1000,
		week: 7 * 24 * 60 * 60 * 1000,
		month: 30 * 24 * 60 * 60 * 1000,
		year: 365 * 24 * 60 * 60 * 1000,
	};
	const startDate = now - periodMap[period];

	const summary = useQuery(api.asaas.getFinancialSummary, {
		startDate,
		endDate: now,
	});

	const pendingPayments = useQuery(api.asaas.getPendingPayments);
	const overduePayments = useQuery(api.asaas.getOverduePayments);

	// Format data for charts
	const chartData = summary
		? [
				{
					name: 'Entradas',
					value: summary.revenue.total,
				},
				{
					name: 'Saídas',
					value: summary.revenue.net - summary.revenue.total,
				},
				{
					name: 'Líquido',
					value: summary.revenue.net,
				},
			]
		: [];

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(value);
	};

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
					<p className="text-muted-foreground">Visão geral das finanças do negócio</p>
				</div>
				<Select value={period} onValueChange={(value: any) => setPeriod(value)}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Período" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="day">Hoje</SelectItem>
						<SelectItem value="week">Esta Semana</SelectItem>
						<SelectItem value="month">Este Mês</SelectItem>
						<SelectItem value="year">Este Ano</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Metrics Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{summary ? (
					<>
						<StatsCard
							title="Total de Entradas"
							value={formatCurrency(summary.revenue.total)}
							description="Pagamentos recebidos"
							icon={TrendingUp}
							trend="up"
						/>
						<StatsCard
							title="Total Líquido"
							value={formatCurrency(summary.revenue.net)}
							description="Após descontos e taxas"
							icon={DollarSign}
							trend={summary.revenue.net > 0 ? 'up' : 'down'}
						/>
						<StatsCard
							title="A Receber"
							value={formatCurrency(summary.charges.pendingAmount)}
							description={`${summary.charges.pending} cobranças pendentes`}
							icon={Calendar}
							trend="neutral"
						/>
						<StatsCard
							title="Vencidas"
							value={formatCurrency(summary.charges.overdueAmount)}
							description={`${summary.charges.overdue} cobranças vencidas`}
							icon={TrendingDown}
							trend="down"
						/>
					</>
				) : (
					Array.from({ length: 4 }).map((_, i) => (
						<Card key={i}>
							<CardHeader>
								<Skeleton className="h-4 w-24" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-8 w-32" />
							</CardContent>
						</Card>
					))
				)}
			</div>

			{/* Charts */}
			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Receita por Tipo</CardTitle>
						<CardDescription>Distribuição de entradas e saídas</CardDescription>
					</CardHeader>
					<CardContent>
						{summary ? (
							<ResponsiveContainer width="100%" height={300}>
								<BarChart data={chartData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="name" />
									<YAxis />
									<Tooltip formatter={(value: number) => formatCurrency(value)} />
									<Bar dataKey="value" fill="#8884d8" />
								</BarChart>
							</ResponsiveContainer>
						) : (
							<Skeleton className="h-[300px]" />
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Taxa de Inadimplência</CardTitle>
						<CardDescription>Percentual de cobranças vencidas</CardDescription>
					</CardHeader>
					<CardContent>
						{summary ? (
							<div className="flex items-center justify-center h-[300px]">
								<div className="text-center">
									<div className="text-4xl font-bold">
										{summary.metrics.defaultRate.toFixed(1)}%
									</div>
									<p className="text-muted-foreground mt-2">
										{summary.charges.overdue} de {summary.charges.pending + summary.charges.overdue} cobranças
									</p>
								</div>
							</div>
						) : (
							<Skeleton className="h-[300px]" />
						)}
					</CardContent>
				</Card>
			</div>

			{/* Recent Payments */}
			<Card>
				<CardHeader>
					<CardTitle>Cobranças Pendentes</CardTitle>
					<CardDescription>Próximas cobranças a receber</CardDescription>
				</CardHeader>
				<CardContent>
					{pendingPayments === undefined ? (
						<Skeleton className="h-32" />
					) : pendingPayments.length === 0 ? (
						<p className="text-muted-foreground text-center py-8">Nenhuma cobrança pendente</p>
					) : (
						<div className="space-y-2">
							{pendingPayments.slice(0, 5).map((payment) => (
								<div
									key={payment._id}
									className="flex items-center justify-between p-3 border rounded-lg"
								>
									<div>
										<p className="font-medium">{payment.description || 'Cobrança'}</p>
										<p className="text-sm text-muted-foreground">
											Vencimento: {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
										</p>
									</div>
									<div className="text-right">
										<p className="font-semibold">{formatCurrency(payment.value)}</p>
										<p className="text-sm text-muted-foreground">{payment.billingType}</p>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Overdue Payments */}
			{overduePayments && overduePayments.length > 0 && (
				<Card className="border-red-500">
					<CardHeader>
						<CardTitle className="text-red-600">Cobranças Vencidas</CardTitle>
						<CardDescription>Ação necessária</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{overduePayments.slice(0, 5).map((payment) => (
								<div
									key={payment._id}
									className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50"
								>
									<div>
										<p className="font-medium">{payment.description || 'Cobrança'}</p>
										<p className="text-sm text-muted-foreground">
											Vencido em: {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
										</p>
									</div>
									<div className="text-right">
										<p className="font-semibold text-red-600">{formatCurrency(payment.value)}</p>
										<p className="text-sm text-muted-foreground">{payment.billingType}</p>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}


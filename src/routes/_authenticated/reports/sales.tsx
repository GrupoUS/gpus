import { api } from '@convex/_generated/api';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { DollarSign, Package, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import {
	Bar,
	BarChart,
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { formatCurrency, productLabels } from '@/lib/constants';

export const Route = createFileRoute('/_authenticated/reports/sales')({
	component: SalesReportPage,
});

function SalesReportPage() {
	const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'year'>('30d');
	const metrics = useQuery(api.metrics.getDashboard, { period });

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="flex items-center gap-2 font-bold text-2xl">
						<DollarSign className="h-6 w-6 text-green-500" />
						Relatório de Vendas
					</h1>
					<p className="text-muted-foreground">Análise detalhada de conversões e receita</p>
				</div>
				<Select onValueChange={(v: typeof period) => setPeriod(v)} value={period}>
					<SelectTrigger className="w-[180px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="7d">Últimos 7 dias</SelectItem>
						<SelectItem value="30d">Últimos 30 dias</SelectItem>
						<SelectItem value="90d">Últimos 90 dias</SelectItem>
						<SelectItem value="year">Este ano</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* KPIs */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">Receita Total</CardTitle>
						<DollarSign className="h-4 w-4 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-green-600">
							{formatCurrency(metrics?.revenue ?? 0)}
						</div>
						<p className="text-muted-foreground text-xs">
							{metrics?.revenueTrend && metrics.revenueTrend > 0 ? '+' : ''}
							{metrics?.revenueTrend?.toFixed(1)}% vs período anterior
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">Conversões</CardTitle>
						<TrendingUp className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{metrics?.funnel?.fechado_ganho ?? 0}</div>
						<p className="text-muted-foreground text-xs">
							Taxa: {metrics?.conversionRate?.toFixed(1)}%
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">Ticket Médio</CardTitle>
						<Package className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{formatCurrency(
								(metrics?.revenue ?? 0) / Math.max(metrics?.funnel?.fechado_ganho ?? 1, 1),
							)}
						</div>
						<p className="text-muted-foreground text-xs">Por conversão</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">Leads Ativos</CardTitle>
						<Users className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{metrics?.totalLeads ?? 0}</div>
						<p className="text-muted-foreground text-xs">No pipeline</p>
					</CardContent>
				</Card>
			</div>

			{/* Charts */}
			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Receita ao Longo do Tempo</CardTitle>
					</CardHeader>
					<CardContent>
						{metrics?.dailyMetrics && metrics.dailyMetrics.length > 0 ? (
							<ResponsiveContainer height={300} minWidth={0} width="100%">
								<LineChart data={metrics.dailyMetrics}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis
										dataKey="date"
										tickFormatter={(v) => {
											const [, m, d] = v.split('-');
											return `${d}/${m}`;
										}}
									/>
									<YAxis />
									<Tooltip
										formatter={(value) => formatCurrency(Number(value ?? 0))}
										labelFormatter={(label) => `Data: ${label}`}
									/>
									<Line
										dataKey="conversionValue"
										name="Receita"
										stroke="hsl(var(--chart-2))"
										strokeWidth={2}
										type="monotone"
									/>
								</LineChart>
							</ResponsiveContainer>
						) : (
							<div className="flex h-[300px] items-center justify-center text-muted-foreground">
								Sem dados disponíveis
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Conversões por Produto</CardTitle>
					</CardHeader>
					<CardContent>
						{metrics?.leadsByProduct && Object.keys(metrics.leadsByProduct).length > 0 ? (
							<ResponsiveContainer height={300} minWidth={0} width="100%">
								<BarChart
									data={Object.entries(metrics.leadsByProduct).map(([k, v]) => ({
										name: productLabels[k] || k,
										value: v,
									}))}
								>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="name" />
									<YAxis />
									<Tooltip />
									<Bar dataKey="value" fill="hsl(var(--primary))" name="Leads" />
								</BarChart>
							</ResponsiveContainer>
						) : (
							<div className="flex h-[300px] items-center justify-center text-muted-foreground">
								Sem dados disponíveis
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Products Table */}
			<Card>
				<CardHeader>
					<CardTitle>Desempenho por Produto</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Produto</TableHead>
								<TableHead className="text-right">Leads</TableHead>
								<TableHead className="text-right">Conversões</TableHead>
								<TableHead className="text-right">Taxa</TableHead>
								<TableHead className="text-right">Receita Est.</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{metrics?.leadsByProduct &&
								Object.entries(metrics.leadsByProduct).map(([product, count]) => {
									const conversions = Math.round(
										(count as number) * (metrics.conversionRate / 100),
									);
									const revenue = conversions * 18_000; // Estimativa baseada no ticket médio
									return (
										<TableRow key={product}>
											<TableCell className="font-medium">
												{productLabels[product] || product}
											</TableCell>
											<TableCell className="text-right">{count as number}</TableCell>
											<TableCell className="text-right">{conversions}</TableCell>
											<TableCell className="text-right">
												{metrics.conversionRate.toFixed(1)}%
											</TableCell>
											<TableCell className="text-right">{formatCurrency(revenue)}</TableCell>
										</TableRow>
									);
								})}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}

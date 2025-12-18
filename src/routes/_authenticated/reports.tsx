import { api } from '@convex/_generated/api';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { BarChart3, DollarSign, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy chart components
const LeadsOverTimeChart = lazy(() => import('@/components/reports/leads-over-time-chart'));
const MessagesOverTimeChart = lazy(() => import('@/components/reports/messages-over-time-chart'));

export const Route = createFileRoute('/_authenticated/reports')({
	component: ReportsPage,
});

function ReportsPage() {
	const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'year'>('30d');
	const stats = useQuery(api.metrics.getDashboard, { period });

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold flex items-center gap-2">
						<BarChart3 className="h-6 w-6 text-primary" />
						Relatórios
					</h1>
					<p className="text-muted-foreground">Métricas e análises do seu negócio</p>
				</div>
				<Select value={period} onValueChange={(value: typeof period) => setPeriod(value)}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Período" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="7d">Últimos 7 dias</SelectItem>
						<SelectItem value="30d">Últimos 30 dias</SelectItem>
						<SelectItem value="90d">Últimos 90 dias</SelectItem>
						<SelectItem value="year">Este ano</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Report Navigation Cards */}
			<div className="grid gap-4 md:grid-cols-2">
				<Link to="/reports/sales">
					<Card className="cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-base font-medium">Relatório de Vendas</CardTitle>
							<DollarSign className="h-5 w-5 text-green-500" />
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Análise detalhada de receita, conversões e performance de vendas
							</p>
						</CardContent>
					</Card>
				</Link>
				<Link to="/reports/team">
					<Card className="cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-base font-medium">Relatório de Equipe</CardTitle>
							<Users className="h-5 w-5 text-primary" />
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Performance individual e métricas por membro da equipe
							</p>
						</CardContent>
					</Card>
				</Link>
			</div>

			{/* Overview Stats */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats?.totalLeads ?? 0}</div>
						<p className="text-xs text-muted-foreground">no período selecionado</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Conversões</CardTitle>
						<TrendingUp className="h-4 w-4 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{stats?.funnel?.fechado_ganho ?? 0}
						</div>
						<p className="text-xs text-muted-foreground">Leads convertidos</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Mensagens</CardTitle>
						<MessageSquare className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-primary">{stats?.totalMessages ?? 0}</div>
						<p className="text-xs text-muted-foreground">Total de mensagens</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Conversas</CardTitle>
						<MessageSquare className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-primary">
							{Math.round(((stats?.conversionRate ?? 0) * (stats?.totalLeads ?? 1)) / 100)}
						</div>
						<p className="text-xs text-muted-foreground">Total de conversas</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
						<TrendingUp className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-primary">{stats?.conversionRate ?? 0}%</div>
						<p className="text-xs text-muted-foreground">Lead → Cliente</p>
					</CardContent>
				</Card>
			</div>

			{/* Revenue Section */}
			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<DollarSign className="h-5 w-5 text-green-500" />
							Receita Estimada
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-green-600">
							{new Intl.NumberFormat('pt-BR', {
								style: 'currency',
								currency: 'BRL',
							}).format(stats?.revenue ?? 0)}
						</div>
						<p className="text-sm text-muted-foreground mt-2">Baseado em conversões</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<BarChart3 className="h-5 w-5 text-primary" />
							Leads por Estágio
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{stats?.funnel &&
								(Object.entries(stats.funnel) as [string, number][]).map(([stage, count]) => {
									const total = (stats.totalLeads as number) || 1;
									const percentage = Math.round((count / total) * 100);
									return (
										<div key={stage} className="flex items-center gap-3">
											<div className="flex-1">
												<div className="flex items-center justify-between mb-1">
													<span className="text-sm font-medium capitalize">
														{stage.replace(/_/g, ' ')}
													</span>
													<span className="text-xs text-muted-foreground">
														{count as number} ({percentage}%)
													</span>
												</div>
												<div className="h-2 bg-muted rounded-full overflow-hidden">
													<div
														className="h-full bg-linear-to-r from-primary to-primary/70 rounded-lg"
														style={{ width: `${percentage}%` }}
													/>
												</div>
											</div>
										</div>
									);
								})}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Charts Section - Lazy Loaded */}
			{stats?.dailyMetrics && stats.dailyMetrics.length > 0 && (
				<div className="grid gap-4 md:grid-cols-2">
					<Suspense fallback={<Skeleton className="h-[380px] w-full rounded-lg" />}>
						<LeadsOverTimeChart data={stats.dailyMetrics} />
					</Suspense>
					<Suspense fallback={<Skeleton className="h-[380px] w-full rounded-lg" />}>
						<MessagesOverTimeChart data={stats.dailyMetrics} />
					</Suspense>
				</div>
			)}

			{/* Products Section */}
			<Card>
				<CardHeader>
					<CardTitle>Interesse por Produto</CardTitle>
				</CardHeader>
				<CardContent>
					{stats?.leadsByProduct && Object.keys(stats.leadsByProduct).length > 0 ? (
						<div className="grid gap-4 md:grid-cols-3">
							{(Object.entries(stats.leadsByProduct) as [string, number][]).map(
								([product, count]) => (
									<div key={product} className="p-4 border rounded-lg">
										<p className="text-sm font-medium capitalize">{product.replace(/_/g, ' ')}</p>
										<p className="text-2xl font-bold text-primary">{count as number}</p>
										<p className="text-xs text-muted-foreground">leads interessados</p>
									</div>
								),
							)}
						</div>
					) : (
						<div className="text-center py-8 text-muted-foreground">
							<BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
							<p>Nenhum dado de produto disponível</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

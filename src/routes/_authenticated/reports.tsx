import { createFileRoute, Link } from '@tanstack/react-router';
import { BarChart3, DollarSign, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';

import { trpc } from '../../lib/trpc';
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
	const { data: stats } = trpc.metrics.daily.useQuery({ period });

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="flex items-center gap-2 font-bold text-2xl">
						<BarChart3 className="h-6 w-6 text-primary" />
						Relatórios
					</h1>
					<p className="text-muted-foreground">Métricas e análises do seu negócio</p>
				</div>
				<Select onValueChange={(value: typeof period) => setPeriod(value)} value={period}>
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
					<Card className="cursor-pointer transition-all hover:border-primary/20 hover:shadow-md">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="font-medium text-base">Relatório de Vendas</CardTitle>
							<DollarSign className="h-5 w-5 text-green-500" />
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground text-sm">
								Análise detalhada de receita, conversões e performance de vendas
							</p>
						</CardContent>
					</Card>
				</Link>
				<Link to="/reports/team">
					<Card className="cursor-pointer transition-all hover:border-primary/20 hover:shadow-md">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="font-medium text-base">Relatório de Equipe</CardTitle>
							<Users className="h-5 w-5 text-primary" />
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground text-sm">
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
						<CardTitle className="font-medium text-sm">Total de Leads</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats?.totalLeads ?? 0}</div>
						<p className="text-muted-foreground text-xs">no período selecionado</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">Conversões</CardTitle>
						<TrendingUp className="h-4 w-4 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-green-600">
							{stats?.funnel?.fechado_ganho ?? 0}
						</div>
						<p className="text-muted-foreground text-xs">Leads convertidos</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">Mensagens</CardTitle>
						<MessageSquare className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-primary">{stats?.totalMessages ?? 0}</div>
						<p className="text-muted-foreground text-xs">Total de mensagens</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">Conversas</CardTitle>
						<MessageSquare className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-primary">
							{Math.round(((stats?.conversionRate ?? 0) * (stats?.totalLeads ?? 1)) / 100)}
						</div>
						<p className="text-muted-foreground text-xs">Total de conversas</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">Taxa de Conversão</CardTitle>
						<TrendingUp className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-primary">{stats?.conversionRate ?? 0}%</div>
						<p className="text-muted-foreground text-xs">Lead → Cliente</p>
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
						<div className="font-bold text-3xl text-green-600">
							{new Intl.NumberFormat('pt-BR', {
								style: 'currency',
								currency: 'BRL',
							}).format(stats?.revenue ?? 0)}
						</div>
						<p className="mt-2 text-muted-foreground text-sm">Baseado em conversões</p>
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
										<div className="flex items-center gap-3" key={stage}>
											<div className="flex-1">
												<div className="mb-1 flex items-center justify-between">
													<span className="font-medium text-sm capitalize">
														{stage.replace(/_/g, ' ')}
													</span>
													<span className="text-muted-foreground text-xs">
														{count as number} ({percentage}%)
													</span>
												</div>
												<div className="h-2 overflow-hidden rounded-full bg-muted">
													<div
														className="h-full rounded-lg bg-linear-to-r from-primary to-primary/70"
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
									<div className="rounded-lg border p-4" key={product}>
										<p className="font-medium text-sm capitalize">{product.replace(/_/g, ' ')}</p>
										<p className="font-bold text-2xl text-primary">{count as number}</p>
										<p className="text-muted-foreground text-xs">leads interessados</p>
									</div>
								),
							)}
						</div>
					) : (
						<div className="py-8 text-center text-muted-foreground">
							<BarChart3 className="mx-auto mb-4 h-12 w-12 opacity-30" />
							<p>Nenhum dado de produto disponível</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

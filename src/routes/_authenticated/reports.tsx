import { api } from '@convex/_generated/api';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { BarChart3, DollarSign, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import {
	Area,
	AreaChart,
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
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
						<BarChart3 className="h-6 w-6 text-purple-500" />
						Relatórios
					</h1>
					<p className="text-muted-foreground">Métricas e análises do seu negócio</p>
				</div>
				<Select value={period} onValueChange={(value: '7d' | '30d' | '90d' | 'year') => setPeriod(value)}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Período" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="7d">Últimos 7 dias</SelectItem>
						<SelectItem value="30d">Últimos 30 dias</SelectItem>
						<SelectItem value="all">Todo o período</SelectItem>
					</SelectContent>
				</Select>
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
						<MessageSquare className="h-4 w-4 text-blue-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-blue-600">{stats?.totalMessages ?? 0}</div>
						<p className="text-xs text-muted-foreground">Total de mensagens</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Conversas</CardTitle>
						<MessageSquare className="h-4 w-4 text-indigo-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-indigo-600">
							{Math.round(((stats?.conversionRate ?? 0) * (stats?.totalLeads ?? 1)) / 100)}
						</div>
						<p className="text-xs text-muted-foreground">Total de conversas</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
						<TrendingUp className="h-4 w-4 text-purple-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-purple-600">{stats?.conversionRate ?? 0}%</div>
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
							<BarChart3 className="h-5 w-5 text-purple-500" />
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
														className="p-2 bg-linear-to-r from-blue-500/10 to-indigo-500/10 rounded-lg"
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

			{/* Charts Section */}
			{stats?.dailyMetrics && stats.dailyMetrics.length > 0 && (
				<div className="grid gap-4 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Leads ao Longo do Tempo</CardTitle>
						</CardHeader>
						<CardContent>
							<ResponsiveContainer width="100%" height={300}>
								<AreaChart data={stats.dailyMetrics}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis
										dataKey="date"
										tickFormatter={(value) => {
											const [, month, day] = value.split('-');
											return `${day}/${month}`;
										}}
									/>
									<YAxis />
									<Area
										type="monotone"
										dataKey="newLeads"
										stroke="#8b5cf6"
										fill="#8b5cf6"
										fillOpacity={0.2}
									/>
								</AreaChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Mensagens ao Longo do Tempo</CardTitle>
						</CardHeader>
						<CardContent>
							<ResponsiveContainer width="100%" height={300}>
								<LineChart data={stats.dailyMetrics}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis
										dataKey="date"
										tickFormatter={(value) => {
											const [, month, day] = value.split('-');
											return `${day}/${month}`;
										}}
									/>
									<YAxis />
									<Line
										type="monotone"
										dataKey="messagesReceived"
										stroke="#3b82f6"
										strokeWidth={2}
										name="Recebidas"
									/>
									<Line
										type="monotone"
										dataKey="messagesSent"
										stroke="#10b981"
										strokeWidth={2}
										name="Enviadas"
									/>
								</LineChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>
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
										<p className="text-2xl font-bold text-purple-600">{count as number}</p>
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

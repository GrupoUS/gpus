import { api } from '@convex/_generated/api';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { BarChart3, DollarSign, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';

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
	const stats = useQuery(api.stats.getDashboardStats, {});

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold flex items-center gap-2">
					<BarChart3 className="h-6 w-6 text-purple-500" />
					Relatórios
				</h1>
				<p className="text-muted-foreground">Métricas e análises do seu negócio</p>
			</div>

			{/* Overview Stats */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats?.totalLeads ?? 0}</div>
						<p className="text-xs text-muted-foreground">
							{stats?.leadsThisMonth ?? 0} novos este mês
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Conversões</CardTitle>
						<TrendingUp className="h-4 w-4 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{stats?.leadsByStage?.fechado_ganho ?? 0}
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
						<div className="text-2xl font-bold text-blue-600">{stats?.messagesCount ?? 0}</div>
						<p className="text-xs text-muted-foreground">Total de mensagens</p>
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
							{stats?.leadsByStage &&
								Object.entries(stats.leadsByStage).map(([stage, count]) => {
									const total = stats.totalLeads || 1;
									const percentage = Math.round((count / total) * 100);
									return (
										<div key={stage} className="flex items-center gap-3">
											<div className="flex-1">
												<div className="flex items-center justify-between mb-1">
													<span className="text-sm font-medium capitalize">
														{stage.replace(/_/g, ' ')}
													</span>
													<span className="text-xs text-muted-foreground">
														{count} ({percentage}%)
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

			{/* Products Section */}
			<Card>
				<CardHeader>
					<CardTitle>Interesse por Produto</CardTitle>
				</CardHeader>
				<CardContent>
					{stats?.leadsByProduct && Object.keys(stats.leadsByProduct).length > 0 ? (
						<div className="grid gap-4 md:grid-cols-3">
							{Object.entries(stats.leadsByProduct).map(([product, count]) => (
								<div key={product} className="p-4 border rounded-lg">
									<p className="text-sm font-medium capitalize">{product.replace(/_/g, ' ')}</p>
									<p className="text-2xl font-bold text-purple-600">{count}</p>
									<p className="text-xs text-muted-foreground">leads interessados</p>
								</div>
							))}
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

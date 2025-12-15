'use client';

import { api } from '@convex/_generated/api';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
	AlertTriangle,
	ArrowRight,
	DollarSign,
	Flame,
	MessageSquare,
	Snowflake,
	Thermometer,
	TrendingUp,
	Users,
} from 'lucide-react';
import { useId, useState } from 'react';
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

import { StatsCard } from '@/components/dashboard/stats-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_authenticated/dashboard')({
	component: DashboardPage,
});

const chartData = [
	{ name: 'Jan', leads: 40, conversoes: 24 },
	{ name: 'Fev', leads: 30, conversoes: 13 },
	{ name: 'Mar', leads: 45, conversoes: 28 },
	{ name: 'Abr', leads: 50, conversoes: 35 },
	{ name: 'Mai', leads: 49, conversoes: 30 },
	{ name: 'Jun', leads: 60, conversoes: 42 },
];

const tempConfig = {
	quente: { icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10' },
	morno: { icon: Thermometer, color: 'text-amber-500', bg: 'bg-amber-500/10' },
	frio: { icon: Snowflake, color: 'text-blue-500', bg: 'bg-blue-500/10' },
} as const;

function DashboardPage() {
	const gradientLeadsId = useId();
	const gradientConversoesId = useId();
	const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'year'>('30d');

	const metrics = useQuery(api.metrics.getDashboard, { period });
	const teamPerformance = useQuery(api.metrics.getTeamPerformance, { period });
	const churnAlerts = useQuery(api.students.getChurnAlerts);
	const recentLeads = useQuery(api.leads.getRecent, { limit: 5 });

	// Format currency
	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
			maximumFractionDigits: 0,
		}).format(value);
	};

	// Product labels
	const productLabels: Record<string, string> = {
		trintae3: 'TRINTAE3',
		black_neon: 'Black NEON',
		comunidade: 'Comunidade US',
		otb: 'OTB MBA',
		auriculo: 'Aurículo',
		na_mesa_certa: 'Na Mesa Certa',
		indefinido: 'Indefinido',
	};

	const funnelStages = [
		{ id: 'novo', label: 'Novos', color: 'bg-blue-500' },
		{ id: 'primeiro_contato', label: 'Primeiro Contato', color: 'bg-cyan-500' },
		{ id: 'qualificado', label: 'Qualificados', color: 'bg-purple-500' },
		{ id: 'proposta', label: 'Proposta', color: 'bg-amber-500' },
		{ id: 'negociacao', label: 'Negociação', color: 'bg-pink-500' },
		{ id: 'fechado_ganho', label: 'Fechados', color: 'bg-emerald-500' },
	];

	return (
		<div className="space-y-6">
			<MotionWrapper>
				<div className="flex items-center justify-between">
					<div>
						<h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
							Dashboard
						</h1>
						<p className="font-sans text-base text-muted-foreground">
							Visão geral do Grupo US em tempo real
						</p>
					</div>
					<Select
						value={period}
						onValueChange={(value: '7d' | '30d' | '90d' | 'year') => setPeriod(value)}
					>
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
			</MotionWrapper>

			<MotionWrapper className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" stagger={100}>
				{!metrics ? (
					<>
						<Skeleton className="h-32 w-full" />
						<Skeleton className="h-32 w-full" />
						<Skeleton className="h-32 w-full" />
						<Skeleton className="h-32 w-full" />
					</>
				) : (
					<>
						<StatsCard
							title="Leads este mês"
							value={metrics.totalLeads || 0}
							icon={Users}
							trend={{
								value: metrics.leadsTrend || 0,
								isPositive: (metrics.leadsTrend || 0) > 0,
							}}
							description="vs. período anterior"
						/>
						<StatsCard
							title="Taxa de Conversão"
							value={metrics ? `${metrics.conversionRate}%` : '0%'}
							description="vs. período anterior"
							icon={TrendingUp}
							trend={{
								value: metrics.conversionTrend || 0,
								isPositive: (metrics.conversionTrend || 0) > 0,
							}}
						/>
						<StatsCard
							title="Faturamento"
							value={metrics ? formatCurrency(metrics.revenue) : 'R$ 0'}
							description="vs. período anterior"
							icon={DollarSign}
							trend={{
								value: metrics.revenueTrend || 0,
								isPositive: (metrics.revenueTrend || 0) > 0,
							}}
						/>
						<StatsCard
							title="Mensagens"
							value={metrics?.totalMessages?.toString() || '0'}
							description="últimas 24h"
							icon={MessageSquare}
						/>
					</>
				)}
			</MotionWrapper>

			<MotionWrapper className="grid gap-4 md:grid-cols-2" stagger={100}>
				<Card className="glass-card">
					<CardHeader>
						<CardTitle className="font-display text-2xl font-semibold">
							Leads vs Conversões
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="h-[300px] min-h-[250px] md:h-[300px]">
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={chartData}>
									<defs>
										<linearGradient id={gradientLeadsId} x1="0" y1="0" x2="0" y2="1">
											<stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
											<stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
										</linearGradient>
										<linearGradient id={gradientConversoesId} x1="0" y1="0" x2="0" y2="1">
											<stop offset="0%" stopColor="hsl(142 76% 36%)" stopOpacity={0.3} />
											<stop offset="100%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
										</linearGradient>
									</defs>
									<CartesianGrid
										strokeDasharray="3 3"
										stroke="hsl(var(--muted-foreground) / 0.2)"
									/>
									<XAxis
										dataKey="name"
										className="text-xs"
										stroke="hsl(var(--muted-foreground) / 0.5)"
									/>
									<YAxis className="text-xs" stroke="hsl(var(--muted-foreground) / 0.5)" />
									<Tooltip
										contentStyle={{
											background: 'hsl(var(--card) / 0.6)',
											backdropFilter: 'blur(24px) saturate(180%)',
											border: '1px solid hsl(var(--border) / 0.5)',
											borderRadius: '0.5rem',
											boxShadow: '0 8px 32px -8px hsl(var(--primary) / 0.1)',
										}}
									/>
									<Area
										type="monotone"
										dataKey="leads"
										stackId="1"
										stroke="hsl(var(--primary))"
										strokeWidth={2}
										fill={`url(#${gradientLeadsId})`}
										animationDuration={1000}
										animationEasing="ease-out"
									/>
									<Area
										type="monotone"
										dataKey="conversoes"
										stackId="2"
										stroke="hsl(142 76% 36%)"
										strokeWidth={2}
										fill={`url(#${gradientConversoesId})`}
										animationDuration={1000}
										animationEasing="ease-out"
									/>
								</AreaChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>

				<Card className="glass-card">
					<CardHeader>
						<CardTitle className="font-display text-2xl font-semibold">Leads por Produto</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{metrics?.leadsByProduct
								? Object.entries(metrics.leadsByProduct)
										.sort(([, a], [, b]) => (b as number) - (a as number))
										.map(([product, value]) => {
											const allValues = Object.values(metrics.leadsByProduct || {}) as number[];
											const maxValue = Math.max(...allValues, 1);
											return (
												<div key={product} className="space-y-1">
													<div className="flex justify-between text-sm font-sans">
														<span>{productLabels[product] || product}</span>
														<span className="font-medium font-display tabular-nums">
															{value as number}
														</span>
													</div>
													<div className="h-2 rounded-full bg-muted overflow-hidden">
														<div
															className="h-full rounded-full progress-bar"
															style={{
																width: `${((value as number) / maxValue) * 100}%`,
																background: `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--us-purple-light)))`,
															}}
														/>
													</div>
												</div>
											);
										})
								: [
										{ name: 'TRINTAE3', value: 45 },
										{ name: 'Black NEON', value: 28 },
										{ name: 'Comunidade US', value: 32 },
									].map((item) => (
										<div key={item.name} className="space-y-1">
											<div className="flex justify-between text-sm font-sans">
												<span>{item.name}</span>
												<span className="font-medium font-display tabular-nums">{item.value}</span>
											</div>
											<div className="h-2 rounded-full bg-muted overflow-hidden">
												<div
													className="h-full rounded-full progress-bar"
													style={{
														width: `${(item.value / 50) * 100}%`,
														background: `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--us-purple-light)))`,
													}}
												/>
											</div>
										</div>
									))}
						</div>
					</CardContent>
				</Card>
			</MotionWrapper>

			<MotionWrapper className="grid gap-4 md:grid-cols-2" stagger={100}>
				<Card className="glass-card">
					<CardHeader>
						<CardTitle className="font-display text-2xl font-semibold">
							Funil de Conversão
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{funnelStages.map((stage) => {
							const value = metrics?.funnel?.[stage.id as keyof typeof metrics.funnel] || 0;
							const maxValue = metrics?.funnel?.novo || 100;
							const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

							return (
								<div key={stage.id} className="space-y-1">
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">{stage.label}</span>
										<span className="font-medium">{value}</span>
									</div>
									<div className="h-2 rounded-full bg-muted overflow-hidden">
										<div
											className={cn('h-full rounded-full transition-all', stage.color)}
											style={{ width: `${percentage}%` }}
										/>
									</div>
								</div>
							);
						})}
					</CardContent>
				</Card>

				<Card className="glass-card">
					<CardHeader>
						<CardTitle className="font-display text-2xl font-semibold">Tempo de Resposta</CardTitle>
					</CardHeader>
					<CardContent>
						{!metrics ? (
							<Skeleton className="h-32 w-full" />
						) : (
							<div className="space-y-4">
								<div className="text-center">
									<div className="font-display text-4xl font-bold tabular-nums">
										{metrics.avgResponseTime || 0}min
									</div>
									<p className="text-sm text-muted-foreground mt-2">Tempo médio de resposta</p>
									{metrics.responseTimeTrend !== undefined && metrics.responseTimeTrend !== 0 && (
										<div className="flex items-center justify-center gap-2 mt-2">
											<span
												className={cn(
													'text-xs font-medium',
													metrics.responseTimeTrend > 0 ? 'text-red-500' : 'text-green-500',
												)}
											>
												{metrics.responseTimeTrend > 0 ? '+' : ''}
												{metrics.responseTimeTrend}%
											</span>
											<span className="text-xs text-muted-foreground">vs. período anterior</span>
										</div>
									)}
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</MotionWrapper>

			<MotionWrapper className="grid gap-4 md:grid-cols-2" stagger={100}>
				<Card className="glass-card">
					<CardHeader>
						<CardTitle className="font-display text-2xl font-semibold">
							Performance do Time
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{!teamPerformance ? (
								<>
									<Skeleton className="h-16 w-full" />
									<Skeleton className="h-16 w-full" />
									<Skeleton className="h-16 w-full" />
								</>
							) : teamPerformance.length > 0 ? (
								teamPerformance.map(
									(member: {
										_id: string;
										name: string;
										role: string;
										metric: number;
										metricLabel: string;
									}) => (
										<div key={member._id} className="flex items-center gap-3">
											<Avatar className="h-9 w-9">
												<AvatarFallback className="text-xs bg-primary/10 text-primary">
													{member.name
														.split(' ')
														.map((n: string) => n[0])
														.join('')
														.slice(0, 2)
														.toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium truncate">{member.name}</p>
												<p className="text-xs text-muted-foreground">{member.role}</p>
											</div>
											<div className="text-right">
												<p className="text-sm font-medium">{member.metric}</p>
												<p className="text-xs text-muted-foreground">{member.metricLabel}</p>
											</div>
										</div>
									),
								)
							) : (
								<p className="text-sm text-muted-foreground text-center py-4">
									Nenhum membro do time encontrado
								</p>
							)}
						</div>
					</CardContent>
				</Card>

				<Card className="glass-card">
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle className="font-display text-2xl font-semibold">Alertas de Risco</CardTitle>
						<AlertTriangle className="h-4 w-4 text-amber-500" />
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{!churnAlerts ? (
								<Skeleton className="h-16 w-full" />
							) : churnAlerts.length > 0 ? (
								churnAlerts.map((alert) => (
									<div
										key={alert._id}
										className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10"
									>
										<div>
											<p className="text-sm font-medium">{alert.studentName}</p>
											<p className="text-xs text-muted-foreground">{alert.reason}</p>
										</div>
										<Badge variant="outline" className="text-amber-600 border-amber-600">
											{alert.risk}
										</Badge>
									</div>
								))
							) : (
								<p className="text-sm text-muted-foreground text-center py-4">
									Nenhum alerta no momento 🎉
								</p>
							)}
						</div>
					</CardContent>
				</Card>
			</MotionWrapper>

			<MotionWrapper>
				<Card className="glass-card">
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle className="font-display text-2xl font-semibold">Leads Recentes</CardTitle>
						<Link to="/crm">
							<Button variant="ghost" size="sm">
								Ver todos <ArrowRight className="h-4 w-4 ml-1" />
							</Button>
						</Link>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{!recentLeads ? (
								<>
									<Skeleton className="h-16 w-full" />
									<Skeleton className="h-16 w-full" />
									<Skeleton className="h-16 w-full" />
								</>
							) : recentLeads.length > 0 ? (
								recentLeads.map((lead: Doc<'leads'>) => {
									const TempIcon = tempConfig[lead.temperature].icon;
									return (
										<div
											key={lead._id}
											className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
										>
											<Avatar className="h-9 w-9">
												<AvatarFallback className="text-xs bg-primary/10 text-primary">
													{lead.name
														.split(' ')
														.map((n: string) => n[0])
														.join('')
														.slice(0, 2)
														.toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium truncate">{lead.name}</p>
												<p className="text-xs text-muted-foreground">
													{productLabels[lead.interestedProduct || 'indefinido'] || 'Indefinido'}
												</p>
											</div>
											<div className={cn('p-1.5 rounded-full', tempConfig[lead.temperature].bg)}>
												<TempIcon
													className={cn('h-3.5 w-3.5', tempConfig[lead.temperature].color)}
												/>
											</div>
											<span className="text-xs text-muted-foreground">
												{formatDistanceToNow(lead.createdAt, { addSuffix: true, locale: ptBR })}
											</span>
										</div>
									);
								})
							) : (
								<p className="text-sm text-muted-foreground text-center py-4">
									Nenhum lead recente encontrado
								</p>
							)}
						</div>
					</CardContent>
				</Card>
			</MotionWrapper>
		</div>
	);
}

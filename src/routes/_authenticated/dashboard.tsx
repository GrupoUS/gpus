'use client';

import { api } from '@convex/_generated/api';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { AlertTriangle, DollarSign, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { Component, lazy, type ReactNode, Suspense, useState } from 'react';

// Keep lightweight components as regular imports
import { StatsCard } from '@/components/dashboard/stats-card';
import { Button } from '@/components/ui/button';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy chart components
const ChurnAlerts = lazy(() =>
	import('@/components/dashboard/churn-alerts').then((m) => ({ default: m.ChurnAlerts })),
);
const FunnelChart = lazy(() =>
	import('@/components/dashboard/funnel-chart').then((m) => ({ default: m.FunnelChart })),
);
const LeadsByProduct = lazy(() =>
	import('@/components/dashboard/leads-by-product').then((m) => ({ default: m.LeadsByProduct })),
);
const LeadsVsConversions = lazy(() =>
	import('@/components/dashboard/leads-vs-conversions').then((m) => ({
		default: m.LeadsVsConversions,
	})),
);
const RecentLeads = lazy(() =>
	import('@/components/dashboard/recent-leads').then((m) => ({ default: m.RecentLeads })),
);
const ResponseTime = lazy(() =>
	import('@/components/dashboard/response-time').then((m) => ({ default: m.ResponseTime })),
);
const TeamPerformance = lazy(() =>
	import('@/components/dashboard/team-performance').then((m) => ({ default: m.TeamPerformance })),
);

export const Route = createFileRoute('/_authenticated/dashboard')({
	component: DashboardPage,
});

function DashboardPage() {
	const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'year'>('30d');

	const metrics = useQuery(api.metrics.getDashboard, { period });
	const teamPerformance = useQuery(api.metrics.getTeamPerformance, { period });
	const churnAlerts = useQuery(api.students.getChurnAlerts);
	const recentLeads = useQuery(api.leads.recent, { limit: 5 });

	// Format currency

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
			maximumFractionDigits: 0,
		}).format(value);
	};

	return (
		<DashboardErrorBoundary>
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
				</MotionWrapper>

				<MotionWrapper>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
					</div>
				</MotionWrapper>

				<MotionWrapper className="grid gap-4 md:grid-cols-2" stagger={100}>
					<Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
						<LeadsVsConversions data={metrics?.dailyMetrics} />
					</Suspense>
					<Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
						<LeadsByProduct data={metrics?.leadsByProduct} />
					</Suspense>
				</MotionWrapper>

				<MotionWrapper className="grid gap-4 md:grid-cols-2" stagger={100}>
					<Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
						<FunnelChart data={metrics?.funnel} />
					</Suspense>
					<Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
						<ResponseTime
							avgResponseTime={metrics?.avgResponseTime}
							trend={metrics?.responseTimeTrend}
						/>
					</Suspense>
				</MotionWrapper>

				<MotionWrapper className="grid gap-4 md:grid-cols-2" stagger={100}>
					<Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
						<TeamPerformance data={teamPerformance} />
					</Suspense>
					<Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
						<ChurnAlerts data={churnAlerts} />
					</Suspense>
				</MotionWrapper>

				<MotionWrapper>
					<Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
						<RecentLeads data={recentLeads} />
					</Suspense>
				</MotionWrapper>
			</div>
		</DashboardErrorBoundary>
	);
}

class DashboardErrorBoundary extends Component<
	{ children: ReactNode },
	{ hasError: boolean; error: Error | null }
> {
	constructor(props: { children: ReactNode }) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error };
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-background p-8 text-center animate-in fade-in zoom-in-95">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
						<AlertTriangle className="h-6 w-6 text-destructive" />
					</div>
					<div className="space-y-1">
						<h3 className="text-lg font-semibold">Erro ao carregar dashboard</h3>
						<p className="max-w-xs text-muted-foreground text-sm">
							{this.state.error?.message || 'Ocorreu um erro inesperado.'}
						</p>
					</div>
					<Button onClick={() => window.location.reload()}>Tentar novamente</Button>
				</div>
			);
		}
		return this.props.children;
	}
}

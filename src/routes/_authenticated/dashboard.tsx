'use client';

import { api } from '@convex/_generated/api';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { DollarSign, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';

import { ChurnAlerts } from '@/components/dashboard/churn-alerts';
import { FunnelChart } from '@/components/dashboard/funnel-chart';
import { LeadsByProduct } from '@/components/dashboard/leads-by-product';
import { LeadsVsConversions } from '@/components/dashboard/leads-vs-conversions';
import { RecentLeads } from '@/components/dashboard/recent-leads';
import { ResponseTime } from '@/components/dashboard/response-time';
import { StatsCard } from '@/components/dashboard/stats-card';
import { TeamPerformance } from '@/components/dashboard/team-performance';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

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
				<LeadsVsConversions data={metrics?.dailyMetrics} />
				<LeadsByProduct data={metrics?.leadsByProduct} />
			</MotionWrapper>

			<MotionWrapper className="grid gap-4 md:grid-cols-2" stagger={100}>
				<FunnelChart data={metrics?.funnel} />
				<ResponseTime
					avgResponseTime={metrics?.avgResponseTime}
					trend={metrics?.responseTimeTrend}
				/>
			</MotionWrapper>

			<MotionWrapper className="grid gap-4 md:grid-cols-2" stagger={100}>
				<TeamPerformance data={teamPerformance} />
				<ChurnAlerts data={churnAlerts} />
			</MotionWrapper>

			<MotionWrapper>
				<RecentLeads data={recentLeads} />
			</MotionWrapper>
		</div>
	);
}

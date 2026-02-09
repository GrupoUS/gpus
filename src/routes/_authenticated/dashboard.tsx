'use client';

import { createFileRoute } from '@tanstack/react-router';
import { AlertTriangle, DollarSign, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { Component, lazy, type ReactNode, Suspense, useState } from 'react';

import { trpc } from '../../lib/trpc';
// Keep lightweight components as regular imports
import { StatsCard } from '@/components/dashboard/stats-card';
import { Badge } from '@/components/ui/badge';
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

interface Vendor {
	id: string;
	name: string;
}

interface DailyMetric {
	date: string;
	newLeads: number;
	conversions: number;
	conversionValue: number;
	messagesReceived: number;
	messagesSent: number;
}

interface FunnelData {
	novo: number;
	primeiro_contato: number;
	qualificado: number;
	proposta: number;
	negociacao: number;
	fechado_ganho: number;
}

interface DashboardMetrics {
	totalLeads: number;
	leadsTrend?: number;
	conversionRate: number;
	conversionTrend?: number;
	revenue: number;
	revenueTrend?: number;
	totalMessages?: number;
	dailyMetrics?: DailyMetric[];
	leadsByProduct?: Record<string, number>;
	funnel?: FunnelData;
	avgResponseTime?: number;
	responseTimeTrend?: number;
}

interface TeamPerformanceItem {
	id: string;
	name: string;
	role: string;
	metric: number;
	metricLabel: string;
}

interface ChurnAlert {
	_id: number;
	studentName: string;
	reason: string;
	risk: 'alto' | 'medio';
}

interface StatsCardsSectionProps {
	metrics: DashboardMetrics | undefined;
	formatCurrency: (value: number) => string;
}

function getDashboardTitle(isManager: boolean, selectedVendor?: Vendor) {
	if (!isManager) return 'Meu Dashboard';
	if (selectedVendor) return `Dashboard - ${selectedVendor.name.split(' ')[0]}`;
	return 'Dashboard';
}

function StatsCardsSection({ metrics, formatCurrency }: StatsCardsSectionProps) {
	if (!metrics) {
		return (
			<>
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-32 w-full" />
			</>
		);
	}

	return (
		<>
			<StatsCard
				description="vs. período anterior"
				icon={Users}
				title="Leads este mês"
				trend={{
					value: metrics.leadsTrend || 0,
					isPositive: (metrics.leadsTrend || 0) > 0,
				}}
				value={metrics.totalLeads || 0}
			/>
			<StatsCard
				description="vs. período anterior"
				icon={TrendingUp}
				title="Taxa de Conversão"
				trend={{
					value: metrics.conversionTrend || 0,
					isPositive: (metrics.conversionTrend || 0) > 0,
				}}
				value={`${metrics.conversionRate.toFixed(1)}%`}
			/>
			<StatsCard
				description="vs. período anterior"
				icon={DollarSign}
				title="Faturamento"
				trend={{
					value: metrics.revenueTrend || 0,
					isPositive: (metrics.revenueTrend || 0) > 0,
				}}
				value={formatCurrency(metrics.revenue)}
			/>
			<StatsCard
				description="últimas 24h"
				icon={MessageSquare}
				title="Mensagens"
				value={metrics.totalMessages?.toString() || '0'}
			/>
		</>
	);
}

function DashboardPage() {
	const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'year'>('30d');
	const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

	const { data: currentUser } = trpc.users.me.useQuery();
	// TODO: Implement metrics, team performance, and churn alerts in tRPC routers
	const vendors: Vendor[] | undefined = undefined; // TODO: trpc.users.listVendors
	const isManager = currentUser && ['manager', 'admin', 'owner'].includes(currentUser.role);
	const selectedVendor = vendors?.find((vendor) => vendor.id === selectedVendorId);

	const metrics: DashboardMetrics | undefined = undefined; // TODO: trpc.metrics.getDashboard
	const teamPerformance: TeamPerformanceItem[] | undefined = undefined; // TODO: trpc.metrics.getTeamPerformance
	const churnAlerts: ChurnAlert[] | undefined = undefined; // TODO: trpc.students.getChurnAlerts
	const recentLeads: Record<string, unknown>[] | undefined = undefined; // TODO: trpc.leads.recent
	const teamPerformanceData = teamPerformance;

	// Format currency

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
			maximumFractionDigits: 0,
		}).format(value);
	};

	const dashboardTitle = getDashboardTitle(Boolean(isManager), selectedVendor);

	return (
		<DashboardErrorBoundary>
			<div className="space-y-6">
				<MotionWrapper>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<div className="flex items-center gap-2">
								<h1 className="font-bold font-display text-4xl tracking-tight md:text-5xl">
									{dashboardTitle}
								</h1>
								{selectedVendor && <Badge variant="secondary">{selectedVendor.name}</Badge>}
								{!isManager && currentUser && (
									<Badge variant="outline">Visualização Individual</Badge>
								)}
							</div>
							<p className="font-sans text-base text-muted-foreground">
								Visão geral do Grupo US em tempo real
							</p>
						</div>
						<div className="flex gap-2">
							{isManager && (
								<Select
									onValueChange={(value) => setSelectedVendorId(value === 'all' ? null : value)}
									value={selectedVendorId || 'all'}
								>
									<SelectTrigger className="w-[200px]">
										<SelectValue placeholder="Todos os Vendedores" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Todos os Vendedores</SelectItem>
										{vendors?.map((vendor) => (
											<SelectItem key={vendor.id} value={vendor.id}>
												{vendor.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
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
					</div>
				</MotionWrapper>

				<MotionWrapper>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
						<StatsCardsSection formatCurrency={formatCurrency} metrics={metrics} />
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
						<TeamPerformance data={teamPerformanceData} />
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

// biome-ignore lint/style/useReactFunctionComponents: Error Boundaries must be class components
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
				<div className="fade-in zoom-in-95 flex min-h-[50vh] animate-in flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-background p-8 text-center">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
						<AlertTriangle className="h-6 w-6 text-destructive" />
					</div>
					<div className="space-y-1">
						<h3 className="font-semibold text-lg">Erro ao carregar dashboard</h3>
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

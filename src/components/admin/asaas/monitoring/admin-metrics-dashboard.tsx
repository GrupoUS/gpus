/**
 * Admin Metrics Dashboard
 *
 * Real-time metrics for Asaas synchronization including:
 * - API health status
 * - Sync statistics
 * - Active alerts
 * - Recent performance metrics
 */

import { api } from '@convex/_generated/api';
import { useQuery } from 'convex/react';
import { Activity, AlertTriangle, CheckCircle2, Clock, Database, XCircle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Type for sync log from Asaas
interface SyncLog {
	status: 'pending' | 'running' | 'completed' | 'failed';
	[key: string]: unknown;
}

// Type for endpoint stats from API
interface EndpointStats {
	endpoint: string;
	count: number;
	errorRate: number;
	avgTime: number;
}

// Type for error stats
interface ErrorStats {
	endpoint: string;
	errors: number;
	errorRate: number;
}

interface ApiUsageStats {
	totalRequests: number;
	errorRate: number;
	avgResponseTime: number;
	topEndpoints: EndpointStats[];
	errorsByEndpoint: ErrorStats[];
}

export function AdminMetricsDashboard() {
	const useQueryUnsafe = useQuery as unknown as <T>(query: unknown, args?: unknown) => T | null;
	const apiAny = api as unknown as {
		asaas: {
			getApiUsageStats: unknown;
			sync: { getRecentSyncLogs: unknown };
		};
	};
	// Get API usage stats for last 24 hours
	const apiStats = useQueryUnsafe<ApiUsageStats>(apiAny.asaas.getApiUsageStats, { hours: 24 });

	// Get sync statistics (would need to be implemented in queries)
	const syncStats = useQueryUnsafe<SyncLog[]>(apiAny.asaas.sync.getRecentSyncLogs, {
		limit: 100,
	});

	// Get active alerts (would need to be implemented in monitoring.ts)
	// const activeAlerts = useQuery(api.asaas.monitoring.getActiveAlerts, {});

	if (!(apiStats && syncStats)) {
		return <MetricsDashboardSkeleton />;
	}

	// Calculate sync stats from logs
	const completedSyncs = syncStats.filter((s: SyncLog) => s.status === 'completed');
	const failedSyncs = syncStats.filter((s: SyncLog) => s.status === 'failed');
	const successRate = syncStats.length > 0 ? (completedSyncs.length / syncStats.length) * 100 : 0;

	// Status determination
	const getHealthStatus = (value: number, thresholds: { healthy: number; degraded: number }) => {
		if (value < thresholds.healthy) return 'healthy';
		if (value < thresholds.degraded) return 'degraded';
		return 'critical';
	};

	const apiHealthStatus = getHealthStatus(apiStats.errorRate, { healthy: 5, degraded: 20 });
	const getSyncHealthStatus = (rate: number) => {
		if (rate > 95) return 'healthy';
		if (rate > 80) return 'degraded';
		return 'critical';
	};
	const syncHealthStatus = getSyncHealthStatus(successRate);

	const getResponseTimeStatus = (time: number) => {
		if (time < 500) return 'healthy';
		if (time < 1000) return 'degraded';
		return 'critical';
	};

	const getErrorRateColor = (rate: number) => {
		if (rate < 5) return 'text-green-600';
		if (rate < 20) return 'text-yellow-600';
		return 'text-red-600';
	};

	return (
		<div className="space-y-6">
			{/* Status Overview */}
			<div className="grid gap-4 md:grid-cols-3">
				<StatusCard
					metric={apiStats.totalRequests}
					metricLabel="Total requests"
					status={apiHealthStatus}
					subtitle="Error rate (24h)"
					title="API Health"
					value={`${apiStats.errorRate}%`}
				/>
				<StatusCard
					metric={completedSyncs.length}
					metricLabel="Successful syncs"
					status={syncHealthStatus}
					subtitle="Success rate"
					title="Sync Health"
					value={`${Math.round(successRate)}%`}
				/>
				<StatusCard
					metric={apiStats.topEndpoints?.[0]?.count || 0}
					metricLabel="Top endpoint calls"
					status={getResponseTimeStatus(apiStats.avgResponseTime)}
					subtitle="Average API response"
					title="Avg Response Time"
					value={`${apiStats.avgResponseTime}ms`}
				/>
			</div>

			{/* Sync Statistics */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Database className="h-5 w-5 text-blue-500" />
						Estatísticas de Sincronização
					</CardTitle>
					<CardDescription>Últimas 100 sincronizações</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-4">
						<StatItem
							icon={<Activity className="h-4 w-4 text-blue-500" />}
							label="Total Syncs"
							value={syncStats.length}
						/>
						<StatItem
							icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
							label="Concluídas"
							value={completedSyncs.length}
						/>
						<StatItem
							icon={<XCircle className="h-4 w-4 text-red-500" />}
							label="Falharam"
							value={failedSyncs.length}
						/>
						<StatItem
							icon={<Clock className="h-4 w-4 text-yellow-500" />}
							label="Em Execução"
							value={syncStats.filter((s: SyncLog) => s.status === 'running').length}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Top Endpoints */}
			<Card>
				<CardHeader>
					<CardTitle>Endpoints Mais Utilizados</CardTitle>
					<CardDescription>Últimas 24 horas</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{apiStats.topEndpoints.slice(0, 5).map((endpoint: EndpointStats, i: number) => (
							<div className="flex items-center justify-between text-sm" key={i}>
								<div className="flex flex-1 items-center gap-2">
									<span className="rounded bg-muted px-2 py-1 font-mono text-xs">
										{endpoint.endpoint}
									</span>
								</div>
								<div className="flex items-center gap-4">
									<span className="text-muted-foreground">{endpoint.count} calls</span>
									<span className={getErrorRateColor(endpoint.errorRate)}>
										{endpoint.errorRate}% errors
									</span>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Errors by Endpoint */}
			{apiStats.errorsByEndpoint.length > 0 && (
				<Card className="border-red-200 dark:border-red-900">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
							<AlertTriangle className="h-5 w-5" />
							Erros por Endpoint
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{apiStats.errorsByEndpoint.map((error: ErrorStats, i: number) => (
								<div
									className="flex items-center justify-between border-b py-2 text-sm last:border-0"
									key={i}
								>
									<span className="font-mono text-xs">{error.endpoint}</span>
									<span className="text-red-600">
										{error.errors} erros ({error.errorRate}%)
									</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

interface StatusCardProps {
	title: string;
	status: 'healthy' | 'degraded' | 'critical';
	value: string;
	subtitle: string;
	metric: number;
	metricLabel: string;
}

function StatusCard({ title, status, value, subtitle, metric, metricLabel }: StatusCardProps) {
	const statusConfig = {
		healthy: { color: 'text-green-600', bg: 'bg-green-500/10', icon: CheckCircle2 },
		degraded: { color: 'text-yellow-600', bg: 'bg-yellow-500/10', icon: AlertTriangle },
		critical: { color: 'text-red-600', bg: 'bg-red-500/10', icon: XCircle },
	};

	const config = statusConfig[status];
	const Icon = config.icon;

	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-base">{title}</CardTitle>
					<div className={`rounded-lg p-2 ${config.bg}`}>
						<Icon className={`h-4 w-4 ${config.color}`} />
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className={`font-bold text-2xl ${config.color}`}>{value}</div>
				<p className="mt-1 text-muted-foreground text-xs">{subtitle}</p>
				<div className="mt-3 border-t pt-3">
					<div className="text-muted-foreground text-xs">{metricLabel}</div>
					<div className="font-medium text-sm">{metric.toLocaleString()}</div>
				</div>
			</CardContent>
		</Card>
	);
}

interface StatItemProps {
	icon: React.ReactNode;
	label: string;
	value: number;
}

function StatItem({ icon, label, value }: StatItemProps) {
	return (
		<div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
			{icon}
			<div>
				<div className="text-muted-foreground text-sm">{label}</div>
				<div className="font-semibold text-lg">{value}</div>
			</div>
		</div>
	);
}

function MetricsDashboardSkeleton() {
	return (
		<div className="space-y-6">
			<div className="grid gap-4 md:grid-cols-3">
				{[1, 2, 3].map((i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-5 w-24" />
						</CardHeader>
						<CardContent>
							<Skeleton className="mb-2 h-8 w-16" />
							<Skeleton className="h-4 w-32" />
						</CardContent>
					</Card>
				))}
			</div>
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-4">
						{[1, 2, 3, 4].map((i) => (
							<Skeleton className="h-16 w-full" key={i} />
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

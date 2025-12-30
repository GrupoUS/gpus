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

export function AdminMetricsDashboard() {
	// Get API usage stats for last 24 hours
	const apiStats = useQuery(api.asaas.getApiUsageStats, { hours: 24 });

	// Get sync statistics (would need to be implemented in queries)
	const syncStats = useQuery(api.asaas.sync.getRecentSyncLogs, { limit: 100 });

	// Get active alerts (would need to be implemented in monitoring.ts)
	// const activeAlerts = useQuery(api.asaas.monitoring.getActiveAlerts, {});

	if (!(apiStats && syncStats)) {
		return <MetricsDashboardSkeleton />;
	}

	// Calculate sync stats from logs
	const completedSyncs = syncStats.filter((s) => s.status === 'completed');
	const failedSyncs = syncStats.filter((s) => s.status === 'failed');
	const successRate = syncStats.length > 0 ? (completedSyncs.length / syncStats.length) * 100 : 0;

	// Status determination
	const apiHealthStatus =
		apiStats.errorRate < 5 ? 'healthy' : apiStats.errorRate < 20 ? 'degraded' : 'critical';
	const syncHealthStatus =
		successRate > 95 ? 'healthy' : successRate > 80 ? 'degraded' : 'critical';

	return (
		<div className="space-y-6">
			{/* Status Overview */}
			<div className="grid gap-4 md:grid-cols-3">
				<StatusCard
					title="API Health"
					status={apiHealthStatus}
					value={`${apiStats.errorRate}%`}
					subtitle="Error rate (24h)"
					metric={apiStats.totalRequests}
					metricLabel="Total requests"
				/>
				<StatusCard
					title="Sync Health"
					status={syncHealthStatus}
					value={`${Math.round(successRate)}%`}
					subtitle="Success rate"
					metric={completedSyncs.length}
					metricLabel="Successful syncs"
				/>
				<StatusCard
					title="Avg Response Time"
					status={
						apiStats.avgResponseTime < 500
							? 'healthy'
							: apiStats.avgResponseTime < 1000
								? 'degraded'
								: 'critical'
					}
					value={`${apiStats.avgResponseTime}ms`}
					subtitle="Average API response"
					metric={apiStats.topEndpoints?.[0]?.count || 0}
					metricLabel="Top endpoint calls"
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
							value={syncStats.filter((s) => s.status === 'running').length}
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
						{apiStats.topEndpoints.slice(0, 5).map((endpoint, i) => (
							<div key={i} className="flex items-center justify-between text-sm">
								<div className="flex items-center gap-2 flex-1">
									<span className="font-mono text-xs bg-muted px-2 py-1 rounded">
										{endpoint.endpoint}
									</span>
								</div>
								<div className="flex items-center gap-4">
									<span className="text-muted-foreground">{endpoint.count} calls</span>
									<span
										className={`${endpoint.errorRate < 5 ? 'text-green-600' : endpoint.errorRate < 20 ? 'text-yellow-600' : 'text-red-600'}`}
									>
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
							{apiStats.errorsByEndpoint.map((error, i) => (
								<div
									key={i}
									className="flex items-center justify-between text-sm py-2 border-b last:border-0"
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
					<div className={`p-2 rounded-lg ${config.bg}`}>
						<Icon className={`h-4 w-4 ${config.color}`} />
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className={`text-2xl font-bold ${config.color}`}>{value}</div>
				<p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
				<div className="mt-3 pt-3 border-t">
					<div className="text-xs text-muted-foreground">{metricLabel}</div>
					<div className="text-sm font-medium">{metric.toLocaleString()}</div>
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
		<div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
			{icon}
			<div>
				<div className="text-sm text-muted-foreground">{label}</div>
				<div className="text-lg font-semibold">{value}</div>
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
							<Skeleton className="h-8 w-16 mb-2" />
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
							<Skeleton key={i} className="h-16 w-full" />
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

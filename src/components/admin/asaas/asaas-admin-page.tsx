/**
 * Asaas Admin Page Component
 *
 * Main admin interface with tabs for:
 * - Dashboard (real-time metrics)
 * - Synchronization (manual controls + auto-sync config)
 * - Export (bidirectional data export)
 * - History (detailed sync logs with pagination)
 */

import type { Doc } from '@convex/_generated/dataModel';
import { Activity, Database, Download, FileText, RefreshCw } from 'lucide-react';
import React from 'react';

import { AdminMetricsDashboard } from './monitoring/admin-metrics-dashboard';
import { AdminExportDialog } from './sync-controls/admin-export-dialog';
import { AdminSyncControls } from './sync-controls/admin-sync-controls';
import { AdminSyncHistory } from './sync-history/admin-sync-history';

interface AsaasAdminPageProps {
	syncStatus: Record<string, Doc<'asaasSyncLogs'> | null> | null | undefined;
	recentLogs: Doc<'asaasSyncLogs'>[] | null | undefined;
}

type TabValue = 'dashboard' | 'sync' | 'export' | 'history';

function AsaasAdminPage({ syncStatus, recentLogs }: AsaasAdminPageProps) {
	const [activeTab, setActiveTab] = React.useState<TabValue>('dashboard');

	// Get most recent sync from all types (prioritize customers)
	const latestSync =
		syncStatus?.customers ||
		syncStatus?.payments ||
		syncStatus?.subscriptions ||
		syncStatus?.financial ||
		null;

	const tabs = [
		{ value: 'dashboard' as const, label: 'Dashboard', icon: Activity },
		{ value: 'sync' as const, label: 'Sincronização', icon: RefreshCw },
		{ value: 'export' as const, label: 'Exportar', icon: Download },
		{ value: 'history' as const, label: 'Histórico', icon: FileText },
	];

	return (
		<div className="mx-auto max-w-7xl space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Administração Asaas</h1>
					<p className="mt-1 text-muted-foreground">
						Gerencie sincronização, exportação e monitoramento
					</p>
				</div>
				{latestSync && (
					<div className="flex items-center gap-2 text-muted-foreground text-sm">
						<Database className="h-4 w-4" />
						<span>
							Última sync: {latestSync.syncType} -{' '}
							{new Date(latestSync.startedAt).toLocaleString('pt-BR')}
						</span>
					</div>
				)}
			</div>

			{/* Tabs Navigation */}
			<div className="border-b">
				<nav aria-label="Tabs" className="flex gap-1">
					{tabs.map((tab) => {
						const Icon = tab.icon;
						return (
							<button
								className={`flex items-center gap-2 border-b-2 px-4 py-3 transition-colors ${
									activeTab === tab.value
										? 'border-primary font-medium text-primary'
										: 'border-transparent text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground'
								}`}
								key={tab.value}
								onClick={() => setActiveTab(tab.value)}
								type="button"
							>
								<Icon className="h-4 w-4" />
								{tab.label}
							</button>
						);
					})}
				</nav>
			</div>

			{/* Tab Content */}
			<div className="mt-6">
				{activeTab === 'dashboard' && <AdminMetricsDashboard />}
				{activeTab === 'sync' && <AdminSyncControls />}
				{activeTab === 'export' && <AdminExportDialog />}
				{activeTab === 'history' && <AdminSyncHistory logs={recentLogs} />}
			</div>
		</div>
	);
}

// Wrapper component that fetches data internally
import { api } from '@convex/_generated/api';
import { useQuery } from 'convex/react';

export function AsaasAdminPageWrapper() {
	const syncStatusResult = useQuery(api.asaas.sync.getLastSyncStatus, {});
	const recentLogsResult = useQuery(api.asaas.sync.getRecentSyncLogs, {
		limit: 10,
	});

	return <AsaasAdminPage recentLogs={recentLogsResult} syncStatus={syncStatusResult} />;
}

/**
 * Asaas Admin Page Component
 *
 * Main admin interface with tabs for:
 * - Dashboard (real-time metrics)
 * - Synchronization (manual controls + auto-sync config)
 * - Export (bidirectional data export)
 * - History (detailed sync logs with pagination)
 */

import { Activity, Database, Download, FileText, RefreshCw } from 'lucide-react';
import React from 'react';

import { trpc } from '../../../lib/trpc';
import { AdminMetricsDashboard } from './monitoring/admin-metrics-dashboard';
import { AdminExportDialog } from './sync-controls/admin-export-dialog';
import { AdminSyncControls } from './sync-controls/admin-sync-controls';
import { AdminSyncHistory } from './sync-history/admin-sync-history';

type TabValue = 'dashboard' | 'sync' | 'export' | 'history';

function AsaasAdminPage() {
	const [activeTab, setActiveTab] = React.useState<TabValue>('dashboard');

	const { data: recentLogs } = trpc.financial.syncLogs.list.useQuery({ limit: 20 });

	// Derive sync status from recent logs by grouping by syncType
	const latestSync = recentLogs?.[0] ?? null;

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
							Última sync: {latestSync.syncType} –{' '}
							{latestSync.startedAt ? new Date(latestSync.startedAt).toLocaleString('pt-BR') : '—'}
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
				{activeTab === 'history' && <AdminSyncHistory logs={recentLogs ?? null} />}
			</div>
		</div>
	);
}

// Wrapper component — data is now fetched within AsaasAdminPage itself
export function AsaasAdminPageWrapper() {
	return <AsaasAdminPage />;
}

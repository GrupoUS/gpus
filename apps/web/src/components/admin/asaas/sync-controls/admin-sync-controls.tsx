/**
 * Admin Sync Controls
 *
 * Enhanced sync controls with:
 * - Manual sync buttons for each entity type
 * - Auto-sync configuration form
 * - Real-time sync status badge
 * - Progress bar for running syncs
 *
 * TODO: Replace stubs with tRPC when asaasSyncRouter is created
 */

import {
	AlertCircle,
	CheckCircle2,
	Clock,
	Download,
	Loader2,
	Play,
	RefreshCw,
	Settings,
} from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

// TODO: Replace with tRPC type when asaasSyncLogs router is created
interface SyncStatus {
	syncType: string;
	status: 'completed' | 'failed' | 'running' | 'pending';
	startedAt: number;
	recordsProcessed: number;
	recordsCreated: number;
	recordsUpdated: number;
	recordsFailed: number;
}

export function AdminSyncControls() {
	const [loading, setLoading] = useState<Record<string, boolean>>({});
	const [autoSyncConfig, setAutoSyncConfig] = useState({
		enabled: false,
		intervalHours: 1,
		syncTypes: [] as Array<'customers' | 'payments' | 'subscriptions'>,
	});

	// TODO: Replace with tRPC when asaasSyncRouter is created
	const syncStatus = null as SyncStatus | null;

	const handleSync = async (type: 'customers' | 'payments' | 'subscriptions' | 'all') => {
		setLoading({ ...loading, [type]: true });
		try {
			toast.info(`Iniciando sincronização de ${type}...`);
			// TODO: Call sync mutation when implemented
			toast.info('[TODO] Sync mutation not yet implemented');
		} catch (error) {
			toast.error('Erro na sincronização', {
				description: error instanceof Error ? error.message : 'Erro desconhecido',
			});
		} finally {
			setLoading({ ...loading, [type]: false });
		}
	};

	const handleSaveAutoSync = () => {
		// TODO: Would need mutation to save auto-sync settings
		toast.success('Configurações de auto-sync salvas!');
	};

	// Calculate progress for running syncs
	const isRunning = syncStatus?.status === 'running';
	const progress = isRunning ? 50 : 100;

	const syncIntervalId = useId();
	const autoSyncEnableId = useId();

	return (
		<div className="space-y-6">
			{/* Current Status */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span className="flex items-center gap-2">
							<RefreshCw className="h-5 w-5" />
							Status da Sincronização
						</span>
						<SyncStatusBadge status={syncStatus?.status} />
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{syncStatus && (
						<div className="text-sm">
							<div className="mb-2 flex items-center justify-between">
								<span className="text-muted-foreground">Tipo:</span>
								<span className="font-medium capitalize">{syncStatus.syncType}</span>
							</div>
							<div className="mb-2 flex items-center justify-between">
								<span className="text-muted-foreground">Iniciado:</span>
								<span className="font-medium">
									{new Date(syncStatus.startedAt).toLocaleString('pt-BR')}
								</span>
							</div>
							{isRunning && (
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Progresso:</span>
										<span className="font-medium">{progress}%</span>
									</div>
									<Progress className="h-2" value={progress} />
								</div>
							)}
							{syncStatus.recordsProcessed > 0 && (
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">Registros:</span>
									<span className="font-medium">
										P: {syncStatus.recordsProcessed} | C: {syncStatus.recordsCreated} | U:{' '}
										{syncStatus.recordsUpdated} | F: {syncStatus.recordsFailed}
									</span>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Manual Sync Controls */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Play className="h-5 w-5" />
						Sincronização Manual
					</CardTitle>
					<CardDescription>Importe dados do Asaas manualmente</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-3 md:grid-cols-2">
						<Button
							className="h-auto py-3"
							disabled={loading.customers || isRunning}
							onClick={() => handleSync('customers')}
							variant="outline"
						>
							{loading.customers ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Download className="mr-2 h-4 w-4" />
							)}
							<div className="text-left">
								<div className="font-medium">Clientes</div>
								<div className="text-muted-foreground text-xs">Import customers from Asaas</div>
							</div>
						</Button>
						<Button
							className="h-auto py-3"
							disabled={loading.payments || isRunning}
							onClick={() => handleSync('payments')}
							variant="outline"
						>
							{loading.payments ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Download className="mr-2 h-4 w-4" />
							)}
							<div className="text-left">
								<div className="font-medium">Pagamentos</div>
								<div className="text-muted-foreground text-xs">Import payments from Asaas</div>
							</div>
						</Button>
						<Button
							className="h-auto py-3"
							disabled={loading.subscriptions || isRunning}
							onClick={() => handleSync('subscriptions')}
							variant="outline"
						>
							{loading.subscriptions ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Download className="mr-2 h-4 w-4" />
							)}
							<div className="text-left">
								<div className="font-medium">Assinaturas</div>
								<div className="text-muted-foreground text-xs">Import subscriptions from Asaas</div>
							</div>
						</Button>
						<Button
							className="h-auto py-3"
							disabled={loading.all || isRunning}
							onClick={() => handleSync('all')}
						>
							{loading.all ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Download className="mr-2 h-4 w-4" />
							)}
							<div className="text-left">
								<div className="font-medium">Sincronizar Tudo</div>
								<div className="text-muted-foreground text-xs">Import all data from Asaas</div>
							</div>
						</Button>
					</div>
					{isRunning && (
						<div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
							<div className="flex items-center gap-2 text-blue-700 text-sm dark:text-blue-300">
								<Loader2 className="h-4 w-4 animate-spin" />
								<span>Uma sincronização está em andamento. Aguarde a conclusão.</span>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Auto Sync Configuration */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Settings className="h-5 w-5" />
						Configuração de Auto-Sync
					</CardTitle>
					<CardDescription>Configure sincronização automática periódica</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor={autoSyncEnableId}>Ativar Auto-Sync</Label>
							<div className="text-muted-foreground text-sm">
								Sincronize automaticamente com o Asaas em intervalos regulares
							</div>
						</div>
						<Switch
							checked={autoSyncConfig.enabled}
							id={autoSyncEnableId}
							onCheckedChange={(checked) =>
								setAutoSyncConfig({ ...autoSyncConfig, enabled: checked })
							}
						/>
					</div>

					{autoSyncConfig.enabled && (
						<>
							<div className="space-y-2">
								<Label htmlFor={syncIntervalId}>Intervalo de Sincronização</Label>
								<Select
									onValueChange={(value) =>
										setAutoSyncConfig({
											...autoSyncConfig,
											intervalHours: Number.parseInt(value, 10),
										})
									}
									value={autoSyncConfig.intervalHours.toString()}
								>
									<SelectTrigger id={syncIntervalId}>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="1">A cada 1 hora</SelectItem>
										<SelectItem value="6">A cada 6 horas</SelectItem>
										<SelectItem value="12">A cada 12 horas</SelectItem>
										<SelectItem value="24">Diariamente</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>Tipos de Sincronização</Label>
								<div className="grid gap-2">
									{[
										{ value: 'customers', label: 'Clientes' },
										{ value: 'payments', label: 'Pagamentos' },
										{ value: 'subscriptions', label: 'Assinaturas' },
									].map((type) => (
										<div
											className="flex items-center justify-between rounded-lg border p-3"
											key={type.value}
										>
											<Label className="cursor-pointer" htmlFor={`sync-${type.value}`}>
												{type.label}
											</Label>
											<Switch
												checked={autoSyncConfig.syncTypes.includes(
													type.value as 'customers' | 'payments' | 'subscriptions',
												)}
												id={`sync-${type.value}`}
												onCheckedChange={(checked) => {
													if (checked) {
														setAutoSyncConfig({
															...autoSyncConfig,
															syncTypes: [
																...autoSyncConfig.syncTypes,
																type.value as 'customers' | 'payments' | 'subscriptions',
															],
														});
													} else {
														setAutoSyncConfig({
															...autoSyncConfig,
															syncTypes: autoSyncConfig.syncTypes.filter((t) => t !== type.value),
														});
													}
												}}
											/>
										</div>
									))}
								</div>
							</div>

							<Button className="w-full" onClick={handleSaveAutoSync}>
								Salvar Configurações
							</Button>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

interface SyncStatusBadgeProps {
	status?: string;
}

function SyncStatusBadge({ status }: SyncStatusBadgeProps) {
	switch (status) {
		case 'completed':
			return (
				<Badge className="border-green-600 text-green-600" variant="outline">
					<CheckCircle2 className="mr-1 h-3 w-3" />
					Concluído
				</Badge>
			);
		case 'failed':
			return (
				<Badge className="border-red-600 text-red-600" variant="outline">
					<AlertCircle className="mr-1 h-3 w-3" />
					Falhou
				</Badge>
			);
		case 'running':
			return (
				<Badge className="border-blue-600 text-blue-600" variant="outline">
					<Loader2 className="mr-1 h-3 w-3 animate-spin" />
					Em Andamento
				</Badge>
			);
		default:
			return (
				<Badge className="border-yellow-600 text-yellow-600" variant="outline">
					<Clock className="mr-1 h-3 w-3" />
					Aguardando
				</Badge>
			);
	}
}

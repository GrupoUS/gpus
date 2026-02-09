import { Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';

import { trpc } from '../../lib/trpc';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function AutoSyncSettings() {
	const { data: config } = trpc.asaas.sync.getAutoSyncConfig.useQuery();
	const saveConfig = trpc.asaas.sync.saveAutoSyncConfig.useMutation();
	const { data: lastSyncLogs } = trpc.asaas.sync.getSyncLogs.useQuery({
		syncType: 'customers',
		limit: 1,
	});

	const [enabled, setEnabled] = useState(false);
	const [intervalHours, setIntervalHours] = useState(1);
	const [updateExisting, setUpdateExisting] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	// Generate unique IDs for form elements
	const autoSyncId = useId();
	const intervalId = useId();
	const updateExistingId = useId();

	// Initialize state from config
	useEffect(() => {
		if (config) {
			setEnabled(config.enabled);
			setIntervalHours(config.intervalHours);
			setUpdateExisting(config.updateExisting);
		}
	}, [config]);

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await saveConfig({
				enabled,
				intervalHours: Number(intervalHours),
				updateExisting,
			});
			toast.success('Configurações de sincronização salvas');
		} catch {
			toast.error('Erro ao salvar configurações');
		} finally {
			setIsSaving(false);
		}
	};

	const lastSync = lastSyncLogs?.[0];

	const getStatusColor = (status: string) => {
		if (status === 'completed') return 'text-green-500';
		if (status === 'failed') return 'text-red-500';
		return 'text-blue-500';
	};

	const getStatusLabel = (status: string) => {
		if (status === 'completed') return 'Sucesso';
		if (status === 'failed') return 'Falha';
		return 'Em andamento';
	};

	if (config === undefined) {
		return (
			<div className="flex items-center justify-center p-8">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<RefreshCw className="h-5 w-5" />
					Sincronização Automática
				</CardTitle>
				<CardDescription>Configure a importação automática de alunos do Asaas.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="flex items-center justify-between space-x-2">
					<Label className="flex flex-col space-y-1" htmlFor={autoSyncId}>
						<span>Habilitar Sincronização Automática</span>
						<span className="font-normal text-muted-foreground text-xs">
							O sistema irá buscar novos alunos automaticamente.
						</span>
					</Label>
					<Switch checked={enabled} id={autoSyncId} onCheckedChange={setEnabled} />
				</div>

				<div className="grid gap-2">
					<Label htmlFor={intervalId}>Intervalo (horas)</Label>
					<Input
						className="max-w-[120px]"
						disabled={!enabled}
						id={intervalId}
						max="24"
						min="1"
						onChange={(e) => setIntervalHours(Number(e.target.value))}
						type="number"
						value={intervalHours}
					/>
					<p className="text-muted-foreground text-xs">
						Defina a frequência da sincronização (mínimo 1 hora).
					</p>
				</div>

				<div className="flex items-center justify-between space-x-2">
					<Label className="flex flex-col space-y-1" htmlFor={updateExistingId}>
						<span>Atualizar Alunos Existentes</span>
						<span className="font-normal text-muted-foreground text-xs">
							Se ativado, dados de alunos já cadastrados serão atualizados.
						</span>
					</Label>
					<Switch
						checked={updateExisting}
						disabled={!enabled}
						id={updateExistingId}
						onCheckedChange={setUpdateExisting}
					/>
				</div>

				{lastSync && (
					<div className="rounded-md bg-muted p-3 text-sm">
						<p className="mb-1 font-medium">Última sincronização:</p>
						<div className="flex items-center justify-between text-muted-foreground">
							<span>{new Date(lastSync.completedAt || lastSync.startedAt).toLocaleString()}</span>
							<span className={getStatusColor(lastSync.status)}>
								{getStatusLabel(lastSync.status)}
							</span>
						</div>
						{lastSync.status === 'completed' && (
							<p className="mt-1 text-muted-foreground text-xs">
								{lastSync.recordsCreated || 0} criados, {lastSync.recordsUpdated || 0} atualizados
							</p>
						)}
					</div>
				)}
			</CardContent>
			<CardFooter>
				<Button className="ml-auto" disabled={isSaving} onClick={handleSave}>
					{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					Salvar Configurações
				</Button>
			</CardFooter>
		</Card>
	);
}

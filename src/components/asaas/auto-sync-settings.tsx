import { useMutation, useQuery } from 'convex/react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { api } from '../../../convex/_generated/api';
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
	const config = useQuery(api.asaas.sync.getAutoSyncConfig);
	const saveConfig = useMutation(api.asaas.sync.saveAutoSyncConfig);
	const lastSyncLogs = useQuery(api.asaas.sync.getSyncLogs, {
		syncType: 'customers',
		limit: 1,
	});

	const [enabled, setEnabled] = useState(false);
	const [intervalHours, setIntervalHours] = useState(1);
	const [updateExisting, setUpdateExisting] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

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
		} catch (error) {
			toast.error('Erro ao salvar configurações');
		} finally {
			setIsSaving(false);
		}
	};

	const lastSync = lastSyncLogs?.[0];

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
					<Label htmlFor="auto-sync" className="flex flex-col space-y-1">
						<span>Habilitar Sincronização Automática</span>
						<span className="font-normal text-xs text-muted-foreground">
							O sistema irá buscar novos alunos automaticamente.
						</span>
					</Label>
					<Switch id="auto-sync" checked={enabled} onCheckedChange={setEnabled} />
				</div>

				<div className="grid gap-2">
					<Label htmlFor="interval">Intervalo (horas)</Label>
					<Input
						id="interval"
						type="number"
						min="1"
						max="24"
						value={intervalHours}
						onChange={(e) => setIntervalHours(Number(e.target.value))}
						disabled={!enabled}
						className="max-w-[120px]"
					/>
					<p className="text-xs text-muted-foreground">
						Defina a frequência da sincronização (mínimo 1 hora).
					</p>
				</div>

				<div className="flex items-center justify-between space-x-2">
					<Label htmlFor="update-existing" className="flex flex-col space-y-1">
						<span>Atualizar Alunos Existentes</span>
						<span className="font-normal text-xs text-muted-foreground">
							Se ativado, dados de alunos já cadastrados serão atualizados.
						</span>
					</Label>
					<Switch
						id="update-existing"
						checked={updateExisting}
						onCheckedChange={setUpdateExisting}
						disabled={!enabled}
					/>
				</div>

				{lastSync && (
					<div className="rounded-md bg-muted p-3 text-sm">
						<p className="font-medium mb-1">Última sincronização:</p>
						<div className="flex justify-between items-center text-muted-foreground">
							<span>{new Date(lastSync.completedAt || lastSync.startedAt).toLocaleString()}</span>
							<span
								className={
									lastSync.status === 'completed'
										? 'text-green-500'
										: lastSync.status === 'failed'
											? 'text-red-500'
											: 'text-blue-500'
								}
							>
								{lastSync.status === 'completed'
									? 'Sucesso'
									: lastSync.status === 'failed'
										? 'Falha'
										: 'Em andamento'}
							</span>
						</div>
						{lastSync.status === 'completed' && (
							<p className="text-xs mt-1 text-muted-foreground">
								{lastSync.recordsCreated || 0} criados, {lastSync.recordsUpdated || 0} atualizados
							</p>
						)}
					</div>
				)}
			</CardContent>
			<CardFooter>
				<Button onClick={handleSave} disabled={isSaving} className="ml-auto">
					{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					Salvar Configurações
				</Button>
			</CardFooter>
		</Card>
	);
}

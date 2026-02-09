import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

// TODO: Replace with tRPC type when asaasSyncLogs router is created
interface SyncLogItem {
	id: number;
	syncType: string;
	status: 'completed' | 'failed' | 'running' | 'pending';
	startedAt: number;
	completedAt?: number | null;
	recordsProcessed: number;
	recordsCreated: number;
	recordsUpdated: number;
	recordsFailed: number;
}

const STATUS_BADGE: Record<
	string,
	{ label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }
> = {
	completed: { label: 'Concluído', variant: 'default' },
	failed: { label: 'Falhou', variant: 'destructive' },
	running: { label: 'Em execução', variant: 'secondary' },
	pending: { label: 'Pendente', variant: 'outline' },
};

export function SyncHistory() {
	// TODO: Replace with tRPC when asaasSyncLogs router is created
	const logs = null as SyncLogItem[] | null;

	if (!logs) {
		return <div>Carregando histórico...</div>;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Histórico de Sincronização</CardTitle>
				<CardDescription>Últimas 10 sincronizações</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Tipo</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Registros</TableHead>
							<TableHead>Iniciado</TableHead>
							<TableHead>Duração</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{logs.map((log) => {
							const duration = log.completedAt
								? Math.round((log.completedAt - log.startedAt) / 1000)
								: null;

							const badge = STATUS_BADGE[log.status];

							return (
								<TableRow key={log.id}>
									<TableCell className="capitalize">{log.syncType}</TableCell>
									<TableCell>
										<Badge variant={badge?.variant ?? 'outline'}>
											{badge?.label ?? log.status}
										</Badge>
									</TableCell>
									<TableCell>
										<span className="text-xs">
											P: {log.recordsProcessed} | C: {log.recordsCreated} | U: {log.recordsUpdated}{' '}
											| F: {log.recordsFailed}
										</span>
									</TableCell>
									<TableCell>{new Date(log.startedAt).toLocaleString('pt-BR')}</TableCell>
									<TableCell>{duration ? `${duration}s` : '-'}</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}

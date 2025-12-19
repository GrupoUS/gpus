import { api } from '@convex/_generated/api';
import type { Doc } from '@convex/_generated/dataModel';
import { useQuery } from 'convex/react';

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

const STATUS_BADGE = {
	completed: { label: 'Concluído', variant: 'default' as const },
	failed: { label: 'Falhou', variant: 'destructive' as const },
	running: { label: 'Em execução', variant: 'secondary' as const },
	pending: { label: 'Pendente', variant: 'outline' as const },
};

export function SyncHistory() {
	const logs = useQuery(api.asaas.getRecentSyncLogs, { limit: 10 });

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
						{logs.map((log: Doc<'asaasSyncLogs'>) => {
							const duration = log.completedAt
								? Math.round((log.completedAt - log.startedAt) / 1000)
								: null;

							return (
								<TableRow key={log._id}>
									<TableCell className="capitalize">{log.syncType}</TableCell>
									<TableCell>
										<Badge variant={STATUS_BADGE[log.status].variant}>
											{STATUS_BADGE[log.status].label}
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

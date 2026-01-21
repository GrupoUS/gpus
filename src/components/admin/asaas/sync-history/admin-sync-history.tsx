/**
 * Admin Sync History
 *
 * Detailed sync history with:
 * - Paginated table of sync logs
 * - Detail dialog for each sync
 * - Progress bar for running syncs
 * - Filtering by status and type
 */

import type { Doc } from '@convex/_generated/dataModel';
import { ChevronLeft, ChevronRight, Eye, Filter } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
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

const SYNC_TYPE_LABELS = {
	customers: 'Clientes',
	payments: 'Pagamentos',
	subscriptions: 'Assinaturas',
	all: 'Tudo',
};

interface AdminSyncHistoryProps {
	logs: Doc<'asaasSyncLogs'>[] | null | undefined;
}

export function AdminSyncHistory({ logs }: AdminSyncHistoryProps) {
	const [page, setPage] = useState(0);
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [typeFilter, setTypeFilter] = useState<string>('all');
	const [selectedLog, setSelectedLog] = useState<Doc<'asaasSyncLogs'> | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);

	const pageSize = 10;

	if (!logs) {
		return (
			<Card>
				<CardContent className="p-6">
					<div className="text-center text-muted-foreground">Carregando histórico...</div>
				</CardContent>
			</Card>
		);
	}

	// Filter logs
	const filteredLogs = logs.filter((log) => {
		if (statusFilter !== 'all' && log.status !== statusFilter) return false;
		if (typeFilter !== 'all' && log.syncType !== typeFilter) return false;
		return true;
	});

	// Paginate
	const totalPages = Math.ceil(filteredLogs.length / pageSize);
	const paginatedLogs = filteredLogs.slice(page * pageSize, (page + 1) * pageSize);

	const handleViewDetails = (log: Doc<'asaasSyncLogs'>) => {
		setSelectedLog(log);
		setDetailOpen(true);
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Histórico de Sincronização</CardTitle>
						<CardDescription>{filteredLogs.length} sincronizações encontradas</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<Select onValueChange={setStatusFilter} value={statusFilter}>
							<SelectTrigger className="w-[140px]">
								<Filter className="mr-2 h-4 w-4" />
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos Status</SelectItem>
								<SelectItem value="completed">Concluído</SelectItem>
								<SelectItem value="failed">Falhou</SelectItem>
								<SelectItem value="running">Em execução</SelectItem>
								<SelectItem value="pending">Pendente</SelectItem>
							</SelectContent>
						</Select>
						<Select onValueChange={setTypeFilter} value={typeFilter}>
							<SelectTrigger className="w-[140px]">
								<SelectValue placeholder="Tipo" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos Tipos</SelectItem>
								<SelectItem value="customers">Clientes</SelectItem>
								<SelectItem value="payments">Pagamentos</SelectItem>
								<SelectItem value="subscriptions">Assinaturas</SelectItem>
								<SelectItem value="all">Tudo</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{paginatedLogs.length === 0 ? (
					<div className="py-8 text-center text-muted-foreground">
						Nenhuma sincronização encontrada
					</div>
				) : (
					<>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Tipo</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Iniciado</TableHead>
									<TableHead>Duração</TableHead>
									<TableHead>Processados</TableHead>
									<TableHead>Criados/Atualizados</TableHead>
									<TableHead className="text-right">Ações</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{paginatedLogs.map((log) => {
									const duration = log.completedAt
										? Math.round((log.completedAt - log.startedAt) / 1000)
										: null;
									const isRunning = log.status === 'running';

									let durationDisplay: ReactNode = null;
									if (isRunning) {
										durationDisplay = <span className="text-blue-600">Em andamento...</span>;
									} else if (duration) {
										durationDisplay = `${duration}s`;
									} else {
										durationDisplay = '-';
									}

									return (
										<TableRow key={log._id}>
											<TableCell className="capitalize">
												{SYNC_TYPE_LABELS[log.syncType as keyof typeof SYNC_TYPE_LABELS] ||
													log.syncType}
											</TableCell>
											<TableCell>
												<Badge variant={STATUS_BADGE[log.status].variant}>
													{STATUS_BADGE[log.status].label}
												</Badge>
											</TableCell>
											<TableCell>{new Date(log.startedAt).toLocaleString('pt-BR')}</TableCell>
											<TableCell>{durationDisplay}</TableCell>
											<TableCell>{log.recordsProcessed}</TableCell>
											<TableCell>
												<span className="text-green-600">{log.recordsCreated}</span> /{' '}
												<span className="text-blue-600">{log.recordsUpdated}</span>
												{log.recordsFailed > 0 && (
													<span className="ml-2 text-red-600">({log.recordsFailed} erros)</span>
												)}
											</TableCell>
											<TableCell className="text-right">
												<Button onClick={() => handleViewDetails(log)} size="sm" variant="ghost">
													<Eye className="h-4 w-4" />
												</Button>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>

						{/* Pagination */}
						{totalPages > 1 && (
							<div className="mt-4 flex items-center justify-between">
								<div className="text-muted-foreground text-sm">
									Página {page + 1} de {totalPages}
								</div>
								<div className="flex items-center gap-2">
									<Button
										disabled={page === 0}
										onClick={() => setPage((p) => Math.max(0, p - 1))}
										size="sm"
										variant="outline"
									>
										<ChevronLeft className="h-4 w-4" />
										Anterior
									</Button>
									<Button
										disabled={page >= totalPages - 1}
										onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
										size="sm"
										variant="outline"
									>
										Próxima
										<ChevronRight className="h-4 w-4" />
									</Button>
								</div>
							</div>
						)}
					</>
				)}
			</CardContent>

			{/* Detail Dialog */}
			<Dialog onOpenChange={setDetailOpen} open={detailOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Detalhes da Sincronização</DialogTitle>
						<DialogDescription>Informações detalhadas sobre a execução</DialogDescription>
					</DialogHeader>
					{selectedLog && (
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<div className="text-muted-foreground text-sm">Tipo</div>
									<div className="font-medium capitalize">{selectedLog.syncType}</div>
								</div>
								<div>
									<div className="text-muted-foreground text-sm">Status</div>
									<Badge variant={STATUS_BADGE[selectedLog.status].variant}>
										{STATUS_BADGE[selectedLog.status].label}
									</Badge>
								</div>
								<div>
									<div className="text-muted-foreground text-sm">Iniciado</div>
									<div className="font-medium">
										{new Date(selectedLog.startedAt).toLocaleString('pt-BR')}
									</div>
								</div>
								<div>
									<div className="text-muted-foreground text-sm">Concluído</div>
									<div className="font-medium">
										{selectedLog.completedAt
											? new Date(selectedLog.completedAt).toLocaleString('pt-BR')
											: 'Em andamento'}
									</div>
								</div>
							</div>

							<div className="grid grid-cols-4 gap-4 rounded-lg bg-muted/50 p-4">
								<div className="text-center">
									<div className="font-bold text-2xl">{selectedLog.recordsProcessed}</div>
									<div className="text-muted-foreground text-xs">Processados</div>
								</div>
								<div className="text-center">
									<div className="font-bold text-2xl text-green-600">
										{selectedLog.recordsCreated}
									</div>
									<div className="text-muted-foreground text-xs">Criados</div>
								</div>
								<div className="text-center">
									<div className="font-bold text-2xl text-blue-600">
										{selectedLog.recordsUpdated}
									</div>
									<div className="text-muted-foreground text-xs">Atualizados</div>
								</div>
								<div className="text-center">
									<div className="font-bold text-2xl text-red-600">{selectedLog.recordsFailed}</div>
									<div className="text-muted-foreground text-xs">Falharam</div>
								</div>
							</div>

							{selectedLog.errors && selectedLog.errors.length > 0 && (
								<div>
									<div className="mb-1 text-muted-foreground text-sm">Erros</div>
									<div className="rounded bg-red-50 p-3 text-red-700 text-sm dark:bg-red-950/30 dark:text-red-300">
										<ul className="list-inside list-disc space-y-1">
											{selectedLog.errors.map((error, i) => (
												<li key={i}>{error}</li>
											))}
										</ul>
									</div>
								</div>
							)}

							{selectedLog.filters && (
								<div>
									<div className="mb-1 text-muted-foreground text-sm">Filtros</div>
									<pre className="max-h-40 overflow-auto rounded bg-muted p-3 text-xs">
										{JSON.stringify(selectedLog.filters, null, 2)}
									</pre>
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>
		</Card>
	);
}

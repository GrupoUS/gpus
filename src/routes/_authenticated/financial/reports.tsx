import { createFileRoute } from '@tanstack/react-router';
import {
	AlertTriangle,
	Calendar,
	CheckCircle,
	Clock,
	DollarSign,
	FileText,
	XCircle,
} from 'lucide-react';
import { useId, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { trpc } from '../../../lib/trpc'; // TODO: re-enable when financial router is ready

export const Route = createFileRoute('/_authenticated/financial/reports')({
	component: FinancialReportsPage,
});

interface Payment {
	id: number | string;
	description?: string;
	status: string;
	value: number;
	netValue?: number;
	dueDate: number;
	confirmedDate?: number;
	billingType: string;
}

interface SyncLog {
	id: number | string;
	status: string;
	syncType: string;
	initiatedBy: string;
	startedAt?: number;
	completedAt?: number;
	recordsProcessed?: number;
	recordsCreated?: number;
	errors?: string[];
}

interface PaymentsResult {
	payments: Payment[];
	total: number;
}

function FinancialReportsPage() {
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');

	const startDateId = useId();
	const endDateId = useId();
	// Get payments for report
	const _startTimestamp = startDate ? new Date(startDate).getTime() : undefined;
	const _endTimestamp = endDate ? new Date(`${endDate}T23:59:59`).getTime() : undefined;

	// TODO: Implement financial reports tRPC router
	const paymentsResult: PaymentsResult | undefined = undefined;

	// TODO: Implement sync logs tRPC router
	const syncLogs: SyncLog[] | undefined = undefined;

	// Format helpers
	const formatCurrency = (value: number) =>
		new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

	const formatDate = (timestamp?: number) =>
		timestamp ? new Date(timestamp).toLocaleDateString('pt-BR') : '-';

	const formatDateTime = (timestamp?: number) =>
		timestamp
			? new Date(timestamp).toLocaleString('pt-BR', {
					day: '2-digit',
					month: '2-digit',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit',
				})
			: '-';

	const getStatusBadge = (status: string) => {
		const statusConfig: Record<
			string,
			{ label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
		> = {
			PENDING: { label: 'Pendente', variant: 'outline' },
			CONFIRMED: { label: 'Confirmado', variant: 'default' },
			RECEIVED: { label: 'Recebido', variant: 'default' },
			OVERDUE: { label: 'Vencido', variant: 'destructive' },
			REFUNDED: { label: 'Estornado', variant: 'secondary' },
			CANCELLED: { label: 'Cancelado', variant: 'secondary' },
		};
		const config = statusConfig[status] || { label: status, variant: 'outline' as const };
		return <Badge variant={config.variant}>{config.label}</Badge>;
	};

	const getSyncStatusIcon = (status: string) => {
		switch (status) {
			case 'completed':
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case 'failed':
				return <XCircle className="h-4 w-4 text-red-500" />;
			case 'running':
				return <Clock className="h-4 w-4 animate-spin text-yellow-500" />;
			default:
				return <Clock className="h-4 w-4 text-muted-foreground" />;
		}
	};

	// Calculate summary metrics
	const payments = paymentsResult?.payments || [];
	const totalValue = payments.reduce((sum, p) => sum + p.value, 0);
	const paidPayments = payments.filter((p) => p.status === 'RECEIVED' || p.status === 'CONFIRMED');
	const paidValue = paidPayments.reduce((sum, p) => sum + p.value, 0);
	const overduePayments = payments.filter((p) => p.status === 'OVERDUE');
	const overdueValue = overduePayments.reduce((sum, p) => sum + p.value, 0);

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div>
				<h1 className="font-bold text-2xl">Relatórios Financeiros</h1>
				<p className="text-muted-foreground">Análise detalhada e histórico de sincronizações</p>
			</div>

			<Tabs defaultValue="payments">
				<TabsList>
					<TabsTrigger value="payments">
						<DollarSign className="mr-2 h-4 w-4" />
						Pagamentos
					</TabsTrigger>
					<TabsTrigger value="webhooks">
						<FileText className="mr-2 h-4 w-4" />
						Logs de Sincronização
					</TabsTrigger>
				</TabsList>

				{/* Payments Tab */}
				<TabsContent className="space-y-6" value="payments">
					{/* Filters */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Filtros</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 md:grid-cols-4">
								<div className="space-y-2">
									<Label>Status</Label>
									<Select onValueChange={setStatusFilter} value={statusFilter}>
										<SelectTrigger>
											<SelectValue placeholder="Todos os status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">Todos</SelectItem>
											<SelectItem value="PENDING">Pendente</SelectItem>
											<SelectItem value="CONFIRMED">Confirmado</SelectItem>
											<SelectItem value="RECEIVED">Recebido</SelectItem>
											<SelectItem value="OVERDUE">Vencido</SelectItem>
											<SelectItem value="REFUNDED">Estornado</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor={startDateId}>Data Inicial</Label>
									<Input
										id={startDateId}
										onChange={(e) => setStartDate(e.target.value)}
										type="date"
										value={startDate}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor={endDateId}>Data Final</Label>
									<Input
										id={endDateId}
										onChange={(e) => setEndDate(e.target.value)}
										type="date"
										value={endDate}
									/>
								</div>
								<div className="flex items-end">
									<Button
										onClick={() => {
											setStatusFilter('all');
											setStartDate('');
											setEndDate('');
										}}
										variant="outline"
									>
										Limpar
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Summary Cards */}
					<div className="grid gap-4 md:grid-cols-4">
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="flex items-center gap-2 font-medium text-sm">
									<Calendar className="h-4 w-4" />
									Total Filtrado
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">{formatCurrency(totalValue)}</div>
								<p className="text-muted-foreground text-xs">{payments.length} cobranças</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="flex items-center gap-2 font-medium text-sm">
									<CheckCircle className="h-4 w-4 text-green-500" />
									Recebido
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl text-green-600">{formatCurrency(paidValue)}</div>
								<p className="text-muted-foreground text-xs">{paidPayments.length} pagamentos</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="flex items-center gap-2 font-medium text-sm">
									<AlertTriangle className="h-4 w-4 text-red-500" />
									Vencido
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl text-red-600">
									{formatCurrency(overdueValue)}
								</div>
								<p className="text-muted-foreground text-xs">{overduePayments.length} cobranças</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="font-medium text-sm">Taxa Recebimento</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">
									{payments.length > 0
										? ((paidPayments.length / payments.length) * 100).toFixed(1)
										: 0}
									%
								</div>
								<p className="text-muted-foreground text-xs">do total filtrado</p>
							</CardContent>
						</Card>
					</div>

					{/* Payments Table */}
					<Card>
						<CardHeader>
							<CardTitle>Cobranças</CardTitle>
							<CardDescription>{paymentsResult?.total || 0} registros encontrados</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Descrição</TableHead>
										<TableHead>Vencimento</TableHead>
										<TableHead>Valor</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Tipo</TableHead>
										<TableHead>Pagamento</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{payments.map((payment) => (
										<TableRow key={String(payment.id)}>
											<TableCell className="font-medium">
												{payment.description || 'Sem descrição'}
											</TableCell>
											<TableCell>{formatDate(payment.dueDate)}</TableCell>
											<TableCell>{formatCurrency(payment.value)}</TableCell>
											<TableCell>{getStatusBadge(payment.status)}</TableCell>
											<TableCell>
												<Badge variant="outline">{payment.billingType}</Badge>
											</TableCell>
											<TableCell>{formatDate(payment.confirmedDate)}</TableCell>
										</TableRow>
									))}
									{payments.length === 0 && (
										<TableRow>
											<TableCell className="py-8 text-center text-muted-foreground" colSpan={6}>
												Nenhuma cobrança encontrada
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Webhook Logs Tab */}
				<TabsContent className="space-y-6" value="webhooks">
					<Card>
						<CardHeader>
							<CardTitle>Histórico de Sincronizações</CardTitle>
							<CardDescription>
								Últimas sincronizações automáticas e manuais do Asaas
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Status</TableHead>
										<TableHead>Tipo</TableHead>
										<TableHead>Iniciado por</TableHead>
										<TableHead>Início</TableHead>
										<TableHead>Conclusão</TableHead>
										<TableHead>Registros</TableHead>
										<TableHead>Mensagem</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{syncLogs?.map((log) => {
										let logMessage = '-';
										if (log.errors && log.errors.length > 0) {
											logMessage = log.errors[0] ?? '-';
										} else if (log.status === 'completed') {
											logMessage = 'Concluído com sucesso';
										}

										return (
											<TableRow key={String(log.id)}>
												<TableCell>{getSyncStatusIcon(log.status)}</TableCell>
												<TableCell>
													<Badge className="capitalize" variant="outline">
														{log.syncType}
													</Badge>
												</TableCell>
												<TableCell className="text-sm">{log.initiatedBy}</TableCell>
												<TableCell className="text-sm">{formatDateTime(log.startedAt)}</TableCell>
												<TableCell className="text-sm">{formatDateTime(log.completedAt)}</TableCell>
												<TableCell>
													{log.recordsProcessed !== undefined ? (
														<Badge variant="secondary">
															{log.recordsCreated || 0} / {log.recordsProcessed || 0}
														</Badge>
													) : (
														'-'
													)}
												</TableCell>
												<TableCell className="max-w-xs truncate text-sm">{logMessage}</TableCell>
											</TableRow>
										);
									})}
									{(!syncLogs || syncLogs.length === 0) && (
										<TableRow>
											<TableCell className="py-8 text-center text-muted-foreground" colSpan={7}>
												Nenhum log de sincronização encontrado
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

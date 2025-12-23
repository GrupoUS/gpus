'use client';

import { api } from '@convex/_generated/api';
import type { Doc } from '@convex/_generated/dataModel';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { Copy, ExternalLink, FileText, Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

export const Route = createFileRoute('/_authenticated/financial/payments')({
	component: PaymentsPage,
});

function PaymentsPage() {
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [billingTypeFilter, setBillingTypeFilter] = useState<string>('all');
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [offset, setOffset] = useState(0);
	const [selectedPayment, setSelectedPayment] = useState<Doc<'asaasPayments'> | null>(null);

	// Convert dates to timestamps for query
	const startTimestamp = startDate ? new Date(startDate).getTime() : undefined;
	const endTimestamp = endDate ? new Date(`${endDate}T23:59:59`).getTime() : undefined;

	// Use getAllPayments with filters
	const paymentsResult = useQuery(api.asaas.queries.getAllPayments, {
		status: statusFilter === 'all' ? undefined : statusFilter,
		billingType: billingTypeFilter === 'all' ? undefined : billingTypeFilter,
		startDate: startTimestamp,
		endDate: endTimestamp,
		limit: 50,
		offset,
	});

	const allPayments = paymentsResult?.payments || [];
	const totalPayments = paymentsResult?.total || 0;
	const hasMore = paymentsResult?.hasMore;

	// Apply local search filter (for description)
	const filteredPayments = search
		? allPayments.filter((payment) =>
				payment.description?.toLowerCase().includes(search.toLowerCase()),
			)
		: allPayments;

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(value);
	};

	const formatDate = (timestamp: number) => {
		return new Date(timestamp).toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	};

	const statusConfig: Record<
		string,
		{ label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
	> = {
		PENDING: { label: 'Pendente', variant: 'secondary' },
		RECEIVED: { label: 'Recebido', variant: 'default' },
		CONFIRMED: { label: 'Confirmado', variant: 'default' },
		OVERDUE: { label: 'Vencido', variant: 'destructive' },
		REFUNDED: { label: 'Reembolsado', variant: 'outline' },
		DELETED: { label: 'Excluído', variant: 'outline' },
		CANCELLED: { label: 'Cancelado', variant: 'outline' },
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				toast.success('Copiado para a área de transferência!');
			})
			.catch(() => {
				toast.error('Falha ao copiar');
			});
	};

	const handleLoadMore = () => {
		setOffset(offset + 50);
	};

	const handleClearFilters = () => {
		setSearch('');
		setStatusFilter('all');
		setBillingTypeFilter('all');
		setStartDate('');
		setEndDate('');
		setOffset(0);
	};

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-3xl font-bold">Cobranças</h1>
				<p className="text-muted-foreground">Gerencie todas as cobranças do sistema</p>
			</div>

			{/* Filters */}
			<Card>
				<CardHeader>
					<CardTitle>Filtros</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Buscar por descrição..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="pl-10"
							/>
						</div>
						<Select
							value={statusFilter}
							onValueChange={(v) => {
								setStatusFilter(v);
								setOffset(0);
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos os Status</SelectItem>
								<SelectItem value="PENDING">Pendente</SelectItem>
								<SelectItem value="RECEIVED">Recebido</SelectItem>
								<SelectItem value="CONFIRMED">Confirmado</SelectItem>
								<SelectItem value="OVERDUE">Vencido</SelectItem>
								<SelectItem value="REFUNDED">Reembolsado</SelectItem>
								<SelectItem value="CANCELLED">Cancelado</SelectItem>
							</SelectContent>
						</Select>
						<Select
							value={billingTypeFilter}
							onValueChange={(v) => {
								setBillingTypeFilter(v);
								setOffset(0);
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder="Tipo de Pagamento" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos os Tipos</SelectItem>
								<SelectItem value="BOLETO">Boleto</SelectItem>
								<SelectItem value="PIX">PIX</SelectItem>
								<SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
								<SelectItem value="DEBIT_CARD">Cartão de Débito</SelectItem>
							</SelectContent>
						</Select>
						<div>
							<Label htmlFor="startDate" className="sr-only">
								Data Inicial
							</Label>
							<Input
								id="startDate"
								type="date"
								value={startDate}
								onChange={(e) => {
									setStartDate(e.target.value);
									setOffset(0);
								}}
								placeholder="Data Inicial"
							/>
						</div>
						<div>
							<Label htmlFor="endDate" className="sr-only">
								Data Final
							</Label>
							<Input
								id="endDate"
								type="date"
								value={endDate}
								onChange={(e) => {
									setEndDate(e.target.value);
									setOffset(0);
								}}
								placeholder="Data Final"
							/>
						</div>
					</div>
					{(search ||
						statusFilter !== 'all' ||
						billingTypeFilter !== 'all' ||
						startDate ||
						endDate) && (
						<div className="mt-4">
							<Button variant="outline" size="sm" onClick={handleClearFilters}>
								Limpar Filtros
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Payments Table */}
			<Card>
				<CardHeader>
					<CardTitle>Cobranças</CardTitle>
					<CardDescription>
						{filteredPayments.length} de {totalPayments} cobrança{totalPayments !== 1 ? 's' : ''}{' '}
						encontrada{totalPayments !== 1 ? 's' : ''}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{paymentsResult === undefined ? (
						<Skeleton className="h-64" />
					) : filteredPayments.length === 0 ? (
						<p className="text-center text-muted-foreground py-8">Nenhuma cobrança encontrada</p>
					) : (
						<>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Descrição</TableHead>
										<TableHead>Vencimento</TableHead>
										<TableHead>Valor</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Tipo</TableHead>
										<TableHead className="text-right">Ações</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredPayments.map((payment) => {
										const statusInfo = statusConfig[payment.status] || {
											label: payment.status,
											variant: 'outline' as const,
										};
										return (
											<TableRow key={payment._id}>
												<TableCell>
													{payment.description || 'Cobrança'}
													{payment.installmentNumber && payment.totalInstallments && (
														<span className="text-xs text-muted-foreground ml-2">
															({payment.installmentNumber}/{payment.totalInstallments})
														</span>
													)}
												</TableCell>
												<TableCell>{formatDate(payment.dueDate)}</TableCell>
												<TableCell>{formatCurrency(payment.value)}</TableCell>
												<TableCell>
													<Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
												</TableCell>
												<TableCell>{payment.billingType}</TableCell>
												<TableCell className="text-right space-x-1">
													<Button
														variant="ghost"
														size="sm"
														onClick={() => setSelectedPayment(payment)}
													>
														Detalhes
													</Button>
													{payment.boletoUrl && (
														<Button variant="ghost" size="sm" asChild>
															<a href={payment.boletoUrl} target="_blank" rel="noopener noreferrer">
																<FileText className="h-4 w-4" />
															</a>
														</Button>
													)}
													{payment.pixQrCode && (
														<Button
															variant="ghost"
															size="sm"
															onClick={() => copyToClipboard(payment.pixQrCode ?? '')}
														>
															<Copy className="h-4 w-4" />
														</Button>
													)}
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
							{hasMore && (
								<div className="mt-4 flex justify-center">
									<Button variant="outline" onClick={handleLoadMore}>
										Carregar Mais
									</Button>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>

			{/* Payment Detail Dialog */}
			<Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Detalhes da Cobrança</DialogTitle>
						<DialogDescription>{selectedPayment?.asaasPaymentId}</DialogDescription>
					</DialogHeader>
					{selectedPayment && (
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<Label className="text-muted-foreground">Valor</Label>
									<p className="font-medium">{formatCurrency(selectedPayment.value)}</p>
								</div>
								<div>
									<Label className="text-muted-foreground">Valor Líquido</Label>
									<p className="font-medium">
										{formatCurrency(selectedPayment.netValue || selectedPayment.value)}
									</p>
								</div>
								<div>
									<Label className="text-muted-foreground">Vencimento</Label>
									<p className="font-medium">{formatDate(selectedPayment.dueDate)}</p>
								</div>
								<div>
									<Label className="text-muted-foreground">Status</Label>
									<Badge variant={statusConfig[selectedPayment.status]?.variant || 'outline'}>
										{statusConfig[selectedPayment.status]?.label || selectedPayment.status}
									</Badge>
								</div>
								<div>
									<Label className="text-muted-foreground">Tipo</Label>
									<p className="font-medium">{selectedPayment.billingType}</p>
								</div>
								{selectedPayment.confirmedDate && (
									<div>
										<Label className="text-muted-foreground">Confirmado em</Label>
										<p className="font-medium">{formatDate(selectedPayment.confirmedDate)}</p>
									</div>
								)}
							</div>
							{selectedPayment.description && (
								<div>
									<Label className="text-muted-foreground">Descrição</Label>
									<p className="font-medium">{selectedPayment.description}</p>
								</div>
							)}
							<div className="flex flex-wrap gap-2 pt-4 border-t">
								{selectedPayment.boletoUrl && (
									<Button variant="outline" size="sm" asChild>
										<a href={selectedPayment.boletoUrl} target="_blank" rel="noopener noreferrer">
											<FileText className="h-4 w-4 mr-2" />
											Ver Boleto
										</a>
									</Button>
								)}
								{selectedPayment.pixQrCode && (
									<Button
										variant="outline"
										size="sm"
										onClick={() => copyToClipboard(selectedPayment.pixQrCode ?? '')}
									>
										<Copy className="h-4 w-4 mr-2" />
										Copiar PIX
									</Button>
								)}
								<Button variant="outline" size="sm" asChild>
									<a
										href={`https://www.asaas.com/cobrancas/${selectedPayment.asaasPaymentId}`}
										target="_blank"
										rel="noopener noreferrer"
									>
										<ExternalLink className="h-4 w-4 mr-2" />
										Abrir no Asaas
									</a>
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

'use client';

import { api } from '@convex/_generated/api';
import type { Doc } from '@convex/_generated/dataModel';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { Copy, ExternalLink, FileText, Search } from 'lucide-react';
import { useId, useState } from 'react';
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

interface PaymentTableRowProps {
	payment: Doc<'asaasPayments'>;
	onSelect: (payment: Doc<'asaasPayments'>) => void;
	onCopy: (text: string) => void;
}

function PaymentTableRow({ payment, onSelect, onCopy }: PaymentTableRowProps) {
	const statusInfo = statusConfig[payment.status] || {
		label: payment.status,
		variant: 'outline' as const,
	};

	const formatDate = (timestamp: number) => {
		return new Date(timestamp).toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(value);
	};

	return (
		<TableRow key={payment._id}>
			<TableCell>
				{payment.description || 'Cobrança'}
				{payment.installmentNumber && payment.totalInstallments && (
					<span className="ml-2 text-muted-foreground text-xs">
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
			<TableCell className="space-x-1 text-right">
				<Button onClick={() => onSelect(payment)} size="sm" variant="ghost">
					Detalhes
				</Button>
				{payment.boletoUrl && (
					<Button asChild size="sm" variant="ghost">
						<a href={payment.boletoUrl} rel="noopener noreferrer" target="_blank">
							<FileText className="h-4 w-4" />
						</a>
					</Button>
				)}
				{payment.pixQrCode && (
					<Button onClick={() => onCopy(payment.pixQrCode ?? '')} size="sm" variant="ghost">
						<Copy className="h-4 w-4" />
					</Button>
				)}
			</TableCell>
		</TableRow>
	);
}

interface PaymentFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	statusFilter: string;
	onStatusFilterChange: (value: string) => void;
	billingTypeFilter: string;
	onBillingTypeFilterChange: (value: string) => void;
	startDate: string;
	onStartDateChange: (value: string) => void;
	endDate: string;
	onEndDateChange: (value: string) => void;
	onClearFilters: () => void;
	startDateId: string;
	endDateId: string;
}

function PaymentFilters({
	search,
	onSearchChange,
	statusFilter,
	onStatusFilterChange,
	billingTypeFilter,
	onBillingTypeFilterChange,
	startDate,
	onStartDateChange,
	endDate,
	onEndDateChange,
	onClearFilters,
	startDateId,
	endDateId,
}: PaymentFiltersProps) {
	const hasFilters =
		search || statusFilter !== 'all' || billingTypeFilter !== 'all' || startDate || endDate;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Filtros</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
					<div className="relative">
						<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
						<Input
							className="pl-10"
							onChange={(e) => onSearchChange(e.target.value)}
							placeholder="Buscar por descrição..."
							value={search}
						/>
					</div>
					<Select onValueChange={onStatusFilterChange} value={statusFilter}>
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
					<Select onValueChange={onBillingTypeFilterChange} value={billingTypeFilter}>
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
						<Label className="sr-only" htmlFor={startDateId}>
							Data Inicial
						</Label>
						<Input
							id={startDateId}
							onChange={(e) => onStartDateChange(e.target.value)}
							placeholder="Data Inicial"
							type="date"
							value={startDate}
						/>
					</div>
					<div>
						<Label className="sr-only" htmlFor={endDateId}>
							Data Final
						</Label>
						<Input
							id={endDateId}
							onChange={(e) => onEndDateChange(e.target.value)}
							placeholder="Data Final"
							type="date"
							value={endDate}
						/>
					</div>
				</div>
				{hasFilters && (
					<div className="mt-4">
						<Button onClick={onClearFilters} size="sm" variant="outline">
							Limpar Filtros
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

interface PaymentDetailContentProps {
	payment: Doc<'asaasPayments'>;
	onCopy: (text: string) => void;
}

function PaymentDetailContent({ payment, onCopy }: PaymentDetailContentProps) {
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

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-4 text-sm">
				<div>
					<Label className="text-muted-foreground">Valor</Label>
					<p className="font-medium">{formatCurrency(payment.value)}</p>
				</div>
				<div>
					<Label className="text-muted-foreground">Valor Líquido</Label>
					<p className="font-medium">{formatCurrency(payment.netValue || payment.value)}</p>
				</div>
				<div>
					<Label className="text-muted-foreground">Vencimento</Label>
					<p className="font-medium">{formatDate(payment.dueDate)}</p>
				</div>
				<div>
					<Label className="text-muted-foreground">Status</Label>
					<Badge variant={statusConfig[payment.status]?.variant || 'outline'}>
						{statusConfig[payment.status]?.label || payment.status}
					</Badge>
				</div>
				<div>
					<Label className="text-muted-foreground">Tipo</Label>
					<p className="font-medium">{payment.billingType}</p>
				</div>
				{payment.confirmedDate && (
					<div>
						<Label className="text-muted-foreground">Confirmado em</Label>
						<p className="font-medium">{formatDate(payment.confirmedDate)}</p>
					</div>
				)}
			</div>
			{payment.description && (
				<div>
					<Label className="text-muted-foreground">Descrição</Label>
					<p className="font-medium">{payment.description}</p>
				</div>
			)}
			<div className="flex flex-wrap gap-2 border-t pt-4">
				{payment.boletoUrl && (
					<Button asChild size="sm" variant="outline">
						<a href={payment.boletoUrl} rel="noopener noreferrer" target="_blank">
							<FileText className="mr-2 h-4 w-4" />
							Ver Boleto
						</a>
					</Button>
				)}
				{payment.pixQrCode && (
					<Button onClick={() => onCopy(payment.pixQrCode ?? '')} size="sm" variant="outline">
						<Copy className="mr-2 h-4 w-4" />
						Copiar PIX
					</Button>
				)}
				<Button asChild size="sm" variant="outline">
					<a
						href={`https://www.asaas.com/cobrancas/${payment.asaasPaymentId}`}
						rel="noopener noreferrer"
						target="_blank"
					>
						<ExternalLink className="mr-2 h-4 w-4" />
						Abrir no Asaas
					</a>
				</Button>
			</div>
		</div>
	);
}

function PaymentsPage() {
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [billingTypeFilter, setBillingTypeFilter] = useState<string>('all');
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [offset, setOffset] = useState(0);
	const [selectedPayment, setSelectedPayment] = useState<Doc<'asaasPayments'> | null>(null);

	const startDateId = useId();
	const endDateId = useId();

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
		? allPayments.filter((payment: Doc<'asaasPayments'>) =>
				payment.description?.toLowerCase().includes(search.toLowerCase()),
			)
		: allPayments;

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
				<h1 className="font-bold text-3xl">Cobranças</h1>
				<p className="text-muted-foreground">Gerencie todas as cobranças do sistema</p>
			</div>

			{/* Filters */}
			<PaymentFilters
				billingTypeFilter={billingTypeFilter}
				endDate={endDate}
				endDateId={endDateId}
				onBillingTypeFilterChange={(v) => {
					setBillingTypeFilter(v);
					setOffset(0);
				}}
				onClearFilters={handleClearFilters}
				onEndDateChange={(v) => {
					setEndDate(v);
					setOffset(0);
				}}
				onSearchChange={setSearch}
				onStartDateChange={(v) => {
					setStartDate(v);
					setOffset(0);
				}}
				onStatusFilterChange={(v) => {
					setStatusFilter(v);
					setOffset(0);
				}}
				search={search}
				startDate={startDate}
				startDateId={startDateId}
				statusFilter={statusFilter}
			/>

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
						<p className="py-8 text-center text-muted-foreground">Nenhuma cobrança encontrada</p>
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
									{filteredPayments.map((payment: Doc<'asaasPayments'>) => (
										<PaymentTableRow
											key={payment._id}
											onCopy={copyToClipboard}
											onSelect={setSelectedPayment}
											payment={payment}
										/>
									))}
								</TableBody>
							</Table>
							{hasMore && (
								<div className="mt-4 flex justify-center">
									<Button onClick={handleLoadMore} variant="outline">
										Carregar Mais
									</Button>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>

			{/* Payment Detail Dialog */}
			<Dialog onOpenChange={(open) => !open && setSelectedPayment(null)} open={!!selectedPayment}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Detalhes da Cobrança</DialogTitle>
						<DialogDescription>{selectedPayment?.asaasPaymentId}</DialogDescription>
					</DialogHeader>
					{selectedPayment && (
						<PaymentDetailContent onCopy={copyToClipboard} payment={selectedPayment} />
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

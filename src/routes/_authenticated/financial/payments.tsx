'use client';

import { api } from '@convex/_generated/api';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { Search } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

	// Get all payments (we'll need to create a query for this or use existing ones)
	// For now, using pending and overdue, but ideally we'd have a comprehensive list query
	const pendingPayments = useQuery(api.asaas.queries.getPendingPayments);
	const overduePayments = useQuery(api.asaas.queries.getOverduePayments);

	// Combine and filter payments
	const allPayments = [...(pendingPayments || []), ...(overduePayments || [])].filter((payment) => {
		if (search && !payment.description?.toLowerCase().includes(search.toLowerCase())) {
			return false;
		}
		if (statusFilter !== 'all' && payment.status !== statusFilter) {
			return false;
		}
		if (billingTypeFilter !== 'all' && payment.billingType !== billingTypeFilter) {
			return false;
		}
		return true;
	});

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
					<div className="grid gap-4 md:grid-cols-3">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Buscar por descrição..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="pl-10"
							/>
						</div>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
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
						<Select value={billingTypeFilter} onValueChange={setBillingTypeFilter}>
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
					</div>
				</CardContent>
			</Card>

			{/* Payments Table */}
			<Card>
				<CardHeader>
					<CardTitle>Cobranças</CardTitle>
					<CardDescription>
						{allPayments.length} cobrança{allPayments.length !== 1 ? 's' : ''} encontrada
						{allPayments.length !== 1 ? 's' : ''}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{pendingPayments === undefined && overduePayments === undefined ? (
						<Skeleton className="h-64" />
					) : allPayments.length === 0 ? (
						<p className="text-center text-muted-foreground py-8">Nenhuma cobrança encontrada</p>
					) : (
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
								{allPayments.map((payment) => {
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
											<TableCell className="text-right">
												{payment.boletoUrl && (
													<Button variant="ghost" size="sm" asChild>
														<a href={payment.boletoUrl} target="_blank" rel="noopener noreferrer">
															Ver Boleto
														</a>
													</Button>
												)}
												{payment.pixQrCode && (
													<Button variant="ghost" size="sm">
														Ver PIX
													</Button>
												)}
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

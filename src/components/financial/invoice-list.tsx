import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import type { FinancialMetrics } from '@/types/api';

const STATUS_CONFIG = {
	PENDING: { label: 'Pendente', variant: 'secondary' as const },
	RECEIVED: { label: 'Recebido', variant: 'default' as const },
	CONFIRMED: { label: 'Confirmado', variant: 'default' as const },
	RECEIVED_IN_CASH: {
		label: 'Recebido em Dinheiro',
		variant: 'default' as const,
	},
	OVERDUE: { label: 'Vencido', variant: 'destructive' as const },
	REFUNDED: { label: 'Reembolsado', variant: 'outline' as const },
	CANCELLED: { label: 'Cancelado', variant: 'outline' as const },
};

const formatCurrency = (value: number) =>
	new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString('pt-BR');

export function InvoiceList() {
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [page, setPage] = useState(0);
	const pageSize = 50;

	const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
	const endOfMonth = new Date(
		new Date().getFullYear(),
		new Date().getMonth() + 1,
		0,
		23,
		59,
		59,
		999,
	).getTime();

	// biome-ignore lint/suspicious/noExplicitAny: Convex deep type instantiation workaround.
	const apiAny: any = api;
	// biome-ignore lint/suspicious/noExplicitAny: Convex deep type instantiation workaround.
	const useQueryAny: any = useQuery;
	const result = useQueryAny(apiAny.asaas.queries.getPaymentsByDateRange, {
		startDate: startOfMonth,
		endDate: endOfMonth,
		status: statusFilter === 'all' ? undefined : statusFilter,
		limit: pageSize,
		offset: page * pageSize,
	}) as { payments: FinancialMetrics[]; total: number; hasMore: boolean } | undefined;

	if (!result) {
		return <div>Carregando...</div>;
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<Select onValueChange={setStatusFilter} value={statusFilter}>
					<SelectTrigger className="w-45">
						<SelectValue placeholder="Filtrar por status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos</SelectItem>
						<SelectItem value="PENDING">Pendente</SelectItem>
						<SelectItem value="RECEIVED">Recebido</SelectItem>
						<SelectItem value="RECEIVED_IN_CASH">Recebido em Dinheiro</SelectItem>
						<SelectItem value="OVERDUE">Vencido</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Descrição</TableHead>
						<TableHead>Valor</TableHead>
						<TableHead>Vencimento</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Tipo</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{result.payments.map((payment: FinancialMetrics) => (
						<TableRow key={payment.id}>
							<TableCell>{payment.description || 'Cobrança'}</TableCell>
							<TableCell>{formatCurrency(payment.value)}</TableCell>
							<TableCell>{formatDate(payment.dueDate)}</TableCell>
							<TableCell>
								<Badge
									variant={STATUS_CONFIG[payment.status as keyof typeof STATUS_CONFIG]?.variant}
								>
									{STATUS_CONFIG[payment.status as keyof typeof STATUS_CONFIG]?.label ||
										payment.status}
								</Badge>
							</TableCell>
							<TableCell>{payment.billingType}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			{result.hasMore && (
				<div className="flex justify-center">
					<Button onClick={() => setPage((p) => p + 1)}>Carregar mais</Button>
				</div>
			)}
		</div>
	);
}

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
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

// Local type for individual invoice items (not yet available from tRPC)
interface InvoiceItem {
	id: string;
	description: string;
	value: number;
	dueDate: number;
	status: string;
	billingType: string;
}

export function InvoiceList() {
	const [statusFilter, setStatusFilter] = useState<string>('all');

	// TODO: Replace with tRPC when asaas payments procedures are created
	// Stub: payments always empty until backend is implemented
	const result = undefined as
		| { payments: InvoiceItem[]; total: number; hasMore: boolean }
		| undefined;

	if (!result) {
		return (
			<div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
				<p>Módulo financeiro em implementação</p>
				<p className="text-xs">As cobranças aparecerão aqui quando o backend estiver conectado.</p>
			</div>
		);
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
					{result.payments.map((payment) => (
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
		</div>
	);
}

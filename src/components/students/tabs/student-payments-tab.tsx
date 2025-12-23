import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { Copy, CreditCard, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { CreatePaymentDialog } from '@/components/students/create-payment-dialog';
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
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

interface StudentPaymentsTabProps {
	studentId: Id<'students'>;
}

const statusConfig: Record<string, { label: string; className: string }> = {
	PENDING: { label: 'Pendente', className: 'bg-yellow-500' },
	RECEIVED: { label: 'Recebido', className: 'bg-green-500' },
	CONFIRMED: { label: 'Confirmado', className: 'bg-green-600' },
	OVERDUE: { label: 'Vencido', className: 'bg-red-500' },
	REFUNDED: { label: 'Reembolsado', className: 'bg-purple-500' },
	DELETED: { label: 'Excluído', className: 'bg-gray-400' },
	CANCELLED: { label: 'Cancelado', className: 'bg-gray-500' },
};

export function StudentPaymentsTab({ studentId }: StudentPaymentsTabProps) {
	const [selectedPayment, setSelectedPayment] = useState<Doc<'asaasPayments'> | null>(null);

	// Fetch student to get Asaas ID
	// biome-ignore lint/suspicious/noExplicitAny: Deep type instantiation workaround for Convex
	const student = useQuery(api.students.getById as any, { id: studentId });
	const asaasCustomerId =
		typeof (student as { asaasCustomerId?: unknown } | null)?.asaasCustomerId === 'string'
			? (student as { asaasCustomerId: string }).asaasCustomerId
			: undefined;
	const lastSyncedAt = (student as { asaasCustomerSyncedAt?: number } | null)
		?.asaasCustomerSyncedAt;

	const payments = useQuery(api.asaas.queries.getPaymentsByStudent, {
		studentId,
	}) as Doc<'asaasPayments'>[] | undefined;

	const formatCurrency = (value: number) =>
		new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

	const formatDate = (timestamp: number | string | undefined) => {
		if (!timestamp) return '-';
		const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
		return date.toLocaleDateString('pt-BR');
	};

	const formatDateTime = (timestamp: number | undefined) => {
		if (!timestamp) return '-';
		return new Date(timestamp).toLocaleString('pt-BR');
	};

	const getStatusBadge = (status: string) => {
		const config = statusConfig[status] || { label: status, className: 'bg-gray-500' };
		return (
			<Badge className={`${config.className} hover:${config.className}`}>{config.label}</Badge>
		);
	};

	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard
			.writeText(text)
			.then(() => toast.success(`${label} copiado!`))
			.catch(() => toast.error('Falha ao copiar'));
	};

	// Calculate summary
	const summary = payments?.reduce(
		(acc, p) => {
			if (p.status === 'RECEIVED' || p.status === 'CONFIRMED') {
				acc.paid += p.value;
				acc.paidCount++;
			} else if (p.status === 'PENDING') {
				acc.pending += p.value;
				acc.pendingCount++;
			} else if (p.status === 'OVERDUE') {
				acc.overdue += p.value;
				acc.overdueCount++;
			}
			return acc;
		},
		{ paid: 0, paidCount: 0, pending: 0, pendingCount: 0, overdue: 0, overdueCount: 0 },
	) || { paid: 0, paidCount: 0, pending: 0, pendingCount: 0, overdue: 0, overdueCount: 0 };

	if (!student) {
		return (
			<div className="flex justify-center p-8">
				<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h3 className="text-lg font-medium flex items-center gap-2">
						<CreditCard className="h-5 w-5" />
						Histórico Financeiro (Asaas)
					</h3>
					{lastSyncedAt && (
						<p className="text-xs text-muted-foreground mt-1">
							Última sincronização: {formatDateTime(lastSyncedAt)}
						</p>
					)}
				</div>

				<CreatePaymentDialog studentId={studentId} />
			</div>

			{/* Asaas Sync Status */}
			{!asaasCustomerId && (
				<div className="bg-yellow-500/10 text-yellow-600 p-4 rounded-md border border-yellow-500/20 text-sm">
					<p className="font-medium">Aluno não sincronizado com Asaas</p>
					<p className="text-xs mt-1">
						A sincronização ocorre automaticamente ao salvar o aluno com CPF/Email válidos.
					</p>
				</div>
			)}

			{/* Summary Cards */}
			{payments && payments.length > 0 && (
				<div className="grid grid-cols-3 gap-4">
					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Recebido</CardDescription>
							<CardTitle className="text-green-600">{formatCurrency(summary.paid)}</CardTitle>
						</CardHeader>
						<CardContent className="pt-0">
							<p className="text-xs text-muted-foreground">{summary.paidCount} cobrança(s)</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Pendente</CardDescription>
							<CardTitle className="text-yellow-600">{formatCurrency(summary.pending)}</CardTitle>
						</CardHeader>
						<CardContent className="pt-0">
							<p className="text-xs text-muted-foreground">{summary.pendingCount} cobrança(s)</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Vencido</CardDescription>
							<CardTitle className="text-red-600">{formatCurrency(summary.overdue)}</CardTitle>
						</CardHeader>
						<CardContent className="pt-0">
							<p className="text-xs text-muted-foreground">{summary.overdueCount} cobrança(s)</p>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Payments Table */}
			<Card>
				<CardContent className="p-0">
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
							{payments === undefined ? (
								<TableRow>
									<TableCell colSpan={6} className="text-center py-8">
										<Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
									</TableCell>
								</TableRow>
							) : payments.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
										Nenhuma cobrança encontrada
									</TableCell>
								</TableRow>
							) : (
								payments.map((payment) => (
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
										<TableCell>{getStatusBadge(payment.status)}</TableCell>
										<TableCell>{payment.billingType}</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-1">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => setSelectedPayment(payment)}
												>
													Detalhes
												</Button>
												{payment.boletoUrl && (
													<Button variant="ghost" size="icon" asChild>
														<a href={payment.boletoUrl} target="_blank" rel="noopener noreferrer">
															<FileText className="h-4 w-4" />
														</a>
													</Button>
												)}
												{payment.pixQrCode && (
													<Button
														variant="ghost"
														size="icon"
														onClick={() => copyToClipboard(payment.pixQrCode ?? '', 'PIX')}
													>
														<Copy className="h-4 w-4" />
													</Button>
												)}
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
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
										{formatCurrency(selectedPayment.netValue ?? selectedPayment.value)}
									</p>
								</div>
								<div>
									<Label className="text-muted-foreground">Vencimento</Label>
									<p className="font-medium">{formatDate(selectedPayment.dueDate)}</p>
								</div>
								<div>
									<Label className="text-muted-foreground">Status</Label>
									{getStatusBadge(selectedPayment.status)}
								</div>
								<div>
									<Label className="text-muted-foreground">Tipo</Label>
									<p className="font-medium">{selectedPayment.billingType}</p>
								</div>
								{selectedPayment.confirmedDate && (
									<div>
										<Label className="text-muted-foreground">Confirmado em</Label>
										<p className="font-medium">{formatDateTime(selectedPayment.confirmedDate)}</p>
									</div>
								)}
							</div>
							{selectedPayment.description && (
								<>
									<Separator />
									<div>
										<Label className="text-muted-foreground">Descrição</Label>
										<p className="font-medium">{selectedPayment.description}</p>
									</div>
								</>
							)}
							<Separator />
							<div className="flex flex-wrap gap-2">
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
										onClick={() => copyToClipboard(selectedPayment.pixQrCode ?? '', 'PIX')}
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

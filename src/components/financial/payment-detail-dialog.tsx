import type { Doc } from '@convex/_generated/dataModel';
import { Copy, ExternalLink, FileText, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface PaymentDetailDialogProps {
	payment: Doc<'asaasPayments'> | null;
	onClose: () => void;
}

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

const billingTypeLabels: Record<string, string> = {
	BOLETO: 'Boleto Bancário',
	PIX: 'PIX',
	CREDIT_CARD: 'Cartão de Crédito',
	DEBIT_CARD: 'Cartão de Débito',
	UNDEFINED: 'Indefinido',
};

export function PaymentDetailDialog({ payment, onClose }: PaymentDetailDialogProps) {
	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(value);
	};

	const formatDate = (timestamp: number | undefined) => {
		if (!timestamp) return '-';
		return new Date(timestamp).toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	};

	const formatDateTime = (timestamp: number | undefined) => {
		if (!timestamp) return '-';
		return new Date(timestamp).toLocaleString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				toast.success(`${label} copiado para a área de transferência!`);
			})
			.catch(() => {
				toast.error('Falha ao copiar');
			});
	};

	if (!payment) return null;

	const statusInfo = statusConfig[payment.status] || {
		label: payment.status,
		variant: 'outline' as const,
	};

	return (
		<Dialog open={!!payment} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center justify-between">
						Detalhes da Cobrança
						<DialogClose asChild>
							<Button variant="ghost" size="icon">
								<X className="h-4 w-4" />
							</Button>
						</DialogClose>
					</DialogTitle>
					<DialogDescription className="flex items-center gap-2">
						ID: {payment.asaasPaymentId}
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6"
							onClick={() => copyToClipboard(payment.asaasPaymentId, 'ID')}
						>
							<Copy className="h-3 w-3" />
						</Button>
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Values */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1">
							<Label className="text-xs text-muted-foreground">Valor</Label>
							<p className="font-semibold text-lg">{formatCurrency(payment.value)}</p>
						</div>
						<div className="space-y-1">
							<Label className="text-xs text-muted-foreground">Valor Líquido</Label>
							<p className="font-semibold text-lg">
								{formatCurrency(payment.netValue ?? payment.value)}
							</p>
						</div>
					</div>

					<Separator />

					{/* Status & Details */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1">
							<Label className="text-xs text-muted-foreground">Status</Label>
							<div>
								<Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
							</div>
						</div>
						<div className="space-y-1">
							<Label className="text-xs text-muted-foreground">Forma de Pagamento</Label>
							<p className="font-medium">
								{billingTypeLabels[payment.billingType] || payment.billingType}
							</p>
						</div>
						<div className="space-y-1">
							<Label className="text-xs text-muted-foreground">Vencimento</Label>
							<p className="font-medium">{formatDate(payment.dueDate)}</p>
						</div>
						{payment.confirmedDate && (
							<div className="space-y-1">
								<Label className="text-xs text-muted-foreground">Confirmado em</Label>
								<p className="font-medium">{formatDateTime(payment.confirmedDate)}</p>
							</div>
						)}
					</div>

					{/* Description */}
					{payment.description && (
						<>
							<Separator />
							<div className="space-y-1">
								<Label className="text-xs text-muted-foreground">Descrição</Label>
								<p className="text-sm">{payment.description}</p>
							</div>
						</>
					)}

					{/* Installments */}
					{payment.installmentNumber && payment.totalInstallments && (
						<>
							<Separator />
							<div className="space-y-1">
								<Label className="text-xs text-muted-foreground">Parcela</Label>
								<p className="font-medium">
									{payment.installmentNumber} de {payment.totalInstallments}
								</p>
							</div>
						</>
					)}

					{/* Timestamps */}
					<Separator />
					<div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
						<div>
							<span>Criado em: {formatDateTime(payment.createdAt)}</span>
						</div>
						<div>
							<span>Atualizado: {formatDateTime(payment.updatedAt)}</span>
						</div>
					</div>

					{/* Actions */}
					<Separator />
					<div className="flex flex-wrap gap-2">
						{payment.boletoUrl && (
							<Button variant="outline" size="sm" asChild>
								<a href={payment.boletoUrl} target="_blank" rel="noopener noreferrer">
									<FileText className="h-4 w-4 mr-2" />
									Ver Boleto
								</a>
							</Button>
						)}
						{payment.pixQrCode && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => copyToClipboard(payment.pixQrCode ?? '', 'Código PIX')}
							>
								<Copy className="h-4 w-4 mr-2" />
								Copiar PIX Copia e Cola
							</Button>
						)}
						<Button variant="outline" size="sm" asChild>
							<a
								href={`https://www.asaas.com/cobrancas/${payment.asaasPaymentId}`}
								target="_blank"
								rel="noopener noreferrer"
							>
								<ExternalLink className="h-4 w-4 mr-2" />
								Abrir no Asaas
							</a>
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

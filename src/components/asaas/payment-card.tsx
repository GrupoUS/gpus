import { Copy, ExternalLink, QrCode } from 'lucide-react';
import { useState } from 'react';

import { PixQrCodeDialog } from './pix-qr-code-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface PaymentCardProps {
	payment: {
		_id: string;
		value: number;
		netValue?: number;
		dueDate: number;
		status: string;
		billingType: string;
		description?: string;
		installmentNumber?: number;
		totalInstallments?: number;
		boletoUrl?: string;
		boletoBarcode?: string;
		pixQrCode?: string;
		pixQrCodeBase64?: string;
		confirmedDate?: number;
	};
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
	BOLETO: 'Boleto',
	PIX: 'PIX',
	CREDIT_CARD: 'Cartão de Crédito',
	DEBIT_CARD: 'Cartão de Débito',
	UNDEFINED: 'Indefinido',
};

export function PaymentCard({ payment }: PaymentCardProps) {
	const { toast } = useToast();
	const [showPixDialog, setShowPixDialog] = useState(false);

	const statusInfo = statusConfig[payment.status] || {
		label: payment.status,
		variant: 'outline' as const,
	};
	const isOverdue =
		payment.status === 'OVERDUE' || (payment.status === 'PENDING' && payment.dueDate < Date.now());

	const copyPixCode = () => {
		if (payment.pixQrCode && navigator.clipboard) {
			void navigator.clipboard.writeText(payment.pixQrCode);
			toast({
				title: 'Sucesso',
				description: 'Código PIX copiado para a área de transferência!',
			});
		} else {
			toast({
				title: 'Erro',
				description: 'Não foi possível copiar o código PIX.',
				variant: 'destructive',
			});
		}
	};

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
		<>
			<Card className={isOverdue ? 'border-red-500' : ''}>
				<CardHeader>
					<div className="flex items-start justify-between">
						<div>
							<CardTitle className="text-lg">
								{payment.description ||
									`Cobrança ${payment.installmentNumber ? `#${payment.installmentNumber}` : ''}`}
							</CardTitle>
							<CardDescription>
								{billingTypeLabels[payment.billingType] || payment.billingType}
								{payment.installmentNumber && payment.totalInstallments && (
									<span className="ml-2">
										Parcela {payment.installmentNumber} de {payment.totalInstallments}
									</span>
								)}
							</CardDescription>
						</div>
						<Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<p className="text-sm text-muted-foreground">Valor</p>
							<p className="text-lg font-semibold">{formatCurrency(payment.value)}</p>
							{payment.netValue && payment.netValue !== payment.value && (
								<p className="text-xs text-muted-foreground">
									Líquido: {formatCurrency(payment.netValue)}
								</p>
							)}
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Vencimento</p>
							<p className={`text-lg font-semibold ${isOverdue ? 'text-red-600' : ''}`}>
								{formatDate(payment.dueDate)}
							</p>
							{payment.confirmedDate && (
								<p className="text-xs text-muted-foreground">
									Pago em: {formatDate(payment.confirmedDate)}
								</p>
							)}
						</div>
					</div>

					<div className="flex gap-2 flex-wrap">
						{payment.boletoUrl && (
							<Button variant="outline" size="sm" asChild>
								<a href={payment.boletoUrl} target="_blank" rel="noopener noreferrer">
									<ExternalLink className="w-4 h-4 mr-2" />
									Ver Boleto
								</a>
							</Button>
						)}
						{payment.boletoBarcode && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									if (navigator.clipboard && payment.boletoBarcode) {
										void navigator.clipboard.writeText(payment.boletoBarcode);
										toast({
											title: 'Sucesso',
											description: 'Código de barras copiado!',
										});
									}
								}}
							>
								<Copy className="w-4 h-4 mr-2" />
								Copiar Código
							</Button>
						)}
						{payment.pixQrCode && (
							<>
								<Button variant="outline" size="sm" onClick={copyPixCode}>
									<Copy className="w-4 h-4 mr-2" />
									Copiar PIX
								</Button>
								<Button variant="outline" size="sm" onClick={() => setShowPixDialog(true)}>
									<QrCode className="w-4 h-4 mr-2" />
									Ver QR Code
								</Button>
							</>
						)}
					</div>
				</CardContent>
			</Card>

			{showPixDialog && payment.pixQrCode && (
				<PixQrCodeDialog
					pixCode={payment.pixQrCode}
					pixQrCodeBase64={payment.pixQrCodeBase64}
					value={payment.value}
					onClose={() => setShowPixDialog(false)}
				/>
			)}
		</>
	);
}

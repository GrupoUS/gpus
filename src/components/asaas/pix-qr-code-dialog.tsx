import { Copy } from 'lucide-react';
import { useId } from 'react';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface PixQrCodeDialogProps {
	pixCode: string;
	pixQrCodeBase64?: string;
	value: number;
	onClose: () => void;
}

export function PixQrCodeDialog({
	pixCode,
	pixQrCodeBase64,
	value,
	onClose,
}: PixQrCodeDialogProps) {
	const { toast } = useToast();
	const textareaId = useId();

	const copyPixCode = () => {
		if (navigator.clipboard) {
			void navigator.clipboard.writeText(pixCode);
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

	const formatCurrency = (val: number) => {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(val);
	};

	return (
		<Dialog open={true} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Pagamento PIX</DialogTitle>
					<DialogDescription>
						Escaneie o QR Code ou copie o código para pagar {formatCurrency(value)}
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					{pixQrCodeBase64 ? (
						<div className="flex justify-center">
							<img
								src={`data:image/png;base64,${pixQrCodeBase64}`}
								alt="QR Code PIX"
								className="w-64 h-64 border rounded-lg"
							/>
						</div>
					) : (
						<div className="flex justify-center items-center h-64 border rounded-lg bg-muted">
							<p className="text-sm text-muted-foreground">QR Code não disponível</p>
						</div>
					)}

					<div className="space-y-2">
						<label htmlFor={textareaId} className="text-sm font-medium">
							Código PIX (Copiar e Colar)
						</label>
						<div className="flex gap-2">
							<textarea
								id={textareaId}
								readOnly
								value={pixCode}
								className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-xs"
							/>
							<Button variant="outline" size="icon" onClick={copyPixCode}>
								<Copy className="h-4 w-4" />
							</Button>
						</div>
					</div>

					<div className="bg-muted p-3 rounded-md text-sm space-y-1">
						<p className="font-medium">Instruções:</p>
						<ol className="list-decimal list-inside space-y-1 text-muted-foreground">
							<li>Abra o app do seu banco</li>
							<li>Escolha a opção PIX</li>
							<li>Escaneie o QR Code ou cole o código</li>
							<li>Confirme o pagamento</li>
						</ol>
					</div>
				</div>
				<DialogFooter>
					<Button onClick={onClose}>Fechar</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

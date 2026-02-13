import { Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function WebhookConfig() {
	// Webhook URL must match the route defined in server/_core/index.ts
	const webhookUrl = `${window.location.origin}/asaas/webhook`;

	const handleCopy = () => {
		navigator.clipboard.writeText(webhookUrl);
		toast.success('URL copiada para a área de transferência!');
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Configuração de Webhook</CardTitle>
				<CardDescription>Configure webhooks no painel do Asaas</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex gap-2">
					<Input readOnly value={webhookUrl} />
					<Button onClick={handleCopy} size="icon">
						<Copy className="h-4 w-4" />
					</Button>
				</div>

				<div className="rounded-lg bg-muted p-4 text-sm">
					<p className="mb-2 font-medium">Eventos para habilitar no Asaas:</p>
					<ul className="list-disc space-y-1 pl-4 text-muted-foreground">
						<li>PAYMENT_CREATED</li>
						<li>PAYMENT_UPDATED</li>
						<li>PAYMENT_CONFIRMED</li>
						<li>PAYMENT_RECEIVED</li>
						<li>PAYMENT_OVERDUE</li>
						<li>PAYMENT_DELETED</li>
					</ul>
				</div>
			</CardContent>
		</Card>
	);
}

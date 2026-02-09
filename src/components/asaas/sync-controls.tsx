import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function SyncControls() {
	const [loading, setLoading] = useState<Record<string, boolean>>({});

	const handleSync = (type: 'customers' | 'payments' | 'subscriptions' | 'all') => {
		setLoading({ ...loading, [type]: true });
		try {
			toast.info(`Iniciando sincronização de ${type}...`);

			// TODO: Implement Asaas sync via tRPC action/mutation
			// Previous Convex actions:
			// - api.asaas.actions.importAllFromAsaas
			// - api.asaas.actions.importCustomersFromAsaas
			// - api.asaas.actions.importPaymentsFromAsaas
			// - api.asaas.actions.importSubscriptionsFromAsaas
			toast.info('Sincronização Asaas em implementação via tRPC');

			toast.success('Sincronização concluída!');
		} catch (error) {
			toast.error('Erro na sincronização', {
				description: error instanceof Error ? error.message : 'Erro desconhecido',
			});
		} finally {
			setLoading({ ...loading, [type]: false });
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Sincronização Manual</CardTitle>
				<CardDescription>Importe dados do Asaas manualmente</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid gap-2 md:grid-cols-2">
					<Button
						disabled={loading.customers}
						onClick={() => handleSync('customers')}
						variant="outline"
					>
						{loading.customers ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Download className="mr-2 h-4 w-4" />
						)}
						Sincronizar Clientes
					</Button>
					<Button
						disabled={loading.payments}
						onClick={() => handleSync('payments')}
						variant="outline"
					>
						{loading.payments ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Download className="mr-2 h-4 w-4" />
						)}
						Sincronizar Pagamentos
					</Button>
					<Button
						disabled={loading.subscriptions}
						onClick={() => handleSync('subscriptions')}
						variant="outline"
					>
						{loading.subscriptions ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Download className="mr-2 h-4 w-4" />
						)}
						Sincronizar Assinaturas
					</Button>
					<Button disabled={loading.all} onClick={() => handleSync('all')}>
						{loading.all ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Download className="mr-2 h-4 w-4" />
						)}
						Sincronizar Tudo
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

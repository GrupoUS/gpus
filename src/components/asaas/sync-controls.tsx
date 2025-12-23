import { api } from '@convex/_generated/api';
import { useConvex } from 'convex/react';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function SyncControls() {
	const [loading, setLoading] = useState<Record<string, boolean>>({});
	const convex = useConvex();

	const handleSync = async (type: 'customers' | 'payments' | 'subscriptions' | 'all') => {
		setLoading({ ...loading, [type]: true });
		try {
			toast.info(`Iniciando sincronização de ${type}...`);

			if (type === 'all') {
				await convex.action(api.asaas.actions.importAllFromAsaas, {
					initiatedBy: 'manual_settings',
				});
			} else if (type === 'customers') {
				await convex.action(api.asaas.actions.importCustomersFromAsaas, {
					initiatedBy: 'manual_settings',
				});
			} else if (type === 'payments') {
				await convex.action(api.asaas.actions.importPaymentsFromAsaas, {
					initiatedBy: 'manual_settings',
				});
			} else if (type === 'subscriptions') {
				await convex.action(api.asaas.actions.importSubscriptionsFromAsaas, {
					initiatedBy: 'manual_settings',
				});
			}

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
						variant="outline"
						onClick={() => handleSync('customers')}
						disabled={loading.customers}
					>
						{loading.customers ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Download className="mr-2 h-4 w-4" />
						)}
						Sincronizar Clientes
					</Button>
					<Button
						variant="outline"
						onClick={() => handleSync('payments')}
						disabled={loading.payments}
					>
						{loading.payments ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Download className="mr-2 h-4 w-4" />
						)}
						Sincronizar Pagamentos
					</Button>
					<Button
						variant="outline"
						onClick={() => handleSync('subscriptions')}
						disabled={loading.subscriptions}
					>
						{loading.subscriptions ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Download className="mr-2 h-4 w-4" />
						)}
						Sincronizar Assinaturas
					</Button>
					<Button onClick={() => handleSync('all')} disabled={loading.all}>
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

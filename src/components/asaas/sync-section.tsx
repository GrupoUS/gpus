/**
 * Asaas Sync Section Component
 *
 * Provides UI for triggering data import from Asaas and viewing sync status.
 */

import { api } from '@convex/_generated/api';
import { useAction } from 'convex/react';
import { CreditCard, DollarSign, Download, Loader2, Repeat, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { SyncStatusIndicator } from '@/components/asaas/sync-status';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface AsaasSyncSectionProps {
	userId: string;
}

type SyncType = 'customers' | 'payments' | 'subscriptions' | 'financial';

export function AsaasSyncSection({ userId }: AsaasSyncSectionProps) {
	const [syncingType, setSyncingType] = useState<SyncType | null>(null);

	const importCustomers = useAction(api.asaas.actions.importCustomersFromAsaas);
	const importPayments = useAction(api.asaas.actions.importPaymentsFromAsaas);
	const importSubscriptions = useAction(api.asaas.actions.importSubscriptionsFromAsaas);
	const syncFinancial = useAction(api.asaas.actions.syncFinancialDataFromAsaas);

	const handleSync = async (type: SyncType) => {
		if (!userId) {
			toast.error('Usuário não identificado');
			return;
		}

		setSyncingType(type);
		try {
			let result: {
				recordsCreated?: number;
				recordsUpdated?: number;
				summary?: { paymentsCount: number };
			};
			switch (type) {
				case 'customers':
					result = await importCustomers({ initiatedBy: userId });
					toast.success(
						`Clientes importados: ${result.recordsCreated} criados, ${result.recordsUpdated} atualizados`,
					);
					break;
				case 'payments':
					result = await importPayments({ initiatedBy: userId });
					toast.success(
						`Pagamentos importados: ${result.recordsCreated} criados, ${result.recordsUpdated} atualizados`,
					);
					break;
				case 'subscriptions':
					result = await importSubscriptions({ initiatedBy: userId });
					toast.success(
						`Assinaturas importadas: ${result.recordsCreated} criadas, ${result.recordsUpdated} atualizadas`,
					);
					break;
				case 'financial':
					result = await syncFinancial({ initiatedBy: userId });
					toast.success(
						`Dados financeiros sincronizados: ${result.summary?.paymentsCount ?? 0} pagamentos processados`,
					);
					break;
			}
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
			toast.error(`Erro ao sincronizar ${type}: ${errorMessage}`);
		} finally {
			setSyncingType(null);
		}
	};

	const syncItems = [
		{
			type: 'customers' as const,
			label: 'Clientes',
			description: 'Importar clientes do Asaas como alunos',
			icon: <Users className="h-4 w-4" />,
			color: 'text-blue-500',
		},
		{
			type: 'payments' as const,
			label: 'Pagamentos',
			description: 'Importar pagamentos e cobranças',
			icon: <CreditCard className="h-4 w-4" />,
			color: 'text-green-500',
		},
		{
			type: 'subscriptions' as const,
			label: 'Assinaturas',
			description: 'Importar assinaturas recorrentes',
			icon: <Repeat className="h-4 w-4" />,
			color: 'text-purple-500',
		},
		{
			type: 'financial' as const,
			label: 'Financeiro',
			description: 'Sincronizar resumo financeiro',
			icon: <DollarSign className="h-4 w-4" />,
			color: 'text-amber-500',
		},
	];

	return (
		<div className="space-y-4">
			{syncItems.map((item, index) => (
				<div key={item.type}>
					{index > 0 && <Separator className="my-3" />}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className={`${item.color}`}>{item.icon}</div>
							<div>
								<p className="font-medium text-sm">{item.label}</p>
								<p className="text-xs text-muted-foreground">{item.description}</p>
								<SyncStatusIndicator syncType={item.type} className="mt-1" />
							</div>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleSync(item.type)}
							disabled={syncingType !== null}
						>
							{syncingType === item.type ? (
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
							) : (
								<Download className="h-4 w-4 mr-2" />
							)}
							Importar
						</Button>
					</div>
				</div>
			))}
		</div>
	);
}

export default AsaasSyncSection;

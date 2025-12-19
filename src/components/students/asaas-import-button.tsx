import { api } from '@convex/_generated/api';
import { useConvex } from 'convex/react';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Type for the combined import result
interface CombinedImportResult {
	success: boolean;
	customers: {
		success: boolean;
		recordsProcessed: number;
		recordsCreated: number;
		recordsUpdated: number;
		recordsFailed: number;
	} | null;
	payments: {
		success: boolean;
		recordsProcessed: number;
		recordsCreated: number;
		recordsUpdated: number;
		recordsFailed: number;
	} | null;
}

export function AsaasImportButton() {
	const [isLoading, setIsLoading] = useState(false);
	const convex = useConvex();

	const handleImport = async () => {
		setIsLoading(true);
		try {
			toast.info('Iniciando importação do Asaas...');

			// Use convex.action to avoid deep type instantiation issue with useAction
			const result = (await convex.action(api.asaas.actions.importAllFromAsaas, {
				initiatedBy: 'manual_import_button',
			})) as CombinedImportResult | null;

			if (result?.success) {
				const customersMsg = result.customers
					? `${result.customers.recordsCreated} criados, ${result.customers.recordsUpdated} atualizados`
					: '0';
				const paymentsMsg = result.payments
					? `${result.payments.recordsCreated} importados`
					: '0 importados';

				toast.success('Importação concluída com sucesso!', {
					description: `Clientes: ${customersMsg} | Pagamentos: ${paymentsMsg}`,
				});
			}
		} catch (error) {
			toast.error('Falha na importação do Asaas', {
				description: error instanceof Error ? error.message : 'Erro desconhecido',
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="outline"
						size="sm"
						onClick={handleImport}
						disabled={isLoading}
						className="gap-2 border-purple-200 hover:border-purple-500 hover:text-purple-600 dark:border-purple-800 dark:hover:border-purple-400 dark:hover:text-purple-400"
					>
						{isLoading ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Download className="h-4 w-4" />
						)}
						<span className="hidden sm:inline">
							{isLoading ? 'Importando...' : 'Importar do Asaas'}
						</span>
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>Sincronizar alunos manualmente do Asaas</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

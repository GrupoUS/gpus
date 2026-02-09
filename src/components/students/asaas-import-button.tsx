import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { trpc } from '../../lib/trpc';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function AsaasImportButton() {
	const [isLoading, setIsLoading] = useState(false);
	const importAll = trpc.settings.set.useMutation();

	const handleImport = async () => {
		setIsLoading(true);
		try {
			toast.info('Iniciando importação do Asaas...');

			const result = await importAll({
				initiatedBy: 'manual_import_button',
			});

			if (result?.success) {
				const customerStats = result.customers;
				const paymentStats = result.payments;

				const customerMsg = customerStats
					? `Clientes: ${customerStats.recordsCreated} criados, ${customerStats.recordsUpdated} atualizados`
					: '';
				const paymentMsg = paymentStats
					? `Pagamentos: ${paymentStats.recordsCreated} importados, ${paymentStats.recordsUpdated} atualizados`
					: '';

				toast.success('Importação concluída com sucesso!', {
					description: [customerMsg, paymentMsg].filter(Boolean).join(' | '),
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
						className="gap-2 border-purple-200 hover:border-purple-500 hover:text-purple-600 dark:border-purple-800 dark:hover:border-purple-400 dark:hover:text-purple-400"
						disabled={isLoading}
						onClick={handleImport}
						size="sm"
						variant="outline"
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
					<p>Sincronizar clientes e pagamentos do Asaas</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

import { useAction } from 'convex/react';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function AsaasImportButton() {
	const [isLoading, setIsLoading] = useState(false);
	const importCustomers = useAction(api.asaas.actions.importCustomersFromAsaas);

	const handleImport = async () => {
		setIsLoading(true);
		try {
			toast.info('Iniciando importação do Asaas...');

			const result = await importCustomers({
				initiatedBy: 'manual_import_button',
			});

			if (result?.success) {
				toast.success('Importação concluída com sucesso!', {
					description: `${result.recordsProcessed} processados: ${result.recordsCreated} criados, ${result.recordsUpdated} atualizados.`,
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

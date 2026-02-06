import { api } from '@convex/_generated/api';
import type { Doc } from '@convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface LeadDeleteDialogProps {
	lead: Doc<'leads'>;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onClose?: () => void;
}

export function LeadDeleteDialog({ lead, open, onOpenChange, onClose }: LeadDeleteDialogProps) {
	const [isDeleting, setIsDeleting] = useState(false);
	const deleteLead = useMutation(api.leads.deleteLead);

	const handleDelete = async () => {
		try {
			setIsDeleting(true);
			await deleteLead({ leadId: lead._id });
			toast.success(`Lead "${lead.name}" excluído com sucesso`);
			onOpenChange(false);
			onClose?.();
		} catch (error) {
			toast.error(
				`Erro ao excluir lead: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
			);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<AlertDialog onOpenChange={onOpenChange} open={open}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Excluir Lead</AlertDialogTitle>
					<AlertDialogDescription>
						Tem certeza que deseja excluir o lead <strong>"{lead.name}"</strong>?
						<br />
						<br />
						Esta ação é irreversível e também excluirá todas as atividades, tarefas e campos
						personalizados associados a este lead.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
					<AlertDialogAction
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						disabled={isDeleting}
						onClick={handleDelete}
					>
						{isDeleting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Excluindo...
							</>
						) : (
							'Excluir'
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

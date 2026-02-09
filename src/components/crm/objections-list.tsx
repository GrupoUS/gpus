import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MoreVertical, Pencil, ShieldAlert, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { ObjectionForm } from './objection-form';
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
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

interface ObjectionsListProps {
	leadId: number;
}

interface Objection {
	id: number;
	_creationTime: number;
	organizationId: string;
	leadId: number;
	objectionText: string;
	recordedBy: string;
	recordedByDetails?: { name?: string };
	recordedAt: number;
	resolved?: boolean;
	resolution?: string;
}

export function ObjectionsList({ leadId }: ObjectionsListProps) {
	// biome-ignore lint/suspicious/noExplicitAny: Required to break deep type inference chain
	const objections = useQuery((api as any).objections.listObjections, { leadId }) as
		| Objection[]
		| undefined;
	// biome-ignore lint/suspicious/noExplicitAny: Required to break deep type inference chain
	const deleteObjection = useMutation((api as any).objections.deleteObjection);
	// biome-ignore lint/suspicious/noExplicitAny: Required to break deep type inference chain
	const user = useQuery((api as any).users.current) as
		| { clerkId: string; role: string }
		| undefined;

	const [editingId, setEditingId] = useState<number | null>(null);
	const [deletingId, setDeletingId] = useState<number | null>(null);

	const handleDelete = async () => {
		if (!deletingId) return;
		try {
			await deleteObjection({ objectionId: deletingId });
			toast.success('Objeção removida');
		} catch (_error) {
			toast.error('Erro ao remover objeção');
		} finally {
			setDeletingId(null);
		}
	};

	const canEdit = (objection: Objection) => {
		if (!user) return false;
		// Allow if user is creator or admin/owner
		const isAdmin = user.role === 'admin' || user.role === 'owner';
		return user.clerkId === objection.recordedBy || isAdmin;
	};

	if (objections === undefined) {
		return (
			<div className="space-y-4">
				{[1, 2, 3].map((i) => (
					<div className="flex gap-4 rounded-lg border border-border/50 p-4" key={i}>
						<Skeleton className="h-10 w-10 rounded-full" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-4 w-1/4" />
							<Skeleton className="h-4 w-full" />
						</div>
					</div>
				))}
			</div>
		);
	}

	if (objections.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
				<ShieldAlert className="mb-2 h-10 w-10 opacity-20" />
				<p>Nenhuma objeção registrada</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{objections.map((objection) => {
				if (editingId === objection.id) {
					return (
						<ObjectionForm
							key={objection.id}
							leadId={leadId}
							objection={objection}
							onCancel={() => setEditingId(null)}
							onSuccess={() => setEditingId(null)}
						/>
					);
				}

				return (
					<div
						className="group relative rounded-lg border border-border/50 bg-card p-4 transition-colors hover:bg-muted/5"
						key={objection.id}
					>
						<div className="mb-2 flex items-start justify-between">
							<div className="flex items-center gap-2 text-muted-foreground text-xs">
								<span className="font-medium text-foreground">
									{objection.recordedByDetails?.name || 'Usuário'}
								</span>
								<span>•</span>
								<span>
									{formatDistanceToNow(objection.recordedAt, {
										addSuffix: true,
										locale: ptBR,
									})}
								</span>
							</div>

							{canEdit(objection) && (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
											size="icon"
											variant="ghost"
										>
											<MoreVertical className="h-4 w-4" />
											<span className="sr-only">Ações</span>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onClick={() => setEditingId(objection.id)}>
											<Pencil className="mr-2 h-4 w-4" />
											Editar
										</DropdownMenuItem>
										<DropdownMenuItem
											className="text-destructive focus:text-destructive"
											onClick={() => setDeletingId(objection.id)}
										>
											<Trash2 className="mr-2 h-4 w-4" />
											Excluir
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							)}
						</div>

						<p className="whitespace-pre-wrap text-sm leading-relaxed">{objection.objectionText}</p>
					</div>
				);
			})}

			<AlertDialog onOpenChange={(open) => !open && setDeletingId(null)} open={!!deletingId}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Excluir objeção?</AlertDialogTitle>
						<AlertDialogDescription>
							Tem certeza que deseja excluir esta objeção? Esta ação não pode ser desfeita.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={handleDelete}
						>
							Excluir
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

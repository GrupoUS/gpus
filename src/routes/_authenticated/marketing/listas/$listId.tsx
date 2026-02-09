import { createFileRoute } from '@tanstack/react-router';
import {
	ArrowLeft,
	Cloud,
	CloudOff,
	Edit,
	ExternalLink,
	List,
	Loader2,
	Mail,
	Plus,
	RefreshCw,
	Trash2,
	UserMinus,
	UserPlus,
	Users,
	XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { trpc } from '../../../../lib/trpc';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

export const Route = createFileRoute('/_authenticated/marketing/listas/$listId')({
	component: ListDetailsPage,
});

// ============================================================================
// Types
// ============================================================================

type SubscriptionStatus = 'subscribed' | 'unsubscribed' | 'pending' | 'bounced';

const subscriptionStatusConfig: Record<
	SubscriptionStatus,
	{ label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
	subscribed: { label: 'Inscrito', variant: 'default' },
	unsubscribed: { label: 'Desinscrito', variant: 'secondary' },
	pending: { label: 'Pendente', variant: 'outline' },
	bounced: { label: 'Bounced', variant: 'destructive' },
};

// ============================================================================
// Sub-components
// ============================================================================

function LoadingSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Skeleton className="h-10 w-10" />
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-64" />
				</div>
			</div>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Skeleton className="h-24" />
				<Skeleton className="h-24" />
			</div>
			<Skeleton className="h-[300px] w-full" />
		</div>
	);
}

interface ListNotFoundProps {
	onBack: () => void;
}

function ListNotFound({ onBack }: ListNotFoundProps) {
	return (
		<div className="space-y-6">
			<Button onClick={onBack} variant="ghost">
				<ArrowLeft className="mr-2 h-4 w-4" />
				Voltar para listas
			</Button>
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-12">
					<XCircle className="mb-4 h-12 w-12 text-muted-foreground" />
					<h2 className="font-semibold text-lg">Lista não encontrada</h2>
					<p className="mt-2 text-muted-foreground text-sm">
						A lista que você procura não existe ou foi removida.
					</p>
					<Button className="mt-6" onClick={onBack}>
						Voltar para listas
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}

interface Contact {
	id: number;
	email: string;
	firstName?: string;
	lastName?: string;
	subscriptionStatus: SubscriptionStatus;
	listIds?: number[];
}

interface AddContactDialogProps {
	availableContacts: Contact[];
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onAdd: (contactId: number) => Promise<void>;
	isAdding: boolean;
}

function AddContactDialog({
	availableContacts,
	isOpen,
	onOpenChange,
	onAdd,
	isAdding,
}: AddContactDialogProps) {
	const [selectedContactId, setSelectedContactId] = useState<string>('');

	const handleAdd = async () => {
		if (!selectedContactId) return;
		await onAdd(selectedContactId as number);
		setSelectedContactId('');
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={isOpen}>
			<DialogTrigger asChild>
				<Button>
					<UserPlus className="mr-2 h-4 w-4" />
					Adicionar Contato
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Adicionar Contato à Lista</DialogTitle>
					<DialogDescription>
						Selecione um contato para adicionar a esta lista de distribuição.
					</DialogDescription>
				</DialogHeader>

				{availableContacts.length === 0 ? (
					<div className="py-6 text-center text-muted-foreground">
						<Users className="mx-auto mb-2 h-8 w-8" />
						<p>Todos os contatos já estão nesta lista.</p>
					</div>
				) : (
					<div className="py-4">
						<Select onValueChange={setSelectedContactId} value={selectedContactId}>
							<SelectTrigger>
								<SelectValue placeholder="Selecione um contato..." />
							</SelectTrigger>
							<SelectContent>
								{availableContacts.map((contact) => (
									<SelectItem key={contact.id} value={contact.id}>
										<div className="flex items-center gap-2">
											<span>
												{contact.firstName || contact.lastName
													? `${contact.firstName ?? ''} ${contact.lastName ?? ''}`.trim()
													: contact.email}
											</span>
											<span className="text-muted-foreground">({contact.email})</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}

				<DialogFooter>
					<Button onClick={() => onOpenChange(false)} variant="outline">
						Cancelar
					</Button>
					<Button disabled={!selectedContactId || isAdding} onClick={handleAdd}>
						{isAdding ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Adicionando...
							</>
						) : (
							<>
								<Plus className="mr-2 h-4 w-4" />
								Adicionar
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

interface ContactsTableProps {
	contacts: Contact[];
	onRemove: (contactId: number) => Promise<void>;
	isRemoving: number | null;
}

function ContactsTable({ contacts, onRemove, isRemoving }: ContactsTableProps) {
	if (contacts.length === 0) {
		return (
			<div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
				<Users className="mx-auto mb-2 h-8 w-8" />
				<p className="font-medium">Nenhum contato nesta lista</p>
				<p className="mt-1 text-sm">
					Adicione contatos para começar a usar esta lista em suas campanhas.
				</p>
			</div>
		);
	}

	return (
		<div className="rounded-lg border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Nome</TableHead>
						<TableHead>E-mail</TableHead>
						<TableHead>Status</TableHead>
						<TableHead className="w-[100px]">Ações</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{contacts.map((contact) => {
						const statusConfig = subscriptionStatusConfig[contact.subscriptionStatus];
						const displayName =
							contact.firstName || contact.lastName
								? `${contact.firstName ?? ''} ${contact.lastName ?? ''}`.trim()
								: '-';

						return (
							<TableRow key={contact.id}>
								<TableCell className="font-medium">{displayName}</TableCell>
								<TableCell>
									<div className="flex items-center gap-2">
										<Mail className="h-4 w-4 text-muted-foreground" />
										{contact.email}
									</div>
								</TableCell>
								<TableCell>
									<Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
								</TableCell>
								<TableCell>
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button
												className="text-destructive hover:bg-destructive/10 hover:text-destructive"
												disabled={isRemoving === contact.id}
												size="icon"
												variant="ghost"
											>
												{isRemoving === contact.id ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<UserMinus className="h-4 w-4" />
												)}
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>Remover contato?</AlertDialogTitle>
												<AlertDialogDescription>
													Você está prestes a remover "{contact.email}" desta lista. O contato não
													será excluído, apenas removido desta lista.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancelar</AlertDialogCancel>
												<AlertDialogAction
													className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
													onClick={() => onRemove(contact.id)}
												>
													Remover
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}

// ============================================================================
// Main Component
// ============================================================================

function ListDetailsPage() {
	const { listId } = Route.useParams();
	const navigate = Route.useNavigate();

	// Local state
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isAdding, setIsAdding] = useState(false);
	const [isRemoving, setIsRemoving] = useState<number | null>(null);
	const [isSyncing, setIsSyncing] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);

	// Convex queries
	const { data: listData } = trpc.emailMarketing.getList.useQuery({
		listId: listId as number,
	});
	const list = listData as Record<string, unknown> | undefined | null;
	const { data: allContacts } = trpc.emailMarketing.contacts.list.useQuery({});

	// Convex mutations/actions
	const updateList = trpc.emailMarketing.updateList.useMutation();
	const deleteList = trpc.emailMarketing.deleteList.useMutation();
	const addContactToList = trpc.emailMarketing.addContactToList.useMutation();
	const removeContactFromList = trpc.emailMarketing.removeContactFromList.useMutation();
	const syncListToBrevo = trpc.emailMarketing.syncListToBrevo.useMutation();

	// Filter contacts: those in this list vs those not in this list
	const { contactsInList, contactsNotInList } = useMemo(() => {
		if (!allContacts) {
			return { contactsInList: [], contactsNotInList: [] };
		}

		const inList: Contact[] = [];
		const notInList: Contact[] = [];

		for (const contact of allContacts) {
			const isInList = contact.listIds?.includes(listId as number);
			if (isInList) {
				inList.push(contact as Contact);
			} else {
				notInList.push(contact as Contact);
			}
		}

		return { contactsInList: inList, contactsNotInList: notInList };
	}, [allContacts, listId]);

	// Navigation
	const handleBack = () => {
		navigate({
			to: '/marketing/listas',
			search: { search: '', status: 'all', view: 'grid', page: 1 },
		});
	};

	// Toggle active status
	const handleToggleActive = async () => {
		if (!list) return;

		setIsUpdating(true);
		try {
			await updateList({
				listId: list.id,
				isActive: !list.isActive,
			});
			toast.success(list.isActive ? 'Lista desativada' : 'Lista ativada', {
				description: list.isActive
					? 'A lista não será mais usada para novas campanhas.'
					: 'A lista agora pode ser usada em campanhas.',
			});
		} catch (error) {
			toast.error('Erro ao atualizar lista', {
				description:
					error instanceof Error ? error.message : 'Ocorreu um erro inesperado. Tente novamente.',
			});
		} finally {
			setIsUpdating(false);
		}
	};

	// Sync to Brevo
	const handleSyncToBrevo = async () => {
		if (!list) return;

		setIsSyncing(true);
		try {
			await syncListToBrevo({ listId: list.id });
			toast.success('Sincronização concluída', {
				description: 'A lista foi sincronizada com o Brevo.',
			});
		} catch (error) {
			toast.error('Erro ao sincronizar', {
				description:
					error instanceof Error ? error.message : 'Não foi possível sincronizar com o Brevo.',
			});
		} finally {
			setIsSyncing(false);
		}
	};

	// Delete list
	const handleDelete = async () => {
		if (!list) return;

		setIsDeleting(true);
		try {
			await deleteList({ listId: list.id });
			toast.success('Lista excluída', {
				description: 'A lista foi excluída com sucesso.',
			});
			handleBack();
		} catch (error) {
			toast.error('Erro ao excluir lista', {
				description:
					error instanceof Error ? error.message : 'Ocorreu um erro inesperado. Tente novamente.',
			});
		} finally {
			setIsDeleting(false);
		}
	};

	// Add contact to list
	const handleAddContact = async (contactId: number) => {
		if (!list) return;

		setIsAdding(true);
		try {
			await addContactToList({ contactId, listId: list.id });
			toast.success('Contato adicionado', {
				description: 'O contato foi adicionado à lista com sucesso.',
			});
			setIsAddDialogOpen(false);
		} catch (error) {
			toast.error('Erro ao adicionar contato', {
				description:
					error instanceof Error ? error.message : 'Ocorreu um erro inesperado. Tente novamente.',
			});
		} finally {
			setIsAdding(false);
		}
	};

	// Remove contact from list
	const handleRemoveContact = async (contactId: number) => {
		if (!list) return;

		setIsRemoving(contactId);
		try {
			await removeContactFromList({ contactId, listId: list.id });
			toast.success('Contato removido', {
				description: 'O contato foi removido da lista.',
			});
		} catch (error) {
			toast.error('Erro ao remover contato', {
				description:
					error instanceof Error ? error.message : 'Ocorreu um erro inesperado. Tente novamente.',
			});
		} finally {
			setIsRemoving(null);
		}
	};

	// Loading state
	if (list === undefined || allContacts === undefined) {
		return <LoadingSkeleton />;
	}

	// Not found state
	if (list === null) {
		return <ListNotFound onBack={handleBack} />;
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-4">
					<Button onClick={handleBack} size="icon" variant="ghost">
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="font-bold text-2xl tracking-tight">{list.name}</h1>
							<Badge variant={list.isActive ? 'default' : 'secondary'}>
								{list.isActive ? 'Ativa' : 'Inativa'}
							</Badge>
							{list.brevoListId ? (
								<Badge className="gap-1" variant="outline">
									<Cloud className="h-3 w-3" />
									Brevo
								</Badge>
							) : (
								<Badge className="gap-1 text-muted-foreground" variant="outline">
									<CloudOff className="h-3 w-3" />
									Não sincronizada
								</Badge>
							)}
						</div>
						{list.description && <p className="text-muted-foreground">{list.description}</p>}
					</div>
				</div>

				{/* Header Actions */}
				<div className="flex items-center gap-2">
					<Button disabled={isSyncing} onClick={handleSyncToBrevo} variant="outline">
						{isSyncing ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Sincronizando...
							</>
						) : (
							<>
								<RefreshCw className="mr-2 h-4 w-4" />
								Sincronizar Brevo
							</>
						)}
					</Button>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">Contatos</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{contactsInList.length}</div>
						<p className="text-muted-foreground text-xs">contatos nesta lista</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">Status</CardTitle>
						<List className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="flex items-center justify-between">
							<span className="text-sm">{list.isActive ? 'Lista Ativa' : 'Lista Inativa'}</span>
							<Switch
								checked={list.isActive}
								disabled={isUpdating}
								onCheckedChange={handleToggleActive}
							/>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* List Details Card */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								<List className="h-5 w-5" />
								Informações da Lista
							</CardTitle>
							<CardDescription>Detalhes e configurações da lista de contatos</CardDescription>
						</div>
						<Button disabled size="sm" variant="outline">
							<Edit className="mr-2 h-4 w-4" />
							Editar
						</Button>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<p className="font-medium text-muted-foreground text-sm">Nome</p>
							<p className="mt-1">{list.name}</p>
						</div>
						<div>
							<p className="font-medium text-muted-foreground text-sm">Descrição</p>
							<p className="mt-1">{list.description || '-'}</p>
						</div>
					</div>

					{list.brevoListId && (
						<>
							<Separator />
							<div>
								<p className="font-medium text-muted-foreground text-sm">ID Brevo</p>
								<p className="mt-1 flex items-center gap-2">
									<ExternalLink className="h-4 w-4 text-muted-foreground" />
									<code className="rounded bg-muted px-2 py-0.5 text-sm">{list.brevoListId}</code>
								</p>
							</div>
						</>
					)}

					<Separator />

					{/* Delete List */}
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium text-destructive">Zona de Perigo</p>
							<p className="text-muted-foreground text-sm">
								Excluir esta lista permanentemente. Esta ação não pode ser desfeita.
							</p>
						</div>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button disabled={isDeleting} variant="destructive">
									{isDeleting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Excluindo...
										</>
									) : (
										<>
											<Trash2 className="mr-2 h-4 w-4" />
											Excluir Lista
										</>
									)}
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Excluir lista?</AlertDialogTitle>
									<AlertDialogDescription>
										Você está prestes a excluir a lista "{list.name}". Esta ação não pode ser
										desfeita. Os contatos não serão excluídos, apenas removidos desta lista.
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
				</CardContent>
			</Card>

			{/* Contacts Section */}
			<Card>
				<CardHeader>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								<Users className="h-5 w-5" />
								Contatos ({contactsInList.length})
							</CardTitle>
							<CardDescription>Gerencie os contatos que pertencem a esta lista</CardDescription>
						</div>
						<AddContactDialog
							availableContacts={contactsNotInList}
							isAdding={isAdding}
							isOpen={isAddDialogOpen}
							onAdd={handleAddContact}
							onOpenChange={setIsAddDialogOpen}
						/>
					</div>
				</CardHeader>
				<CardContent>
					<ContactsTable
						contacts={contactsInList}
						isRemoving={isRemoving}
						onRemove={handleRemoveContact}
					/>
				</CardContent>
			</Card>
		</div>
	);
}

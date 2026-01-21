import { api } from '@convex/_generated/api';
import type { Doc } from '@convex/_generated/dataModel';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { ArrowLeft, Cloud, CloudOff, List, Loader2, Search, Users } from 'lucide-react';
import { useState } from 'react';

import { CreateListDialog } from '@/components/marketing/create-list-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/_authenticated/marketing/listas')({
	component: ListsPage,
});

// Loading skeleton component
function LoadingSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<Skeleton className="h-10 w-48" />
				<Skeleton className="h-10 w-32" />
			</div>
			<Skeleton className="h-10 w-full max-w-sm" />
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{[1, 2, 3, 4, 5, 6].map((i) => (
					<Skeleton className="h-40" key={i} />
				))}
			</div>
		</div>
	);
}

// Empty state component
function EmptyState() {
	return (
		<Card>
			<CardContent className="flex flex-col items-center justify-center py-12">
				<List className="mb-4 h-12 w-12 text-muted-foreground" />
				<h2 className="font-semibold text-lg">Nenhuma lista encontrada</h2>
				<p className="mt-2 text-center text-muted-foreground text-sm">
					Crie sua primeira lista de contatos para começar a segmentar seus destinatários.
				</p>
				<div className="mt-6">
					<CreateListDialog />
				</div>
			</CardContent>
		</Card>
	);
}

// Sync status badge helper
function SyncStatusBadge({ status }: { status?: string }) {
	switch (status) {
		case 'synced':
			return (
				<Badge className="gap-1 text-green-600" variant="outline">
					<Cloud className="h-3 w-3" />
					Sincronizada
				</Badge>
			);
		case 'syncing':
			return (
				<Badge className="gap-1" variant="outline">
					<Loader2 className="h-3 w-3 animate-spin" />
					Sincronizando
				</Badge>
			);
		case 'error':
			return (
				<Badge className="gap-1" variant="destructive">
					<CloudOff className="h-3 w-3" />
					Erro
				</Badge>
			);
		case 'pending':
			return (
				<Badge className="gap-1" variant="secondary">
					Pendente
				</Badge>
			);
		default:
			return null;
	}
}

function ListsPage() {
	const navigate = Route.useNavigate();
	const [searchQuery, setSearchQuery] = useState('');

	// Fetch all lists
	const useQueryUnsafe = useQuery as unknown as (query: unknown, args?: unknown) => unknown;
	const apiAny = api as unknown as { emailMarketing: { getLists: unknown } };
	const lists = useQueryUnsafe(apiAny.emailMarketing.getLists, { activeOnly: false }) as
		| Doc<'emailLists'>[]
		| undefined;

	// Filter lists by search query
	const filteredLists =
		lists?.filter(
			(list: Doc<'emailLists'>) =>
				list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(list.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false),
		) ?? [];

	const emptyState = searchQuery ? (
		<Card>
			<CardContent className="flex flex-col items-center justify-center py-12">
				<Search className="mb-4 h-12 w-12 text-muted-foreground" />
				<h2 className="font-semibold text-lg">Nenhum resultado</h2>
				<p className="mt-2 text-center text-muted-foreground text-sm">
					Não encontramos listas com "{searchQuery}". Tente outro termo.
				</p>
				<Button className="mt-4" onClick={() => setSearchQuery('')} variant="outline">
					Limpar busca
				</Button>
			</CardContent>
		</Card>
	) : (
		<EmptyState />
	);

	// Navigation handlers
	const handleBack = () => {
		navigate({
			to: '/marketing',
			search: { search: '', status: 'all', view: 'grid', page: 1 },
		});
	};

	const handleListClick = (listId: string) => {
		navigate({
			to: '/marketing/listas/$listId',
			params: { listId },
			search: { search: '', status: 'all', view: 'grid', page: 1 },
		});
	};

	// Loading state
	if (lists === undefined) {
		return <LoadingSkeleton />;
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
						<h1 className="font-bold text-2xl tracking-tight">Listas de Contatos</h1>
						<p className="text-muted-foreground">
							Gerencie suas listas de segmentação para campanhas
						</p>
					</div>
				</div>
				<CreateListDialog />
			</div>

			{/* Search */}
			<div className="relative max-w-sm">
				<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					className="pl-9"
					onChange={(e) => setSearchQuery(e.target.value)}
					placeholder="Buscar listas..."
					value={searchQuery}
				/>
			</div>

			{/* Lists Grid */}
			{filteredLists.length === 0 ? (
				emptyState
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{filteredLists.map((list: Doc<'emailLists'>) => (
						<Card
							className="cursor-pointer transition-colors hover:bg-muted/50"
							key={list._id}
							onClick={() => handleListClick(list._id)}
						>
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-2">
										<List className="h-5 w-5 text-muted-foreground" />
										<CardTitle className="text-lg">{list.name}</CardTitle>
									</div>
									<Badge variant={list.isActive ? 'default' : 'secondary'}>
										{list.isActive ? 'Ativa' : 'Inativa'}
									</Badge>
								</div>
								{list.description && (
									<CardDescription className="line-clamp-2">{list.description}</CardDescription>
								)}
							</CardHeader>
							<CardContent>
								<div className="flex items-center justify-between text-sm">
									<div className="flex items-center gap-2 text-muted-foreground">
										<Users className="h-4 w-4" />
										<span>
											{list.contactCount ?? 0} contato{(list.contactCount ?? 0) !== 1 ? 's' : ''}
										</span>
									</div>
									<SyncStatusBadge status={list.syncStatus} />
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Summary */}
			{lists.length > 0 && (
				<div className="flex items-center justify-between text-muted-foreground text-sm">
					<span>
						{filteredLists.length} de {lists.length} lista
						{lists.length !== 1 ? 's' : ''}
					</span>
					<span>
						Total:{' '}
						{lists.reduce((sum: number, l: Doc<'emailLists'>) => sum + (l.contactCount ?? 0), 0)}{' '}
						contatos
					</span>
				</div>
			)}
		</div>
	);
}

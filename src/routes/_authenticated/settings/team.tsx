import { api } from '@convex/_generated/api';
import type { Doc } from '@convex/_generated/dataModel';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { usePaginatedQuery } from 'convex/react';
import { Search, UserCog } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce';

// Components
import { EditRoleDialog } from './team/-components/edit-role-dialog';
import { InviteDialog } from './team/-components/invite-dialog';
import { RemoveDialog } from './team/-components/remove-dialog';
import { UserDetailsDrawer } from './team/-components/user-details';
import { UserTable } from './team/-components/user-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const Route = createFileRoute('/_authenticated/settings/team')({
	beforeLoad: ({ context }) => {
		const isLoaded = context.auth?.isLoaded;
		const role = context.auth?.orgRole;
		const isAdmin =
			role === 'org:admin' || role === 'org:owner' || role === 'admin' || role === 'owner';
		const hasPermission = context.auth?.has?.({ permission: 'team:manage' });

		if (isLoaded && !isAdmin && !hasPermission) {
			// Instead of throwing a raw error, redirect with a message
			toast.error('Você não tem permissão para acessar o gerenciamento de equipe.');
			throw redirect({
				to: '/settings',
			});
		}
	},
	component: TeamSettingsPage,
});

function TeamSettingsPage() {
	const [searchQuery, setSearchQuery] = useState('');
	const [debouncedQuery] = useDebounce(searchQuery, 300);

	// Use paginated query
	// biome-ignore lint/suspicious/noExplicitAny: Fix deep type instantiation
	const searchTeamMembers = (api as any).users.searchTeamMembers;
	// biome-ignore lint/suspicious/noExplicitAny: Fix deep type instantiation
	const paginatedQuery = usePaginatedQuery as any;
	const { results, status, loadMore } = paginatedQuery(
		searchTeamMembers,
		{ query: debouncedQuery },
		{ initialNumItems: 10 },
	);

	// State for Dialogs
	const [selectedUser, setSelectedUser] = useState<Doc<'users'> | null>(null);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isRemoveOpen, setIsRemoveOpen] = useState(false);

	// Handlers
	const handleEditRole = (user: Doc<'users'>) => {
		setSelectedUser(user);
		setIsEditOpen(true);
	};

	const handleRemove = (user: Doc<'users'>) => {
		setSelectedUser(user);
		setIsRemoveOpen(true);
	};

	const handleView = (user: Doc<'users'>) => {
		setSelectedUser(user);
	};

	const isLoading = status === 'LoadingFirstPage';

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="flex items-center gap-2 font-bold text-2xl">
						<UserCog className="h-6 w-6 text-purple-500" />
						Gerenciar Equipe
					</h1>
					<p className="text-muted-foreground">Adicione e gerencie membros da equipe</p>
				</div>
				<InviteDialog />
			</div>

			{/* Filters */}
			<div className="flex items-center gap-4">
				<div className="relative max-w-sm flex-1">
					<Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						className="pl-8"
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Buscar por nome ou email..."
						value={searchQuery}
					/>
				</div>
			</div>

			{/* Table */}
			<UserTable
				isLoading={isLoading}
				onEdit={handleEditRole}
				onRemove={handleRemove}
				onView={handleView}
				users={results || []}
			/>

			{/* Pagination / Load More */}
			<div className="flex justify-center py-4">
				{status === 'CanLoadMore' && (
					<Button onClick={() => loadMore(10)} variant="outline">
						Carregar mais
					</Button>
				)}
			</div>

			{/* Dialogs */}
			{selectedUser && (
				<UserDetailsDrawer
					onClose={() => setSelectedUser(null)}
					onEditRole={(u) => {
						setSelectedUser(u);
						setIsEditOpen(true);
					}}
					onRemove={(u) => {
						setSelectedUser(u);
						setIsRemoveOpen(true);
					}}
					user={selectedUser}
				/>
			)}

			{selectedUser && (
				<>
					<EditRoleDialog
						onOpenChange={(open) => {
							setIsEditOpen(open);
							if (!open) setSelectedUser(null);
						}}
						open={isEditOpen}
						user={{
							clerkId: selectedUser.clerkId || '',
							name: selectedUser.name,
							role: selectedUser.role,
						}}
					/>
					<RemoveDialog
						onOpenChange={(open) => {
							setIsRemoveOpen(open);
							if (!open) setSelectedUser(null);
						}}
						open={isRemoveOpen}
						user={{
							clerkId: selectedUser.clerkId || '',
							name: selectedUser.name,
							email: selectedUser.email,
						}}
					/>
				</>
			)}
		</div>
	);
}

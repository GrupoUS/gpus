import { api } from '@convex/_generated/api';
import type { Doc } from '@convex/_generated/dataModel';
import { createFileRoute } from '@tanstack/react-router';
import { usePaginatedQuery } from 'convex/react';
import { Search, UserCog } from 'lucide-react';
import { useState } from 'react';
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
	component: TeamSettingsPage,
});

function TeamSettingsPage() {
	const [searchQuery, setSearchQuery] = useState('');
	const [debouncedQuery] = useDebounce(searchQuery, 300);

	// Use paginated query
	const { results, status, loadMore } = usePaginatedQuery(
		api.users.searchTeamMembers as any,
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
					<h1 className="text-2xl font-bold flex items-center gap-2">
						<UserCog className="h-6 w-6 text-purple-500" />
						Gerenciar Equipe
					</h1>
					<p className="text-muted-foreground">Adicione e gerencie membros da equipe</p>
				</div>
				<InviteDialog />
			</div>

			{/* Filters */}
			<div className="flex items-center gap-4">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Buscar por nome ou email..."
						className="pl-8"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			{/* Table */}
			<UserTable
				users={results || []}
				isLoading={isLoading}
				onEdit={handleEditRole}
				onRemove={handleRemove}
				onView={handleView}
			/>

			{/* Pagination / Load More */}
			<div className="flex justify-center py-4">
				{status === 'CanLoadMore' && (
					<Button variant="outline" onClick={() => loadMore(10)}>
						Carregar mais
					</Button>
				)}
			</div>

			{/* Dialogs */}
			{selectedUser && (
				<UserDetailsDrawer
					user={selectedUser}
					onClose={() => setSelectedUser(null)}
					onEditRole={(u) => {
						setSelectedUser(u);
						setIsEditOpen(true);
					}}
					onRemove={(u) => {
						setSelectedUser(u);
						setIsRemoveOpen(true);
					}}
				/>
			)}

			{selectedUser && (
				<>
					<EditRoleDialog
						open={isEditOpen}
						onOpenChange={(open) => {
							setIsEditOpen(open);
							if (!open) setSelectedUser(null);
						}}
						user={{
							clerkId: selectedUser.clerkId || '',
							name: selectedUser.name,
							role: selectedUser.role,
						}}
					/>
					<RemoveDialog
						open={isRemoveOpen}
						onOpenChange={(open) => {
							setIsRemoveOpen(open);
							if (!open) setSelectedUser(null);
						}}
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

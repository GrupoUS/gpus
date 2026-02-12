import { createFileRoute, redirect } from '@tanstack/react-router';
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
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';

export interface TeamUser {
	id: number;
	clerkId: string;
	name: string;
	email: string;
	role: string;
	isActive: boolean;
	inviteStatus?: string;
	createdAt?: Date | string;
	[key: string]: unknown;
}

export const Route = createFileRoute('/_authenticated/settings/team')({
	beforeLoad: ({ context }) => {
		const isLoaded = context.auth?.isLoaded;
		const role = context.auth?.orgRole;
		const isAdmin =
			role === 'org:admin' || role === 'org:owner' || role === 'admin' || role === 'owner';
		const hasPermission = context.auth?.has?.({ permission: 'team:manage' });

		if (isLoaded && !isAdmin && !hasPermission) {
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

	const { data: allUsers, isLoading } = trpc.users.list.useQuery();

	const results: TeamUser[] = ((allUsers as TeamUser[] | undefined) ?? []).filter((user) => {
		if (!debouncedQuery) return true;
		const q = debouncedQuery.toLowerCase();
		return user.name?.toLowerCase().includes(q) || user.email?.toLowerCase().includes(q);
	});

	const [selectedUser, setSelectedUser] = useState<TeamUser | null>(null);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isRemoveOpen, setIsRemoveOpen] = useState(false);

	const handleEditRole = (user: TeamUser) => {
		setSelectedUser(user);
		setIsEditOpen(true);
	};

	const handleRemove = (user: TeamUser) => {
		setSelectedUser(user);
		setIsRemoveOpen(true);
	};

	const handleView = (user: TeamUser) => {
		setSelectedUser(user);
	};

	return (
		<div className="space-y-6 p-6">
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

			<UserTable
				isLoading={isLoading}
				onEdit={handleEditRole}
				onRemove={handleRemove}
				onView={handleView}
				users={results}
			/>

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
							id: selectedUser.id,
							clerkId: selectedUser.clerkId,
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
							id: selectedUser.id,
							clerkId: selectedUser.clerkId,
							name: selectedUser.name,
							email: selectedUser.email,
						}}
					/>
				</>
			)}
		</div>
	);
}

import { Eye, MoreVertical, Trash2, UserCog } from 'lucide-react';

import type { Doc } from '../../../../../../convex/_generated/dataModel';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

interface UserTableProps {
	users: Doc<'users'>[];
	isLoading: boolean;
	onEdit: (user: Doc<'users'>) => void;
	onRemove: (user: Doc<'users'>) => void;
	onView: (user: Doc<'users'>) => void;
}

const roleLabels: Record<string, string> = {
	owner: 'Proprietário',
	admin: 'Admin',
	manager: 'Gerente',
	member: 'Membro',
	sdr: 'SDR',
	cs: 'CS',
	support: 'Suporte',
};

const roleBadgeVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
	owner: 'default',
	admin: 'default',
	manager: 'default',
	member: 'outline',
	sdr: 'secondary',
	cs: 'outline',
	support: 'outline',
};

export function UserTable({ users, isLoading, onEdit, onRemove, onView }: UserTableProps) {
	if (isLoading) {
		return (
			<div className="space-y-2">
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="h-16 w-full animate-pulse bg-muted rounded-md" />
				))}
			</div>
		);
	}

	if (users.length === 0) {
		return <div className="text-center py-12 text-muted-foreground">Nenhum membro encontrado.</div>;
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Membro</TableHead>
					<TableHead>Email</TableHead>
					<TableHead>Função</TableHead>
					<TableHead>Status</TableHead>
					<TableHead className="w-12" />
				</TableRow>
			</TableHeader>
			<TableBody>
				{users.map((user) => (
					<TableRow
						key={user._id}
						className="cursor-pointer hover:bg-muted/50"
						onClick={() => onView(user)}
					>
						<TableCell>
							<div className="flex items-center gap-3">
								<Avatar className="h-9 w-9">
									<AvatarFallback className="text-xs bg-primary/10 text-primary">
										{user.name
											? user.name
													.split(' ')
													.map((n) => n[0])
													.join('')
													.slice(0, 2)
													.toUpperCase()
											: 'U'}
									</AvatarFallback>
								</Avatar>
								<span className="font-medium">{user.name}</span>
							</div>
						</TableCell>
						<TableCell className="text-muted-foreground">{user.email}</TableCell>
						<TableCell>
							<Badge variant={roleBadgeVariants[user.role] || 'outline'}>
								{roleLabels[user.role] || user.role}
							</Badge>
						</TableCell>
						<TableCell>
							<Badge
								variant={
									// inviteStatus added to schema
									user.inviteStatus === 'pending'
										? 'secondary'
										: user.isActive
											? 'default'
											: 'secondary'
								}
							>
								{user.inviteStatus === 'pending' ? 'Pendente' : user.isActive ? 'Ativo' : 'Inativo'}
							</Badge>
						</TableCell>
						<TableCell onClick={(e) => e.stopPropagation()}>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon">
										<MoreVertical className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem onClick={() => onView(user)}>
										<Eye className="h-4 w-4 mr-2" />
										Detalhes
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => onEdit(user)}>
										<UserCog className="h-4 w-4 mr-2" />
										Editar Função
									</DropdownMenuItem>
									<DropdownMenuItem className="text-destructive" onClick={() => onRemove(user)}>
										<Trash2 className="h-4 w-4 mr-2" />
										Remover
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

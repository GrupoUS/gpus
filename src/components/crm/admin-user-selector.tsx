import { api } from '@convex/_generated/api';
import { useQuery } from 'convex/react';
import { Check, ChevronsUpDown, User } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface AdminUserSelectorProps {
	selectedUserId: string | null;
	onUserSelect: (userId: string | null) => void;
}

export function AdminUserSelector({ selectedUserId, onUserSelect }: AdminUserSelectorProps) {
	const [open, setOpen] = useState(false);
	const users = useQuery(api.users.listSystemUsers);

	// If no users returned (not admin or no data), don't render
	if (!users || users.length === 0) {
		return null;
	}

	const selectedUser = users.find((u) => u.clerkId === selectedUserId);

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button
					aria-expanded={open}
					className="w-[250px] justify-between"
					role="combobox"
					variant="outline"
				>
					<User className="mr-2 h-4 w-4" />
					{selectedUser ? selectedUser.name : 'Todos os usuários'}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[250px] p-0">
				<Command>
					<CommandInput placeholder="Buscar usuário..." />
					<CommandList>
						<CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
						<CommandGroup>
							<CommandItem
								onSelect={() => {
									onUserSelect(null);
									setOpen(false);
								}}
								value="all"
							>
								<Check
									className={cn('mr-2 h-4 w-4', selectedUserId ? 'opacity-0' : 'opacity-100')}
								/>
								Todos os usuários
							</CommandItem>
							{users.map((user) => (
								<CommandItem
									key={user._id}
									onSelect={() => {
										onUserSelect(user.clerkId);
										setOpen(false);
									}}
									value={user.name}
								>
									<Check
										className={cn(
											'mr-2 h-4 w-4',
											selectedUserId === user.clerkId ? 'opacity-100' : 'opacity-0',
										)}
									/>
									<div className="flex flex-col">
										<span>{user.name}</span>
										<span className="text-muted-foreground text-xs">{user.role}</span>
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

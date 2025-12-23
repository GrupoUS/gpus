import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { Loader2, MoreVertical, Plus, Trash2, UserCog } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

export const Route = createFileRoute('/_authenticated/settings/team')({
	component: TeamSettingsPage,
});

const userSchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
	email: z.string().email('Email inválido'),
	role: z.enum(['admin', 'sdr', 'cs', 'support']),
});

type UserFormData = z.infer<typeof userSchema>;

const roleLabels: Record<string, string> = {
	admin: 'Admin',
	sdr: 'SDR',
	cs: 'CS',
	support: 'Suporte',
};

const roleBadgeVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
	admin: 'default',
	sdr: 'secondary',
	cs: 'outline',
	support: 'outline',
};

function TeamSettingsPage() {
	const users = useQuery(api.users.list);
	const deleteUser = useMutation(api.users.deleteUser);
	const [isCreateOpen, setIsCreateOpen] = useState(false);

	const handleDeactivateUser = async (userId: Id<'users'>, userName: string) => {
		if (confirm(`Desativar ${userName}?`)) {
			try {
				await deleteUser({ userId });
				toast.success('Membro desativado com sucesso!');
			} catch (_error) {
				toast.error('Erro ao desativar membro');
			}
		}
	};

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
				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogTrigger asChild>
						<Button className="gap-2">
							<Plus className="h-4 w-4" />
							Adicionar Membro
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Novo Membro</DialogTitle>
						</DialogHeader>
						<p className="text-sm text-muted-foreground mb-4">
							Para adicionar novos membros, convide-os através do painel de organização do Clerk. Os
							usuários aparecerão aqui após fazer login.
						</p>
						<Button variant="outline" onClick={() => setIsCreateOpen(false)}>
							Entendi
						</Button>
					</DialogContent>
				</Dialog>
			</div>

			{/* Users Table */}
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
					{users?.map((user: Doc<'users'>) => (
						<TableRow key={user._id}>
							<TableCell>
								<div className="flex items-center gap-3">
									<Avatar className="h-9 w-9">
										<AvatarFallback className="text-xs bg-primary/10 text-primary">
											{user.name
												.split(' ')
												.map((n: string) => n[0])
												.join('')
												.slice(0, 2)}
										</AvatarFallback>
									</Avatar>
									<span className="font-medium">{user.name}</span>
								</div>
							</TableCell>
							<TableCell className="text-muted-foreground">{user.email}</TableCell>
							<TableCell>
								<Badge variant={roleBadgeVariants[user.role]}>{roleLabels[user.role]}</Badge>
							</TableCell>
							<TableCell>
								<Badge variant={user.isActive ? 'default' : 'secondary'}>
									{user.isActive ? 'Ativo' : 'Inativo'}
								</Badge>
							</TableCell>
							<TableCell>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="icon">
											<MoreVertical className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<Dialog>
											<DialogTrigger asChild>
												<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
													Editar
												</DropdownMenuItem>
											</DialogTrigger>
											<DialogContent>
												<DialogHeader>
													<DialogTitle>Editar Membro</DialogTitle>
												</DialogHeader>
												<UserForm
													userId={user._id}
													initialData={{ name: user.name, email: user.email, role: user.role }}
												/>
											</DialogContent>
										</Dialog>
										<DropdownMenuItem
											className="text-destructive"
											onClick={() => handleDeactivateUser(user._id, user.name)}
										>
											<Trash2 className="h-4 w-4 mr-2" />
											Desativar
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

function UserForm({
	userId,
	initialData,
	onSuccess,
}: {
	userId?: Id<'users'>;
	initialData?: UserFormData;
	onSuccess?: () => void;
}) {
	const updateUser = useMutation(api.users.updateUser);
	const deleteUser = useMutation(api.users.deleteUser);

	const form = useForm<UserFormData>({
		resolver: zodResolver(userSchema),
		defaultValues: initialData ?? {
			name: '',
			email: '',
			role: 'sdr',
		},
	});

	const onSubmit = async (values: UserFormData) => {
		try {
			if (userId) {
				await updateUser({ userId, patch: values });
				toast.success('Membro atualizado com sucesso!');
			} else {
				// Note: Create would need syncUser with Clerk integration
				toast.info('Criação de usuários requer integração com Clerk');
			}
			onSuccess?.();
		} catch (_error) {
			toast.error('Erro ao salvar membro');
		}
	};

	const handleDelete = async () => {
		if (!userId) return;
		try {
			await deleteUser({ userId });
			toast.success('Membro desativado');
			onSuccess?.();
		} catch (_error) {
			toast.error('Erro ao desativar membro');
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nome Completo</FormLabel>
							<FormControl>
								<Input placeholder="Ex: João Silva" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input type="email" placeholder="joao@exemplo.com" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="role"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Função</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="admin">Admin</SelectItem>
									<SelectItem value="sdr">SDR (Vendas)</SelectItem>
									<SelectItem value="cs">CS (Customer Success)</SelectItem>
									<SelectItem value="support">Suporte</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-between pt-4">
					{userId && (
						<Button type="button" variant="destructive" onClick={handleDelete}>
							Desativar
						</Button>
					)}
					<Button type="submit" disabled={form.formState.isSubmitting} className="ml-auto">
						{form.formState.isSubmitting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Salvando...
							</>
						) : userId ? (
							'Atualizar'
						) : (
							'Criar'
						)}
					</Button>
				</div>
			</form>
		</Form>
	);
}

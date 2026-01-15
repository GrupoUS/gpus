import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'convex/react';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { api } from '../../../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const editRoleSchema = z.object({
	role: z.enum(['admin', 'manager', 'member', 'sdr', 'cs', 'support']),
	reason: z.string().optional(),
});

type EditRoleFormData = z.infer<typeof editRoleSchema>;

interface EditRoleDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: {
		clerkId: string;
		name: string;
		role: 'admin' | 'manager' | 'member' | 'sdr' | 'cs' | 'support' | string;
	};
}

export function EditRoleDialog({ open, onOpenChange, user }: EditRoleDialogProps) {
	const updateRole = useAction(api.users.updateTeamMemberRole);

	const form = useForm<EditRoleFormData>({
		resolver: zodResolver(editRoleSchema),
		defaultValues: {
			// biome-ignore lint/suspicious/noExplicitAny: cast to enum
			role: user.role as any,
			reason: '',
		},
	});

	const onSubmit = async (values: EditRoleFormData) => {
		try {
			await updateRole({
				userId: user.clerkId,
				newRole: values.role,
				reason: values.reason,
			});
			toast.success('Função atualizada com sucesso');
			onOpenChange(false);
			// biome-ignore lint/suspicious/noExplicitAny: catch generic error
		} catch (error: any) {
			toast.error(error.message || 'Erro ao atualizar função');
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Alterar Função</DialogTitle>
					<DialogDescription>
						Alterando função de <strong>{user.name}</strong>
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="role"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Nova Função</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="admin">Admin</SelectItem>
											<SelectItem value="manager">Gerente</SelectItem>
											<SelectItem value="member">Membro</SelectItem>
											{/* Legacy roles if needed to maintain */}
											<SelectItem value="sdr">SDR (Legado)</SelectItem>
											<SelectItem value="cs">CS (Legado)</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="reason"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Motivo (Opcional)</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Justificativa para auditoria..."
											className="resize-none"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
								Cancelar
							</Button>
							<Button type="submit" disabled={form.formState.isSubmitting}>
								{form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Salvar Alterações
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

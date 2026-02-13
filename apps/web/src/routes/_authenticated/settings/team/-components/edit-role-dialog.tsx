import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { trpc } from '../../../../../lib/trpc';
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
		id: number | string;
		clerkId: string;
		name: string;
		role: string;
	};
}

export function EditRoleDialog({ open, onOpenChange, user }: EditRoleDialogProps) {
	const updateRole = trpc.users.update.useMutation();

	const form = useForm<EditRoleFormData>({
		resolver: zodResolver(editRoleSchema),
		defaultValues: {
			role: user.role as EditRoleFormData['role'],
			reason: '',
		},
	});

	const onSubmit = async (values: EditRoleFormData) => {
		try {
			await updateRole.mutateAsync({
				userId: Number(user.id),
				patch: { role: values.role },
			});
			toast.success('Função atualizada com sucesso');
			onOpenChange(false);
			// biome-ignore lint/suspicious/noExplicitAny: catch generic error
		} catch (error: any) {
			toast.error(error.message || 'Erro ao atualizar função');
		}
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Alterar Função</DialogTitle>
					<DialogDescription>
						Alterando função de <strong>{user.name}</strong>
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
						<FormField
							control={form.control}
							name="role"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Nova Função</FormLabel>
									<Select defaultValue={field.value} onValueChange={field.onChange}>
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
											className="resize-none"
											placeholder="Justificativa para auditoria..."
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter>
							<Button onClick={() => onOpenChange(false)} type="button" variant="outline">
								Cancelar
							</Button>
							<Button disabled={form.formState.isSubmitting} type="submit">
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

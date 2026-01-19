import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'convex/react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { api } from '../../../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Input } from '@/components/ui/input';

const removeUserSchema = z.object({
	reason: z.string().min(5, 'Motivo é obrigatório (min 5 caracteres)'),
	confirmation: z.boolean().refine((val) => val === true, {
		message: 'Você deve confirmar que entende as consequências',
	}),
});

type RemoveUserFormData = z.infer<typeof removeUserSchema>;

interface RemoveDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: {
		clerkId: string;
		name: string;
		email: string;
	};
}

export function RemoveDialog({ open, onOpenChange, user }: RemoveDialogProps) {
	const removeUser = useAction(api.users.removeTeamMember);

	const form = useForm<RemoveUserFormData>({
		resolver: zodResolver(removeUserSchema),
		defaultValues: {
			reason: '',
			confirmation: false,
		},
	});

	const onSubmit = async (values: RemoveUserFormData) => {
		try {
			await removeUser({
				userId: user.clerkId,
				reason: values.reason,
			});
			toast.success('Membro removido com sucesso');
			onOpenChange(false);
			// biome-ignore lint/suspicious/noExplicitAny: catch generic error
		} catch (error: any) {
			toast.error(error.message || 'Erro ao remover membro');
		}
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="border-destructive/50">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-destructive">
						<AlertTriangle className="h-5 w-5" />
						Remover Membro
					</DialogTitle>
					<DialogDescription>
						Esta ação removerá <strong>{user.name}</strong> ({user.email}) da equipe. O acesso será
						revogado imediatamente.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
						<FormField
							control={form.control}
							name="reason"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Motivo da remoção (Auditoria)</FormLabel>
									<FormControl>
										<Input placeholder="Ex: Saiu da empresa" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="confirmation"
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
									<FormControl>
										<Checkbox checked={field.value} onCheckedChange={field.onChange} />
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel>Entendo que esta ação desativa o usuário</FormLabel>
									</div>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter>
							<Button onClick={() => onOpenChange(false)} type="button" variant="outline">
								Cancelar
							</Button>
							<Button disabled={form.formState.isSubmitting} type="submit" variant="destructive">
								{form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Confirmar Remoção
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

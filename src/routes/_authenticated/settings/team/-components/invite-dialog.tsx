import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'convex/react';
import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { api } from '../../../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

const inviteSchema = z.object({
	email: z.string().email('Email inválido'),
	role: z.enum(['admin', 'manager', 'member']),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export function InviteDialog() {
	const [open, setOpen] = useState(false);
	const inviteUser = useAction(api.users.inviteTeamMember);

	const form = useForm<InviteFormData>({
		resolver: zodResolver(inviteSchema),
		defaultValues: {
			email: '',
			role: 'member',
		},
	});

	const onSubmit = async (values: InviteFormData) => {
		try {
			await inviteUser({
				email: values.email,
				role: values.role,
				redirectUrl: `${window.location.origin}/sign-up`, // Redirect to sign-up after invite accept
			});
			toast.success(`Convite enviado para ${values.email}`);
			setOpen(false);
			form.reset();
		} catch (error: any) {
			toast.error(error.message || 'Erro ao enviar convite');
		}
	};

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild>
				<Button className="gap-2">
					<Plus className="h-4 w-4" />
					Convidar Membro
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Convidar Membro</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input placeholder="email@exemplo.com" {...field} />
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
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex justify-end pt-4">
							<Button disabled={form.formState.isSubmitting} type="submit">
								{form.formState.isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Enviando...
									</>
								) : (
									'Enviar Convite'
								)}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

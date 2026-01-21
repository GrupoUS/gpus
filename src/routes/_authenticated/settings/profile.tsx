import { useUser } from '@clerk/clerk-react';
import { api } from '@convex/_generated/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { Loader2, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export const Route = createFileRoute('/_authenticated/settings/profile')({
	component: ProfileSettingsPage,
});

const profileSchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
	email: z.string().email(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

function ProfileSettingsPage() {
	const { user: clerkUser } = useUser();
	const userData = useQuery(api.users.current);
	const updateProfile = useMutation(api.users.updateProfile);

	const form = useForm<ProfileFormData>({
		resolver: zodResolver(profileSchema),
		values: {
			name: userData?.name || clerkUser?.fullName || '',
			email: userData?.email || clerkUser?.primaryEmailAddress?.emailAddress || '',
		},
	});

	const onSubmit = async (values: ProfileFormData) => {
		try {
			await updateProfile({
				name: values.name,
				// We sync email back to Convex, but Clerk is source of truth for auth
			});
			toast.success('Perfil atualizado com sucesso!');
		} catch (_error) {
			toast.error('Erro ao atualizar perfil');
		}
	};

	if (!userData) {
		return (
			<div className="flex justify-center p-12">
				<Loader2 className="h-8 w-8 animate-spin text-purple-500" />
			</div>
		);
	}

	return (
		<div className="max-w-4xl space-y-6 p-6">
			<div>
				<h1 className="flex items-center gap-2 font-bold text-2xl">
					<User className="h-6 w-6 text-purple-500" />
					Meu Perfil
				</h1>
				<p className="text-muted-foreground">Gerencie suas informações pessoais</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Informações Básicas</CardTitle>
					<CardDescription>Seus dados de identificação no portal.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex items-center gap-6">
						<Avatar className="h-20 w-20 border-2 border-purple-100">
							<AvatarImage src={clerkUser?.imageUrl} />
							<AvatarFallback className="text-xl">
								{userData.name?.slice(0, 2).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div className="space-y-1">
							<h3 className="font-medium">Foto de Perfil</h3>
							<p className="max-w-xs text-muted-foreground text-sm">
								Sua foto é gerenciada pela sua conta Clerk.
							</p>
						</div>
					</div>

					<Form {...form}>
						<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nome Completo</FormLabel>
										<FormControl>
											<Input {...field} />
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
											<Input {...field} disabled />
										</FormControl>
										<FormDescription>
											O email é gerenciado pelo provedor de autenticação.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="flex justify-end">
								<Button disabled={form.formState.isSubmitting} type="submit">
									{form.formState.isSubmitting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Salvando...
										</>
									) : (
										'Salvar Alterações'
									)}
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}

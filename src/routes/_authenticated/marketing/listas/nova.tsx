import { api } from '@convex/_generated/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { ArrowLeft, List, Loader2, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

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
import { Textarea } from '@/components/ui/textarea';

export const Route = createFileRoute('/_authenticated/marketing/listas/nova')({
	component: NewListPage,
});

// Zod schema for form validation
const listFormSchema = z.object({
	name: z
		.string()
		.min(3, { message: 'Nome deve ter pelo menos 3 caracteres' })
		.max(100, { message: 'Nome deve ter no máximo 100 caracteres' }),
	description: z
		.string()
		.max(500, { message: 'Descrição deve ter no máximo 500 caracteres' })
		.optional(),
});

type ListFormValues = z.infer<typeof listFormSchema>;

function NewListPage() {
	const navigate = Route.useNavigate();

	// Convex mutation
	const createList = useMutation(api.emailMarketing.createList);

	// Form setup
	const form = useForm<ListFormValues>({
		resolver: zodResolver(listFormSchema),
		defaultValues: {
			name: '',
			description: '',
		},
	});

	const isSubmitting = form.formState.isSubmitting;

	// Handle form submission
	const onSubmit = async (data: ListFormValues) => {
		try {
			const listId = await createList({
				name: data.name,
				description: data.description || undefined,
			});

			toast.success('Lista criada com sucesso!', {
				description: 'Sua nova lista de contatos está pronta.',
			});

			// Navigate to the list details page
			navigate({
				to: '/marketing/listas/$listId',
				params: { listId },
				search: { search: '', status: 'all', view: 'grid', page: 1 },
			});
		} catch (error) {
			toast.error('Erro ao criar lista', {
				description:
					error instanceof Error ? error.message : 'Ocorreu um erro inesperado. Tente novamente.',
			});
		}
	};

	const handleCancel = () => {
		navigate({
			to: '/marketing/listas',
			search: { search: '', status: 'all', view: 'grid', page: 1 },
		});
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" onClick={handleCancel}>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Nova Lista</h1>
					<p className="text-muted-foreground">Crie uma nova lista de segmentação de contatos</p>
				</div>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<div className="grid gap-6 lg:grid-cols-3">
						{/* Main Form Card */}
						<div className="lg:col-span-2">
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<List className="h-5 w-5" />
										Informações da Lista
									</CardTitle>
									<CardDescription>
										Configure o nome e descrição da sua lista de contatos
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Nome da Lista *</FormLabel>
												<FormControl>
													<Input placeholder="Ex: Clientes VIP" {...field} />
												</FormControl>
												<FormDescription>
													Nome único para identificar esta lista de contatos
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="description"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Descrição (Opcional)</FormLabel>
												<FormControl>
													<Textarea
														placeholder="Ex: Lista de clientes com mais de 5 compras nos últimos 6 meses"
														className="min-h-[100px]"
														{...field}
													/>
												</FormControl>
												<FormDescription>
													Uma breve descrição do propósito ou critérios desta lista
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>
						</div>

						{/* Sidebar */}
						<div className="space-y-6">
							{/* Actions Card */}
							<Card>
								<CardHeader>
									<CardTitle>Ações</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									<Button type="submit" className="w-full" disabled={isSubmitting}>
										{isSubmitting ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Criando...
											</>
										) : (
											<>
												<Save className="mr-2 h-4 w-4" />
												Criar Lista
											</>
										)}
									</Button>
									<Button
										type="button"
										variant="outline"
										className="w-full"
										onClick={handleCancel}
										disabled={isSubmitting}
									>
										Cancelar
									</Button>
								</CardContent>
							</Card>

							{/* Info Card */}
							<Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
								<CardContent className="pt-6">
									<p className="text-sm text-muted-foreground">
										<strong>Dica:</strong> Após criar a lista, você poderá adicionar contatos
										existentes ou importar novos contatos diretamente na página de detalhes.
									</p>
								</CardContent>
							</Card>
						</div>
					</div>
				</form>
			</Form>
		</div>
	);
}

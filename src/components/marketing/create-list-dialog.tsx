'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'convex/react';
import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
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

const formSchema = z.object({
	name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
	description: z.string().optional(),
	sourceType: z.enum(['lead', 'student']),
	product: z.string().optional(),
	stage: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateListDialog() {
	const [open, setOpen] = useState(false);
	// @ts-expect-error
	const createList = useAction(api.emailMarketing.createListFromSegment);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: '',
			description: '',
			sourceType: 'student',
			product: 'all',
			stage: 'all',
		},
	});

	const sourceType = form.watch('sourceType');
	const isSubmitting = form.formState.isSubmitting;

	async function onSubmit(values: FormValues) {
		try {
			const filters: Record<string, any> = {};

			if (values.sourceType === 'student') {
				filters.product = values.product === 'all' ? undefined : values.product;
				filters.status = 'ativo'; // Default to active students
			} else {
				filters.stage = values.stage === 'all' ? undefined : values.stage;
			}

			const result = await createList({
				name: values.name,
				description: values.description,
				sourceType: values.sourceType,
				filters,
			});

			toast.success(`Lista criada com ${result.count} contatos!`, {
				description: 'A sincronização com o Brevo foi iniciada.',
			});

			setOpen(false);
			form.reset();
		} catch (error) {
			toast.error('Erro ao criar lista', {
				description: error instanceof Error ? error.message : 'Tente novamente.',
			});
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="gap-2">
					<Plus className="h-4 w-4" />
					Nova Lista
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Criar Nova Lista</DialogTitle>
					<DialogDescription>
						Crie uma lista de contatos baseada em um segmento de alunos ou leads. A lista será
						sincronizada automaticamente com o Brevo.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Nome da Lista</FormLabel>
									<FormControl>
										<Input placeholder="Ex: Alunos OTB Ativos" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="sourceType"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Origem</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Selecione a origem" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="student">Alunos</SelectItem>
											<SelectItem value="lead">Leads</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						{sourceType === 'student' && (
							<FormField
								control={form.control}
								name="product"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Produto</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecione o produto" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="all">Todos os Produtos</SelectItem>
												<SelectItem value="trintae3">Trinta e 3</SelectItem>
												<SelectItem value="otb">OTB</SelectItem>
												<SelectItem value="black_neon">Black Neon</SelectItem>
												<SelectItem value="comunidade">Comunidade</SelectItem>
												<SelectItem value="auriculo">Aurículo</SelectItem>
												<SelectItem value="na_mesa_certa">Na Mesa Certa</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{sourceType === 'lead' && (
							<FormField
								control={form.control}
								name="stage"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Estágio do Funil</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecione o estágio" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="all">Todos os Estágios</SelectItem>
												<SelectItem value="novo">Novo</SelectItem>
												<SelectItem value="qualificado">Qualificado</SelectItem>
												<SelectItem value="proposta">Proposta</SelectItem>
												<SelectItem value="fechado_ganho">Venda Realizada</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => setOpen(false)}>
								Cancelar
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Criar Lista
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

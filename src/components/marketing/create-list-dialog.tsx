'use client';

import { api } from '@convex/_generated/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from 'convex/react';
import { Loader2, Plus, Users } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

// Available products
const PRODUCTS = [
	{ value: 'trintae3', label: 'Trinta e 3' },
	{ value: 'otb', label: 'OTB' },
	{ value: 'black_neon', label: 'Black Neon' },
	{ value: 'comunidade', label: 'Comunidade' },
	{ value: 'auriculo', label: 'Aurículo' },
	{ value: 'na_mesa_certa', label: 'Na Mesa Certa' },
] as const;

// Form schema
const formSchema = z.object({
	name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
	description: z.string().optional(),
	sourceType: z.enum(['students', 'leads', 'both']),
	products: z.array(z.string()),
	activeOnly: z.boolean(),
	qualifiedOnly: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateListDialogProps {
	onSuccess?: () => void;
}

export function CreateListDialog({ onSuccess }: CreateListDialogProps) {
	const [open, setOpen] = useState(false);
	const createList = useMutation(api.emailMarketing.createListWithContacts);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: '',
			description: '',
			sourceType: 'both',
			products: [],
			activeOnly: true,
			qualifiedOnly: false,
		},
	});
	const studentsId = useId();
	const leadsId = useId();
	const bothId = useId();

	const sourceType = form.watch('sourceType');
	const products = form.watch('products');
	const activeOnly = form.watch('activeOnly');
	const qualifiedOnly = form.watch('qualifiedOnly');
	const isSubmitting = form.formState.isSubmitting;

	// Preview count query
	const previewData = useQuery(
		api.emailMarketing.previewListContacts,
		open
			? {
					sourceType,
					products,
					filters: { activeOnly, qualifiedOnly },
				}
			: 'skip',
	);

	const toggleProduct = (product: string) => {
		const currentProducts = form.getValues('products');
		if (currentProducts.includes(product)) {
			form.setValue(
				'products',
				currentProducts.filter((p) => p !== product),
			);
		} else {
			form.setValue('products', [...currentProducts, product]);
		}
	};

	async function onSubmit(values: FormValues) {
		try {
			const result = await createList({
				name: values.name,
				description: values.description || undefined,
				sourceType: values.sourceType,
				products: values.products,
				filters: {
					activeOnly: values.activeOnly,
					qualifiedOnly: values.qualifiedOnly,
				},
			});

			toast.success(`Lista criada com ${result.contactCount} contatos!`, {
				description: 'A sincronização com o Brevo será iniciada automaticamente.',
			});

			setOpen(false);
			form.reset();
			onSuccess?.();
		} catch (error) {
			toast.error('Erro ao criar lista', {
				description: error instanceof Error ? error.message : 'Tente novamente.',
			});
		}
	}

	// Reset form when dialog closes
	useEffect(() => {
		if (!open) {
			form.reset();
		}
	}, [open, form]);

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild>
				<Button className="gap-2">
					<Plus className="h-4 w-4" />
					Nova Lista
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Criar Nova Lista</DialogTitle>
					<DialogDescription>
						Crie uma lista de contatos baseada em filtros de alunos e/ou leads. A lista será
						sincronizada automaticamente com o Brevo.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
						{/* Name */}
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Nome da Lista *</FormLabel>
									<FormControl>
										<Input placeholder="Ex: Alunos TRINTAE3 Ativos" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Description */}
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Descrição (opcional)</FormLabel>
									<FormControl>
										<Textarea
											className="resize-none"
											placeholder="Descreva o propósito desta lista..."
											rows={2}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Source Type */}
						<FormField
							control={form.control}
							name="sourceType"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Origem dos Contatos</FormLabel>
									<FormControl>
										<RadioGroup
											className="flex gap-4"
											defaultValue={field.value}
											onValueChange={field.onChange}
										>
											<div className="flex items-center space-x-2">
												<RadioGroupItem id={studentsId} value="students" />
												<Label htmlFor={studentsId}>Alunos</Label>
											</div>
											<div className="flex items-center space-x-2">
												<RadioGroupItem id={leadsId} value="leads" />
												<Label htmlFor={leadsId}>Leads</Label>
											</div>
											<div className="flex items-center space-x-2">
												<RadioGroupItem id={bothId} value="both" />
												<Label htmlFor={bothId}>Ambos</Label>
											</div>
										</RadioGroup>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Products Multi-Select */}
						<div className="space-y-2">
							<Label>Produtos (selecione um ou mais)</Label>
							<div className="flex flex-wrap gap-2">
								{PRODUCTS.map((product) => (
									<Badge
										className="cursor-pointer transition-colors hover:bg-primary/80"
										key={product.value}
										onClick={() => toggleProduct(product.value)}
										variant={products.includes(product.value) ? 'default' : 'outline'}
									>
										{product.label}
									</Badge>
								))}
							</div>
							<p className="text-muted-foreground text-xs">
								{products.length === 0
									? 'Nenhum produto selecionado (todos serão incluídos)'
									: `${products.length} produto(s) selecionado(s)`}
							</p>
						</div>

						{/* Filters */}
						<div className="space-y-3 rounded-lg border p-3">
							<Label className="font-semibold">Filtros Adicionais</Label>

							{(sourceType === 'students' || sourceType === 'both') && (
								<FormField
									control={form.control}
									name="activeOnly"
									render={({ field }) => (
										<FormItem className="flex items-center gap-2 space-y-0">
											<FormControl>
												<Checkbox checked={field.value} onCheckedChange={field.onChange} />
											</FormControl>
											<FormLabel className="font-normal">Apenas alunos ativos</FormLabel>
										</FormItem>
									)}
								/>
							)}

							{(sourceType === 'leads' || sourceType === 'both') && (
								<FormField
									control={form.control}
									name="qualifiedOnly"
									render={({ field }) => (
										<FormItem className="flex items-center gap-2 space-y-0">
											<FormControl>
												<Checkbox checked={field.value} onCheckedChange={field.onChange} />
											</FormControl>
											<FormLabel className="font-normal">Apenas leads qualificados</FormLabel>
										</FormItem>
									)}
								/>
							)}
						</div>

						{/* Preview Count */}
						<div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
							<Users className="h-5 w-5 text-muted-foreground" />
							<span className="text-sm">
								{previewData === undefined ? (
									<Loader2 className="inline h-4 w-4 animate-spin" />
								) : (
									<>
										<strong>{previewData.count}</strong> contatos serão adicionados à lista
									</>
								)}
							</span>
						</div>

						<DialogFooter>
							<Button onClick={() => setOpen(false)} type="button" variant="outline">
								Cancelar
							</Button>
							<Button disabled={isSubmitting || previewData?.count === 0} type="submit">
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

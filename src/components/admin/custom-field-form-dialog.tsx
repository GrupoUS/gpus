import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from 'convex/react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { api } from '../../../convex/_generated/api';
import type { Doc } from '../../../convex/_generated/dataModel';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '../ui/dialog';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

const formSchema = z.object({
	name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
	fieldType: z.enum(['text', 'number', 'date', 'select', 'multiselect', 'boolean']),
	entityType: z.enum(['lead', 'student']),
	required: z.boolean().default(false),
	options: z.string().optional(),
});

type CustomFieldFormValues = z.infer<typeof formSchema>;

interface CustomFieldFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialData?: Doc<'customFields'> | null;
}

export function CustomFieldFormDialog({
	open,
	onOpenChange,
	initialData,
}: CustomFieldFormDialogProps) {
	const isEditing = !!initialData;
	// biome-ignore lint/suspicious/noExplicitAny: Fix deep type instantiation
	const createField = useMutation((api as any).customFields.createCustomField);
	// biome-ignore lint/suspicious/noExplicitAny: Fix deep type instantiation
	const updateField = useMutation((api as any).customFields.updateCustomField);

	const form = useForm<CustomFieldFormValues>({
		// biome-ignore lint/suspicious/noExplicitAny: Fix deep type instantiation from zodResolver
		resolver: zodResolver(formSchema) as any,
		defaultValues: {
			name: initialData?.name || '',
			fieldType: (initialData?.fieldType as CustomFieldFormValues['fieldType']) || 'text',
			entityType: (initialData?.entityType as CustomFieldFormValues['entityType']) || 'lead',
			required: initialData?.required ?? false,
			options: initialData?.options ? initialData.options.join('\n') : '',
		},
	});

	// Reset form when initialData or open state changes
	useEffect(() => {
		if (open) {
			form.reset({
				name: initialData?.name || '',
				fieldType: (initialData?.fieldType as CustomFieldFormValues['fieldType']) || 'text',
				entityType: (initialData?.entityType as CustomFieldFormValues['entityType']) || 'lead',
				required: initialData?.required ?? false,
				options: initialData?.options ? initialData.options.join('\n') : '',
			});
		}
	}, [initialData, open, form]);

	const fieldType = form.watch('fieldType');
	const showOptions = fieldType === 'select' || fieldType === 'multiselect';

	async function onSubmit(values: CustomFieldFormValues) {
		try {
			const optionsArray = values.options
				? values.options
						.split('\n')
						.map((o) => o.trim())
						.filter((o) => o.length > 0)
				: undefined;

			if (
				(values.fieldType === 'select' || values.fieldType === 'multiselect') &&
				(!optionsArray || optionsArray.length === 0)
			) {
				form.setError('options', { message: 'Defina pelo menos uma opção' });
				return;
			}

			if (isEditing && initialData) {
				await updateField({
					id: initialData._id,
					name: values.name,
					required: values.required,
					options: optionsArray,
				});
				toast.success('Campo atualizado com sucesso');
			} else {
				await createField({
					name: values.name,
					fieldType: values.fieldType,
					entityType: values.entityType,
					required: values.required,
					options: optionsArray,
				});
				toast.success('Campo criado com sucesso');
			}
			onOpenChange(false);
			form.reset();
		} catch (_error) {
			toast.error('Erro ao salvar campo');
		}
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>
						{isEditing ? 'Editar Campo Personalizado' : 'Novo Campo Personalizado'}
					</DialogTitle>
					<DialogDescription>Configure os detalhes do campo abaixo.</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Nome do Campo</FormLabel>
									<FormControl>
										<Input placeholder="Ex: Orçamento Estimado" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="fieldType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Tipo de Dado</FormLabel>
										<Select
											defaultValue={field.value}
											disabled={isEditing}
											onValueChange={field.onChange}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecione o tipo" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="text">Texto</SelectItem>
												<SelectItem value="number">Número</SelectItem>
												<SelectItem value="date">Data</SelectItem>
												<SelectItem value="boolean">Sim/Não</SelectItem>
												<SelectItem value="select">Seleção Única</SelectItem>
												<SelectItem value="multiselect">Seleção Múltipla</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="entityType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Entidade</FormLabel>
										<Select
											defaultValue={field.value}
											disabled={isEditing}
											onValueChange={field.onChange}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecione..." />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="lead">Lead</SelectItem>
												<SelectItem value="student">Aluno</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{showOptions && (
							<FormField
								control={form.control}
								name="options"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Opções (uma por linha)</FormLabel>
										<FormControl>
											<Textarea
												className="min-h-[100px]"
												placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
												{...field}
											/>
										</FormControl>
										<FormDescription>
											Digite as opções disponíveis para seleção, separadas por quebra de linha.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						<FormField
							control={form.control}
							name="required"
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
									<FormControl>
										<Checkbox checked={field.value} onCheckedChange={field.onChange} />
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel>Campo Obrigatório</FormLabel>
										<FormDescription>
											Se marcado, o usuário será obrigado a preencher este campo.
										</FormDescription>
									</div>
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button onClick={() => onOpenChange(false)} type="button" variant="outline">
								Cancelar
							</Button>
							<Button type="submit">Salvar</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

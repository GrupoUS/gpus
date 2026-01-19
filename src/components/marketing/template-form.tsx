'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const templateSchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
	subject: z.string().min(2, 'Assunto deve ter pelo menos 2 caracteres'),
	category: z.string().min(1, 'Categoria é obrigatória'),
	htmlContent: z.string().min(10, 'Conteúdo HTML deve ter pelo menos 10 caracteres'),
	isActive: z.boolean(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

interface TemplateFormProps {
	initialData?: Partial<TemplateFormValues>;
	onSubmit: (data: TemplateFormValues) => Promise<void>;
	isSubmitting?: boolean;
}

export function TemplateForm({ initialData, onSubmit, isSubmitting = false }: TemplateFormProps) {
	const form = useForm<TemplateFormValues>({
		resolver: zodResolver(templateSchema),
		defaultValues: {
			name: initialData?.name ?? '',
			subject: initialData?.subject ?? '',
			category: initialData?.category ?? 'newsletter',
			htmlContent:
				initialData?.htmlContent ??
				'<html>\n  <body>\n    <h1>Olá {{contact.FIRSTNAME}}</h1>\n    <p>Escreva seu conteúdo aqui...</p>\n  </body>\n</html>',
			isActive: initialData?.isActive ?? true,
		},
	});

	const handleFormSubmit = async (data: TemplateFormValues) => {
		await onSubmit(data);
	};

	return (
		<Form {...form}>
			<form className="space-y-6" onSubmit={form.handleSubmit(handleFormSubmit)}>
				<div className="grid gap-6 md:grid-cols-2">
					<Card>
						<CardContent className="space-y-4 pt-6">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nome do Template</FormLabel>
										<FormControl>
											<Input placeholder="Ex: Newsletter Mensal" {...field} />
										</FormControl>
										<FormDescription>Nome interno para identificar o template.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="subject"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Assunto do Email</FormLabel>
										<FormControl>
											<Input placeholder="Ex: Novidades da semana para você" {...field} />
										</FormControl>
										<FormDescription>O assunto que aparecerá na caixa de entrada.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="category"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Categoria</FormLabel>
											<Select
												defaultValue={field.value ?? 'newsletter'}
												onValueChange={field.onChange}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Selecione..." />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="newsletter">Newsletter</SelectItem>
													<SelectItem value="promocional">Promocional</SelectItem>
													<SelectItem value="transacional">Transacional</SelectItem>
													<SelectItem value="boas_vindas">Boas-vindas</SelectItem>
													<SelectItem value="outro">Outro</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="isActive"
									render={({ field }) => (
										<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
											<FormControl>
												<Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} />
											</FormControl>
											<div className="space-y-1 leading-none">
												<FormLabel>Ativo</FormLabel>
												<FormDescription>Disponível para uso</FormDescription>
											</div>
										</FormItem>
									)}
								/>
							</div>
						</CardContent>
					</Card>

					<Card className="flex h-full flex-col">
						<CardContent className="flex h-full grow flex-col pt-6">
							<FormField
								control={form.control}
								name="htmlContent"
								render={({ field }) => (
									<FormItem className="flex h-full grow flex-col">
										<FormLabel>Conteúdo HTML</FormLabel>
										<FormControl>
											<Textarea
												className="min-h-[250px] grow resize-none bg-muted/50 font-mono text-xs"
												placeholder="<html>...</html>"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>
				</div>

				<div className="flex justify-end gap-4">
					<Button onClick={() => window.history.back()} type="button" variant="outline">
						Cancelar
					</Button>
					<Button disabled={isSubmitting} type="submit">
						{isSubmitting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Salvando...
							</>
						) : (
							<>
								<Save className="mr-2 h-4 w-4" />
								Salvar Template
							</>
						)}
					</Button>
				</div>
			</form>
		</Form>
	);
}

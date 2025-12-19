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
	category: z.string().optional(),
	htmlContent: z.string().min(10, 'Conteúdo HTML deve ter pelo menos 10 caracteres'),
	isActive: z.boolean().default(true),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

interface TemplateFormProps {
	initialData?: TemplateFormValues;
	onSubmit: (data: TemplateFormValues) => Promise<void>;
	isSubmitting?: boolean;
}

export function TemplateForm({ initialData, onSubmit, isSubmitting = false }: TemplateFormProps) {
	const form = useForm<TemplateFormValues>({
		resolver: zodResolver(templateSchema),
		defaultValues: initialData || {
			name: '',
			subject: '',
			category: 'newsletter',
			htmlContent:
				'<html>\n  <body>\n    <h1>Olá {{contact.FIRSTNAME}}</h1>\n    <p>Escreva seu conteúdo aqui...</p>\n  </body>\n</html>',
			isActive: true,
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<div className="grid gap-6 md:grid-cols-2">
					<Card>
						<CardContent className="pt-6 space-y-4">
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
											<Select onValueChange={field.onChange} defaultValue={field.value}>
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
												<Checkbox checked={field.value} onCheckedChange={field.onChange} />
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

					<Card className="h-full flex flex-col">
						<CardContent className="pt-6 flex-grow flex flex-col h-full">
							<FormField
								control={form.control}
								name="htmlContent"
								render={({ field }) => (
									<FormItem className="flex-grow flex flex-col h-full">
										<FormLabel>Conteúdo HTML</FormLabel>
										<FormControl>
											<Textarea
												className="font-mono text-xs min-h-[250px] flex-grow resize-none bg-muted/50"
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
					<Button type="button" variant="outline" onClick={() => window.history.back()}>
						Cancelar
					</Button>
					<Button type="submit" disabled={isSubmitting}>
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

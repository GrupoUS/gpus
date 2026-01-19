import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { ArrowLeft, ListChecks, Loader2, Mail, Save, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

export const Route = createFileRoute('/_authenticated/marketing/nova')({
	component: NewCampaignPage,
});

// Zod schema for form validation
const campaignFormSchema = z.object({
	name: z
		.string()
		.min(3, { message: 'Nome deve ter pelo menos 3 caracteres' })
		.max(100, { message: 'Nome deve ter no máximo 100 caracteres' }),
	subject: z
		.string()
		.min(5, { message: 'Assunto deve ter pelo menos 5 caracteres' })
		.max(150, { message: 'Assunto deve ter no máximo 150 caracteres' }),
	htmlContent: z.string().optional(),
	templateId: z.string().optional(),
	listIds: z
		.array(z.string())
		.min(1, { message: 'Selecione pelo menos uma lista de destinatários' }),
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;

function NewCampaignPage() {
	const navigate = Route.useNavigate();

	// Convex queries
	const lists = useQuery(api.emailMarketing.getLists, { activeOnly: true });
	const templates = useQuery(api.emailMarketing.getTemplates, { activeOnly: true });

	// Convex mutation
	const createCampaign = useMutation(api.emailMarketing.createCampaign);

	// Form setup
	const form = useForm<CampaignFormValues>({
		resolver: zodResolver(campaignFormSchema),
		defaultValues: {
			name: '',
			subject: '',
			htmlContent: '',
			templateId: undefined,
			listIds: [],
		},
	});

	const isSubmitting = form.formState.isSubmitting;
	const selectedListIds = form.watch('listIds');
	const selectedTemplateId = form.watch('templateId');

	// Calculate total contacts from selected lists
	const totalContacts =
		lists
			?.filter((list: Doc<'emailLists'>) => selectedListIds.includes(list._id))
			.reduce((sum: number, list: Doc<'emailLists'>) => sum + (list.contactCount ?? 0), 0) ?? 0;

	// Handle template selection - populate subject from template
	const handleTemplateChange = (templateId: string) => {
		form.setValue('templateId', templateId === 'none' ? undefined : templateId);

		if (templateId && templateId !== 'none') {
			const template = templates?.find((t: Doc<'emailTemplates'>) => t._id === templateId);
			if (template) {
				// Populate subject if template has one
				if (template.subject && !form.getValues('subject')) {
					form.setValue('subject', template.subject);
				}
			}
		}
	};

	// Handle form submission
	const onSubmit = async (data: CampaignFormValues) => {
		try {
			const campaignId = await createCampaign({
				name: data.name,
				subject: data.subject,
				htmlContent: data.htmlContent || undefined,
				templateId: data.templateId ? (data.templateId as Id<'emailTemplates'>) : undefined,
				listIds: data.listIds as Id<'emailLists'>[],
			});

			toast.success('Campanha criada com sucesso!', {
				description: 'Sua campanha foi salva como rascunho.',
			});

			// Navigate to the campaign details page
			navigate({
				to: '/marketing/$campaignId',
				params: { campaignId },
				search: { search: '', status: 'all', view: 'grid', page: 1 },
			});
		} catch (error) {
			toast.error('Erro ao criar campanha', {
				description:
					error instanceof Error ? error.message : 'Ocorreu um erro inesperado. Tente novamente.',
			});
		}
	};

	const handleCancel = () => {
		navigate({
			to: '/marketing',
			search: { search: '', status: 'all', view: 'grid', page: 1 },
		});
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button onClick={handleCancel} size="icon" variant="ghost">
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Nova Campanha</h1>
					<p className="text-muted-foreground">Crie uma nova campanha de email marketing</p>
				</div>
			</div>

			<Form {...form}>
				<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
					<div className="grid gap-6 lg:grid-cols-3">
						{/* Main Form Card */}
						<div className="space-y-6 lg:col-span-2">
							{/* Basic Info Card */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Mail className="h-5 w-5" />
										Informações Básicas
									</CardTitle>
									<CardDescription>Configure o nome e assunto da sua campanha</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Nome da Campanha *</FormLabel>
												<FormControl>
													<Input placeholder="Ex: Newsletter Dezembro 2024" {...field} />
												</FormControl>
												<FormDescription>Nome interno para identificar a campanha</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="subject"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Assunto do Email *</FormLabel>
												<FormControl>
													<Input placeholder="Ex: 🎉 Novidades exclusivas para você!" {...field} />
												</FormControl>
												<FormDescription>
													Este texto aparecerá na caixa de entrada do destinatário
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>

							{/* Content Card */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Sparkles className="h-5 w-5" />
										Conteúdo
									</CardTitle>
									<CardDescription>
										Escreva o conteúdo do email ou selecione um template
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									{/* Template Selection */}
									<FormField
										control={form.control}
										name="templateId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Template (Opcional)</FormLabel>
												<Select onValueChange={handleTemplateChange} value={field.value || 'none'}>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Selecione um template" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="none">Sem template - criar do zero</SelectItem>
														{templates === undefined ? (
															<SelectItem disabled value="loading">
																Carregando templates...
															</SelectItem>
														) : templates.length === 0 ? (
															<SelectItem disabled value="empty">
																Nenhum template disponível
															</SelectItem>
														) : (
															templates.map((template: Doc<'emailTemplates'>) => (
																<SelectItem key={template._id} value={template._id}>
																	{template.name}
																	{template.category && (
																		<span className="ml-2 text-muted-foreground">
																			({template.category})
																		</span>
																	)}
																</SelectItem>
															))
														)}
													</SelectContent>
												</Select>
												<FormDescription>
													Use um template existente para agilizar a criação
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									{/* Content Textarea - shown when no template selected */}
									{(!selectedTemplateId || selectedTemplateId === 'none') && (
										<FormField
											control={form.control}
											name="htmlContent"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Conteúdo do Email</FormLabel>
													<FormControl>
														<Textarea
															className="min-h-[200px] font-mono text-sm"
															placeholder="Escreva o conteúdo do seu email aqui...&#10;&#10;Você pode usar HTML para formatação avançada."
															{...field}
														/>
													</FormControl>
													<FormDescription>Suporta HTML básico para formatação</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
									)}

									{/* Template selected indicator */}
									{selectedTemplateId && selectedTemplateId !== 'none' && (
										<div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
											<Sparkles className="mx-auto mb-2 h-8 w-8" />
											<p className="font-medium">Template selecionado</p>
											<p className="text-sm">O conteúdo do template será usado no envio.</p>
										</div>
									)}
								</CardContent>
							</Card>
						</div>

						{/* Sidebar */}
						<div className="space-y-6">
							{/* Lists Selection Card */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<ListChecks className="h-5 w-5" />
										Destinatários *
									</CardTitle>
									<CardDescription>Selecione as listas que receberão esta campanha</CardDescription>
								</CardHeader>
								<CardContent>
									<FormField
										control={form.control}
										name="listIds"
										render={() => (
											<FormItem>
												{lists === undefined ? (
													<div className="space-y-3">
														{[1, 2, 3].map((i) => (
															<Skeleton className="h-10 w-full" key={i} />
														))}
													</div>
												) : lists.length === 0 ? (
													<div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
														<p className="text-sm">Nenhuma lista disponível</p>
														<p className="text-xs">Crie listas de contatos primeiro</p>
													</div>
												) : (
													<div className="space-y-3">
														{lists.map((list: Doc<'emailLists'>) => (
															<FormField
																control={form.control}
																key={list._id}
																name="listIds"
																render={({ field }) => {
																	return (
																		<FormItem
																			className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 transition-colors hover:bg-muted/50"
																			key={list._id}
																		>
																			<FormControl>
																				<Checkbox
																					checked={field.value?.includes(list._id)}
																					onCheckedChange={(checked) => {
																						return checked
																							? field.onChange([...field.value, list._id])
																							: field.onChange(
																									field.value?.filter(
																										(value) => value !== list._id,
																									),
																								);
																					}}
																				/>
																			</FormControl>
																			<div className="flex-1 space-y-1 leading-none">
																				<FormLabel className="cursor-pointer font-medium">
																					{list.name}
																				</FormLabel>
																				<p className="text-muted-foreground text-xs">
																					{list.contactCount ?? 0} contatos
																					{list.description && <span> • {list.description}</span>}
																				</p>
																			</div>
																		</FormItem>
																	);
																}}
															/>
														))}
													</div>
												)}
												<FormMessage />
											</FormItem>
										)}
									/>

									{/* Selected lists summary */}
									{selectedListIds.length > 0 && (
										<>
											<Separator className="my-4" />
											<div className="flex items-center justify-between text-sm">
												<span className="text-muted-foreground">
													{selectedListIds.length} lista
													{selectedListIds.length !== 1 ? 's' : ''} selecionada
													{selectedListIds.length !== 1 ? 's' : ''}
												</span>
												<Badge variant="secondary">{totalContacts} contatos</Badge>
											</div>
										</>
									)}
								</CardContent>
							</Card>

							{/* Actions Card */}
							<Card>
								<CardHeader>
									<CardTitle>Ações</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									<Button className="w-full" disabled={isSubmitting} type="submit">
										{isSubmitting ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Salvando...
											</>
										) : (
											<>
												<Save className="mr-2 h-4 w-4" />
												Salvar como Rascunho
											</>
										)}
									</Button>
									<Button
										className="w-full"
										disabled={isSubmitting}
										onClick={handleCancel}
										type="button"
										variant="outline"
									>
										Cancelar
									</Button>
								</CardContent>
							</Card>

							{/* Info Card */}
							<Card className="border-primary/20 bg-primary/5">
								<CardContent className="pt-6">
									<p className="text-muted-foreground text-sm">
										<strong>Dica:</strong> Após salvar, você poderá revisar e enviar a campanha na
										página de detalhes.
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

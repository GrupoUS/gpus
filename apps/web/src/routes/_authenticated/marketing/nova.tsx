import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute } from '@tanstack/react-router';
import { ArrowLeft, ListChecks, Loader2, Mail, Save, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { trpc } from '../../../lib/trpc';
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

	// tRPC queries
	const { data: lists } = trpc.emailMarketing.lists.list.useQuery();
	const { data: templates } = trpc.emailMarketing.templates.list.useQuery();

	// Convex mutation
	const createCampaign = trpc.emailMarketing.campaigns.create.useMutation();

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
	let templateOptions: ReactNode = null;
	let listOptions: ReactNode = null;

	// Calculate total contacts from selected lists
	const totalContacts =
		lists
			?.filter((list) => selectedListIds.includes(String(list.id)))
			.reduce(
				(sum: number, list) =>
					sum + ((list as unknown as { contactCount?: number }).contactCount ?? 0),
				0,
			) ?? 0;

	// Handle template selection - populate subject from template
	const handleTemplateChange = (templateId: string) => {
		form.setValue('templateId', templateId === 'none' ? undefined : templateId);

		if (templateId && templateId !== 'none') {
			const template = templates?.find((t) => String(t.id) === templateId);
			if (template?.subject && !form.getValues('subject')) {
				form.setValue('subject', template.subject);
			}
		}
	};

	if (templates === undefined) {
		templateOptions = (
			<SelectItem disabled value="loading">
				Carregando templates...
			</SelectItem>
		);
	} else if (templates.length === 0) {
		templateOptions = (
			<SelectItem disabled value="empty">
				Nenhum template disponível
			</SelectItem>
		);
	} else {
		templateOptions = templates.map((template) => (
			<SelectItem key={template.id} value={String(template.id)}>
				{template.name}
				{template.category && (
					<span className="ml-2 text-muted-foreground">({template.category})</span>
				)}
			</SelectItem>
		));
	}

	if (lists === undefined) {
		listOptions = (
			<div className="space-y-3">
				{[1, 2, 3].map((i) => (
					<Skeleton className="h-10 w-full" key={i} />
				))}
			</div>
		);
	} else if (lists.length === 0) {
		listOptions = (
			<div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
				<p className="text-sm">Nenhuma lista disponível</p>
			</div>
		);
	} else {
		listOptions = lists.map((list) => (
			<FormField
				control={form.control}
				key={list.id}
				name="listIds"
				render={({ field }) => {
					const isChecked = field.value?.includes(String(list.id));
					return (
						<FormItem className="flex items-center space-x-3 space-y-0">
							<FormControl>
								<Checkbox
									checked={isChecked}
									onCheckedChange={(checked) => {
										const current = field.value || [];
										const updatedListIds = checked
											? [...current, String(list.id)]
											: current.filter((id) => id !== String(list.id));
										field.onChange(updatedListIds);
									}}
								/>
							</FormControl>
							<div className="space-y-1 leading-none">
								<FormLabel className="font-medium">{list.name}</FormLabel>
								<p className="text-muted-foreground text-sm">
									{(list as unknown as { contactCount?: number }).contactCount ?? 0} contatos
								</p>
							</div>
						</FormItem>
					);
				}}
			/>
		));
	}

	// Handle form submission
	const onSubmit = async (data: CampaignFormValues) => {
		try {
			const campaignId = await createCampaign.mutateAsync({
				name: data.name,
				subject: data.subject,
				htmlContent: data.htmlContent || undefined,
				templateId: data.templateId ? Number(data.templateId) : undefined,
				listIds: data.listIds.map(Number),
			});

			toast.success('Campanha criada com sucesso!', {
				description: 'Sua campanha foi salva como rascunho.',
			});

			// Navigate to the campaign details page
			navigate({
				to: '/marketing/$campaignId',
				params: { campaignId: String(campaignId) },
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
														{templateOptions}
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
												{listOptions}
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

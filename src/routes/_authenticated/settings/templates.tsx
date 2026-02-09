import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute } from '@tanstack/react-router';
import { FileText, Loader2, MoreVertical, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { trpc } from '../../../lib/trpc';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { productLabels } from '@/lib/constants';

export const Route = createFileRoute('/_authenticated/settings/templates')({
	component: TemplatesSettingsPage,
});

const templateSchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
	category: z.enum([
		'abertura',
		'qualificacao',
		'apresentacao',
		'objecao_preco',
		'objecao_tempo',
		'objecao_outros_cursos',
		'follow_up',
		'fechamento',
		'pos_venda',
		'suporte',
	]),
	product: z
		.enum(['trintae3', 'otb', 'black_neon', 'comunidade', 'auriculo', 'na_mesa_certa', 'geral'])
		.optional(),
	content: z.string().min(10, 'Conteúdo deve ter pelo menos 10 caracteres'),
});

type TemplateFormData = z.infer<typeof templateSchema>;

const categoryLabels: Record<string, string> = {
	abertura: 'Abertura',
	qualificacao: 'Qualificação',
	apresentacao: 'Apresentação',
	objecao_preco: 'Objeção: Preço',
	objecao_tempo: 'Objeção: Tempo',
	objecao_outros_cursos: 'Objeção: Outros Cursos',
	follow_up: 'Follow-up',
	fechamento: 'Fechamento',
	pos_venda: 'Pós-venda',
	suporte: 'Suporte',
};

function TemplatesSettingsPage() {
	const { data: templates } = trpc.templates.list.useQuery({});
	const deleteTemplate = trpc.templates.list.useMutation();
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [categoryFilter, setCategoryFilter] = useState<string>('all');

	const filteredTemplates = templates?.filter(
		(t: { category: string }) => categoryFilter === 'all' || t.category === categoryFilter,
	);

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="flex items-center gap-2 font-bold text-2xl">
						<FileText className="h-6 w-6 text-green-500" />
						Templates de Mensagem
					</h1>
					<p className="text-muted-foreground">Gerencie respostas rápidas para chat</p>
				</div>
				<div className="flex items-center gap-2">
					<Select onValueChange={setCategoryFilter} value={categoryFilter}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Categoria" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Todas</SelectItem>
							{Object.entries(categoryLabels).map(([key, label]) => (
								<SelectItem key={key} value={key}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Dialog onOpenChange={setIsCreateOpen} open={isCreateOpen}>
						<DialogTrigger asChild>
							<Button className="gap-2">
								<Plus className="h-4 w-4" />
								Novo Template
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[600px]">
							<DialogHeader>
								<DialogTitle>Novo Template</DialogTitle>
							</DialogHeader>
							<TemplateForm onSuccess={() => setIsCreateOpen(false)} />
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Templates Table */}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Nome</TableHead>
						<TableHead>Categoria</TableHead>
						<TableHead>Produto</TableHead>
						<TableHead>Uso</TableHead>
						<TableHead>Status</TableHead>
						<TableHead className="w-12" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{filteredTemplates?.map((template: Record<string, unknown>) => (
						<TableRow key={template.id}>
							<TableCell className="font-medium">{template.name}</TableCell>
							<TableCell>
								<Badge variant="outline">{categoryLabels[template.category]}</Badge>
							</TableCell>
							<TableCell className="text-muted-foreground">
								{template.product ? productLabels[template.product] || template.product : 'Geral'}
							</TableCell>
							<TableCell className="text-muted-foreground">{template.usageCount || 0}x</TableCell>
							<TableCell>
								<Badge variant={template.isActive ? 'default' : 'secondary'}>
									{template.isActive ? 'Ativo' : 'Inativo'}
								</Badge>
							</TableCell>
							<TableCell>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button size="icon" variant="ghost">
											<MoreVertical className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<Dialog>
											<DialogTrigger asChild>
												<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
													Editar
												</DropdownMenuItem>
											</DialogTrigger>
											<DialogContent className="sm:max-w-[600px]">
												<DialogHeader>
													<DialogTitle>Editar Template</DialogTitle>
												</DialogHeader>
												<TemplateForm initialData={template} templateId={template.id} />
											</DialogContent>
										</Dialog>
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<DropdownMenuItem
													className="text-destructive"
													onSelect={(e) => e.preventDefault()}
												>
													<Trash2 className="mr-2 h-4 w-4" />
													Excluir
												</DropdownMenuItem>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>Excluir template?</AlertDialogTitle>
													<AlertDialogDescription>
														Tem certeza que deseja excluir o template "{template.name}"? Essa ação
														não pode ser desfeita.
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>Cancelar</AlertDialogCancel>
													<AlertDialogAction
														className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
														onClick={async () => {
															try {
																await deleteTemplate({
																	templateId: template.id,
																});
																toast.success('Template excluído');
															} catch {
																toast.error('Erro ao excluir');
															}
														}}
													>
														Excluir
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</DropdownMenuContent>
								</DropdownMenu>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

function TemplateForm({
	templateId,
	initialData,
	onSuccess,
}: {
	templateId?: number;
	initialData?: TemplateFormData;
	onSuccess?: () => void;
}) {
	const createTemplate = trpc.templates.create.useMutation();
	const updateTemplate = trpc.templates.create.useMutation();

	const form = useForm<TemplateFormData>({
		resolver: zodResolver(templateSchema),
		defaultValues: initialData || {
			name: '',
			category: 'abertura',
			product: undefined,
			content: '',
		},
	});

	const onSubmit = async (values: TemplateFormData) => {
		try {
			if (templateId) {
				await updateTemplate({ templateId, patch: values });
				toast.success('Template atualizado!');
			} else {
				await createTemplate(values);
				toast.success('Template criado!');
			}
			onSuccess?.();
			form.reset();
		} catch (_error) {
			toast.error('Erro ao salvar template');
		}
	};

	const getSubmitContent = () => {
		if (form.formState.isSubmitting) {
			return (
				<>
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					Salvando...
				</>
			);
		}
		if (templateId) return 'Atualizar';
		return 'Criar Template';
	};

	return (
		<Form {...form}>
			<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nome do Template</FormLabel>
							<FormControl>
								<Input placeholder="Ex: Abertura Padrão" {...field} />
							</FormControl>
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
								<Select defaultValue={field.value} onValueChange={field.onChange}>
									<FormControl>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Object.entries(categoryLabels).map(([key, label]) => (
											<SelectItem key={key} value={key}>
												{label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="product"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Produto (Opcional)</FormLabel>
								<Select defaultValue={field.value} onValueChange={field.onChange}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Geral" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value="geral">Geral</SelectItem>
										{Object.entries(productLabels).map(([key, label]) => (
											<SelectItem key={key} value={key}>
												{label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="content"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Conteúdo</FormLabel>
							<FormControl>
								<Textarea
									className="min-h-[150px] resize-none"
									placeholder="Digite o conteúdo do template... Use {{nome}}, {{produto}} para variáveis."
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end pt-4">
					<Button disabled={form.formState.isSubmitting} type="submit">
						{getSubmitContent()}
					</Button>
				</div>
			</form>
		</Form>
	);
}

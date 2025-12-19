import type { Doc } from '@convex/_generated/dataModel';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Loader2, Plus, Search } from 'lucide-react';
import { z } from 'zod';

import { TemplateCard } from '@/components/marketing/template-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { useTemplatesViewModel } from '@/hooks/use-templates-view-model';

const searchSchema = z.object({
	search: z.string().catch(''),
	category: z.string().catch('all'),
});

export const Route = createFileRoute('/_authenticated/marketing/templates')({
	component: TemplatesListPage,
	validateSearch: searchSchema,
});

function TemplatesListPage() {
	const navigate = useNavigate();
	const {
		templates,
		isLoading,
		filters,
		handleFilterChange,
		handleDeleteTemplate,
		handleSyncTemplate,
	} = useTemplatesViewModel(Route);

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Templates de Email</h1>
					<p className="text-muted-foreground">Gerencie seus modelos de email reutilizáveis.</p>
				</div>
				<Link to="/marketing/templates/novo" search={{ search: '', category: 'all' }}>
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Novo Template
					</Button>
				</Link>
			</div>

			<div className="flex flex-col sm:flex-row gap-4 items-center">
				<div className="relative w-full sm:w-72">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Buscar templates..."
						value={filters.search}
						onChange={(e) => handleFilterChange('search', e.target.value)}
						className="pl-9"
					/>
				</div>
				<Select value={filters.category} onValueChange={(v) => handleFilterChange('category', v)}>
					<SelectTrigger className="w-full sm:w-[180px]">
						<SelectValue placeholder="Categoria" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todas</SelectItem>
						<SelectItem value="newsletter">Newsletter</SelectItem>
						<SelectItem value="promocional">Promocional</SelectItem>
						<SelectItem value="transacional">Transacional</SelectItem>
						<SelectItem value="boas_vindas">Boas-vindas</SelectItem>
						<SelectItem value="outro">Outro</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{isLoading ? (
				<div className="flex justify-center items-center h-64">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
					{templates?.map((template: Doc<'emailTemplates'>) => (
						<TemplateCard
							key={template._id}
							template={template}
							onEdit={(id) => {
								void navigate({
									to: '/marketing/templates/$templateId',
									params: { templateId: id },
									search: { search: '', category: 'all' },
								});
							}}
							onDelete={handleDeleteTemplate}
							onSync={handleSyncTemplate}
						/>
					))}
					{templates?.length === 0 && (
						<div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg bg-muted/50">
							<h3 className="text-lg font-medium text-muted-foreground">
								Nenhum template encontrado
							</h3>
							<p className="text-sm text-muted-foreground mt-2">
								Crie seu primeiro template para começar.
							</p>
							<Link
								to="/marketing/templates/novo"
								search={{ search: '', category: 'all' }}
								className="mt-4 inline-block"
							>
								<Button variant="outline">Criar Template</Button>
							</Link>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

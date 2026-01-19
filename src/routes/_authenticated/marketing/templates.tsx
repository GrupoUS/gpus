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
					<h1 className="font-bold text-2xl tracking-tight">Templates de Email</h1>
					<p className="text-muted-foreground">Gerencie seus modelos de email reutilizáveis.</p>
				</div>
				<Link search={{ search: '', category: 'all' }} to="/marketing/templates/novo">
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Novo Template
					</Button>
				</Link>
			</div>

			<div className="flex flex-col items-center gap-4 sm:flex-row">
				<div className="relative w-full sm:w-72">
					<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						className="pl-9"
						onChange={(e) => handleFilterChange('search', e.target.value)}
						placeholder="Buscar templates..."
						value={filters.search}
					/>
				</div>
				<Select onValueChange={(v) => handleFilterChange('category', v)} value={filters.category}>
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
				<div className="flex h-64 items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{templates?.map((template: Doc<'emailTemplates'>) => (
						<TemplateCard
							key={template._id}
							onDelete={handleDeleteTemplate}
							onEdit={(id) => {
								void navigate({
									to: '/marketing/templates/$templateId',
									params: { templateId: id },
									search: { search: '', category: 'all' },
								});
							}}
							onSync={handleSyncTemplate}
							template={template}
						/>
					))}
					{templates?.length === 0 && (
						<div className="col-span-full rounded-lg border-2 border-dashed bg-muted/50 py-12 text-center">
							<h3 className="font-medium text-lg text-muted-foreground">
								Nenhum template encontrado
							</h3>
							<p className="mt-2 text-muted-foreground text-sm">
								Crie seu primeiro template para começar.
							</p>
							<Link
								className="mt-4 inline-block"
								search={{ search: '', category: 'all' }}
								to="/marketing/templates/novo"
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

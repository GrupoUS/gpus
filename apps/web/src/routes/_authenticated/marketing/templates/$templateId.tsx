import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

import { trpc } from '../../../../lib/trpc';
import { TemplateForm } from '@/components/marketing/template-form';
import { useTemplatesViewModel } from '@/hooks/use-templates-view-model';

const searchSchema = z.object({
	search: z.string().catch(''),
	category: z.string().catch('all'),
});

export const Route = createFileRoute('/_authenticated/marketing/templates/$templateId')({
	component: EditTemplatePage,
	validateSearch: searchSchema,
});

function EditTemplatePage() {
	const navigate = useNavigate();
	const { templateId } = Route.useParams();
	const { handleUpdateTemplate } = useTemplatesViewModel();

	// Fetch template data — list returns array, find by ID
	const { data: templatesList } = trpc.emailMarketing.templates.list.useQuery();
	const numericId = Number(templateId);
	const template = templatesList?.find((t) => t.id === numericId);

	// Loading state
	if (templatesList === undefined) {
		return (
			<div className="flex h-64 items-center justify-center p-6">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	// Not found state
	if (!template) {
		return (
			<div className="p-6">
				<h1 className="font-bold text-2xl text-destructive tracking-tight">
					Template não encontrado
				</h1>
				<p className="mt-2 text-muted-foreground">
					O template solicitado não existe ou foi removido.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">Editar Template</h1>
				<p className="text-muted-foreground">
					Modifique o template "{template.name}" conforme necessário.
				</p>
			</div>

			<TemplateForm
				initialData={{
					name: template.name,
					subject: template.subject,
					category: template.category ?? undefined,
					htmlContent: template.htmlContent,
					isActive: template.isActive,
				}}
				onSubmit={async (data) => {
					await handleUpdateTemplate(template.id, data);
					void navigate({ to: '/marketing/templates', search: { search: '', category: 'all' } });
				}}
			/>
		</div>
	);
}

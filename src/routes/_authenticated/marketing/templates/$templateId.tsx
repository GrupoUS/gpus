import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

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

	// Fetch template data
	const template = useQuery(api.emailMarketing.getTemplate, {
		templateId: templateId as Id<'emailTemplates'>,
	});

	// Loading state
	if (template === undefined) {
		return (
			<div className="flex justify-center items-center h-64 p-6">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	// Not found state
	if (template === null) {
		return (
			<div className="p-6">
				<h1 className="text-2xl font-bold tracking-tight text-destructive">
					Template não encontrado
				</h1>
				<p className="text-muted-foreground mt-2">
					O template solicitado não existe ou foi removido.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Editar Template</h1>
				<p className="text-muted-foreground">
					Modifique o template "{template.name}" conforme necessário.
				</p>
			</div>

			<TemplateForm
				initialData={{
					name: template.name,
					subject: template.subject,
					category: template.category,
					htmlContent: template.htmlContent,
					isActive: template.isActive,
				}}
				onSubmit={async (data) => {
					await handleUpdateTemplate(template._id, data);
					void navigate({ to: '/marketing/templates', search: { search: '', category: 'all' } });
				}}
			/>
		</div>
	);
}

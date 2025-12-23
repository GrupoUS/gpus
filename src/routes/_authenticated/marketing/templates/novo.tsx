import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { TemplateForm } from '@/components/marketing/template-form';
import { useTemplatesViewModel } from '@/hooks/use-templates-view-model';

const searchSchema = z.object({
	search: z.string().catch(''),
	category: z.string().catch('all'),
});

export const Route = createFileRoute('/_authenticated/marketing/templates/novo')({
	component: NewTemplatePage,
	validateSearch: searchSchema,
});

function NewTemplatePage() {
	const { handleCreateTemplate } = useTemplatesViewModel();

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Novo Template</h1>
				<p className="text-muted-foreground">Crie um novo template de email para suas campanhas.</p>
			</div>

			<TemplateForm
				onSubmit={async (data) => {
					await handleCreateTemplate(data);
				}}
			/>
		</div>
	);
}

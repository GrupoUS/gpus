import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useNavigate } from '@tanstack/react-router';
import { useAction, useMutation, useQuery } from 'convex/react';
import { useMemo } from 'react';
import { toast } from 'sonner';

// biome-ignore lint/suspicious/noExplicitAny: generic route typing
export function useTemplatesViewModel(Route?: any) {
	const navigate = useNavigate();

	// Always call hooks unconditionally at the top level
	const routeSearch = Route?.useSearch?.();
	const search = routeSearch?.search ?? '';
	const category = routeSearch?.category ?? 'all';

	// @ts-expect-error - Convex type inference is excessively deep
	const getTemplates = useQuery(api.emailMarketing.getTemplates, {
		category: category === 'all' ? undefined : category,
	});

	const createTemplate = useMutation(api.emailMarketing.createTemplate);
	const updateTemplate = useMutation(api.emailMarketing.updateTemplate);
	const deleteTemplate = useMutation(api.emailMarketing.deleteTemplate);
	const syncTemplate = useAction(api.emailMarketing.syncTemplateToBrevo);

	const templates = useMemo(() => {
		if (!getTemplates) return undefined;

		let filtered = [...getTemplates];

		if (search) {
			const searchLower = search.toLowerCase();
			filtered = filtered.filter(
				(t) =>
					t.name.toLowerCase().includes(searchLower) ||
					t.subject.toLowerCase().includes(searchLower),
			);
		}

		return filtered;
	}, [getTemplates, search]);

	const handleCreateTemplate = async (data: {
		name: string;
		subject: string;
		htmlContent: string;
		category?: string;
	}) => {
		try {
			const templateId = await createTemplate(data);
			toast.success('Template criado com sucesso');
			void navigate({ to: '/marketing/templates', search: { search: '', category: 'all' } });
			return templateId;
		} catch (_err) {
			toast.error('Falha ao criar template');
			throw _err;
		}
	};

	const handleUpdateTemplate = async (
		templateId: Id<'emailTemplates'>,
		data: {
			name?: string;
			subject?: string;
			htmlContent?: string;
			category?: string;
			isActive?: boolean;
		},
	) => {
		try {
			await updateTemplate({ templateId, ...data });
			toast.success('Template atualizado');
		} catch (_err) {
			toast.error('Falha ao atualizar template');
			throw _err;
		}
	};

	const handleDeleteTemplate = async (templateId: Id<'emailTemplates'>) => {
		try {
			await deleteTemplate({ templateId });
			toast.success('Template excluído');
		} catch (_err) {
			toast.error('Falha ao excluir template');
		}
	};

	const handleSyncTemplate = async (templateId: Id<'emailTemplates'>) => {
		try {
			const result = await syncTemplate({ templateId });
			if (result.success) {
				toast.success('Template sincronizado com Brevo');
			}
		} catch (_err) {
			toast.error('Falha ao sincronizar template');
		}
	};

	const handleFilterChange = (key: string, value: string) => {
		void navigate({
			to: '/marketing/templates',
			search: {
				search: key === 'search' ? value : search,
				category: key === 'category' ? value : category,
			},
		});
	};

	return {
		templates,
		isLoading: getTemplates === undefined,
		filters: {
			search,
			category,
		},
		handleCreateTemplate,
		handleUpdateTemplate,
		handleDeleteTemplate,
		handleSyncTemplate,
		handleFilterChange,
	};
}

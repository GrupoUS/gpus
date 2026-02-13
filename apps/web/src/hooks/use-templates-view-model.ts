import { useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { trpc } from '../lib/trpc';

// biome-ignore lint/suspicious/noExplicitAny: generic route typing
export function useTemplatesViewModel(Route?: any) {
	const navigate = useNavigate();

	// Always call hooks unconditionally at the top level
	const routeSearch = Route?.useSearch?.();
	const search = routeSearch?.search ?? '';
	const category = routeSearch?.category ?? 'all';

	const { data: getTemplates } = trpc.emailMarketing.templates.list.useQuery();

	const createTemplateMutation = trpc.emailMarketing.templates.create.useMutation();
	// TODO: Add update/delete to email templates tRPC router

	const templates = useMemo(() => {
		if (!getTemplates) return undefined;

		let filtered = [...getTemplates];

		if (search) {
			const searchLower = search.toLowerCase();
			filtered = filtered.filter(
				(t: { name: string; subject: string }) =>
					t.name.toLowerCase().includes(searchLower) ||
					t.subject.toLowerCase().includes(searchLower),
			);
		}

		if (category && category !== 'all') {
			// @ts-expect-error - Migration: error TS2769
			filtered = filtered.filter((t: { category?: string }) => t.category === category);
		}

		return filtered;
	}, [getTemplates, search, category]);

	const handleCreateTemplate = async (data: {
		name: string;
		subject: string;
		htmlContent: string;
		category?: string;
	}) => {
		try {
			const result = await createTemplateMutation.mutateAsync(data);
			toast.success('Template criado com sucesso');
			void navigate({ to: '/marketing/templates', search: { search: '', category: 'all' } });
			return result;
		} catch (_err) {
			toast.error('Falha ao criar template');
			throw _err;
		}
	};

	const handleUpdateTemplate = (
		_templateId: number,
		_data: {
			name?: string;
			subject?: string;
			htmlContent?: string;
			category?: string;
			isActive?: boolean;
		},
	) => {
		// TODO: Add update to email templates tRPC router
		toast.info('Atualização de template em breve');
	};

	const handleDeleteTemplate = (_templateId: number) => {
		// TODO: Add delete to email templates tRPC router
		toast.info('Exclusão de template em breve');
	};

	const handleSyncTemplate = (_templateId: number) => {
		// TODO: Add syncTemplateToBrevo as a tRPC action/mutation
		toast.info('Sincronização com Brevo em breve');
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

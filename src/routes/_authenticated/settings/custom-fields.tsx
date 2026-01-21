import { createFileRoute, redirect } from '@tanstack/react-router';
import { toast } from 'sonner';

import { CustomFieldsPage } from '@/components/admin/custom-fields-page';

export const Route = createFileRoute('/_authenticated/settings/custom-fields')({
	beforeLoad: ({ context }) => {
		const isLoaded = context.auth?.isLoaded;
		const role = context.auth?.orgRole;
		const isAdmin =
			role === 'org:admin' || role === 'org:owner' || role === 'admin' || role === 'owner';

		if (isLoaded && !isAdmin) {
			toast.error('Você não tem permissão para acessar campos personalizados.');
			throw redirect({
				to: '/settings',
			});
		}
	},
	component: CustomFieldsPage,
});

import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { MainLayout } from '@/components/layout/main-layout';

export const Route = createFileRoute('/_authenticated')({
	beforeLoad: ({ context }) => {
		if (!context.auth?.userId) {
			throw redirect({
				to: '/sign-in',
			});
		}
	},
	component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
	return (
		<MainLayout>
			<Outlet />
		</MainLayout>
	);
}

import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { MainLayout } from '@/components/layout/main-layout';

export const Route = createFileRoute('/_authenticated')({
	beforeLoad: ({ context }) => {
		// Wait for Clerk to load before checking auth
		// If auth is undefined or not loaded yet, don't redirect
		// The component will handle the loading state
		if (context.auth?.isLoaded === false) {
			// Still loading, don't redirect yet
			return;
		}
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

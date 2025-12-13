import { useAuth } from '@clerk/clerk-react';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import React, { Suspense } from 'react';

import { MainLayout } from '@/components/layout/main-layout';
import { Toaster } from '@/components/ui/sonner';

const TanStackRouterDevtools =
	process.env.NODE_ENV === 'production'
		? () => null
		: React.lazy(() =>
				import('@tanstack/router-devtools').then((res) => ({
					default: res.TanStackRouterDevtools,
				})),
			);

export const Route = createRootRoute({
	component: RootLayout,
});

function RootLayout() {
	const { isSignedIn } = useAuth();
	return (
		<>
			<a href="#main-content" className="skip-link">
				Pular para conteúdo principal
			</a>
			{isSignedIn ? (
				<MainLayout>
					<Outlet />
				</MainLayout>
			) : (
				// Public / Auth layout (no sidebar)
				<main id="main-content" className="min-h-screen bg-background bg-mesh bg-noise">
					<Outlet />
				</main>
			)}
			<Toaster />
			<Suspense>
				<TanStackRouterDevtools />
			</Suspense>
		</>
	);
}

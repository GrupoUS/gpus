import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import React, { Suspense } from 'react';

import { Toaster } from '@/components/ui/sonner';

const TanStackRouterDevtools =
	process.env.NODE_ENV === 'production'
		? () => null
		: React.lazy(() =>
				import('@tanstack/router-devtools').then((res) => ({
					default: res.TanStackRouterDevtools,
				})),
			);

interface RouterContext {
	auth: { userId: string | null | undefined } | undefined;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
});

function RootLayout() {
	// Root layout just renders the Outlet.
	// The _authenticated layout handles the sidebar for protected routes.
	// The index route (Landing) will have its own layout/structure.
	return (
		<>
			<a href="#main-content" className="skip-link">
				Pular para conteúdo principal
			</a>
			<Outlet />
			<Toaster />
			<Suspense>
				<TanStackRouterDevtools />
			</Suspense>
		</>
	);
}

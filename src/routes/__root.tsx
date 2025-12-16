import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';

import { Toaster } from '@/components/ui/sonner';

interface RouterContext {
	auth: { userId: string | null | undefined; isLoaded: boolean } | undefined;
}

import { NotFound } from '@/components/not-found';
import { ThemeProvider } from '@/components/theme-provider';

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
	notFoundComponent: NotFound,
});

function RootLayout() {
	// Root layout just renders the Outlet.
	// The _authenticated layout handles the sidebar for protected routes.
	// The index route (Landing) will have its own layout/structure.
	return (
		<ThemeProvider defaultTheme="dark" storageKey="gpus-ui-theme">
			<Outlet />
			<Toaster />
		</ThemeProvider>
	);
}

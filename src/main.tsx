import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

import { trpc } from './lib/trpc';
import { createTRPCClient } from './lib/trpc-client';
import { routeTree } from './routeTree.gen';
import './index.css';

// Convex client (kept for backward compatibility during migration)
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// Router
const router = createRouter({
	routeTree,
	context: {
		auth: undefined as ReturnType<typeof useAuth> | undefined,
	},
	defaultPreload: 'intent',
});

// Register things for typesafety
declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router;
	}
}

// Clerk publishable key
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
	throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

function InnerApp() {
	const auth = useAuth();
	const { getToken } = auth;

	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 1000 * 30, // 30 seconds
						refetchOnWindowFocus: false,
					},
				},
			}),
	);

	const [trpcClient] = useState(() => createTRPCClient(getToken));

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>
				<RouterProvider context={{ auth }} router={router} />
			</QueryClientProvider>
		</trpc.Provider>
	);
}

export function App() {
	return (
		<ClerkProvider
			afterSignOutUrl="/"
			publishableKey={clerkPubKey}
			signInForceRedirectUrl="/dashboard"
			signUpForceRedirectUrl="/dashboard"
		>
			<ConvexProviderWithClerk client={convex} useAuth={useAuth}>
				<InnerApp />
			</ConvexProviderWithClerk>
		</ClerkProvider>
	);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
	throw new Error('Root element not found');
}
if (!rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<React.StrictMode>
			<App />
		</React.StrictMode>,
	);
}

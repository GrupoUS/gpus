import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import React from 'react';
import ReactDOM from 'react-dom/client';

import { routeTree } from './routeTree.gen';
import './index.css';

// Convex client
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// Router
const router = createRouter({
	routeTree,
	context: {
		auth: undefined as ReturnType<typeof useAuth> | undefined, // We'll inject this in the provider
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
	return <RouterProvider router={router} context={{ auth }} />;
}

export function App() {
	return (
		<ClerkProvider
			publishableKey={clerkPubKey}
			signInForceRedirectUrl="/dashboard"
			signUpForceRedirectUrl="/dashboard"
			afterSignOutUrl="/"
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

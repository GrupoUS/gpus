'use client';

import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

export const Route = createFileRoute('/sign-in/sso-callback')({
	component: SSOCallbackPage,
	validateSearch: (search: Record<string, unknown>) => {
		return {
			sign_in_force_redirect_url: (search.sign_in_force_redirect_url as string) || '/dashboard',
		};
	},
});

function SSOCallbackPage() {
	const navigate = useNavigate();
	const { isSignedIn, isLoaded } = useAuth();
	const { sign_in_force_redirect_url } = Route.useSearch();
	const [hasRedirected, setHasRedirected] = useState(false);

	useEffect(() => {
		if (!isLoaded) return;

		if (isSignedIn && !hasRedirected) {
			setHasRedirected(true);
			
			// Decode the redirect URL if it's URL encoded
			let redirectUrl = sign_in_force_redirect_url || '/dashboard';
			
			try {
				redirectUrl = decodeURIComponent(redirectUrl);
			} catch {
				// If decoding fails, use the original
			}

			// Extract pathname if it's a full URL
			let path = redirectUrl;
			if (redirectUrl.startsWith('http')) {
				try {
					const url = new URL(redirectUrl);
					path = url.pathname;
				} catch {
					// If URL parsing fails, use the original
					path = '/dashboard';
				}
			}

			// Ensure path starts with /
			if (!path.startsWith('/')) {
				path = '/dashboard';
			}

			// Navigate to the dashboard
			void navigate({ to: '/dashboard' });
		}
	}, [isLoaded, isSignedIn, sign_in_force_redirect_url, navigate, hasRedirected]);

	return (
		<div className="flex items-center justify-center min-h-screen bg-mesh bg-noise">
			<div className="text-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
				<p className="text-muted-foreground font-sans">Finalizando login...</p>
			</div>
		</div>
	);
}


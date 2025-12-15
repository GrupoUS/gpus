'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { createFileRoute } from '@tanstack/react-router';

// biome-ignore lint/suspicious/noExplicitAny: TanStack Router SSO callback route
export const Route = createFileRoute('/sign-up/sso-callback' as any)({
	component: SSOCallbackPage,
});

function SSOCallbackPage() {
	return (
		<div className="flex items-center justify-center min-h-screen bg-mesh bg-noise">
			<AuthenticateWithRedirectCallback
				signInForceRedirectUrl="/dashboard"
				signUpForceRedirectUrl="/dashboard"
			/>
		</div>
	);
}

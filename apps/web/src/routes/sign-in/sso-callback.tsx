'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sign-in/sso-callback')({
	component: SSOCallbackPage,
});

function SSOCallbackPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-mesh bg-noise">
			<AuthenticateWithRedirectCallback
				signInForceRedirectUrl="/dashboard"
				signUpForceRedirectUrl="/dashboard"
			/>
		</div>
	);
}

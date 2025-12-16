import { useAuth } from '@clerk/clerk-react';
import { api } from '@convex/_generated/api';
import { useMutation } from 'convex/react';

import { Button } from '@/components/ui/button';

export function DebugAuth() {
	const { isSignedIn, getToken } = useAuth();
	// biome-ignore lint/suspicious/noExplicitAny: IDE ghost error workaround
	const checkAuth = useMutation((api as any).debug_tool.checkAuth);
	// biome-ignore lint/suspicious/noExplicitAny: IDE ghost error workaround
	const testCreate = useMutation((api as any).debug_tool.testCreate);

	const runDebug = async () => {
		// biome-ignore lint/suspicious/noConsole: debug component
		console.log('isSignedIn:', isSignedIn);
		try {
			const token = await getToken({ template: 'convex' });
			// biome-ignore lint/suspicious/noConsole: debug component
			console.log('Token obtido:', token ? 'SIM' : 'NÃO');

			if (token) {
				const parts = token.split('.');
				const payload = JSON.parse(atob(parts[1]));
				// biome-ignore lint/suspicious/noConsole: debug component
				console.log('Token payload:', payload);
			}
		} catch (e) {
			// biome-ignore lint/suspicious/noConsole: debug component
			console.error('Error getting token:', e);
		}

		try {
			const authResult = await checkAuth();
			// biome-ignore lint/suspicious/noConsole: debug component
			console.log('Backend auth check:', authResult);

			const createResult = await testCreate();
			// biome-ignore lint/suspicious/noConsole: debug component
			console.log('Backend create test:', createResult);
		} catch (e) {
			// biome-ignore lint/suspicious/noConsole: debug component
			console.error('Backend operation failed:', e);
		}
	};

	return (
		<Button onClick={runDebug} variant="outline">
			🔍 Debug Auth
		</Button>
	);
}

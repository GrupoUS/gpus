import { useAuth } from '@clerk/clerk-react';
import { useMutation, useQuery } from 'convex/react';
import { useEffect, useState } from 'react';

import { api } from '../../convex/_generated/api';

export type SyncStatus = 'loading' | 'synced' | 'error';

export function useUserSync() {
	const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
	const [status, setStatus] = useState<SyncStatus>('loading');
	const [error, setError] = useState<Error | null>(null);

	// Skip query if not signed in to avoid unnecessary calls
	// We use "skip" logic: if not signed in, we don't query
	const shouldQuery = isAuthLoaded && isSignedIn;

	// biome-ignore lint/suspicious/noExplicitAny: Temporary cast to avoid deep type instantiation error
	const currentUser = useQuery(api.users.current, shouldQuery ? {} : ('skip' as any));
	const ensureUser = useMutation(api.users.ensureUser);

	useEffect(() => {
		// If auth is loading, wait
		if (!isAuthLoaded) return;

		// If not signed in, we are "synced" in the sense that we don't need a user record
		// But typically this hook is used in authenticated routes.
		if (!isSignedIn) {
			setStatus('synced');
			return;
		}

		// If we have a user from existing query, we are synced
		if (currentUser) {
			setStatus('synced');
			return;
		}

		// If query is loading (undefined), wait
		if (currentUser === undefined) {
			// It's still loading the query
			return;
		}

		// If currentUser is null, it means we need to create it
		const sync = async () => {
			try {
				await ensureUser();
				setStatus('synced');
			} catch (err) {
				// biome-ignore lint/suspicious/noConsole: Log error for debugging
				console.error('Failed to sync user:', err);
				setStatus('error');
				setError(err instanceof Error ? err : new Error('Unknown sync error'));
			}
		};

		void sync();
	}, [isAuthLoaded, isSignedIn, currentUser, ensureUser]);

	return {
		status,
		error,
		isLoading: status === 'loading',
		user: currentUser,
	};
}

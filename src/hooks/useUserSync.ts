import { useAuth, useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';

import { trpc } from '../lib/trpc';

type SyncStatus = 'loading' | 'synced' | 'error';

export function useUserSync() {
	const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
	const { user: clerkUser } = useUser();
	const [status, setStatus] = useState<SyncStatus>('loading');
	const [error, setError] = useState<Error | null>(null);

	const shouldQuery = isAuthLoaded && isSignedIn;

	const { data: currentUser } = trpc.users.me.useQuery(undefined, {
		enabled: shouldQuery,
	});

	const ensureUserMutation = trpc.users.ensureUser.useMutation();

	useEffect(() => {
		if (!isAuthLoaded) return;

		if (!isSignedIn) {
			setStatus('synced');
			return;
		}

		if (currentUser) {
			setStatus('synced');
			return;
		}

		// If query is still loading, wait
		if (currentUser === undefined) {
			return;
		}

		// currentUser is null — create it
		const sync = async () => {
			if (!clerkUser) return;
			try {
				await ensureUserMutation.mutateAsync({
					clerkId: clerkUser.id,
					email: clerkUser.primaryEmailAddress?.emailAddress ?? '',
					name: clerkUser.fullName ?? clerkUser.firstName ?? 'User',
					avatarUrl: clerkUser.imageUrl,
				});
				setStatus('synced');
			} catch (err) {
				// biome-ignore lint/suspicious/noConsole: Log error for debugging
				console.error('Failed to sync user:', err);
				setStatus('error');
				setError(err instanceof Error ? err : new Error('Unknown sync error'));
			}
		};

		void sync();
	}, [isAuthLoaded, isSignedIn, currentUser, clerkUser, ensureUserMutation]);

	return {
		status,
		error,
		isLoading: status === 'loading',
		user: currentUser,
	};
}

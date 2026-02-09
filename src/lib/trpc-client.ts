import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

import { trpc } from './trpc';

/**
 * Creates a configured tRPC client with:
 * - httpBatchLink for request batching
 * - superjson transformer for Date/Map/Set serialization
 * - Clerk JWT token attached as Bearer header
 */
export function createTRPCClient(getToken: () => Promise<string | null>) {
	return trpc.createClient({
		links: [
			httpBatchLink({
				url: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/trpc`,
				transformer: superjson,
				async headers() {
					const token = await getToken();
					return token ? { authorization: `Bearer ${token}` } : {};
				},
			}),
		],
	});
}

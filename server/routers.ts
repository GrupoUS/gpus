import { publicProcedure, router } from './_core/trpc';

export const appRouter = router({
	healthCheck: publicProcedure.query(() => ({
		status: 'ok',
		timestamp: new Date().toISOString(),
	})),
});

export type AppRouter = typeof appRouter;

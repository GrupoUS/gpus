import { clerkMiddleware } from '@hono/clerk-auth';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { appRouter } from '../routers';
import { createContext } from './context';

const app = new Hono();

// ── Middleware ──
app.use('*', logger());
app.use(
	'/api/*',
	cors({
		origin: ['http://localhost:5173', 'http://localhost:3000'],
		credentials: true,
	}),
);
app.use('*', clerkMiddleware());

// ── Health check ──
app.get('/', (c) =>
	c.json({
		status: 'ok',
		service: 'GPUS Backend',
		version: '1.0.0',
	}),
);

// ── tRPC handler ──
app.all('/api/trpc/*', (c) => {
	return fetchRequestHandler({
		endpoint: '/api/trpc',
		req: c.req.raw,
		router: appRouter,
		createContext: () => createContext(c),
	});
});

// ── Start ──
const port = Number(process.env.PORT) || 3001;
// biome-ignore lint/suspicious/noConsole: startup message
console.log(`🚀 GPUS Server running on http://localhost:${port}`);

export default { port, fetch: app.fetch };

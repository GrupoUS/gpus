import { clerkMiddleware } from '@hono/clerk-auth';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { appRouter } from '../routers';
import { handleAsaasWebhook } from '../webhooks/asaas';
import { handleClerkWebhook } from '../webhooks/clerk';
import { createContext } from './context';
import { initSchedulers } from './scheduler';

const app = new Hono();

// ── Middleware ──
app.use('*', logger());
app.use(
	'/api/*',
	cors({
		origin: [
			'http://localhost:5173',
			'http://localhost:3000',
			'http://localhost:3001',
			'https://gpus-env.up.railway.app',
			'https://gpus-production.up.railway.app',
		],
		credentials: true,
	}),
);
app.use('/api/*', clerkMiddleware());

// ── Health check ──
app.get('/api/health', (c) =>
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

// ── Webhooks ──
app.post('/api/webhooks/asaas', handleAsaasWebhook);
app.post('/api/webhooks/clerk', handleClerkWebhook);

// ── Static file serving (SPA) ──
// Serve Vite build output from dist/
app.use('*', serveStatic({ root: './dist' }));

// SPA fallback: serve index.html for client-side routing
app.use('*', serveStatic({ path: './dist/index.html' }));

// ── Scheduler ──
initSchedulers();

// ── Start ──
const port = Number(process.env.PORT) || 3001;
// biome-ignore lint/suspicious/noConsole: startup message
console.log(`🚀 GPUS Server running on http://localhost:${port}`);

export default { port, fetch: app.fetch };

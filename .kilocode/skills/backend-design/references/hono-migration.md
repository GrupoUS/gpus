# Hono Migration Guide — Gradual Express to Hono Transition

## Overview

Hono is an ultrafast, lightweight web framework built on Web Standards. It runs on Bun, Node.js, Cloudflare Workers, Deno, and other runtimes with the same codebase.

**Key advantages over Express:**
- **Performance**: RegExpRouter is significantly faster
- **Size**: Under 14kB with zero dependencies
- **Standards**: Built on Web Standards (Request/Response)
- **TypeScript**: First-class type safety
- **Multi-runtime**: Same code across platforms

## Migration Strategy

### Phase 1: New Features Only (Current)
- Implement all new API endpoints in Hono
- Keep existing Express routes unchanged
- Run both frameworks side-by-side

### Phase 2: Incremental Migration (Future)
- Migrate webhooks to Hono (simpler signature verification)
- Migrate OAuth callbacks to Hono
- Migrate SSE endpoints to Hono

### Phase 3: Complete Migration (Long-term)
- Migrate remaining Express routes
- Remove Express dependency
- Consolidate to single Hono app

## Hono Setup Patterns

### Basic Server Setup

```typescript
// server/hono-app.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Routes
app.get('/api/health', (c) => c.json({ status: 'ok' }));

export default app;
```

### Integration with Existing Express Server

```typescript
// server/_core/index.ts
import express from 'express';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const expressApp = express();
const honoApp = new Hono();

// Mount Hono app on Express (transition approach)
expressApp.use('/api/v2', (req, res) => {
  serve({
    fetch: honoApp.fetch,
    port: 0, // Not used when mounted
  })(req, res);
});
```

### tRPC Integration with Hono

```typescript
// server/_core/hono-trpc.ts
import { Hono } from 'hono';
import { trpcServer } from '@trpc/server/adapters/fetch';
import { appRouter } from '../routers';
import { createContext } from './context';

const app = new Hono();

app.use('/api/trpc/*', async (c) => {
  return trpcServer({
    router: appRouter,
    createContext: () => createContext(c.req.raw),
  })(c.req.raw);
});
```

## Express to Hono Pattern Equivalents

### Request/Response Handling

| Express | Hono |
|---|---|
| `req.body` | `await c.req.json()` |
| `req.query.id` | `c.req.query('id')` |
| `req.params.id` | `c.req.param('id')` |
| `req.headers['x-token']` | `c.req.header('x-token')` |
| `res.json({ data })` | `c.json({ data })` |
| `res.status(404).json(...)` | `c.json(..., 404)` |
| `res.redirect('/path')` | `c.redirect('/path')` |

### Middleware

**Express:**
```typescript
app.use((req, res, next) => {
  req.requestId = generateId();
  next();
});
```

**Hono:**
```typescript
app.use('*', async (c, next) => {
  c.set('requestId', generateId());
  await next();
});
```

### Route Handlers

**Express:**
```typescript
app.get('/api/users/:id', async (req, res) => {
  const user = await getUser(req.params.id);
  res.json(user);
});
```

**Hono:**
```typescript
app.get('/api/users/:id', async (c) => {
  const user = await getUser(c.req.param('id'));
  return c.json(user);
});
```

### Error Handling

**Express:**
```typescript
app.use((err, req, res, next) => {
  logger.error('request_error', err);
  res.status(500).json({ error: 'Internal error' });
});
```

**Hono:**
```typescript
app.onError((err, c) => {
  logger.error('request_error', err);
  return c.json({ error: 'Internal error' }, 500);
});
```

### Webhook Signature Verification

**Express (Stripe example):**
```typescript
app.post('/webhooks/stripe', 
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.body, sig, secret);
    // Process event
    res.json({ received: true });
  }
);
```

**Hono (Stripe example):**
```typescript
app.post('/webhooks/stripe', async (c) => {
  const sig = c.req.header('stripe-signature');
  const body = await c.req.text();
  const event = stripe.webhooks.constructEvent(body, sig, secret);
  // Process event
  return c.json({ received: true });
});
```

## Clerk Authentication with Hono

```typescript
import { clerkMiddleware, getAuth } from '@hono/clerk-auth';

const app = new Hono();

app.use('*', clerkMiddleware());

app.get('/api/protected', async (c) => {
  const auth = getAuth(c);
  
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  return c.json({ userId: auth.userId });
});
```

## Context Creation Pattern

```typescript
// server/_core/hono-context.ts
import type { Context } from 'hono';
import { getAuth } from '@hono/clerk-auth';

export async function createHonoContext(c: Context) {
  const auth = getAuth(c);
  const requestId = generateRequestId();
  const logger = createLogger({ userId: auth?.userId, requestId });
  
  if (!auth?.userId) {
    return { user: null, mentorado: null, logger };
  }
  
  // Reuse existing session cache logic
  const { user, mentorado } = await resolveUserAndMentorado(auth.userId, logger);
  
  return { user, mentorado, logger };
}
```

## Rate Limiting

**Express:**
```typescript
import rateLimit from 'express-rate-limit';
app.use('/api', rateLimit({ windowMs: 60000, max: 100 }));
```

**Hono:**
```typescript
import { rateLimiter } from 'hono-rate-limiter';
app.use('/api/*', rateLimiter({ windowMs: 60000, limit: 100 }));
```

## SSE (Server-Sent Events)

**Hono:**
```typescript
import { streamSSE } from 'hono/streaming';

app.get('/api/events', async (c) => {
  return streamSSE(c, async (stream) => {
    while (true) {
      await stream.writeSSE({
        data: JSON.stringify({ timestamp: Date.now() }),
        event: 'update',
      });
      await stream.sleep(1000);
    }
  });
});
```

## File Upload Handling

**Hono:**
```typescript
app.post('/api/upload', async (c) => {
  const body = await c.req.parseBody();
  const file = body['file'] as File;
  
  if (!file) {
    return c.json({ error: 'No file provided' }, 400);
  }
  
  const buffer = await file.arrayBuffer();
  // Process file
  return c.json({ success: true });
});
```

## Migration Checklist

### Before Migrating a Route
- [ ] Route has no Express-specific middleware dependencies
- [ ] Request/response patterns are simple (JSON in/out)
- [ ] No complex streaming or chunked responses (unless using Hono streaming)
- [ ] Authentication can use Clerk's Hono adapter

### After Migrating a Route
- [ ] Test with same inputs as Express version
- [ ] Verify error handling matches expected contracts
- [ ] Check performance metrics (should improve)
- [ ] Update API documentation if endpoint path changed
- [ ] Add to Hono migration tracking document

## Do / Don't

**Do:**
- Use Hono for new API endpoints and webhooks
- Leverage Web Standards (Request/Response) for portability
- Use Hono's built-in middleware when available
- Keep context creation logic consistent with Express version

**Don't:**
- Don't mix Express and Hono middleware in same route
- Don't migrate critical production routes without thorough testing
- Don't assume Express middleware works with Hono (check compatibility)
- Don't forget to update monitoring/observability for Hono routes

## Performance Considerations

Hono's RegExpRouter is significantly faster than Express routing:
- **Routing**: 10-20x faster for complex route patterns
- **Memory**: Lower memory footprint due to zero dependencies
- **Startup**: Faster cold starts (important for serverless)

## Testing Patterns

```typescript
// test/hono-routes.test.ts
import { describe, it, expect } from 'bun:test';
import app from '../server/hono-app';

describe('Hono API', () => {
  it('should return health status', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });
});
```

## Resources

- Official Docs: https://hono.dev
- Full LLM Context: https://hono.dev/llms-full.txt
- Hono + tRPC: https://hono.dev/examples/trpc
- Clerk + Hono: https://hono.dev/examples/clerk

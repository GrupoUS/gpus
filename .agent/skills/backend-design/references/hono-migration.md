# Hono Migration Guide — Phase 1 Runtime Migration (Express to Hono)

Use this guide as the operational reference for Phase 1 migration in this repository.

## Objective

Migrate backend runtime from Express to Hono while preserving:

- endpoint contracts (`/api/trpc`, webhook routes, health routes, OAuth callbacks, SSE path),
- auth/context semantics,
- webhook reliability guarantees (signature + idempotency + fast ACK),
- rollback safety.

## Migration Strategy (Project-Specific)

### Stage 1 — Core Runtime

1. Introduce Hono app and Node server adapter.
2. Establish global middleware order:
   - `logger()`
   - `cors(...)`
   - `secureHeaders()`
   - `clerkMiddleware()`
3. Migrate tRPC mount to Hono while keeping `/api/trpc`.

### Stage 2 — Context and Infra

1. Migrate context creation from Express types to Hono context.
2. Replace Express rate limiter with Hono middleware.
3. Migrate static serving and Vite bridge to Hono-compatible paths.

### Stage 3 — Integration Edges

1. Migrate signature-sensitive webhooks (Stripe, Clerk, Meta).
2. Migrate Z-API and Baileys webhook registration and event flow.
3. Preserve SSE behavior and cleanup guarantees.

### Stage 4 — Cleanup and Hardening

1. Remove Express-only imports and dependencies.
2. Validate backend non-regression gates.
3. Update runbooks and docs.

## Canonical Setup Pattern

```ts
import { serve, type HttpBindings } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { clerkMiddleware } from "@hono/clerk-auth";
import { trpcServer } from "@hono/trpc-server";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use("*", logger());
app.use("*", cors({ origin: process.env.CORS_ORIGIN ?? "*", credentials: true }));
app.use("*", secureHeaders());
app.use("*", clerkMiddleware());

app.use(
  "/api/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext: (_opts, c) => createContext(c),
  }),
);

serve({ fetch: app.fetch, port: 3000, hostname: "0.0.0.0" });
```

## Express to Hono Equivalents

| Express | Hono |
|---|---|
| `req.body` | `await c.req.json()` or `await c.req.text()` |
| `req.query.foo` | `c.req.query("foo")` |
| `req.params.id` | `c.req.param("id")` |
| `req.headers["x"]` | `c.req.header("x")` |
| `res.status(200).json(x)` | `c.json(x, 200)` |
| `res.redirect(url)` | `c.redirect(url)` |
| error middleware | `app.onError((err, c) => ...)` |

## Webhook Signature Pattern

```ts
app.post("/api/webhooks/provider", async (c) => {
  const signature = c.req.header("x-signature");
  const rawBody = await c.req.text();

  if (!signature || !verify(signature, rawBody)) {
    return c.json({ error: "Invalid signature" }, 400);
  }

  const event = JSON.parse(rawBody);
  await queueWebhookTask(event); // ACK fast, process async

  return c.json({ received: true }, 202);
});
```

## SSE Pattern for Existing Service Model

When existing architecture depends on broadcasting via shared service, preserve push model with Node outgoing response access through Hono Node bindings.

```ts
app.get("/api/chat/events", async (c) => {
  const outgoing = c.env.outgoing;
  outgoing.setHeader("Content-Type", "text/event-stream");
  outgoing.setHeader("Cache-Control", "no-cache");
  outgoing.setHeader("Connection", "keep-alive");

  sseService.addClient(mentoradoId, outgoing);
  outgoing.on("close", () => sseService.removeClient(mentoradoId, outgoing));

  return new Response(null, { status: 200 });
});
```

If manual binding behavior is unstable in runtime, fallback to `streamSSE` and migrate broadcast service accordingly.

## Phase 1 Checklist

### Before subsystem migration

- [ ] `bun run check` baseline captured
- [ ] `bun test server` baseline captured
- [ ] Route contract mapping documented for subsystem

### After subsystem migration

- [ ] TypeScript check passes
- [ ] Auth/context behavior unchanged
- [ ] Webhook/SSE/health smoke checks pass (as applicable)
- [ ] Rollback command documented and tested

## Do / Don't

Do:

- Keep route contracts stable.
- Verify signatures before parsing trusted payloads.
- Preserve fast ACK + async processing for webhook flows.
- Maintain deterministic middleware order.

Don't:

- Don’t mix Express middleware with Hono route handlers.
- Don’t remove Express deps before all imports are migrated.
- Don’t migrate critical ingress without smoke verification.
- Don’t merge without subsystem rollback instructions.

## Validation Commands

```bash
bun run check
bun test server
curl -i http://localhost:3000/health/live
curl -i http://localhost:3000/health/ready
```

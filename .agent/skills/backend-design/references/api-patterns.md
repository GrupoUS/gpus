# API Patterns — Bun + Hono + tRPC + Clerk

Define strict API boundaries and keep failure behavior deterministic.

## Canonical Request Boundary

Use this ordering for every endpoint:

1. Parse transport request.
2. Enforce coarse abuse controls (rate limit, payload size).
3. Resolve auth identity.
4. Compose typed context.
5. Enforce procedure-level authorization.
6. Execute service logic.
7. Persist state with Drizzle.
8. Emit stable response contract and structured logs.

Use lifecycle maps in [`request-lifecycle.md`](request-lifecycle.md).

## Procedure Hierarchy

```text
publicProcedure
  -> protectedProcedure
      -> mentoradoProcedure
      -> adminProcedure
```

Boundary contract:

- `publicProcedure`: no actor context required.
- `protectedProcedure`: authenticated actor required.
- `mentoradoProcedure`: authenticated actor with linked mentorado context.
- `adminProcedure`: authenticated actor with admin/mentor role check.

## Context Composition Rules

Context must be deterministic and side-effect aware.

Requirements:

- Create one request logger with correlation fields.
- Resolve user from cache first, fallback to source sync.
- Resolve role and mentorado after identity stability.
- Keep cache invalidation explicit; no silent mutation paths.

Failure mapping:

- Missing auth token -> `UNAUTHORIZED`.
- Authenticated but role mismatch -> `FORBIDDEN`.
- Missing entity required by procedure -> `NOT_FOUND` or domain-specific `FORBIDDEN`.

## Router and Namespace Standards

- Keep one aggregation entry point for routers.
- Use stable namespaces to avoid client cache churn.
- Keep transport concerns in route handlers and orchestration in services.

## Webhook Endpoint Standards

Webhooks are integration ingress, not tRPC procedures.

Rules:

1. Verify signature before trusted processing.
2. Enforce idempotency key/event-id dedup.
3. Persist critical ingress before ACK.
4. ACK fast and process heavy work async.
5. Distinguish retryable vs terminal failures.

## External API Adapter Pattern

Wrap each provider in adapter services:

- Input normalization + schema validation.
- Timeout budget per operation.
- Bounded retries with exponential backoff + jitter.
- Retry-after respect for 429.
- Circuit-open behavior under sustained failure.

## Error Contract Standards

Use explicit, stable contracts:

- `BAD_REQUEST`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `TOO_MANY_REQUESTS`
- `INTERNAL_SERVER_ERROR`

Always include correlation id in logs for non-success responses.

## Hono API Patterns

### Runtime Setup (Hono + tRPC)

```ts
app.use("*", logger());
app.use("*", cors({ origin: process.env.CORS_ORIGIN ?? "*", credentials: true }));
app.use("*", secureHeaders());
app.use("*", clerkMiddleware());

app.use("/api/trpc/*", userRateLimiter);
app.use(
  "/api/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext: (_opts, c) => createContext(c),
  }),
);
```

### Route Handler Boundary

```ts
app.post("/api/resource", async (c) => {
  const body = await c.req.json();
  const input = resourceSchema.parse(body);
  const auth = getAuth(c);

  if (!auth.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const result = await resourceService.create(input, auth.userId);
  return c.json(result);
});
```

### Webhook Pattern

```ts
app.post("/api/webhooks/provider", async (c) => {
  const signature = c.req.header("x-signature");
  const rawBody = await c.req.text();

  if (!signature || !verifyProviderSignature(rawBody, signature)) {
    return c.json({ error: "Invalid signature" }, 400);
  }

  const event = JSON.parse(rawBody);
  await queueWebhookTask(event);

  return c.json({ received: true }, 202);
});
```

## Do / Don't

Do:

- Validate input at the edge with Zod.
- Normalize provider errors in adapters/services.
- Keep endpoint contracts stable during runtime migration.

Don't:

- Don’t call external APIs directly from transport handlers.
- Don’t leak provider-specific errors to client contracts.
- Don’t parse trusted webhook payload before signature verification.

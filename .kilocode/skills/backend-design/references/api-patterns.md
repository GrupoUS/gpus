# API Patterns — Bun + Express + tRPC + Clerk

Define strict API boundaries and keep failure behavior deterministic.

## Canonical Request Boundary

Use this request ordering for every endpoint:

1. Parse transport layer request.
2. Enforce rate limiting and coarse abuse controls.
3. Resolve auth identity and session state.
4. Compose typed context.
5. Execute procedure-level authorization.
6. Execute service logic.
7. Persist state with Drizzle.
8. Emit response with stable error mapping.

Use lifecycle maps in [`request-lifecycle.md`](request-lifecycle.md).

## Procedure Hierarchy

```
publicProcedure
  -> protectedProcedure
      -> mentoradoProcedure
      -> adminProcedure
```

Boundary contract:

- `publicProcedure`: no actor context required.
- `protectedProcedure`: authenticated actor required.
- `mentoradoProcedure`: authenticated actor with linked mentorado context.
- `adminProcedure`: authenticated actor with admin role check.

## Context Composition Rules

Context must be deterministic and side-effect aware.

Requirements:

- Create one request logger with correlation fields.
- Resolve user from session cache, then fallback source.
- Resolve role and mentorado only after identity is stable.
- Never mutate persistent state implicitly during context creation except controlled sync paths.

Failure mapping:

- Missing auth token → `UNAUTHORIZED`.
- Authenticated but role mismatch → `FORBIDDEN`.
- Missing domain entity for required procedure → `NOT_FOUND` or domain-specific `FORBIDDEN`.

## Router and Namespace Standards

- Keep one aggregation entry point.
- Group procedures by bounded context.
- Use stable namespaces to avoid frontend cache churn.
- Keep transport concerns in router, business rules in services.

## Webhook Endpoint Standards

Webhooks are not tRPC procedures. Treat as integration ingress.

Rules:

1. Verify signature before parse.
2. Ensure idempotency key or event-id dedup.
3. Persist durable ingress record when critical.
4. Return ACK fast, process heavy work async.
5. Classify failures as retryable vs terminal.

When in-memory queue is present, include degradation behavior and replay instructions in runbook.

## External API Adapter Pattern

Wrap each external provider in adapter services:

- Input normalization and schema validation.
- Timeout budget per operation.
- Bounded retries with exponential backoff and jitter.
- Rate-limit response handling and retry-after respect.
- Circuit-open behavior when failure rate threshold breaches.

## Error Contract Standards

Use explicit, stable error contracts:

- `BAD_REQUEST` for contract violations.
- `UNAUTHORIZED` for missing/invalid identity.
- `FORBIDDEN` for authorization failure.
- `NOT_FOUND` for absent resource.
- `CONFLICT` for concurrent mutation/domain conflict.
- `TOO_MANY_REQUESTS` for rate limiting.
- `INTERNAL_SERVER_ERROR` for unexpected faults.

Always include correlation id in logs for every non-success response.

## Do / Don’t

Do:

- Validate input at procedure edge with Zod.
- Normalize domain errors inside services.
- Keep adapters deterministic and typed.

Don’t:

- Don’t call external APIs directly from routers.
- Don’t leak provider-specific errors to client contracts.
- Don’t perform silent fallback without observability signal.

## Hono API Patterns

For new endpoints, use Hono with these patterns:

### Request Boundary (Hono)

```typescript
app.post('/api/resource', async (c) => {
  // 1. Parse and validate input
  const body = await c.req.json();
  const input = resourceSchema.parse(body);
  
  // 2. Resolve auth and context
  const ctx = await createHonoContext(c);
  if (!ctx.user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // 3. Execute service logic
  const result = await resourceService.create(input, ctx);
  
  // 4. Return response
  return c.json(result);
});
```

### Procedure Hierarchy (Hono + tRPC)

Hono works seamlessly with tRPC via the fetch adapter. Use the same procedure hierarchy:
- `publicProcedure`
- `protectedProcedure`
- `mentoradoProcedure`
- `adminProcedure`

### Webhook Pattern (Hono)

```typescript
app.post('/webhooks/provider', async (c) => {
  // 1. Verify signature
  const sig = c.req.header('x-signature');
  const body = await c.req.text();
  if (!verifySignature(body, sig)) {
    return c.json({ error: 'Invalid signature' }, 401);
  }
  
  // 2. Parse and dedup
  const event = JSON.parse(body);
  const isDuplicate = await checkEventId(event.id);
  if (isDuplicate) {
    return c.json({ received: true });
  }
  
  // 3. Persist and ACK fast
  await persistWebhookEvent(event);
  
  // 4. Process async
  processWebhookAsync(event).catch(logger.error);
  
  return c.json({ received: true });
});
```
